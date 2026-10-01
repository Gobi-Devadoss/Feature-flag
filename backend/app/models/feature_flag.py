import enum

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class FeatureFlagStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SCHEDULED = "SCHEDULED"
    ARCHIVED = "ARCHIVED"


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)  # machine-readable, e.g. "new_checkout_flow"
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(FeatureFlagStatus), default=FeatureFlagStatus.INACTIVE, nullable=False)
    is_enabled = Column(Boolean, default=False, nullable=False)

    # Scheduled activation
    scheduled_start_at = Column(DateTime, nullable=True)
    scheduled_end_at = Column(DateTime, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    created_by_user = relationship("User", back_populates="created_flags")
    rollouts = relationship("FeatureRollout", back_populates="feature_flag", cascade="all, delete-orphan")
    user_assignments = relationship("UserAssignment", back_populates="feature_flag", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="feature_flag")
