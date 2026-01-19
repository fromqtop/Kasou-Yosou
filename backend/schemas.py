from uuid import UUID

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
