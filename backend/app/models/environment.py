from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Environment(Base):
    __tablename__ = "environments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # Development, Testing, Production
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    rollouts = relationship("FeatureRollout", back_populates="environment")
