from datetime import datetime
from uuid import UUID

from models import PredictionChoice
from pydantic import BaseModel, ConfigDict


class ResponseBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserMini(ResponseBase):
    name: str
    is_ai: bool
    points: int


class UserCreate(BaseModel):
    name: str


class UserCreateResponse(ResponseBase):
    uid: UUID
    name: str
    is_ai: bool
    points: int


class UserDelete(BaseModel):
    uid: UUID


class UserDeleteResponse(ResponseBase):
    uid: UUID


class UserLookup(BaseModel):
    uid: UUID


class GameRoundCreateResponse(ResponseBase):
    id: int
    start_at: datetime
    closed_at: datetime
    target_at: datetime
    base_price: float


class prediction(BaseModel):
    user: UserMini
    choice: PredictionChoice


class GameRoundResponse(ResponseBase):
    id: int
    start_at: datetime
    closed_at: datetime
    target_at: datetime
    base_price: float
    result_price: float | None
    winning_choice: PredictionChoice | None
    predictions: list[prediction]


class PredictionCreate(BaseModel):
    user_uid: UUID
    choice: PredictionChoice


class PredictionCreateResponse(ResponseBase):
    id: int
    game_round_id: int
    choice: PredictionChoice
    user: UserMini


class LeaderBoardItem(ResponseBase):
    rank: int
    username: str
    points: int
    total_rounds: int
    wins: int
    win_rate: float
