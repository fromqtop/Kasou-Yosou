import models
import requests
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
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

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


@app.get("/test-binance")
def test_binance():
    url = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
    try:
        response = requests.get(url, timeout=10)
        return {
            "status_code": response.status_code,
            "data": response.json(),
            "message": "Binance APIへの接続に成功しました！",
        }
    except Exception as e:
        return {"error": str(e), "message": "接続に失敗しました"}
