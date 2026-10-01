from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.crud.audit import log_action
from app.db.session import get_db
from app.models.feature_flag import FeatureFlag, FeatureFlagStatus
from app.models.user import User
from app.schemas.feature_flag import (
    FeatureFlagCreate,
    FeatureFlagOut,
    FeatureFlagUpdate,
    ToggleRequest,
)

router = APIRouter(prefix="/feature-flags", tags=["Feature Flags"])


@router.get("", response_model=List[FeatureFlagOut])
def list_flags(
    status_filter: Optional[FeatureFlagStatus] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(FeatureFlag)
    if status_filter:
        query = query.filter(FeatureFlag.status == status_filter)
    if search:
        like = f"%{search}%"
        query = query.filter((FeatureFlag.key.ilike(like)) | (FeatureFlag.name.ilike(like)))
    return query.order_by(FeatureFlag.created_at.desc()).all()


@router.get("/{flag_id}", response_model=FeatureFlagOut)
def get_flag(flag_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    flag = db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return flag


@router.post("", response_model=FeatureFlagOut, status_code=201, dependencies=[Depends(require_admin)])
def create_flag(payload: FeatureFlagCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(FeatureFlag).filter(FeatureFlag.key == payload.key).first():
        raise HTTPException(status_code=400, detail="Flag key already exists")

    status_value = FeatureFlagStatus.SCHEDULED if payload.scheduled_start_at else FeatureFlagStatus.INACTIVE
    flag = FeatureFlag(**payload.model_dump(), status=status_value, created_by=current_user.id)
    db.add(flag)
    db.commit()
    db.refresh(flag)
    log_action(db, user_id=current_user.id, action="FLAG_CREATED", entity_type="FEATURE_FLAG", entity_id=flag.id, feature_flag_id=flag.id, new_value=payload.model_dump())
    return flag


@router.patch("/{flag_id}", response_model=FeatureFlagOut, dependencies=[Depends(require_admin)])
def update_flag(flag_id: int, payload: FeatureFlagUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    flag = db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")

    old_value = {"name": flag.name, "status": flag.status, "description": flag.description}
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(flag, field, value)
    db.commit()
    db.refresh(flag)
    log_action(db, user_id=current_user.id, action="FLAG_UPDATED", entity_type="FEATURE_FLAG", entity_id=flag.id, feature_flag_id=flag.id, old_value=old_value, new_value=payload.model_dump(exclude_unset=True))
    return flag


@router.post("/{flag_id}/toggle", response_model=FeatureFlagOut, dependencies=[Depends(require_admin)])
def toggle_flag(flag_id: int, payload: ToggleRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Global on/off switch for a flag (does not affect per-environment rollout %)."""
    flag = db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")

    old_value = flag.is_enabled
    flag.is_enabled = payload.is_enabled
    flag.status = FeatureFlagStatus.ACTIVE if payload.is_enabled else FeatureFlagStatus.INACTIVE
    db.commit()
    db.refresh(flag)
    log_action(
        db,
        user_id=current_user.id,
        action="FLAG_ENABLED" if payload.is_enabled else "FLAG_DISABLED",
        entity_type="FEATURE_FLAG",
        entity_id=flag.id,
        feature_flag_id=flag.id,
        old_value=old_value,
        new_value=payload.is_enabled,
    )
    return flag


@router.delete("/{flag_id}", status_code=204, dependencies=[Depends(require_admin)])
def archive_flag(flag_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Soft-delete: archives the flag instead of removing history."""
    flag = db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    flag.status = FeatureFlagStatus.ARCHIVED
    flag.is_enabled = False
    db.commit()
    log_action(db, user_id=current_user.id, action="FLAG_ARCHIVED", entity_type="FEATURE_FLAG", entity_id=flag.id, feature_flag_id=flag.id)
    return None
