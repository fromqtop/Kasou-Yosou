from datetime import datetime
from uuid import UUID

from models import PredictionChoice
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    name: str


class UserResponse(BaseModel):
    uid: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserDelete(BaseModel):
    uid: UUID


class UserDeleteResponse(BaseModel):
    uid: UUID


class GameRoundCreate(BaseModel):
    id: int
    start_at: datetime
    closed_at: datetime
    target_at: datetime
    base_price: float


class predictionInfo(BaseModel):
    name: str
    choice: PredictionChoice
    is_ai: bool


class GameRoundResponse(BaseModel):
    id: int
    start_at: datetime
    closed_at: datetime
    target_at: datetime
    base_price: float
    result_price: float | None
    winning_choice: PredictionChoice | None
    predictions: list[predictionInfo]


class PredictionCreate(BaseModel):
    user_uid: UUID
    choice: PredictionChoice


class PredictionCreateResponse(BaseModel):
    id: int
    game_round_id: int
    choice: PredictionChoice
