# Course Seller Platform — Complete Documentation

> A full-stack course-selling platform with React (Vite) frontend, FastAPI backend, PostgreSQL database, and Docker deployment.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Frontend Pages](#frontend-pages)
8. [Authentication & Authorization](#authentication--authorization)
9. [Theme System](#theme-system)
10. [Error Handling](#error-handling)
11. [Database Migrations](#database-migrations)
12. [Seed Data](#seed-data)
13. [Docker Setup](#docker-setup)
14. [Environment Variables](#environment-variables)

---

## Overview

Course Seller is a platform where:

- **Students** can browse courses, make payments, enroll, track progress, leave reviews, and earn certificates.
- **Teachers** can create and manage courses, add lessons (text, video, PDF), and view student statistics.
- **Admins** can manage users, approve/reject courses, view analytics, and manage categories.

The application includes a dummy payment system, dark/light theme, responsive design, and full Dockerization.

---

## Tech Stack

| Layer             | Technology                           |
| ----------------- | ------------------------------------ |
| **Frontend**      | React 19 + Vite 7 + React Router v7 |
| **Styling**       | Vanilla CSS with CSS Variables       |
| **Backend**       | FastAPI 0.109 + SQLAlchemy 2.0       |
| **Database**      | PostgreSQL 16 (Alpine)               |
| **Migrations**    | Alembic 1.13                         |
| **Authentication**| JWT (python-jose + bcrypt via passlib)|
| **DB Admin**      | pgAdmin 4                            |
| **Container**     | Docker + Docker Compose              |
| **Font**          | Ubuntu (Google Fonts)                |

---

## Project Structure

```
course-seller/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app entry point, CORS, global exception handler
│   │   ├── config.py              # Pydantic Settings (env vars)
│   │   ├── database.py            # SQLAlchemy engine, SessionLocal, Base
│   │   ├── models/                # SQLAlchemy ORM models (9 tables)
│   │   │   ├── __init__.py        # Imports all models
│   │   │   ├── user.py
│   │   │   ├── category.py
│   │   │   ├── course.py
│   │   │   ├── lesson.py
│   │   │   ├── enrollment.py
│   │   │   ├── progress.py
│   │   │   ├── payment.py
│   │   │   ├── review.py
│   │   │   └── certificate.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py         # 16 Pydantic models for request/response
│   │   ├── routers/               # 10 API router files
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── courses.py
│   │   │   ├── lessons.py
│   │   │   ├── enrollments.py
│   │   │   ├── payments.py
│   │   │   ├── reviews.py
│   │   │   ├── categories.py
│   │   │   ├── certificates.py
│   │   │   └── admin.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── auth.py            # JWT, password hashing, role guards
│   ├── alembic/
│   │   ├── env.py                 # Alembic environment config
│   │   ├── script.py.mako         # Migration template
│   │   └── versions/
│   │       └── 001_initial.py     # Initial migration (all 9 tables)
│   ├── scripts/
│   │   ├── entrypoint.sh          # Docker startup: migrations → seed → server
│   │   └── seed.py                # Seeds admin, teacher, and categories
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx               # React entry point
│   │   ├── App.jsx                # Routes, providers, layout
│   │   ├── index.css              # Global CSS, theme variables, reset
│   │   ├── api/
│   │   │   └── axios.js           # Axios instance with JWT interceptor
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Auth state, login/logout/register
│   │   │   └── ThemeContext.jsx    # Dark/Light theme toggle
│   │   ├── components/
│   │   │   ├── Header/            # Navigation, theme toggle, auth links
│   │   │   ├── Footer/            # Site footer
│   │   │   ├── CourseCard/         # Reusable course card for listings
│   │   │   └── ProtectedRoute/    # Role-based route guard
│   │   └── pages/
│   │       ├── Home/              # Landing page with hero and featured courses
│   │       ├── Login/             # Login form with role-based redirect
│   │       ├── Register/          # Registration with role picker
│   │       ├── Courses/           # Course listing with search/filter/sort
│   │       ├── CourseDetail/       # Single course view with lessons and reviews
│   │       ├── Checkout/          # Dummy payment flow
│   │       ├── CoursePlayer/      # Lesson viewer (video/text/PDF) with progress
│   │       ├── StudentDashboard/  # Enrolled courses, certificates, payments
│   │       ├── TeacherDashboard/  # Course CRUD, lesson management
│   │       ├── AdminDashboard/    # User mgmt, course approval, analytics
│   │       ├── Profile/           # Edit name, bio, avatar
│   │       └── NotFound/          # 404 page
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── project.md                      # This file
└── README.md
```

---

## Getting Started

### Option 1: Docker (Recommended)

```bash
docker-compose up --build
```

| Service       | URL                        |
| ------------- | -------------------------- |
| Frontend      | http://localhost:3000       |
| Backend API   | http://localhost:8000       |
| Swagger Docs  | http://localhost:8000/docs  |
| pgAdmin       | http://localhost:5050       |

### Option 2: Manual

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Create a PostgreSQL database named "course_seller"
# Update DATABASE_URL in .env
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Database Schema

### Entity-Relationship Overview

```
Users ──< Courses ──< Lessons
  │          │
  │          ├──< Enrollments ──< Progress
  │          │
  │          ├──< Payments
  │          │
  │          ├──< Reviews
  │          │
  │          └──< Certificates
  │
  └──< Categories ──< Courses
```

### Tables

#### 1. `users`
| Column        | Type         | Constraints                |
| ------------- | ------------ | -------------------------- |
| id            | INTEGER      | PK, AUTO INCREMENT         |
| email         | VARCHAR(255) | UNIQUE, NOT NULL, INDEXED  |
| password_hash | VARCHAR(255) | NOT NULL                   |
| name          | VARCHAR(255) | NOT NULL                   |
| role          | VARCHAR(20)  | DEFAULT 'student'          |
| avatar_url    | VARCHAR(500) | NULLABLE                   |
| bio           | TEXT         | NULLABLE                   |
| is_active     | BOOLEAN      | DEFAULT true               |
| created_at    | TIMESTAMP    | DEFAULT now()              |

> Roles: `student`, `teacher`, `admin`

#### 2. `categories`
| Column      | Type         | Constraints       |
| ----------- | ------------ | ----------------- |
| id          | INTEGER      | PK, AUTO INCREMENT|
| name        | VARCHAR(100) | UNIQUE, NOT NULL  |
| description | TEXT         | NULLABLE          |

#### 3. `courses`
| Column         | Type         | Constraints                |
| -------------- | ------------ | -------------------------- |
| id             | INTEGER      | PK, AUTO INCREMENT         |
| title          | VARCHAR(255) | NOT NULL                   |
| description    | TEXT         | NULLABLE                   |
| price          | FLOAT        | DEFAULT 0.0                |
| thumbnail_url  | VARCHAR(500) | NULLABLE                   |
| teacher_id     | INTEGER      | FK → users.id, INDEXED     |
| category_id    | INTEGER      | FK → categories.id, INDEXED|
| status         | VARCHAR(20)  | DEFAULT 'draft'            |
| avg_rating     | FLOAT        | DEFAULT 0.0                |
| total_students | INTEGER      | DEFAULT 0                  |
| created_at     | TIMESTAMP    | DEFAULT now()              |

> Statuses: `draft`, `published`, `archived`

#### 4. `lessons`
| Column       | Type         | Constraints               |
| ------------ | ------------ | ------------------------- |
| id           | INTEGER      | PK, AUTO INCREMENT        |
| course_id    | INTEGER      | FK → courses.id, INDEXED  |
| title        | VARCHAR(255) | NOT NULL                  |
| content_type | VARCHAR(20)  | DEFAULT 'text'            |
| content      | TEXT         | NULLABLE (for text type)  |
| video_url    | VARCHAR(500) | NULLABLE (for video type) |
| pdf_url      | VARCHAR(500) | NULLABLE (for pdf type)   |
| order_index  | INTEGER      | DEFAULT 0                 |
| created_at   | TIMESTAMP    | DEFAULT now()             |

> Content types: `text`, `video`, `pdf`

#### 5. `enrollments`
| Column      | Type      | Constraints                          |
| ----------- | --------- | ------------------------------------ |
| id          | INTEGER   | PK, AUTO INCREMENT                   |
| user_id     | INTEGER   | FK → users.id                        |
| course_id   | INTEGER   | FK → courses.id                      |
| enrolled_at | TIMESTAMP | DEFAULT now()                        |
| completed   | BOOLEAN   | DEFAULT false                        |

> UNIQUE constraint on (user_id, course_id)

#### 6. `progress`
| Column        | Type      | Constraints            |
| ------------- | --------- | ---------------------- |
| id            | INTEGER   | PK, AUTO INCREMENT     |
| enrollment_id | INTEGER   | FK → enrollments.id    |
| lesson_id     | INTEGER   | FK → lessons.id        |
| completed     | BOOLEAN   | DEFAULT false          |
| completed_at  | TIMESTAMP | NULLABLE               |

#### 7. `payments`
| Column         | Type         | Constraints        |
| -------------- | ------------ | ------------------ |
| id             | INTEGER      | PK, AUTO INCREMENT |
| user_id        | INTEGER      | FK → users.id      |
| course_id      | INTEGER      | FK → courses.id    |
| amount         | FLOAT        | NOT NULL           |
| status         | VARCHAR(20)  | DEFAULT 'pending'  |
| transaction_id | VARCHAR(255) | UNIQUE, NOT NULL   |
| created_at     | TIMESTAMP    | DEFAULT now()      |

> Statuses: `pending`, `completed`, `failed`
> Transaction IDs are auto-generated as `TXN-<12_HEX_CHARS>`

#### 8. `reviews`
| Column     | Type      | Constraints        |
| ---------- | --------- | ------------------ |
| id         | INTEGER   | PK, AUTO INCREMENT |
| user_id    | INTEGER   | FK → users.id      |
| course_id  | INTEGER   | FK → courses.id    |
| rating     | INTEGER   | NOT NULL (1-5)     |
| comment    | TEXT      | NULLABLE           |
| created_at | TIMESTAMP | DEFAULT now()      |

#### 9. `certificates`
| Column          | Type         | Constraints        |
| --------------- | ------------ | ------------------ |
| id              | INTEGER      | PK, AUTO INCREMENT |
| user_id         | INTEGER      | FK → users.id      |
| course_id       | INTEGER      | FK → courses.id    |
| certificate_url | VARCHAR(500) | NULLABLE           |
| issued_at       | TIMESTAMP    | DEFAULT now()      |

---

## API Reference

Base URL: `http://localhost:8000`

All error responses follow this format:
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

### Authentication (`/api/auth`)

| Method | Endpoint     | Auth | Description                |
| ------ | ------------ | ---- | -------------------------- |
| POST   | `/register`  | ❌   | Register a new user        |
| POST   | `/login`     | ❌   | Login, returns JWT         |
| GET    | `/me`        | ✅   | Get current user profile   |

**POST /api/auth/register**
```json
// Request
{ "email": "user@example.com", "password": "pass123", "name": "John", "role": "student" }
// Response (201)
{ "id": 1, "email": "user@example.com", "name": "John", "role": "student", ... }
```

**POST /api/auth/login**
```json
// Request
{ "email": "user@example.com", "password": "pass123" }
// Response
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```

### Users (`/api/users`)

| Method | Endpoint      | Auth  | Description              |
| ------ | ------------- | ----- | ------------------------ |
| GET    | `/`           | Admin | List all users           |
| GET    | `/{user_id}`  | ✅    | Get user by ID           |
| PATCH  | `/{user_id}`  | ✅    | Update user (own or admin)|
| DELETE | `/{user_id}`  | Admin | Deactivate user          |

### Courses (`/api/courses`)

| Method | Endpoint        | Auth            | Description                |
| ------ | --------------- | --------------- | -------------------------- |
| GET    | `/`             | ❌              | List published courses     |
| POST   | `/`             | Teacher/Admin   | Create a course            |
| GET    | `/{course_id}`  | ❌              | Get course detail          |
| PUT    | `/{course_id}`  | Owner/Admin     | Update a course            |
| DELETE | `/{course_id}`  | Owner/Admin     | Delete a course            |

**Query parameters for GET `/api/courses/`:**
- `search` — Filter by title (case-insensitive)
- `category_id` — Filter by category
- `min_price` / `max_price` — Price range
- `sort_by` — Options: `price`, `rating`, `newest`, `students`

### Lessons (`/api`)

| Method | Endpoint                            | Auth        | Description        |
| ------ | ----------------------------------- | ----------- | ------------------ |
| GET    | `/courses/{course_id}/lessons`      | ❌          | List course lessons|
| POST   | `/courses/{course_id}/lessons`      | Owner/Admin | Add a lesson       |
| PUT    | `/lessons/{lesson_id}`              | Owner/Admin | Update lesson      |
| DELETE | `/lessons/{lesson_id}`              | Owner/Admin | Delete lesson      |

### Enrollments (`/api/enrollments`)

| Method | Endpoint                         | Auth | Description              |
| ------ | -------------------------------- | ---- | ------------------------ |
| POST   | `/`                              | ✅   | Enroll in a course       |
| GET    | `/my`                            | ✅   | Get my enrollments       |
| PATCH  | `/progress`                      | ✅   | Mark lesson complete     |
| GET    | `/{enrollment_id}/progress`      | ✅   | Get enrollment progress  |

### Payments (`/api/payments`)

| Method | Endpoint | Auth | Description                      |
| ------ | -------- | ---- | -------------------------------- |
| POST   | `/`      | ✅   | Make payment (auto-enrolls)      |
| GET    | `/my`    | ✅   | Get my payment history           |

> Payments always succeed (dummy system). Auto-enrolls the user after payment.

### Reviews (`/api/reviews`)

| Method | Endpoint                    | Auth        | Description          |
| ------ | --------------------------- | ----------- | -------------------- |
| POST   | `/`                         | ✅          | Create a review      |
| GET    | `/course/{course_id}`       | ❌          | Get course reviews   |
| DELETE | `/{review_id}`              | Owner/Admin | Delete a review      |

> Reviews auto-update the course's `avg_rating`.

### Categories (`/api/categories`)

| Method | Endpoint           | Auth  | Description        |
| ------ | ------------------ | ----- | ------------------ |
| GET    | `/`                | ❌    | List all categories|
| POST   | `/`                | Admin | Create a category  |
| DELETE | `/{category_id}`   | Admin | Delete a category  |

### Certificates (`/api/certificates`)

| Method | Endpoint     | Auth | Description                         |
| ------ | ------------ | ---- | ----------------------------------- |
| POST   | `/generate`  | ✅   | Generate certificate (if completed) |
| GET    | `/my`        | ✅   | Get my certificates                 |

### Admin (`/api/admin`)

| Method | Endpoint                         | Auth  | Description             |
| ------ | -------------------------------- | ----- | ----------------------- |
| GET    | `/stats`                         | Admin | Platform statistics     |
| GET    | `/users`                         | Admin | List all users          |
| PATCH  | `/users/{id}/toggle-active`      | Admin | Activate/deactivate user|
| PATCH  | `/users/{id}/role?role=...`      | Admin | Change user role        |
| PATCH  | `/courses/{id}/approve`          | Admin | Publish a course        |
| PATCH  | `/courses/{id}/reject`           | Admin | Archive a course        |
| DELETE | `/courses/{id}`                  | Admin | Delete a course         |

---

## Frontend Pages

### Public Pages

| Page           | Route             | Description                                   |
| -------------- | ----------------- | --------------------------------------------- |
| Home           | `/`               | Hero section, featured courses, call-to-action |
| Login          | `/login`          | Email/password login with role-based redirect  |
| Register       | `/register`       | Registration with student/teacher role picker  |
| Courses        | `/courses`        | Course listing with search, filter, and sort   |
| Course Detail  | `/courses/:id`    | Course info, lessons list, reviews, enroll/buy |
| 404            | `*`               | Not found page                                |

### Protected Pages (Require Login)

| Page               | Route              | Role     | Description                       |
| ------------------ | ------------------ | -------- | --------------------------------- |
| Checkout           | `/checkout/:id`    | Any      | Dummy payment flow                |
| Course Player      | `/learn/:id`       | Any      | Video/text/PDF viewer + progress  |
| Student Dashboard  | `/dashboard`       | Student  | Enrolled courses, certs, payments |
| Teacher Dashboard  | `/teacher`         | Teacher  | Course CRUD, add lessons          |
| Admin Dashboard    | `/admin`           | Admin    | User mgmt, approvals, analytics   |
| Profile            | `/profile`         | Any      | Edit name, bio, avatar            |

### Shared Components

| Component      | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| Header         | Navigation bar, theme toggle, auth-aware links, role-based menu |
| Footer         | Site footer with branding and links                             |
| CourseCard     | Reusable card for course listings (thumbnail, price, rating)    |
| ProtectedRoute | HOC that checks auth + role, redirects to login if unauthorized |

---

## Authentication & Authorization

### How it works

1. **Register** — Creates user with hashed password (bcrypt)
2. **Login** — Validates credentials, returns a JWT token
3. **JWT Token** — Sent in `Authorization: Bearer <token>` header
4. **Token Payload** — Contains `sub` (user ID) and `role`
5. **Token Expiry** — Configurable (default: 24 hours / 1440 minutes)

### Role-Based Access

| Role      | Capabilities                                                |
| --------- | ----------------------------------------------------------- |
| `student` | Browse, enroll, learn, review, earn certificates            |
| `teacher` | All student actions + create/manage own courses and lessons  |
| `admin`   | Full access — manage users, approve courses, view analytics  |

### Frontend Auth Flow

- Login redirects: `student` → `/dashboard`, `teacher` → `/teacher`, `admin` → `/admin`
- Token stored in `localStorage`
- Axios interceptor auto-attaches token to every API request
- `ProtectedRoute` component gates routes by auth status and role

---

## Theme System

The app supports **Dark** and **Light** themes using CSS variables.

### CSS Variables

```css
:root, [data-theme="dark"] {
  --bg: #0a0a0f;
  --surface: #13131a;
  --border: #1e1e2e;
  --text: #e4e4e7;
  --text-muted: #71717a;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --success: #10b981;
  --danger: #ef4444;
  --gradient-primary: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
}

[data-theme="light"] {
  --bg: #f8f9fc;
  --surface: #ffffff;
  --border: #e2e4ea;
  --text: #18181b;
  /* ... etc */
}
```

### How it works

- `ThemeContext` manages the current theme state
- Theme preference is persisted in `localStorage`
- `data-theme` attribute is set on `<html>` element
- Toggle button in the Header (☀️ / 🌙)
- All components use CSS variables — zero inline color values

---

## Error Handling

### Backend Pattern

Every endpoint follows this pattern:

```python
@router.get("/example")
def example(db: Session = Depends(get_db)):
    try:
        # Business logic
        if not found:
            return JSONResponse(status_code=404, content={"success": False, "message": "Not found"})
        return result
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed: {str(e)}"})
```

### Global Safety Net

`main.py` includes a global exception handler that catches any unhandled exception:

```python
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"success": False, "message": "An unexpected error occurred", "error": str(exc)})
```

### Response Format

| Scenario          | Response                                                    |
| ----------------- | ----------------------------------------------------------- |
| Success           | Standard Pydantic model response (200/201)                  |
| Not Found         | `{"success": false, "message": "Course not found"}` (404)   |
| Unauthorized      | `{"success": false, "message": "Not authenticated"}` (401)  |
| Forbidden         | `{"success": false, "message": "Not authorized"}` (403)     |
| Validation Error  | `{"success": false, "message": "Rating must be..."}` (400)  |
| Server Error      | `{"success": false, "message": "Failed: ..."}` (500)        |

---

## Database Migrations

Managed with **Alembic**.

### Key Files

| File                           | Purpose                            |
| ------------------------------ | ---------------------------------- |
| `alembic.ini`                  | Alembic config (DB URL, logging)   |
| `alembic/env.py`               | Imports models, configures context |
| `alembic/script.py.mako`       | Template for new migrations        |
| `alembic/versions/001_initial.py` | Creates all 9 tables            |

### Commands

```bash
# Apply all migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description"

# Rollback one step
alembic downgrade -1

# Rollback to zero (drop all tables)
alembic downgrade base
```

---

## Seed Data

The seed script (`scripts/seed.py`) creates initial data on first startup:

### Default Users

| Email                     | Password     | Role    |
| ------------------------- | ------------ | ------- |
| admin@courseseller.com    | admin123     | admin   |
| teacher@courseseller.com  | teacher123   | teacher |

### Default Categories

| # | Name               | Description                                    |
| - | ------------------ | ---------------------------------------------- |
| 1 | Programming        | Learn to code in various languages              |
| 2 | Web Development    | Build modern websites and web applications      |
| 3 | Data Science       | Analyze data and build ML models                |
| 4 | Design             | UI/UX, graphic design, and creative skills      |
| 5 | Business           | Entrepreneurship, marketing, and management     |
| 6 | DevOps             | Cloud, CI/CD, containerization, infrastructure  |
| 7 | Mobile Development | Build iOS and Android applications              |
| 8 | Cybersecurity      | Protect systems and networks from threats        |

> The seed script is **idempotent** — safe to run multiple times. It skips records that already exist.

---

## Docker Setup

### Services

| Service      | Image                | Port | Description              |
| ------------ | -------------------- | ---- | ------------------------ |
| `db`         | postgres:16-alpine   | 5432 | PostgreSQL database      |
| `backend`    | Custom (Python 3.11) | 8000 | FastAPI server           |
| `frontend`   | Custom (Node + Nginx)| 3000 | React app (production)   |
| `pgadmin`    | dpage/pgadmin4       | 5050 | Database admin UI        |

### Startup Sequence

When `docker-compose up` is run:

1. **PostgreSQL** starts and runs health checks
2. **Backend** waits for DB to be healthy, then:
   - Runs Alembic migrations (`alembic upgrade head`)
   - Runs seed script (`python scripts/seed.py`)
   - Starts uvicorn server
3. **Frontend** builds React app, then serves via Nginx
4. **pgAdmin** starts independently

### pgAdmin Connection

| Field    | Value      |
| -------- | ---------- |
| Host     | `db`       |
| Port     | `5432`     |
| Username | `postgres` |
| Password | `postgres` |
| Database | `course_seller` |

### Volumes

- `postgres_data` — Persists database data across restarts
- `pgadmin_data` — Persists pgAdmin configuration

---

## Environment Variables

### Backend (`.env`)

| Variable                    | Default Value                                      | Description           |
| --------------------------- | -------------------------------------------------- | --------------------- |
| `DATABASE_URL`              | `postgresql://postgres:postgres@db:5432/course_seller` | PostgreSQL connection |
| `SECRET_KEY`                | `dev-secret-key-change-in-production`               | JWT signing key       |
| `ALGORITHM`                 | `HS256`                                            | JWT algorithm         |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 hours)                                | Token expiry          |

> ⚠️ Change `SECRET_KEY` in production!

---

## User Flows

### Student Flow
1. Register as student → Login → Browse courses
2. View course detail → Make payment (dummy) → Auto-enrolled
3. Open course player → Watch/read lessons → Mark progress
4. Complete all lessons → Generate certificate
5. Leave a review (1-5 stars + comment)

### Teacher Flow
1. Register as teacher → Login → Go to Teacher Dashboard
2. Create a new course (title, description, price, category, thumbnail)
3. Add lessons to course (text, video URL, or PDF URL)
4. Course starts as "draft" → Admin approves → Published & visible

### Admin Flow
1. Login as admin → Go to Admin Dashboard
2. View platform statistics (users, courses, revenue, enrollments)
3. Manage users: change roles, activate/deactivate
4. Manage courses: approve (publish) or reject (archive)
5. Manage categories: create new ones for course organization

---

*Last updated: 2026-02-17*
