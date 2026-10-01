from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.feature_flag import FeatureFlagStatus


class FeatureFlagCreate(BaseModel):
    key: str = Field(..., max_length=100, description="Machine-readable unique key, e.g. new_checkout_flow")
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    scheduled_start_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None


class FeatureFlagUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[FeatureFlagStatus] = None
    scheduled_start_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None


class FeatureFlagOut(BaseModel):
    id: int
    key: str
    name: str
    description: Optional[str] = None
    status: FeatureFlagStatus
    is_enabled: bool
    scheduled_start_at: Optional[datetime] = None
    scheduled_end_at: Optional[datetime] = None
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ToggleRequest(BaseModel):
    is_enabled: bool
