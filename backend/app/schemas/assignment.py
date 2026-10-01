from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserAssignmentCreate(BaseModel):
    environment_id: int
    target_user_identifier: int
    is_enabled: bool = True


class UserAssignmentOut(BaseModel):
    id: int
    feature_flag_id: int
    environment_id: int
    target_user_identifier: int
    is_enabled: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeatureCheckRequest(BaseModel):
    flag_key: str
    environment_name: str
    user_identifier: int
