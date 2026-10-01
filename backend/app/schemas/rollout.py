from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class RolloutUpsert(BaseModel):
    environment_id: int
    is_enabled: bool = False
    rollout_percentage: int = Field(0, ge=0, le=100)


class RolloutOut(BaseModel):
    id: int
    feature_flag_id: int
    environment_id: int
    is_enabled: bool
    rollout_percentage: int
    previous_percentage: Optional[int] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RollbackRequest(BaseModel):
    environment_id: int
