from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=List[AuditLogOut], dependencies=[Depends(require_admin)])
def list_audit_logs(
    feature_flag_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if feature_flag_id:
        query = query.filter(AuditLog.feature_flag_id == feature_flag_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()
