# Success Solar ERP

A full-stack ERP application for a solar business built with **FastAPI** (backend) and **React + Vite** (frontend). Covers lead management, project tracking, quotations, payments, stock, HR, and role-based portals.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Known Issues & Fixes](#known-issues--fixes)
- [Login Accounts](#login-accounts)
- [Role & Permission Matrix](#role--permission-matrix)
- [API Reference](#api-reference)
- [Project Architecture](#project-architecture)

---

## Project Structure

```
Success-Solar--Backend/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Route handlers (one file per domain)
│   │   ├── core/            # Config, DB, security, permissions, exceptions
│   │   ├── crud/            # Low-level DB queries
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Helpers: pagination, PDF, quotation numbers
│   │   └── main.py          # FastAPI app entry point
│   ├── alembic/             # Database migrations
│   ├── tests/               # Pytest test suite
│   ├── seed.py              # Database seeder (creates tables + sample data)
│   ├── requirements.txt
│   └── .env                 # Your local environment config (never commit this)
└── frontend/
    ├── src/
    │   ├── api/             # API client (client.ts) and hooks (hooks.ts)
    │   ├── auth/            # AuthContext, ProtectedRoute
    │   ├── components/      # Shared UI components
    │   ├── pages/           # Page components (CEO + Marketing portals)
    │   ├── types/           # TypeScript model types
    │   └── App.tsx          # Routes and portal switching
    ├── vite.config.ts
    └── package.json
```

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Python 3.11+, FastAPI, SQLAlchemy 2 (async), Asyncpg |
| Database  | PostgreSQL 14+ (all tables in `solar` schema)   |
| Auth      | JWT (access + refresh tokens), bcrypt passwords |
| Frontend  | React 18, TypeScript, Vite, TailwindCSS         |
| PDF       | ReportLab                                       |
| Testing   | Pytest, pytest-asyncio                          |

---

## Prerequisites

- **Python 3.11+**
- **Node.js v18+**
- **PostgreSQL 14+** running locally on port `5432`
- A PostgreSQL database named `solar` (or any name — update `.env` accordingly)

---

## Backend Setup

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Copy the example and fill in your values:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Then edit `.env` — the minimum required changes are:

```env
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
DATABASE_URL=postgresql+asyncpg://postgres:<your_password>@localhost:5432/solar
```

> **Important — Windows users:** Save `.env` as **UTF-8** encoding (not UTF-16). In Notepad, use *File → Save As → Encoding: UTF-8*. A UTF-16 encoded `.env` will silently corrupt all values.

> **Important — Windows users:** If you have a system environment variable named `DEBUG` (common with Node/VS tools), it will override the `.env` value. This is already handled in `config.py` via a validator, but be aware of it.

### 5. Create the database

In psql or pgAdmin, create the database:

```sql
CREATE DATABASE solar;
```

The `solar` schema inside that database is created automatically by the seed script.

### 6. Seed the database

This creates all tables and inserts sample employees, departments, and stock items:

```bash
python seed.py
```

You should see:
```
OK - 7 departments seeded
OK - 11 employees seeded (all designations)
OK - 5 stock items seeded

OK Seed complete!
   Default password for all employees: SolarERP@2024
```

> The seed script is **idempotent** — safe to run multiple times. It skips records that already exist.

### 7. Start the backend server

```bash
uvicorn app.main:app --reload
```

The API runs at **http://127.0.0.1:8000**

---

## Frontend Setup

### 1. Navigate to the frontend directory

Open a **new terminal**:

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The frontend runs at **http://localhost:5173**

---

## Environment Variables

Full reference for `backend/.env`:

| Variable                      | Default                                              | Description                                              |
|-------------------------------|------------------------------------------------------|----------------------------------------------------------|
| `APP_NAME`                    | `Success Solar ERP`                                  | Application name shown in API docs                       |
| `ENVIRONMENT`                 | `development`                                        | `development` / `staging` / `production`                 |
| `DEBUG`                       | `true`                                               | Coerced to bool — any non-true string becomes `false`    |
| `SECRET_KEY`                  | *(required, min 32 chars)*                           | JWT signing key — generate a random one, never reuse     |
| `ALGORITHM`                   | `HS256`                                              | JWT algorithm                                            |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60`                                                 | Access token lifetime in minutes                         |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | `7`                                                  | Refresh token lifetime in days                           |
| `DATABASE_URL`                | `postgresql+asyncpg://postgres:root@localhost:5432/solar` | Full async DSN                                      |
| `POSTGRES_SCHEMA`             | `solar`                                              | PostgreSQL schema where all tables live                  |
| `CORS_ORIGINS`                | `http://localhost:5173,http://localhost:3000`         | Comma-separated allowed frontend origins                 |
| `UPLOAD_DIR`                  | `uploads`                                            | Directory for uploaded files (relative to `backend/`)    |
| `MAX_FILE_SIZE_MB`            | `10`                                                 | Max upload size in MB                                    |
| `SEED_DEFAULT_PASSWORD`       | `SolarERP@2024`                                      | Password assigned to all seeded employee accounts        |
| `LOG_LEVEL`                   | `INFO`                                               | `DEBUG` / `INFO` / `WARNING` / `ERROR` / `CRITICAL`      |

---

## Known Issues & Fixes

These are real issues encountered and already fixed in the codebase:

### 1. CORS error on 500 responses
**Symptom:** Browser reports a CORS error, but the real problem is a backend 500.
**Cause:** FastAPI's unhandled exception handler didn't include CORS headers, so the browser blocked the error response.
**Fix:** `app/core/exceptions.py` — the `unhandled_exception_handler` now echoes the `Origin` header back in the response.

### 2. `DEBUG=release` crashes the backend on Windows
**Symptom:** `pydantic_core.ValidationError: DEBUG — Input should be a valid boolean, unable to interpret input 'release'`
**Cause:** Windows (and some Node.js tools) set a system environment variable `DEBUG=release` which overrides the `.env` file.
**Fix:** `app/core/config.py` — a `coerce_debug` field validator accepts any string and maps it to a proper bool (`"true"`, `"1"`, `"yes"`, `"on"` → `True`, everything else → `False`).

### 3. `.env` saved as UTF-16 on Windows
**Symptom:** Config values appear garbled or empty; `pydantic-settings` fails to parse them.
**Cause:** Windows Notepad and some editors default to UTF-16 LE when saving files.
**Fix:** Always save `.env` as **UTF-8** (no BOM).

### 4. 403 on `/api/v1/employees` for non-CEO users
**Symptom:** Telecaller / Direct Marketing employees get a 403 when opening Lead Inbox.
**Cause:** `LeadInbox.tsx` was unconditionally calling `/api/v1/employees` to resolve assigned employee names, but only CEO has `employees:read` permission.
**Fix:** `frontend/src/pages/marketing/LeadInbox.tsx` — the employees fetch is now gated: `useApi(portal === 'CEO' ? '/api/v1/employees' : null)`.

### 5. Premature API calls before auth state loads
**Symptom:** On page refresh, the wrong dashboard briefly mounts and fires unauthorized API calls.
**Cause:** `AuthContext` reads from `localStorage` in a `useEffect`, so `portal` is `null` on the first render. `ProtectedRoute` was rendering children before auth was restored.
**Fix:**
- `AuthContext.tsx` — added a `ready` boolean that becomes `true` after localStorage is read.
- `ProtectedRoute.tsx` — returns `null` until `ready` is `true`.
- `App.tsx` — `Home` component returns `null` while `portal` is still `null`.

### 6. Access token expiry causes silent 401 loops
**Symptom:** After 60 minutes, all API calls fail with 401 and the user is redirected to login.
**Cause:** The API client had no token refresh logic.
**Fix:** `frontend/src/api/client.ts` — on a 401 response, the client now attempts a token refresh using the stored refresh token, retries the original request with the new token, and only redirects to `/login` if the refresh also fails.

---

## Login Accounts

All accounts seeded by `python seed.py` share the same default password:

```
SolarERP@2024
```

| Username         | Designation                    | Portal           |
|------------------|--------------------------------|------------------|
| `karthik.ceo`    | CEO                            | CEO Portal       |
| `priya.tele`     | Telecaller                     | Marketing Portal |
| `arun.dme`       | Direct Marketing Executive     | Marketing Portal |
| `kavya.site`     | Site Visitor                   | *(no portal)*    |
| `dinesh.acct`    | Accountant                     | *(no portal)*    |
| `meena.pm`       | Project Head                   | *(no portal)*    |
| `suresh.tech`    | Field Technician               | *(no portal)*    |
| `lakshmi.doc`    | Document Follow-up Executive   | *(no portal)*    |
| `venkat.wh`      | Warehouse Maintenance          | *(no portal)*    |
| `ravi.driver`    | Driver                         | *(no portal)*    |
| `anand.partner`  | Partner / Payment Receiver     | *(no portal)*    |

> Accounts marked *(no portal)* can authenticate via the API but have no frontend portal yet. The frontend currently supports CEO and Marketing portals only.

---

## Role & Permission Matrix

| Permission              | CEO | Telecaller | Direct Mktg | Site Visitor | Accountant | Project Head | Field Tech | Doc Followup | Warehouse | Driver | Partner |
|-------------------------|:---:|:----------:|:-----------:|:------------:|:----------:|:------------:|:----------:|:------------:|:---------:|:------:|:-------:|
| `employees:read/write`  | ✅  |            |             |              |            |              |            |              |           |        |         |
| `leads:read`            | ✅  |            | ✅          |              |            |              |            |              |           |        |         |
| `leads:read_own`        | ✅  | ✅         |             |              |            |              |            |              |           |        |         |
| `leads:write`           | ✅  | ✅         | ✅          |              |            |              |            |              |           |        |         |
| `quotations:read/write` | ✅  | ✅         | ✅          |              |            | ✅           |            |              |           |        |         |
| `quotations:revise`     | ✅  |            | ✅          |              |            |              |            |              |           |        |         |
| `projects:read`         | ✅  |            |             | ✅           | ✅         | ✅           | ✅         | ✅           | ✅        | ✅     | ✅      |
| `projects:write/stage`  | ✅  |            |             |              |            | ✅           |            | ✅           |           |        |         |
| `payments:read/write`   | ✅  |            |             |              | ✅         | ✅ *(read)*  |            |              |           |        | ✅*(w)* |
| `payments:verify`       | ✅  |            |             |              | ✅         |              |            |              |           |        |         |
| `stock:read`            | ✅  |            |             |              |            | ✅           |            |              | ✅        |        |         |
| `stock:write/manage`    | ✅  |            |             |              |            |              |            |              | ✅        |        |         |
| `field_movements`       | ✅  |            | ✅ *(own)*  | ✅ *(own)*   |            |              | ✅ *(own)* | ✅ *(own)*   |           | ✅*(o)*|         |
| `leave:read/write`      | ✅  | ✅         | ✅          | ✅           | ✅         | ✅           | ✅         | ✅           | ✅        | ✅     | ✅      |
| `leave:approve`         | ✅  |            |             |              |            |              |            |              |           |        |         |
| `reports:read`          | ✅  |            |             |              | ✅         |              |            |              |           |        |         |
| `dashboard:ceo`         | ✅  |            |             |              |            |              |            |              |           |        |         |
| `dashboard:marketing`   | ✅  | ✅         | ✅          |              |            |              |            |              |           |        |         |

> `leads:read_own` means the employee can only see leads assigned to themselves (Telecaller scoping).

---

## API Reference

Once the backend is running, interactive docs are available at:

- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

### Authentication

All endpoints (except `/api/v1/auth/login`) require a Bearer token:

```
Authorization: Bearer <access_token>
```

**Login:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{ "username": "karthik.ceo", "password": "SolarERP@2024" }
```

Response includes `access_token`, `refresh_token`, `employee`, and `portal`.

**Refresh:**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{ "refresh_token": "<refresh_token>" }
```

### Endpoint Summary

| Method | Endpoint                              | Permission Required         |
|--------|---------------------------------------|-----------------------------|
| GET    | `/api/v1/employees`                   | `employees:read`            |
| POST   | `/api/v1/employees`                   | `employees:write`           |
| GET    | `/api/v1/leads`                       | `leads:read` or `leads:read_own` |
| POST   | `/api/v1/leads`                       | `leads:write`               |
| PATCH  | `/api/v1/leads/{id}/status`           | `leads:write`               |
| GET    | `/api/v1/quotations`                  | `quotations:read`           |
| POST   | `/api/v1/quotations`                  | `quotations:write`          |
| POST   | `/api/v1/quotations/{id}/revise`      | `quotations:revise`         |
| GET    | `/api/v1/quotations/{id}/document`    | `quotations:read`           |
| GET    | `/api/v1/projects`                    | `projects:read`             |
| POST   | `/api/v1/projects`                    | `projects:write`            |
| GET    | `/api/v1/payments`                    | `payments:read`             |
| POST   | `/api/v1/payments`                    | `payments:write`            |
| GET    | `/api/v1/stock`                       | `stock:read`                |
| GET    | `/api/v1/dashboard`                   | `dashboard:ceo`             |
| GET    | `/api/v1/notifications`               | `notifications:read`        |
| GET    | `/api/v1/leave`                       | `leave:read`                |
| POST   | `/api/v1/leave`                       | `leave:write`               |
| GET    | `/api/v1/approvals`                   | `approvals:read`            |
| GET    | `/api/v1/reports`                     | `reports:read`              |
| GET    | `/api/v1/activity`                    | `activity:read`             |

---

## Project Architecture

### Backend layers

```
Request → Router (api/v1/) → Service (services/) → CRUD (crud/) → Model (models/)
                                    ↓
                             Pydantic Schema (schemas/) → Response
```

- **Routers** are thin — they validate input, call a service, and return the schema.
- **Services** contain all business logic (number generation, permission scoping, totals computation).
- **CRUD** contains raw SQLAlchemy queries with no business logic.
- **Models** are SQLAlchemy ORM classes. All tables live in the `solar` PostgreSQL schema.
- **Schemas** are Pydantic models for request validation and response serialization.

### Frontend data flow

```
Component → useApi(endpoint) → apiClient() → fetch() → Backend
                                    ↓
                          Auto-refresh on 401 → retry → redirect to /login
```

- `client.ts` handles auth headers, camelCase↔snake_case conversion, token refresh, and error handling.
- `hooks.ts` provides the `useApi` hook for GET requests with loading/error state.
- `AuthContext.tsx` manages login state, persists to `localStorage`, and exposes `ready` flag to prevent premature renders.

### Token storage keys (localStorage)

| Key                    | Value                        |
|------------------------|------------------------------|
| `ssc-erp-token-v2`     | JWT access token             |
| `ssc-erp-refresh-v2`   | JWT refresh token            |
| `ssc-erp-employee-v2`  | Serialized employee object   |
| `ssc-erp-portal-v2`    | Portal name (`CEO` / `Telecalling` / `Direct Marketing`) |
