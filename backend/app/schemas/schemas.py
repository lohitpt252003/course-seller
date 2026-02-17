from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# --- Auth ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"  # student or teacher


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- User ---
class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


# --- Category ---
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# --- Course ---
class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float = 0.0
    thumbnail_url: Optional[str] = None
    category_id: Optional[int] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    thumbnail_url: Optional[str] = None
    category_id: Optional[int] = None
    status: Optional[str] = None


class CourseOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    price: float
    thumbnail_url: Optional[str] = None
    teacher_id: int
    category_id: Optional[int] = None
    status: str
    avg_rating: float
    total_students: int
    created_at: datetime
    teacher: Optional[UserOut] = None
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True


# --- Lesson ---
class LessonCreate(BaseModel):
    title: str
    content_type: str = "text"  # video, text, pdf
    content: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    order_index: int = 0


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    order_index: Optional[int] = None


class LessonOut(BaseModel):
    id: int
    course_id: int
    title: str
    content_type: str
    content: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Enrollment ---
class EnrollmentCreate(BaseModel):
    course_id: int


class EnrollmentOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime
    completed: bool
    course: Optional[CourseOut] = None

    class Config:
        from_attributes = True


# --- Progress ---
class ProgressUpdate(BaseModel):
    lesson_id: int
    completed: bool = True


class ProgressOut(BaseModel):
    id: int
    enrollment_id: int
    lesson_id: int
    completed: bool
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Payment ---
class PaymentCreate(BaseModel):
    course_id: int


class PaymentOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    amount: float
    status: str
    transaction_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Review ---
class ReviewCreate(BaseModel):
    course_id: int
    rating: int  # 1-5
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True


# --- Certificate ---
class CertificateOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    certificate_url: Optional[str] = None
    issued_at: datetime

    class Config:
        from_attributes = True


# --- Admin ---
class AdminStats(BaseModel):
    total_users: int
    total_courses: int
    total_enrollments: int
    total_revenue: float
    total_teachers: int
    total_students: int
