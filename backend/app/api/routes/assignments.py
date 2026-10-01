from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.crud.audit import log_action
from app.db.session import get_db
from app.models.feature_flag import FeatureFlag
from app.models.user import User
from app.models.user_assignment import UserAssignment
from app.schemas.assignment import UserAssignmentCreate, UserAssignmentOut

router = APIRouter(prefix="/feature-flags/{flag_id}/assignments", tags=["User Assignments"])


@router.get("", response_model=List[UserAssignmentOut])
def list_assignments(flag_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(UserAssignment).filter(UserAssignment.feature_flag_id == flag_id).all()


@router.post("", response_model=UserAssignmentOut, status_code=201, dependencies=[Depends(require_admin)])
def create_assignment(flag_id: int, payload: UserAssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not db.query(FeatureFlag).filter(FeatureFlag.id == flag_id).first():
        raise HTTPException(status_code=404, detail="Feature flag not found")

    existing = (
        db.query(UserAssignment)
        .filter(
            UserAssignment.feature_flag_id == flag_id,
            UserAssignment.environment_id == payload.environment_id,
            UserAssignment.target_user_identifier == payload.target_user_identifier,
        )
        .first()
    )
    if existing:
        existing.is_enabled = payload.is_enabled
        db.commit()
        db.refresh(existing)
        return existing

    assignment = UserAssignment(
        feature_flag_id=flag_id,
        environment_id=payload.environment_id,
        target_user_identifier=payload.target_user_identifier,
        is_enabled=payload.is_enabled,
        assigned_by=current_user.id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    log_action(
        db,
        user_id=current_user.id,
        action="USER_ASSIGNMENT_CREATED",
        entity_type="USER_ASSIGNMENT",
        entity_id=assignment.id,
        feature_flag_id=flag_id,
        new_value=payload.model_dump(),
    )
    return assignment


@router.delete("/{assignment_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_assignment(flag_id: int, assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assignment = db.query(UserAssignment).filter(UserAssignment.id == assignment_id, UserAssignment.feature_flag_id == flag_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    log_action(db, user_id=current_user.id, action="USER_ASSIGNMENT_REMOVED", entity_type="USER_ASSIGNMENT", entity_id=assignment_id, feature_flag_id=flag_id)
    return None
