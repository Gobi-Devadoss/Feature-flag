from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EnvironmentCreate(BaseModel):
    name: str
    description: Optional[str] = None


class EnvironmentUpdate(BaseModel):
    description: Optional[str] = None
    is_active: Optional[bool] = None


class EnvironmentOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
