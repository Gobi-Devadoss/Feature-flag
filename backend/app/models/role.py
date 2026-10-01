from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # e.g. SUPER_ADMIN, ADMIN, DEVELOPER, VIEWER
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    users = relationship("User", back_populates="role")
