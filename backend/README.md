# Backend Documentation

This directory contains the FastAPI backend for the Course Seller application.

## Structure

- **`app/`**: Main application logic.
  - **`models/`**: SQLAlchemy database models.
  - **`routers/`**: API route definitions.
  - **`schemas/`**: Pydantic schemas for data validation.
  - **`utils/`**: Helper functions and utilities.
- **`alembic/`**: Database migration scripts.
- **`scripts/`**: Utility scripts (e.g., seeding the database).

## Setup

1.  Create a virtual environment: `python -m venv venv`
2.  Activate it: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
3.  Install dependencies: `pip install -r requirements.txt`
4.  Run migrations: `alembic upgrade head`
5.  Seed database: `python scripts/seed.py`
6.  Start server: `uvicorn app.main:app --reload`
