from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    feature_flag_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
