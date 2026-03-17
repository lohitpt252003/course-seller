# Course Seller Platform

A full-stack course selling platform with user roles (`student`, `teacher`, `manager`, `admin`), dummy payments, progress tracking, reviews, certificates, public demo lectures, and paid learning content.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite) + Vanilla CSS |
| Backend | FastAPI + SQLAlchemy |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose + bcrypt) |
| File Storage | MinIO (S3-compatible) |
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

- **Students**: Browse courses, preview course structure before buying, watch public demo lectures, enroll, track progress, submit quizzes/assignments, leave reviews, earn certificates
- **Teachers**: Create and manage courses, upload a public demo lecture, and add paid course items such as `video`, `pdf`, `ppt`, `text`, `markdown_code`, `dpp`, `quiz`, `assignment_manual`, and `assignment_autograded`
- **Managers/Admins**: Set course pricing, manage users/courses/categories, review teacher applications, manage testimonials and placement stats
- **Teacher Application**: Students can apply to become teachers via a multi-step form with PDF CV/resume upload. Admin reviews and approves/rejects applications. Role is auto-upgraded on approval.
- **Payments**: Dummy payment system with multiple methods (Credit Card, Debit Card, UPI, Net Banking, QR Scanner), coupon support, order summary, and success animation
- **Autograding**: Python autograded assignments run through an isolated Docker container flow in v1, with manual-review fallback if container execution is unavailable
- **Themes**: Dark & Light mode with toggle
- **Responsive**: Mobile-friendly design
- **Security**: JWT auth, file validation, filename sanitization, path traversal prevention
