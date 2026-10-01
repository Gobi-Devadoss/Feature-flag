import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    *,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    feature_flag_id: Optional[int] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    description: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id,
        feature_flag_id=feature_flag_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=json.dumps(old_value, default=str) if old_value is not None else None,
        new_value=json.dumps(new_value, default=str) if new_value is not None else None,
        description=description,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
