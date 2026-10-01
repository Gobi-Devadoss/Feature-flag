from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    feature_flag_id = Column(Integer, ForeignKey("feature_flags.id"), nullable=True)

    action = Column(String(100), nullable=False)  # e.g. FLAG_CREATED, FLAG_ENABLED, ROLLOUT_CHANGED, ROLLBACK
    entity_type = Column(String(50), nullable=False)  # FEATURE_FLAG, ENVIRONMENT, USER, ROLLOUT
    entity_id = Column(Integer, nullable=True)

    old_value = Column(Text, nullable=True)  # JSON-serialized snapshot
    new_value = Column(Text, nullable=True)  # JSON-serialized snapshot
    description = Column(String(255), nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="audit_logs")
    feature_flag = relationship("FeatureFlag", back_populates="audit_logs")
