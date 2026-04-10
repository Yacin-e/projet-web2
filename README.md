## EventHub — Event and Participant Management System

This repository contains the implementation of the **EventHub** full‑stack application for the *Web Programming 2026* Master 1 project.
web app is publicly available at https://projet-web2.vercel.app/login
---

### 1. Repository Structure

- **`backend_django/`**: Main REST API built with Django + Django REST Framework.
- **`backend_node/`**: Comparative Node.js/Express backend implementing a subset of the API.
- **`frontend/`**: React SPA that consumes the Django API.

Each part is self‑contained with its own dependencies and run instructions.

---

### 2. Features Overview

- **Event Management**
  - Create, update, delete, list events
  - Filter by date and status
- **Participant Management**
  - Create, update, delete, list participants
- **Registrations (many‑to‑many)**
  - One participant ⇄ many events
  - One event ⇄ many participants
  - No duplicate registration for the same participant/event pair
- **Authentication & Authorization**
  - Login/logout with token‑based auth
  - **Roles**:
    - `admin` / `editor`: full CRUD
    - `viewer`: read‑only access
- **React SPA**
  - Login page
  - Events list with filters
  - Event details (with registered participants)
  - Participants list
  - Dashboard (summary of counts)
  - Protected routes, token storage, loading & error states

---

### 3. Backend (Django) — `backend_django/`

**Stack**

- Python 3.11+
- Django 5.x
- Django REST Framework
- SQLite (for development)

**App structure (high level)**

- `eventhub/` – Django project (settings, URLs, WSGI)
- `core/` – application with:
  - Models: `Event`, `Participant`, `Registration`
  - DRF serializers and viewsets
  - Token authentication + role‑based permissions

#### 3.1. Quickstart (development)

From `backend_django/`:

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/macOS

pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser

python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`.

#### 3.2. Main API endpoints (examples)

- `POST /api/auth/login/` – obtain JWT access/refresh tokens
- `POST /api/auth/refresh/` – refresh access token
- `POST /api/auth/logout/` – blacklist refresh token (logout)
- `GET /api/me/` – current user info (role)
- `GET /api/events/` – list events (supports filtering)
- `POST /api/events/` – create event (**editor/admin only**)
- `GET /api/events/{id}/` – event details
- `GET /api/participants/` – list participants
- `POST /api/participants/` – create participant (**editor/admin only**)
- `POST /api/registrations/` – register participant to event

All write operations are restricted to users with `role="editor"` or `role="admin"`.

---

### 4. Backend (Node.js / Express) — `backend_node/`

**Stack**

- Node.js 20+
- Express
- SQLite (via `sqlite3`) for persistence

The Node backend provides a **simplified API** (e.g. `Event` + `Participant` basic CRUD). It is used to compare:

- Project structure
- Architectural philosophy
- Development experience and complexity
- Scalability considerations
- Ecosystem and libraries

#### 4.1. Quickstart (development)

From `backend_node/`:

```bash
npm install
npm run dev
```

The API will be exposed on `http://127.0.0.1:4000/` (configurable in `.env`).

---

### 5. Frontend (React SPA) — `frontend/`

**Stack**

- React 18
- TypeScript
- React Router
- Fetch API / Axios for HTTP calls

**Main pages**

- `LoginPage` – authentication and token storage.
- `DashboardPage` – high‑level summary (counts of events, participants, registrations).
- `EventsPage` – list + filter events by date/status.
- `EventDetailsPage` – event information + registered participants.
- `ParticipantsPage` – participants list and management.

Protected routes ensure that only authenticated users can access dashboard and CRUD features. The token is stored in `localStorage` (or `sessionStorage`) and automatically attached to API requests.

Role behavior:

- `viewer`: read-only UI (no create/edit/delete buttons)
- `editor` / `admin`: can create/edit/delete and manage registrations

#### 5.1. Quickstart (development)

From `frontend/`:

```bash
npm install
npm run dev
```

The dev server will be available at `http://127.0.0.1:5173/`.

Make sure the Django backend is running and that the frontend `.env` is configured with the correct API base URL.

Example:

```bash
copy .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
```

---

### 6. Environment Configuration

- **Django backend**
  - `.env` (or environment variables) for:
    - `SECRET_KEY`
    - `DEBUG`
    - `ALLOWED_HOSTS`
    - DB connection (if not using SQLite)
- **Node backend**
  - `.env` for:
    - `PORT`
    - DB file/path or URL
- **Frontend**
  - `.env`:
    - `VITE_API_BASE_URL` (Django API root)

---
