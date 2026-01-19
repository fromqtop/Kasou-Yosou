from datetime import datetime, timedelta, timezone

import ccxt
import models
import schemas
from database import get_db
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

app = FastAPI()


@app.post("/users", response_model=schemas.UserResponse)
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


@app.post("/game_round", response_model=schemas.GameRoundCreate)
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
    exchange = ccxt.binance({"enableRateLimit": True})

    try:
        symbol = "BTC/USDT"
        timeframe = "1h"
        since = int(start_at.timestamp() * 1000)
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe, since=since, limit=1)

        if not ohlcv:
            raise HTTPException(status_code=404, detail="価格データ取得エラー")

        # ohlcv[0] = [timestamp, open, high, low, close, volume]
        base_price = float(ohlcv[0][1])

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
