from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class FeatureRollout(Base):
    """Tracks a feature flag's state within a specific environment, including
    percentage-based rollout and rollback (previous percentage) support."""

    __tablename__ = "feature_rollouts"
    __table_args__ = (UniqueConstraint("feature_flag_id", "environment_id", name="uq_flag_environment"),)

    id = Column(Integer, primary_key=True, index=True)
    feature_flag_id = Column(Integer, ForeignKey("feature_flags.id"), nullable=False)
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=False)

    is_enabled = Column(Boolean, default=False, nullable=False)
    rollout_percentage = Column(Integer, default=0, nullable=False)  # 0-100
    previous_percentage = Column(Integer, nullable=True)  # used for rollback

    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    feature_flag = relationship("FeatureFlag", back_populates="rollouts")
    environment = relationship("Environment", back_populates="rollouts")
