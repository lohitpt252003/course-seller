# Course Seller Platform

A full-stack course selling platform with user roles (Student, Teacher, Admin), dummy payments, progress tracking, reviews, and certificates.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite) + Vanilla CSS |
| Backend | FastAPI + SQLAlchemy |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose + bcrypt) |
| Containerization | Docker + Docker Compose |

## Quick Start (Docker)

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

## Development (without Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
# Set DATABASE_URL in .env to your local PostgreSQL
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

- **Students**: Browse courses, enroll, track progress, leave reviews, earn certificates
- **Teachers**: Create & manage courses, add lessons (text/video/PDF), professional analytics dashboard (revenue, enrolled students, reviews)
- **Admins**: User management, course approval, analytics dashboard, category management
- **Payments**: Dummy payment system with auto-enrollment
- **Themes**: Dark & Light mode with toggle
- **Responsive**: Mobile-friendly design
