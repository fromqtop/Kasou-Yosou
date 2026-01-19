import models
import schemas
from database import engine, get_db
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

# アプリ起動時にテーブル作成
models.Base.metadata.create_all(bind=engine)

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

    return new_user
