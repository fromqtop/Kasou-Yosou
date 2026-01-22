from datetime import datetime, timedelta, timezone

import ccxt
import models
import schemas
from database import get_db
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

app = FastAPI()

# 許可するオリジン（フロントエンドのURL）
origins = [
    "http://localhost:5173",  # ローカル開発用
    "https://kasou-yosou.pages.dev/",  # Cloudflare Pages 本番用
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/users", response_model=schemas.UserCreateResponse)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    new_user = models.User(name=user_in.name)
    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        # Unique制約違反（名前の重複）が起きた場合の処理
        db.rollback()
        raise HTTPException(status_code=409, detail="この名前は既に登録されています")
    except Exception as e:
        db.rollback()
        print(f"予期せぬエラー: {e}")
        raise HTTPException(status_code=500, detail="予期せぬエラーが発生しました")

    return new_user


@app.delete("/users", response_model=schemas.UserDeleteResponse)
def delete_user(user_in: schemas.UserDelete, db: Session = Depends(get_db)):
    stmt = select(models.User).where(models.User.uid == user_in.uid)
    user = db.scalar(stmt)

    # ユーザー未存在エラー
    if not user or user.status == "deleted":
        raise HTTPException(status_code=409, detail="この名前は既に登録されています")

    # userデータ更新（退会）
    try:
        user.name = f"del_{user.uid.hex}"
        user.status = "deleted"
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        print(f"予期せぬエラー: {e}")
        raise HTTPException(status_code=500, detail="予期せぬエラーが発生しました")

    return user


@app.post("/users/me", response_model=schemas.UserMini)
def get_current_user(data: schemas.UserLookup, db: Session = Depends(get_db)):
    stmt = select(models.User).where(models.User.uid == data.uid)
    user = db.scalar(stmt)

    if not user or user.status == "deleted":
        raise HTTPException(status_code=404, detail="ユーザーが存在しません")

    return user


@app.get("/game_rounds", response_model=list[schemas.GameRoundResponse])
def get_game_rounds(db: Session = Depends(get_db)):
    stmt = select(models.GameRound).order_by(models.GameRound.id)
    game_round = db.scalars(stmt)

    return game_round


@app.post("/game_rounds", response_model=schemas.GameRoundResponse)
def create_game_round(db: Session = Depends(get_db)):
    # ラウンドの開始時刻
    start_at = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    # ラウンド存在チェック
    stmt = select(models.GameRound).where(models.GameRound.start_at == start_at)
    if db.scalar(stmt):
        raise HTTPException(
            status_code=409, detail="このゲームラウンドは既に存在します"
        )

    # binanceの価格を取得
    try:
        exchange = ccxt.binance({"enableRateLimit": True})
        symbol = "BTC/USDT"
        timeframe = "1h"
        since = int(start_at.timestamp() * 1000)
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe, since=since, limit=1)

        if not ohlcv:
            raise HTTPException(status_code=404, detail="価格データ取得エラー")

        base_price = float(ohlcv[0][1])  # [1]:open

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Binance API接続エラー: {e}")

    # DB追加
    new_round = models.GameRound(
        start_at=start_at,
        closed_at=start_at + timedelta(hours=1),
        target_at=start_at + timedelta(hours=4),
        base_price=base_price,
    )

    try:
        db.add(new_round)
        db.commit()
        db.refresh(new_round)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB保存失敗: {e}")

    return new_round


def settle_round(db: Session, round: models.GameRound, result_price: float):
    """
    1つのラウンドに対して、勝敗判定とポイント分配を行う
    """
    # ゲームラウンドに正解をセットする
    round.result_price = result_price

    diff_pct = (round.result_price - round.base_price) / round.base_price
    if diff_pct <= -0.003:
        round.winning_choice = models.PredictionChoice.BEARISH
    elif diff_pct >= 0.003:
        round.winning_choice = models.PredictionChoice.BULLISH
    else:
        round.winning_choice = models.PredictionChoice.NEUTRAL

    # ポイント計算・配布
    num_participants = len(round.predictions)

    if num_participants > 0:
        total_pool = num_participants * 100 * 2  # 参加人数 * 100pt * 2(ボーナス)

        win_predictions = [
            p for p in round.predictions if p.choice == round.winning_choice
        ]

        if win_predictions:
            share = total_pool // len(win_predictions)

        # ユーザーの所持ポイント、予想データのポイントを更新
        for p in round.predictions:
            if p.choice == round.winning_choice:
                p.is_won = True
                p.earned_points = share
                p.user.points += share
            else:
                p.is_won = False


@app.post("/game_rounds/settle")
def settle_game_rounds(db: Session = Depends(get_db)):
    # 正解が登録されていないゲームラウンドを取得
    now = datetime.now(timezone.utc)

    stmt = (
        select(models.GameRound)
        .options(
            selectinload(models.GameRound.predictions).selectinload(
                models.Prediction.user
            )
        )
        .where(models.GameRound.target_at <= now)
        .where(models.GameRound.result_price.is_(None))
    )
    game_rounds = db.scalars(stmt).all()

    if not game_rounds:
        return {"message": "現在、判定待ちのラウンドはありません。"}

    exchange = ccxt.binance({"enableRateLimit": True})
    symbol = "BTC/USDT"
    timeframe = "1h"

    settled_ids = []
    for round in game_rounds:
        try:
            # 判定時刻１時間前のローソクのcloseを取得
            since_dt = round.target_at - timedelta(hours=1)
            since = int(since_dt.timestamp() * 1000)

            ohlcv = exchange.fetch_ohlcv(symbol, timeframe, since=since, limit=1)

            if not ohlcv:
                continue

            settle_round(db, round, ohlcv[0][4])  # ohlcv[0][4]: close

            # データ更新
            db.commit()
            settled_ids.append(round.id)

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"異常終了: {e}")

    return {
        "message": f"{len(settled_ids)}件のラウンドを確定",
        "settled_ids": settled_ids,
    }


@app.get("/game_rounds/active", response_model=schemas.GameRoundResponse | None)
def get_active_game_round(db: Session = Depends(get_db)):
    # 現在有効なゲームラウンドを取得
    now = datetime.now(timezone.utc)
    stmt = (
        select(models.GameRound)
        .where(models.GameRound.start_at <= now)
        .where(models.GameRound.closed_at > now)
        .order_by(models.GameRound.start_at.desc())
        .limit(1)
    ).options(
        joinedload(models.GameRound.predictions).joinedload(models.Prediction.user)
    )

    game_round = db.scalars(stmt).first()
    return game_round


@app.post(
    "/game_rounds/{game_round_id}/predictions",
    response_model=schemas.PredictionCreateResponse,
)
def create_prediction(
    game_round_id: int,
    prediction_in: schemas.PredictionCreate,
    db: Session = Depends(get_db),
):
    # ゲームラウンドの存在・終了時刻確認
    stmt = select(models.GameRound).where(models.GameRound.id == game_round_id)
    game_round = db.scalar(stmt)

    if not game_round:
        raise HTTPException(
            status_code=404, detail="指定されたゲームラウンドは存在しません"
        )

    if datetime.now(timezone.utc) >= game_round.closed_at:
        raise HTTPException(
            status_code=400, detail="このラウンドはすでに締め切られています"
        )

    # ユーザーの取得
    stmt = select(models.User).where(models.User.uid == prediction_in.user_uid)
    user = db.scalar(stmt)

    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが存在しません")

    # 登録済の予測があるか確認
    stmt = (
        select(models.Prediction)
        .where(models.Prediction.user_uid == prediction_in.user_uid)
        .where(models.Prediction.game_round_id == game_round_id)
    )
    prediction = db.scalar(stmt)

    if prediction:
        prediction.choice = prediction_in.choice
    else:
        # ポイントが不足している場合は参加不可
        if user.points < 100:
            raise HTTPException(status_code=400, detail="ポイントが不足しています")

        prediction = models.Prediction(
            user_uid=prediction_in.user_uid,
            game_round_id=game_round_id,
            choice=prediction_in.choice,
        )
        db.add(prediction)
        user.points -= 100

    try:
        db.commit()
        db.refresh(prediction)
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB更新失敗: {e}")

    print(prediction.__dict__)
    return prediction
