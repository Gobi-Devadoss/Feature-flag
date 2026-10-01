from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.crud.audit import log_action
from app.db.session import get_db
from app.models.environment import Environment
from app.models.feature_flag import FeatureFlag
from app.models.feature_rollout import FeatureRollout
from app.models.user import User
from app.schemas.rollout import RollbackRequest, RolloutOut, RolloutUpsert

router = APIRouter(prefix="/feature-flags/{flag_id}/rollouts", tags=["Rollouts"])


def _get_flag_or_404(db: Session, flag_id: int) -> FeatureFlag:
    flag = db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return flag


@router.get("", response_model=List[RolloutOut])
def list_rollouts(flag_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_flag_or_404(db, flag_id)
    return db.query(FeatureRollout).filter(FeatureRollout.feature_flag_id == flag_id).all()


@router.put("", response_model=RolloutOut, dependencies=[Depends(require_admin)])
def upsert_rollout(flag_id: int, payload: RolloutUpsert, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create or update the rollout config (enabled + percentage) for a flag in a given environment."""
    _get_flag_or_404(db, flag_id)
    if not db.query(Environment).filter(Environment.id == payload.environment_id).first():
        raise HTTPException(status_code=400, detail="Invalid environment_id")

    rollout = (
        db.query(FeatureRollout)
        .filter(FeatureRollout.feature_flag_id == flag_id, FeatureRollout.environment_id == payload.environment_id)
        .first()
    )

    if rollout is None:
        rollout = FeatureRollout(
            feature_flag_id=flag_id,
            environment_id=payload.environment_id,
            is_enabled=payload.is_enabled,
            rollout_percentage=payload.rollout_percentage,
            updated_by=current_user.id,
        )
        db.add(rollout)
        action = "ROLLOUT_CREATED"
        old_pct = None
    else:
        old_pct = rollout.rollout_percentage
        rollout.previous_percentage = rollout.rollout_percentage
        rollout.is_enabled = payload.is_enabled
        rollout.rollout_percentage = payload.rollout_percentage
        rollout.updated_by = current_user.id
        action = "ROLLOUT_CHANGED"

    db.commit()
    db.refresh(rollout)
    log_action(
        db,
        user_id=current_user.id,
        action=action,
        entity_type="ROLLOUT",
        entity_id=rollout.id,
        feature_flag_id=flag_id,
        old_value={"rollout_percentage": old_pct},
        new_value={"rollout_percentage": payload.rollout_percentage, "is_enabled": payload.is_enabled},
    )
    return rollout


@router.post("/rollback", response_model=RolloutOut, dependencies=[Depends(require_admin)])
def rollback_rollout(flag_id: int, payload: RollbackRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Revert a rollout's percentage to its previous value for the given environment."""
    _get_flag_or_404(db, flag_id)
    rollout = (
        db.query(FeatureRollout)
        .filter(FeatureRollout.feature_flag_id == flag_id, FeatureRollout.environment_id == payload.environment_id)
        .first()
    )
    if not rollout:
        raise HTTPException(status_code=404, detail="Rollout not found for this environment")
    if rollout.previous_percentage is None:
        raise HTTPException(status_code=400, detail="No previous rollout state to roll back to")

    old_pct = rollout.rollout_percentage
    rollout.rollout_percentage, rollout.previous_percentage = rollout.previous_percentage, rollout.rollout_percentage
    rollout.updated_by = current_user.id
    db.commit()
    db.refresh(rollout)

    log_action(
        db,
        user_id=current_user.id,
        action="ROLLBACK",
        entity_type="ROLLOUT",
        entity_id=rollout.id,
        feature_flag_id=flag_id,
        old_value={"rollout_percentage": old_pct},
        new_value={"rollout_percentage": rollout.rollout_percentage},
        description="Rolled back to previous rollout percentage",
    )
    return rollout
