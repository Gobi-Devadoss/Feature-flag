from fastapi import APIRouter

from app.api.routes import (
    assignments,
    audit_logs,
    auth,
    dashboard,
    environments,
    evaluation,
    feature_flags,
    rollouts,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(environments.router)
api_router.include_router(feature_flags.router)
api_router.include_router(rollouts.router)
api_router.include_router(assignments.router)
api_router.include_router(evaluation.router)
api_router.include_router(audit_logs.router)
api_router.include_router(dashboard.router)
