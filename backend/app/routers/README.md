# API Routers

These FastAPI routers define the API endpoints and map them to their respective logic.

- **`auth.py`**: User authentication (register, login, get current user).
- **`users.py`**: User profile management (read, update).
- **`courses.py`**: Course CRUD operations (list, create, read, update, delete).
- **`lessons.py`**: Lesson management within courses.
- **`enrollments.py`**: User enrollments and progress tracking.
- **`payments.py`**: Dummy payment processing.
- **`reviews.py`**: Handling user reviews.
- **`certificates.py`**: Generating course completion certificates.
- **`categories.py`**: Managing course categories.
- **`admin.py`**: Admin-only functionalities (user management, course approval).
- **`teacher_applications.py`**: Teacher application submission (with PDF resume upload), status checking, and admin review (approve/reject). Prevents duplicate applications.
- **`uploads.py`**: File upload to MinIO (thumbnails, PDFs, videos, materials) with security checks (magic bytes, filename sanitization, size limits).
