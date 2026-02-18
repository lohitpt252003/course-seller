# Application Logic

This directory contains the core application logic.

## Structure

- **`models/`**: SQLAlchemy database models define the database schema.
- **`routers/`**: FastAPI routers handle API requests and map them to database operations.
- **`schemas/`**: Pydantic schemas validate input and output data.
- **`utils/`**: Utility functions for authentication, password hashing, etc.
- **`main.py`**: The entry point for the FastAPI application.
- **`database.py`**: SQLAlchemy database connection and session management.
- **`config.py`**: Global configuration and environment settings.
