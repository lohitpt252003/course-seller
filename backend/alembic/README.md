# Database Migrations

This directory contains Alembic migration scripts for managing schema changes.

## Structure

- **`env.py`**: Configures Alembic to work with the application's models and database connection.
- **`script.py.mako`**: Template for new migration files.
- **`versions/`**: Directory where migration scripts are stored.
  - **`001_initial.py`**: Initial database schema setup.

## Usage

- **Apply migrations**: `alembic upgrade head`
- **Create new migration**: `alembic revision --autogenerate -m "description"`
