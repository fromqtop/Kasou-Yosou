from datetime import datetime, timedelta, timezone

import ccxt.async_support as ccxt
import httpx
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


@app.post("/game_round")
async def create_game_round(
    db: Session = Depends(get_db),
):
    # create
    # 例 10:01に実行された場合、11:00-13:00 > 10時価格をもとに14時価格をあてるゲームを作成
    start_at = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    # ラウンド既登録チェック
    stmt = select(models.GameRound).where(models.GameRound.start_at == start_at)
    if db.scalar(stmt):
        raise HTTPException(
            status_code=409, detail="このゲームラウンドは既に登録されています"
        )

    # ラウンド作成
    # 価格取得
    exchange = ccxt.hyperliquid()
    try:
        symbol = "BTC/USDC:USDC"
        timeframe = "1h"
        since = int(start_at.timestamp() * 1000)
        limit = 24

        ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, since, limit)
        print(ohlcv[0])
    finally:
        await exchange.close()
    return

    # 1. 価格取得は非同期(httpx)でサクッと行う
    HYPERLIQUID_API_URL = "https://api.hyperliquid.xyz/info"
    payload = {"type": "allMids"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(HYPERLIQUID_API_URL, json=payload)
            data = response.json()
            # 取得したデータから価格を抽出（floatに変換）
            btc_price = float(data.get("BTC"))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"価格取得失敗: {e}")

    # 2. DBへの書き込みは、既存の models.py と Session(db) を使用
    now = datetime.now()
    new_round = models.GameRound(
        start_at=now,
        closed_at=now + timedelta(minutes=5),
        target_at=now + timedelta(minutes=10),
        base_price=btc_price,  # 取得した価格をセット
    )

    try:
        db.add(new_round)
        db.commit()  # 同期のDB接続なので await は不要
        db.refresh(new_round)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB保存失敗: {e}")

    return {"status": "success", "round_id": new_round.id, "base_price": btc_price}
