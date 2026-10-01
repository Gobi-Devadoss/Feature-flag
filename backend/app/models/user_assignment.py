from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserAssignment(Base):
    """Explicit per-user override for a feature flag within an environment
    (whitelist/blacklist a specific user regardless of rollout percentage)."""

    __tablename__ = "user_assignments"
    __table_args__ = (
        UniqueConstraint("feature_flag_id", "environment_id", "target_user_identifier", name="uq_flag_env_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    feature_flag_id = Column(Integer, ForeignKey("feature_flags.id"), nullable=False)
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=False)

    # identifier of the *end user* of the client application (not necessarily
    # a row in `users`, since flags target the consuming app's users)
    target_user_identifier = Column(Integer, nullable=False, index=True)

    is_enabled = Column(Boolean, default=True, nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    feature_flag = relationship("FeatureFlag", back_populates="user_assignments")
    environment = relationship("Environment")
