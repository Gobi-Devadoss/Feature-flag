from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.user import RoleOut, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=List[UserOut], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.patch("/{user_id}", response_model=UserOut, dependencies=[Depends(require_admin)])
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/roles/all", response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Role).all()
