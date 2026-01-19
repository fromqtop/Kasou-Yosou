import enum
import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    uid: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    is_ai: Mapped[bool] = mapped_column(default=False)
    status: Mapped[str] = mapped_column(default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"User(uid={self.uid!r}, name={self.name!r}, is_ai={self.is_ai!r})"


# 予測の選択肢
class PredictionChoice(enum.IntEnum):
    BEARISH = 1  #  - 0.5%以下
    NEUTRAL = 2  #  - 0.5% ~ +0.5%
    BULLISH = 3  #  + 0.5%以上


class GameRound(Base):
    __tablename__ = "game_rounds"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    start_at: Mapped[datetime] = mapped_column(unique=True, index=True)
    closed_at: Mapped[datetime] = mapped_column()
    target_at: Mapped[datetime] = mapped_column()
    base_price: Mapped[float | None] = mapped_column(Float)
    result_price: Mapped[float | None] = mapped_column(Float)
    winning_choice: Mapped[int | None] = mapped_column(Integer)

    # リレーションシップ：この回の予測一覧
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="game_round")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_uid: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.uid"), nullable=False)
    game_round_id: Mapped[int] = mapped_column(
        ForeignKey("game_rounds.id"), nullable=False
    )
    choice: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # リレーションシップ
    game_round: Mapped["GameRound"] = relationship(back_populates="predictions")
    user: Mapped["User"] = relationship()
