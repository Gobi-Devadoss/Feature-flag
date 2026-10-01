# Feature Flag & Environment Management System — Backend

Centralized platform for managing application feature flags, environments,
percentage-based rollouts, user-specific overrides, and audit history —
without redeploying the application.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, JWT (python-jose), Redis
- **Database:** SQLite (file-based, `feature_flag.db` in the project root)
- **Docs:** Swagger UI (`/docs`), ReDoc (`/redoc`), Postman collection included

## Project Structure

```
app/
  core/         # config, security (JWT/hashing), redis client
  db/           # SQLAlchemy session, seed script
  models/       # roles, users, environments, feature_flags,
                # feature_rollouts, user_assignments, audit_logs
  schemas/      # Pydantic request/response models
  api/
    deps.py     # auth + RBAC dependencies
    routes/     # auth, users, environments, feature_flags,
                # rollouts, assignments, evaluation, audit_logs, dashboard
  main.py       # FastAPI app entrypoint
alembic/        # migrations (0001_initial_schema creates all 7 tables)
```

## Running with Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

This starts Redis and the API (SQLite needs no separate database service —
the `feature_flag.db` file is created in the project root, and the bind
mount in `docker-compose.yml` persists it on the host across restarts). On
boot it automatically runs `alembic upgrade head` and seeds default roles,
environments, and an admin user (`admin@example.com` / `ChangeMe123!` —
**change this in production**).

API available at `http://localhost:8000`, docs at `http://localhost:8000/docs`.

## Running locally without Docker

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # DATABASE_URL defaults to sqlite:///./feature_flag.db
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

To point at a different database later (e.g. Postgres or MySQL in
production), just change `DATABASE_URL` in `.env` and add the matching
driver to `requirements.txt` — nothing else in the code is SQLite-specific.

## Authentication & RBAC

- `POST /api/v1/auth/register` / `/login` / `/refresh` issue/rotate JWT access
  (60 min) + refresh (7 day) tokens.
- Every protected route depends on `get_current_user`; admin-only routes use
  `require_admin` (`SUPER_ADMIN`, `ADMIN` roles). Default seeded roles:
  `SUPER_ADMIN`, `ADMIN`, `DEVELOPER`, `VIEWER`.

## Core Concepts

- **Feature Flags** (`/feature-flags`): create, update, toggle on/off,
  schedule activation windows (`scheduled_start_at` / `scheduled_end_at`),
  and soft-archive.
- **Environments** (`/environments`): Development / Testing / Production,
  managed independently.
- **Rollouts** (`/feature-flags/{id}/rollouts`): per-environment percentage
  rollout (0–100). Every change stores the previous percentage, enabling
  one-call **rollback** (`POST .../rollouts/rollback`).
- **User Assignments** (`/feature-flags/{id}/assignments`): explicit
  per-user overrides that take precedence over percentage rollout.
- **Evaluation** (`POST /evaluate`): the endpoint client applications call
  to check whether a flag is on for a given user + environment. Resolution
  order: schedule window → global enabled flag → user override → percentage
  rollout (deterministic hash bucketing, so a given user always gets a
  consistent result for a fixed percentage). Every evaluation increments a
  Redis counter for usage analytics (`GET /evaluate/{key}/usage`).
- **Audit Logs** (`/audit-logs`): every create/update/toggle/rollback writes
  an entry with old/new value snapshots.
- **Dashboard** (`/dashboard/stats`): flag counts by status, environment
  counts, and average rollout percentage per environment.

## Postman

Import `postman_collection.json`. The `Login` request auto-populates the
`access_token` / `refresh_token` collection variables for subsequent calls.

## Next Steps / Not Yet Implemented

- Celery/scheduled job to auto-flip flag status when a `scheduled_start_at`
  / `scheduled_end_at` window opens or closes (currently evaluated live at
  request time in `/evaluate`, which is correct for evaluation but doesn't
  update the stored `status` field automatically).
- Rate limiting on `/evaluate` for high-traffic client SDKs.
- Frontend (React + Vite + TypeScript + MUI) — not part of this scaffold.
