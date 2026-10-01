from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.crud.audit import log_action
from app.db.session import get_db
from app.models.environment import Environment
from app.models.user import User
from app.schemas.environment import EnvironmentCreate, EnvironmentOut, EnvironmentUpdate

router = APIRouter(prefix="/environments", tags=["Environments"])


@router.get("", response_model=List[EnvironmentOut])
def list_environments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Environment).all()


@router.post("", response_model=EnvironmentOut, status_code=201, dependencies=[Depends(require_admin)])
def create_environment(payload: EnvironmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Environment).filter(Environment.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Environment already exists")
    env = Environment(**payload.model_dump())
    db.add(env)
    db.commit()
    db.refresh(env)
    log_action(db, user_id=current_user.id, action="ENVIRONMENT_CREATED", entity_type="ENVIRONMENT", entity_id=env.id, new_value=payload.model_dump())
    return env


@router.patch("/{env_id}", response_model=EnvironmentOut, dependencies=[Depends(require_admin)])
def update_environment(env_id: int, payload: EnvironmentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    env = db.query(Environment).filter(Environment.id == env_id).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(env, field, value)
    db.commit()
    db.refresh(env)
    log_action(db, user_id=current_user.id, action="ENVIRONMENT_UPDATED", entity_type="ENVIRONMENT", entity_id=env.id)
    return env
