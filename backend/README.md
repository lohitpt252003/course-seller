# Backend Documentation

This directory contains the FastAPI backend for the Course Seller application.

## Structure

- **`app/`**: Main application logic.
  - **`models/`**: SQLAlchemy database models.
  - **`routers/`**: API route definitions.
  - **`schemas/`**: Pydantic schemas for data validation.
  - **`services/`**: MinIO file storage service.
  - **`utils/`**: Helper functions and utilities.
- **`alembic/`**: Database migration scripts.

## Key Features

- **Teacher Application System**: Students apply to become teachers. Applications are reviewed by admins. Includes PDF resume upload with security (magic byte validation, 10MB limit, content-type check). Role auto-upgraded on approval.
- **Payments & Coupons**: Dummy payment processing with auto-enrollment. Admin dashboard supports managing coupons with optional expiry dates (Admin only).
- **Manager Role**: Support for a mid-level `manager` role with granular permission flags (users, courses, categories, applications) assigned by an Admin.
- **Course Demo + Pricing Flow**: Teachers can upload a nullable public `demo_video_url`, while course pricing is controlled by Admins and Managers with course permissions.
- **Rich Learning Content**: Lessons now support `video`, `pdf`, `ppt`, `text`, `markdown_code`, `dpp`, `quiz`, `assignment_manual`, and `assignment_autograded`.
- **Lesson Submissions**: Paid learners can submit quizzes and assignments; submissions are stored in `lesson_submissions`.
- **Autograder Service**: Autograded assignments use isolated Docker execution for Python in v1, with fallback to manual review if Docker is unavailable.
- **Alumni Testimonials**: Backend APIs and models to manage and serve featured alumni success stories.
- **File Uploads**: MinIO-based file storage with security (blocked executables, filename sanitization, path traversal prevention).
- **`scripts/`**: Utility scripts (e.g., seeding the database).

## Setup

1.  Create a virtual environment: `python -m venv venv`
2.  Activate it: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
3.  Install dependencies: `pip install -r requirements.txt`
4.  Run migrations: `alembic upgrade head`
5.  Seed database: `python scripts/seed.py`
6.  Start server: `uvicorn app.main:app --reload`
