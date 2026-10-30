from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal

class ShipmentBase(BaseModel):
    tracking_number: str
    recipient_name: str
    destination: str
    weight: float
    status: Literal["Pending", "In Transit", "Delivered", "Cancelled"] = "Pending"

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentResponse(ShipmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AuthCredentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class UserCreate(AuthCredentials):
    password: str = Field(min_length=12, max_length=128)


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True