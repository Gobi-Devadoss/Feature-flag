# Feature Flag & Environment Management System

A full-stack platform for centrally managing application feature flags without requiring application redeployments.

The system supports:

- Secure JWT authentication
- Role-Based Access Control (RBAC)
- Feature flag creation and management
- Enable/disable controls
- Development, Testing, and Production environments
- Scheduled activation windows
- Percentage-based feature rollouts
- User-specific feature assignments/overrides
- Deterministic feature evaluation
- Rollout rollback
- Feature usage analytics through Redis
- Audit logs and change history
- Admin dashboard and environment statistics
- React-based management console
- Docker support
- Alembic database migrations
- Swagger/OpenAPI documentation
- Postman collection for API testing

---

## 1. Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| Python 3.12 | Backend programming language |
| FastAPI | REST API framework |
| SQLAlchemy 2.0 | ORM and database access |
| Alembic | Database migrations |
| Pydantic v2 | Request/response validation |
| JWT / python-jose | Authentication |
| Passlib + bcrypt | Password hashing |
| Redis | Feature usage analytics/counters |
| SQLite | Default development database |
| Uvicorn | ASGI application server |

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type-safe frontend development |
| Vite | Frontend build tool |
| Material UI | UI components |
| React Router | Client-side routing |
| Axios | API communication |
| Chart.js | Dashboard charts |

### DevOps / Tools

- Docker
- Docker Compose
- Nginx
- Git / GitHub
- Postman
- Swagger UI / OpenAPI

---

## 2. System Architecture

```text
                         ┌─────────────────────┐
                         │     React Client    │
                         │ React + TypeScript  │
                         │    Material UI      │
                         └──────────┬──────────┘
                                    │
                                  Axios
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     FastAPI API     │
                         │    REST Endpoints   │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
           ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
           │  SQLAlchemy │   │    Redis    │   │    JWT      │
           │     ORM     │   │   Usage     │   │    Auth     │
           └──────┬──────┘   │  Counters   │   └─────────────┘
                  │          └─────────────┘
                  ▼
           ┌─────────────┐
           │   SQLite    │
           │ feature_flag│
           │    .db      │
           └─────────────┘

                  │
                  ▼
           ┌─────────────┐
           │   Alembic   │
           │  Migrations │
           └─────────────┘
```

---

## 3. Main Features

### 3.1 Authentication

The backend provides:

- User registration
- Login
- JWT access token
- JWT refresh token
- Current-user endpoint
- Password hashing using bcrypt
- Protected API endpoints

Token configuration:

- Access token: 60 minutes by default
- Refresh token: 7 days by default

---

## 4. Role-Based Access Control

The application defines four default roles:

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full system access |
| `ADMIN` | Manage flags, environments and rollouts |
| `DEVELOPER` | Create/view feature-related resources according to API permissions |
| `VIEWER` | Read-only access |

RBAC is implemented using FastAPI dependencies.

Protected endpoints use the authenticated user dependency, while administrative operations use the admin dependency.

---

## 5. Feature Flags

A feature flag allows a functionality in a client application to be enabled or disabled dynamically.

Example:

```text
new_checkout_flow
```

Instead of deploying a new application version, an administrator can control the feature through this platform.

Supported operations include:

- Create feature flag
- View feature flags
- Search/filter flags
- Update flag
- Globally enable/disable flag
- Archive flag
- Configure scheduled start/end times

---

## 6. Environments

The system supports independent environments.

Default environments:

```text
Development
Testing
Production
```

Each feature flag can have different rollout settings for each environment.

Example:

```text
Feature: new_payment_system

Development  → 100%
Testing      → 50%
Production   → 10%
```

This allows teams to test a feature gradually before exposing it to all production users.

---

## 7. Percentage-Based Rollouts

A feature can be released gradually using a percentage rollout.

Example:

```text
0%    → Nobody receives the feature
10%   → Approximately 10% of users
50%   → Approximately half of users
100%  → Everyone receives the feature
```

The evaluation logic uses deterministic hashing based on the feature key and user identifier.

This means the same user receives a consistent result for a fixed rollout percentage.

---

## 8. User-Specific Assignments

Administrators can explicitly enable or disable a feature for a specific user.

Example:

```text
Feature:
new_dashboard

User 101 → ENABLED
User 102 → DISABLED
```

User-specific assignments take precedence over percentage-based rollout decisions.

This is useful for:

- Internal testing
- Beta users
- Early-access customers
- Troubleshooting
- Specific customer overrides

---

## 9. Feature Evaluation

Client applications can call the evaluation endpoint to determine whether a feature should be enabled.

Conceptually:

```text
Client Application
       │
       ▼
POST /api/v1/evaluate
       │
       ▼
Check schedule
       │
       ▼
Check global flag status
       │
       ▼
Check user-specific assignment
       │
       ▼
Check percentage rollout
       │
       ▼
Return enabled/disabled result
```

The evaluation endpoint is designed to be consumed by client applications.

---

## 10. Rollback

Every rollout update stores the previous rollout percentage.

Example:

```text
Previous rollout: 50%
New rollout:      80%
```

If a problem occurs:

```text
Rollback
   ↓
80% → 50%
```

Rollback is available through the rollout API and management console.

---

## 11. Usage Analytics

Redis is used to maintain lightweight usage counters for feature evaluations.

The system records evaluation usage based on:

- Feature flag
- Environment
- Enabled/disabled result

This allows administrators to inspect feature usage from the API/dashboard.

---

## 12. Audit Logs

Administrative changes are recorded in audit logs.

The audit system can track actions such as:

- Feature creation
- Feature updates
- Enable/disable operations
- Rollout changes
- Rollbacks
- Other managed entity changes

Audit records contain previous/new state information where applicable.

---

## 13. Dashboard

The frontend dashboard provides system statistics such as:

- Feature flag status counts
- Environment counts
- Average rollout percentage
- Rollout information by environment
- Usage-related information

Charts are implemented using Chart.js.

---

# 14. Project Structure

```text
feature flag/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── assignments.py
│   │   │   │   ├── audit_logs.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── dashboard.py
│   │   │   │   ├── environments.py
│   │   │   │   ├── evaluation.py
│   │   │   │   ├── feature_flags.py
│   │   │   │   ├── rollouts.py
│   │   │   │   └── users.py
│   │   │   ├── api_router.py
│   │   │   └── deps.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── redis_client.py
│   │   │   └── security.py
│   │   │
│   │   ├── crud/
│   │   │   └── audit.py
│   │   │
│   │   ├── db/
│   │   │   ├── session.py
│   │   │   └── seed.py
│   │   │
│   │   ├── models/
│   │   │   ├── audit_log.py
│   │   │   ├── environment.py
│   │   │   ├── feature_flag.py
│   │   │   ├── feature_rollout.py
│   │   │   ├── role.py
│   │   │   ├── user.py
│   │   │   └── user_assignment.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── assignment.py
│   │   │   ├── audit_log.py
│   │   │   ├── environment.py
│   │   │   ├── feature_flag.py
│   │   │   ├── rollout.py
│   │   │   └── user.py
│   │   │
│   │   └── main.py
│   │
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── 0001_initial_schema.py
│   │   └── env.py
│   │
│   ├── .env.example
│   ├── alembic.ini
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── requirements.txt
│   └── postman_collection.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── client.ts
    │   │   └── services.ts
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   └── RequireAuth.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── AssignmentsPage.tsx
    │   │   ├── AuditLogsPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   ├── EnvironmentsPage.tsx
    │   │   ├── EvaluationPage.tsx
    │   │   ├── FlagDetailPage.tsx
    │   │   ├── FlagsListPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   └── RolloutsPage.tsx
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   └── main.tsx
    │
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

# 15. Backend Setup

## Prerequisites

Install:

- Python 3.12+
- Redis
- Node.js 18+ or 20+ for frontend
- Git

Docker can be used instead of installing Redis manually.

---

## 16. Backend Installation

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

### Windows PowerShell

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### Linux/macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 17. Environment Configuration

Create `.env` from `.env.example`.

```env
DATABASE_URL=sqlite:///./feature_flag.db
REDIS_URL=redis://localhost:6379/0

JWT_SECRET_KEY=change-this-to-a-long-random-secret
JWT_ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

For production, replace the development JWT secret with a long random secret.

---

# 18. Database Migration

Run:

```bash
alembic upgrade head
```

This applies the existing database migrations.

To create a new migration after model changes:

```bash
alembic revision --autogenerate -m "describe your change"
```

Then apply it:

```bash
alembic upgrade head
```

To check the current migration:

```bash
alembic current
```

---

# 19. Seed Initial Data

Run:

```bash
python -m app.db.seed
```

The seed script creates default:

- Roles
- Environments
- Super administrator

Default admin account:

```text
Email:    admin@example.com
Password: ChangeMe123!
```

Change this password before using the application in a real environment.

---

# 20. Start Backend

Run:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/health
```

Swagger documentation:

```text
http://localhost:8000/docs
```

ReDoc:

```text
http://localhost:8000/redoc
```

---

# 21. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

The Vite configuration proxies API requests to the backend.

---

# 22. Build Frontend

Create a production build:

```bash
npm run build
```

The generated files are placed in:

```text
frontend/dist/
```

Preview the production build:

```bash
npm run preview
```

---

# 23. Docker Setup

The backend includes Docker configuration for FastAPI and Redis.

From the backend directory:

```bash
cd backend
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Start services:

```bash
docker compose up --build
```

This starts:

```text
FastAPI → http://localhost:8000
Redis   → localhost:6379
```

The container runs:

```text
alembic upgrade head
        ↓
python -m app.db.seed
        ↓
uvicorn app.main:app
```

Stop the services:

```bash
docker compose down
```

---

# 24. API Endpoints

All API endpoints are prefixed with:

```text
/api/v1
```

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh JWT tokens |

## Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Get current user |
| GET | `/users` | List users |
| PATCH | `/users/{user_id}` | Update user |
| GET | `/users/roles/all` | List roles |

## Environments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/environments` | List environments |
| POST | `/environments` | Create environment |
| PATCH | `/environments/{env_id}` | Update environment |

## Feature Flags

| Method | Endpoint | Description |
|---|---|---|
| GET | `/feature-flags` | List/search flags |
| GET | `/feature-flags/{flag_id}` | Get flag |
| POST | `/feature-flags` | Create flag |
| PATCH | `/feature-flags/{flag_id}` | Update flag |
| POST | `/feature-flags/{flag_id}/toggle` | Enable/disable flag |
| DELETE | `/feature-flags/{flag_id}` | Archive flag |

## Rollouts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/feature-flags/{flag_id}/rollouts` | List rollouts |
| PUT | `/feature-flags/{flag_id}/rollouts` | Create/update rollout |
| POST | `/feature-flags/{flag_id}/rollouts/rollback` | Roll back rollout |

## User Assignments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/feature-flags/{flag_id}/assignments` | List assignments |
| POST | `/feature-flags/{flag_id}/assignments` | Create assignment |
| DELETE | `/feature-flags/{flag_id}/assignments/{assignment_id}` | Remove assignment |

## Evaluation

| Method | Endpoint | Description |
|---|---|---|
| POST | `/evaluate` | Evaluate a feature flag |
| GET | `/evaluate/{flag_key}/usage` | Get usage statistics |

## Audit Logs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/audit-logs` | View audit logs |

## Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/stats` | Dashboard statistics |

---

# 25. Example Feature Evaluation

A client application can send a feature evaluation request:

```http
POST /api/v1/evaluate
Content-Type: application/json
```

Example request:

```json
{
  "flag_key": "new_checkout_flow",
  "environment_name": "Production",
  "user_identifier": 101
}
```

The API evaluates:

1. Feature schedule
2. Global feature status
3. User-specific assignment
4. Percentage rollout

and returns the evaluation result.

---

# 26. API Testing with Postman

The project contains:

```text
backend/postman_collection.json
```

Import this collection into Postman.

Recommended testing sequence:

```text
1. Register/Login
       ↓
2. Receive JWT access token
       ↓
3. Create environment
       ↓
4. Create feature flag
       ↓
5. Configure rollout
       ↓
6. Add user assignment
       ↓
7. Evaluate feature
       ↓
8. Check usage
       ↓
9. Check audit logs
```

---

# 27. Database Models

The backend currently contains models for:

```text
Role
User
Environment
FeatureFlag
FeatureRollout
UserAssignment
AuditLog
```

Conceptually:

```text
Role
 │
 └── User
       │
       └── UserAssignment
                 │
FeatureFlag ─────┘
     │
     └── FeatureRollout
              │
              └── Environment

FeatureFlag
     │
     └── AuditLog
```

---

# 28. Security

Security mechanisms implemented include:

- Password hashing with bcrypt
- JWT authentication
- Access and refresh tokens
- Protected routes
- Role-based authorization
- CORS configuration
- Pydantic request validation
- SQLAlchemy ORM
- Environment-based configuration

For production:

- Use a strong random JWT secret
- Change the default admin password
- Use HTTPS
- Use a production database such as PostgreSQL/MySQL
- Restrict CORS origins
- Do not commit `.env`
- Use secure secret management
- Run Redis with appropriate authentication/network restrictions

---

# 29. Development Workflow

Typical development workflow:

```text
1. Update SQLAlchemy model
       ↓
2. Generate Alembic migration
       ↓
3. Review migration
       ↓
4. Run migration
       ↓
5. Update Pydantic schema
       ↓
6. Update API route/service
       ↓
7. Update frontend API service
       ↓
8. Update React page/component
       ↓
9. Test using Swagger/Postman
       ↓
10. Run frontend build
```

---

# 30. Troubleshooting

## `uvicorn` is not recognized

Use:

```bash
python -m uvicorn app.main:app --reload
```

or activate the virtual environment first.

---

## Database table does not exist

Run:

```bash
alembic upgrade head
```

Then:

```bash
python -m app.db.seed
```

---

## Redis connection error

Make sure Redis is running.

With Docker:

```bash
docker compose up redis
```

For a local Redis installation, make sure the configured `REDIS_URL` points to the correct host and port.

---

## Frontend cannot connect to API

Check that the backend is running:

```text
http://localhost:8000/health
```

Then verify the Vite proxy configuration and backend CORS settings.

---

# 31. Future Improvements

Potential production enhancements include:

- PostgreSQL/MySQL production database
- Celery-based scheduled flag activation/deactivation
- Rate limiting for high-volume evaluation requests
- Client SDKs for Python/JavaScript/etc.
- API keys for client applications
- Multi-tenant organizations
- Advanced targeting rules
- Geographic/device/user-attribute targeting
- Webhooks
- Email/Slack notifications
- More detailed analytics
- Automated tests and CI/CD
- Production Kubernetes deployment
- Secret management
- Observability with structured logging and metrics

---

# 32. License

This project is intended as a software development/learning project.

Add an appropriate license here if the project is distributed publicly.

---

## Quick Start

### Backend

```bash
cd backend

python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1

pip install -r requirements.txt

# Create .env from .env.example

alembic upgrade head

python -m app.db.seed

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

Open:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:8000

Swagger:
http://localhost:8000/docs
```

Default administrator:

```text
Email: admin@example.com
Password: ChangeMe123!
```
