from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role_id: int


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    role: RoleOut
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
