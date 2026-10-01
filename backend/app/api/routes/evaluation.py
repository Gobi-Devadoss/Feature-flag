import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.environment import Environment
from app.models.feature_flag import FeatureFlag, FeatureFlagStatus
from app.models.feature_rollout import FeatureRollout
from app.models.user_assignment import UserAssignment
from app.schemas.assignment import FeatureCheckRequest
from app.core.redis_client import redis_client
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/evaluate", tags=["Evaluation"])


def _bucket_percentage(flag_key: str, user_identifier: int) -> int:
    """Deterministically hash (flag, user) into a stable 0-99 bucket so the
    same user always gets the same rollout decision for a given percentage."""
    digest = hashlib.md5(f"{flag_key}:{user_identifier}".encode()).hexdigest()
    return int(digest, 16) % 100


@router.post("")
def evaluate_feature(payload: FeatureCheckRequest, db: Session = Depends(get_db)):
    flag = db.query(FeatureFlag).filter(FeatureFlag.key == payload.flag_key).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")

    environment = db.query(Environment).filter(Environment.name == payload.environment_name).first()
    if not environment:
        raise HTTPException(status_code=404, detail="Environment not found")

    result = {"flag_key": payload.flag_key, "enabled": False, "reason": "default_off"}

    # Scheduled activation window check
    now = datetime.now(timezone.utc)
    if flag.status == FeatureFlagStatus.SCHEDULED:
        if flag.scheduled_start_at and now < flag.scheduled_start_at.replace(tzinfo=timezone.utc):
            result["reason"] = "not_yet_scheduled"
            _record_usage(payload.flag_key, environment.name, False)
            return result
        if flag.scheduled_end_at and now > flag.scheduled_end_at.replace(tzinfo=timezone.utc):
            result["reason"] = "schedule_ended"
            _record_usage(payload.flag_key, environment.name, False)
            return result

    if flag.status == FeatureFlagStatus.ARCHIVED or not flag.is_enabled:
        result["reason"] = "flag_disabled"
        _record_usage(payload.flag_key, environment.name, False)
        return result

    # Explicit per-user override takes precedence
    assignment = (
        db.query(UserAssignment)
        .filter(
            UserAssignment.feature_flag_id == flag.id,
            UserAssignment.environment_id == environment.id,
            UserAssignment.target_user_identifier == payload.user_identifier,
        )
        .first()
    )
    if assignment:
        result["enabled"] = assignment.is_enabled
        result["reason"] = "user_override"
        _record_usage(payload.flag_key, environment.name, assignment.is_enabled)
        return result

    # Percentage-based rollout for this environment
    rollout = (
        db.query(FeatureRollout)
        .filter(FeatureRollout.feature_flag_id == flag.id, FeatureRollout.environment_id == environment.id)
        .first()
    )
    if rollout and rollout.is_enabled:
        bucket = _bucket_percentage(payload.flag_key, payload.user_identifier)
        enabled = bucket < rollout.rollout_percentage
        result["enabled"] = enabled
        result["reason"] = f"rollout_bucket_{bucket}_of_{rollout.rollout_percentage}"
        _record_usage(payload.flag_key, environment.name, enabled)
        return result

    _record_usage(payload.flag_key, environment.name, False)
    return result


def _record_usage(flag_key: str, environment_name: str, enabled: bool) -> None:
    try:
        key = f"usage:{flag_key}:{environment_name}:{'enabled' if enabled else 'disabled'}"
        redis_client.incr(key)
    except Exception:
        # Analytics must never block the evaluation response
        pass


@router.get("/{flag_key}/usage")
def get_usage(flag_key: str, environment_name: str, current_user: User = Depends(get_current_user)):
    try:
        enabled_count = int(redis_client.get(f"usage:{flag_key}:{environment_name}:enabled") or 0)
        disabled_count = int(redis_client.get(f"usage:{flag_key}:{environment_name}:disabled") or 0)
    except Exception:
        enabled_count = disabled_count = 0
    return {
        "flag_key": flag_key,
        "environment": environment_name,
        "enabled_evaluations": enabled_count,
        "disabled_evaluations": disabled_count,
        "total_evaluations": enabled_count + disabled_count,
    }
