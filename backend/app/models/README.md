# Database Models

These models define the structure of the database tables using SQLAlchemy.

- **`user.py`**: User account details and roles.
- **`course.py`**: Course structure (title, description, price, etc.).
- **`lesson.py`**: Individual lessons within a course.
- **`enrollment.py`**: User enrollments in courses.
- **`progress.py`**: Tracking user progress on lessons.
- **`payment.py`**: Recording payments for course purchases.
- **`review.py`**: User reviews for courses.
- **`certificate.py`**: Certificates issued upon course completion.
- **`category.py`**: Course categories.
- **`teacher_application.py`**: Teacher applications with fields for requirements, CV (text + PDF URL), course description, course overview, expected lectures, demo video URL, status (pending/approved/rejected), and admin notes.
