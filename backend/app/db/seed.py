"""Run with: python -m app.db.seed
Creates default roles, environments, and a super admin user if they don't exist.
"""
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.environment import Environment
from app.models.role import Role
from app.models.user import User

DEFAULT_ROLES = [
    ("SUPER_ADMIN", "Full system access"),
    ("ADMIN", "Manage flags, environments, rollouts"),
    ("DEVELOPER", "Create and view flags, no destructive actions"),
    ("VIEWER", "Read-only access"),
]

DEFAULT_ENVIRONMENTS = [
    ("Development", "Development environment"),
    ("Testing", "QA / staging environment"),
    ("Production", "Live production environment"),
]


def seed() -> None:
    db = SessionLocal()
    try:
        for name, description in DEFAULT_ROLES:
            if not db.query(Role).filter(Role.name == name).first():
                db.add(Role(name=name, description=description))
        db.commit()

        for name, description in DEFAULT_ENVIRONMENTS:
            if not db.query(Environment).filter(Environment.name == name).first():
                db.add(Environment(name=name, description=description))
        db.commit()

        admin_role = db.query(Role).filter(Role.name == "SUPER_ADMIN").first()
        if not db.query(User).filter(User.email == "admin@example.com").first():
            db.add(
                User(
                    full_name="Super Admin",
                    email="admin@example.com",
                    hashed_password=hash_password("ChangeMe123!"),
                    role_id=admin_role.id,
                )
            )
            db.commit()
        print("Seed complete. Default login: admin@example.com / ChangeMe123!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
