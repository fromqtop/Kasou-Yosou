import enum
import uuid
from datetime import datetime
from typing import Tuple

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from typing_extensions import TypedDict


class Base(DeclarativeBase):
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(Base):
    __tablename__ = "users"

    uid: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    is_ai: Mapped[bool] = mapped_column(default=False)
    status: Mapped[str] = mapped_column(default="active", nullable=False)
    points: Mapped[int] = mapped_column(default=1000, nullable=False)

    def __repr__(self) -> str:
        return f"User(uid={self.uid!r}, name={self.name!r}, is_ai={self.is_ai!r})"


# 予測の選択肢
class PredictionChoice(enum.IntEnum):
    BEARISH = 1  #  - 0.3%以下
    NEUTRAL = 2  #  - 0.3% ~ +0.3%
    BULLISH = 3  #  + 0.3%以上


PriceAtTime = Tuple[int, float]  # (timestamp, close_price)


class ChartData(TypedDict):
    before: list[PriceAtTime]
    after: list[PriceAtTime]


class GameRound(Base):
    __tablename__ = "game_rounds"

    id: Mapped[int] = mapped_column(primary_key=True)
    start_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), unique=True, index=True
    )
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    target_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    base_price: Mapped[float] = mapped_column(Float)
    result_price: Mapped[float | None] = mapped_column(Float)
    winning_choice: Mapped[int | None] = mapped_column(Integer)
    chart_data: Mapped[ChartData] = mapped_column(JSON, nullable=False)

    # リレーションシップ：この回の予測一覧
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="game_round")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_uid: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.uid"), nullable=False)
    game_round_id: Mapped[int] = mapped_column(
        ForeignKey("game_rounds.id"), nullable=False
    )
    choice: Mapped[PredictionChoice] = mapped_column(Integer, nullable=False)
    is_won: Mapped[bool | None] = mapped_column(Boolean, default=None)
    earned_points: Mapped[int] = mapped_column(default=0)

    # リレーションシップ
    game_round: Mapped["GameRound"] = relationship(back_populates="predictions")
    user: Mapped["User"] = relationship()
