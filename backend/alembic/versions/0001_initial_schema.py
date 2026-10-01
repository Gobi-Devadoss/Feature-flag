"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-23

"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(150), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("role_id", sa.Integer, sa.ForeignKey("roles.id"), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("last_login_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "environments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    feature_flag_status = sa.Enum("ACTIVE", "INACTIVE", "SCHEDULED", "ARCHIVED", name="featureflagstatus")

    op.create_table(
        "feature_flags",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("key", sa.String(100), nullable=False, unique=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", feature_flag_status, nullable=False, server_default="INACTIVE"),
        sa.Column("is_enabled", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("scheduled_start_at", sa.DateTime, nullable=True),
        sa.Column("scheduled_end_at", sa.DateTime, nullable=True),
        sa.Column("created_by", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "feature_rollouts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("feature_flag_id", sa.Integer, sa.ForeignKey("feature_flags.id"), nullable=False),
        sa.Column("environment_id", sa.Integer, sa.ForeignKey("environments.id"), nullable=False),
        sa.Column("is_enabled", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("rollout_percentage", sa.Integer, nullable=False, server_default="0"),
        sa.Column("previous_percentage", sa.Integer, nullable=True),
        sa.Column("updated_by", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint("feature_flag_id", "environment_id", name="uq_flag_environment"),
    )

    op.create_table(
        "user_assignments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("feature_flag_id", sa.Integer, sa.ForeignKey("feature_flags.id"), nullable=False),
        sa.Column("environment_id", sa.Integer, sa.ForeignKey("environments.id"), nullable=False),
        sa.Column("target_user_identifier", sa.Integer, nullable=False, index=True),
        sa.Column("is_enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("assigned_by", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint("feature_flag_id", "environment_id", "target_user_identifier", name="uq_flag_env_user"),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("feature_flag_id", sa.Integer, sa.ForeignKey("feature_flags.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.Integer, nullable=True),
        sa.Column("old_value", sa.Text, nullable=True),
        sa.Column("new_value", sa.Text, nullable=True),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("user_assignments")
    op.drop_table("feature_rollouts")
    op.drop_table("feature_flags")
    op.drop_table("environments")
    op.drop_table("users")
    op.drop_table("roles")
    sa.Enum(name="featureflagstatus").drop(op.get_bind(), checkfirst=True)
