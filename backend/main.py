from datetime import datetime, timedelta, timezone

import ccxt
import models
import schemas
from database import get_db
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

app = FastAPI()


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


@app.post("/game_rounds", response_model=schemas.GameRoundCreate)
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

        # ohlcv[0] ・・・ [timestamp, open, high, low, close, volume]
        base_price = float(ohlcv[0][1])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Binance API接続エラー: {e}")

    finally:
        exchange.close()

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


@app.get("/game_rounds/active", response_model=schemas.GameRoundResponse | None)
def get_active_game_round(db: Session = Depends(get_db)):
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

    if not game_round:
        return None

    formatted_predictions = []
    for p in game_round.predictions:
        formatted_predictions.append(
            {"name": p.user.name, "choice": p.choice, "is_ai": p.user.is_ai}
        )

    return {
        "id": game_round.id,
        "start_at": game_round.start_at,
        "closed_at": game_round.closed_at,
        "target_at": game_round.target_at,
        "base_price": game_round.base_price,
        "result_price": game_round.result_price,
        "winning_choice": game_round.winning_choice,
        "predictions": formatted_predictions,
    }


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

    # ユーザーの存在確認
    stmt = select(exists().where(models.User.uid == prediction_in.user_uid))
    user_exists = db.scalar(stmt)

    if not user_exists:
        raise HTTPException(status_code=404, detail="ユーザーが存在しません")

    # 予測の登録（または更新）
    stmt = (
        select(models.Prediction)
        .where(models.Prediction.user_uid == prediction_in.user_uid)
        .where(models.Prediction.game_round_id == game_round_id)
    )
    prediction = db.scalar(stmt)

    if prediction:
        try:
            prediction.choice = prediction_in.choice
            db.commit()
            db.refresh(prediction)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"DB保存失敗: {e}")

        return prediction

    else:
        new_prediction = models.Prediction(
            user_uid=prediction_in.user_uid,
            game_round_id=game_round_id,
            choice=prediction_in.choice,
        )

        try:
            db.add(new_prediction)
            db.commit()
            db.refresh(new_prediction)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"DB保存失敗: {e}")

        return new_prediction
