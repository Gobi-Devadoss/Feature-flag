from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.environment import Environment
from app.models.feature_flag import FeatureFlag, FeatureFlagStatus
from app.models.feature_rollout import FeatureRollout
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_flags = db.query(func.count(FeatureFlag.id)).scalar()
    active_flags = db.query(func.count(FeatureFlag.id)).filter(FeatureFlag.status == FeatureFlagStatus.ACTIVE).scalar()
    scheduled_flags = db.query(func.count(FeatureFlag.id)).filter(FeatureFlag.status == FeatureFlagStatus.SCHEDULED).scalar()
    archived_flags = db.query(func.count(FeatureFlag.id)).filter(FeatureFlag.status == FeatureFlagStatus.ARCHIVED).scalar()

    total_environments = db.query(func.count(Environment.id)).scalar()

    rollouts_by_env = (
        db.query(Environment.name, func.count(FeatureRollout.id), func.avg(FeatureRollout.rollout_percentage))
        .join(FeatureRollout, FeatureRollout.environment_id == Environment.id)
        .group_by(Environment.name)
        .all()
    )

    return {
        "flags": {
            "total": total_flags,
            "active": active_flags,
            "scheduled": scheduled_flags,
            "archived": archived_flags,
            "inactive": total_flags - active_flags - scheduled_flags - archived_flags,
        },
        "environments": {
            "total": total_environments,
        },
        "rollouts_by_environment": [
            {"environment": name, "flag_count": count, "avg_rollout_percentage": round(float(avg_pct or 0), 2)}
            for name, count, avg_pct in rollouts_by_env
        ],
    }
