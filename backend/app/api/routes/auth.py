from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.crud.audit import log_action
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.user import LoginRequest, RefreshRequest, TokenResponse, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if not db.query(Role).filter(Role.id == payload.role_id).first():
        raise HTTPException(status_code=400, detail="Invalid role_id")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role_id=payload.role_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_action(db, user_id=user.id, action="USER_REGISTERED", entity_type="USER", entity_id=user.id)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")

    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token(str(user.id), extra_claims={"role": user.role.name})
    refresh_token = create_refresh_token(str(user.id))
    log_action(db, user_id=user.id, action="USER_LOGIN", entity_type="USER", entity_id=user.id)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise ValueError("Not a refresh token")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == int(data["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    access_token = create_access_token(str(user.id), extra_claims={"role": user.role.name})
    new_refresh_token = create_refresh_token(str(user.id))
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)
