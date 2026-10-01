# Feature Flag Console — Frontend

React (Vite) + TypeScript + Material UI console for the Feature Flag &
Environment Management System backend.

## Features

- JWT login with automatic access-token refresh on 401
- Role-aware UI (write actions hidden/disabled for non-admins)
- **Dashboard**: flag status counts + avg rollout % per environment chart (Chart.js)
- **Feature Flags**: search/filter, create, global enable/disable toggle
- **Flag Detail**: per-environment percentage rollout (slider), enable/disable
  per environment, one-click **rollback** to previous percentage, and
  user-specific access grants/revokes
- **Environments**: list, create, activate/deactivate
- **Audit Logs**: full change history feed

## Setup

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:8000` (see
`vite.config.ts`) — make sure the backend is running there, or adjust the
proxy target.

Default seeded login: `admin@example.com` / `ChangeMe123!` (from the backend's
seed script).

## Build

```bash
npm run build   # outputs to dist/
```

## Docker

```bash
docker build -t feature-flag-frontend .
docker run -p 5173:80 feature-flag-frontend
```

`nginx.conf` proxies `/api/` to a `backend` service — update the
`proxy_pass` host if not running via the same docker-compose network as
the backend (add this service to the backend's `docker-compose.yml`
alongside `db`, `redis`, and `backend`).

## Structure

```
src/
  api/         # axios client (token injection/refresh) + typed service calls
  context/     # AuthContext (login/logout/current user)
  components/  # Layout (nav shell), RequireAuth/RequireAdmin guards
  pages/       # LoginPage, DashboardPage, FlagsListPage, FlagDetailPage,
               # EnvironmentsPage, AuditLogsPage
  types/       # TypeScript interfaces mirroring backend Pydantic schemas
```
