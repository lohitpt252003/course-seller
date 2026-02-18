from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.payment import Payment
from app.models.enrollment import Enrollment
from app.models.review import Review
from app.models.lesson import Lesson
from app.schemas.schemas import CourseCreate, CourseUpdate, CourseOut
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/courses", tags=["Courses"])


@router.get("/", response_model=list[CourseOut])
def list_courses(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = Query(None, regex="^(price|rating|newest|students)$"),
    db: Session = Depends(get_db),
):
    try:
        query = db.query(Course).options(joinedload(Course.teacher), joinedload(Course.category))
        query = query.filter(Course.status == "published")

        if search:
            query = query.filter(Course.title.ilike(f"%{search}%"))
        if category_id:
            query = query.filter(Course.category_id == category_id)
        if min_price is not None:
            query = query.filter(Course.price >= min_price)
        if max_price is not None:
            query = query.filter(Course.price <= max_price)

        if sort_by == "price":
            query = query.order_by(Course.price.asc())
        elif sort_by == "rating":
            query = query.order_by(Course.avg_rating.desc())
        elif sort_by == "students":
            query = query.order_by(Course.total_students.desc())
        else:
            query = query.order_by(Course.created_at.desc())

        return query.all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to list courses: {str(e)}"})


@router.get("/my", response_model=list[CourseOut])
def my_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        return (
            db.query(Course)
            .options(joinedload(Course.teacher), joinedload(Course.category))
            .filter(Course.teacher_id == current_user.id)
            .order_by(Course.created_at.desc())
            .all()
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get your courses: {str(e)}"})


@router.get("/my/analytics")
def my_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    if current_user.role not in ["teacher", "admin"]:
        return JSONResponse(status_code=403, content={"success": False, "message": "Only teachers can view analytics"})
    try:
        teacher_courses = db.query(Course).filter(Course.teacher_id == current_user.id).all()
        course_ids = [c.id for c in teacher_courses]

        # Overview stats
        total_revenue = 0.0
        total_students = 0
        total_reviews = 0
        total_lessons = 0
        rating_sum = 0.0
        rating_count = 0

        if course_ids:
            rev = db.query(sql_func.coalesce(sql_func.sum(Payment.amount), 0.0)).filter(
                Payment.course_id.in_(course_ids), Payment.status == "completed"
            ).scalar()
            total_revenue = float(rev) if rev else 0.0

            total_students = db.query(Enrollment).filter(Enrollment.course_id.in_(course_ids)).count()
            total_reviews = db.query(Review).filter(Review.course_id.in_(course_ids)).count()
            total_lessons = db.query(Lesson).filter(Lesson.course_id.in_(course_ids)).count()

            avg_r = db.query(sql_func.avg(Review.rating)).filter(Review.course_id.in_(course_ids)).scalar()
            if avg_r:
                rating_sum = float(avg_r)
                rating_count = 1  # used as flag for avg

        overview = {
            "total_courses": len(teacher_courses),
            "published_courses": len([c for c in teacher_courses if c.status == "published"]),
            "draft_courses": len([c for c in teacher_courses if c.status == "draft"]),
            "total_students": total_students,
            "total_revenue": total_revenue,
            "avg_rating": round(rating_sum, 2) if rating_count else 0.0,
            "total_reviews": total_reviews,
            "total_lessons": total_lessons,
        }

        # Per-course details
        courses_data = []
        for course in teacher_courses:
            # Enrolled students
            enrollments = (
                db.query(Enrollment)
                .options(joinedload(Enrollment.user))
                .filter(Enrollment.course_id == course.id)
                .order_by(Enrollment.enrolled_at.desc())
                .all()
            )
            students = [
                {
                    "id": e.user.id,
                    "name": e.user.name,
                    "email": e.user.email,
                    "avatar_url": e.user.avatar_url,
                    "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
                    "completed": e.completed,
                }
                for e in enrollments
            ]

            # Reviews
            reviews = (
                db.query(Review)
                .options(joinedload(Review.user))
                .filter(Review.course_id == course.id)
                .order_by(Review.created_at.desc())
                .all()
            )
            reviews_data = [
                {
                    "id": r.id,
                    "user_name": r.user.name,
                    "user_avatar": r.user.avatar_url,
                    "rating": r.rating,
                    "comment": r.comment,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in reviews
            ]

            # Revenue for this course
            course_rev = db.query(sql_func.coalesce(sql_func.sum(Payment.amount), 0.0)).filter(
                Payment.course_id == course.id, Payment.status == "completed"
            ).scalar()
            sales_count = db.query(Payment).filter(
                Payment.course_id == course.id, Payment.status == "completed"
            ).count()

            lesson_count = db.query(Lesson).filter(Lesson.course_id == course.id).count()

            courses_data.append({
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "price": course.price,
                "status": course.status,
                "avg_rating": course.avg_rating or 0.0,
                "total_students": len(students),
                "revenue": float(course_rev) if course_rev else 0.0,
                "sales": sales_count,
                "lesson_count": lesson_count,
                "thumbnail_url": course.thumbnail_url,
                "category_id": course.category_id,
                "created_at": course.created_at.isoformat() if course.created_at else None,
                "students": students,
                "reviews": reviews_data,
            })

        # Recent activity (last 10 enrollments)
        recent_enrollments = []
        if course_ids:
            recent = (
                db.query(Enrollment)
                .options(joinedload(Enrollment.user), joinedload(Enrollment.course))
                .filter(Enrollment.course_id.in_(course_ids))
                .order_by(Enrollment.enrolled_at.desc())
                .limit(10)
                .all()
            )
            recent_enrollments = [
                {
                    "student_name": e.user.name,
                    "student_avatar": e.user.avatar_url,
                    "course_title": e.course.title,
                    "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
                }
                for e in recent
            ]

        return {
            "overview": overview,
            "courses": courses_data,
            "recent_activity": recent_enrollments,
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get analytics: {str(e)}"})


@router.post("/", response_model=CourseOut, status_code=201)
def create_course(course_data: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["teacher", "admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Only teachers and admins can create courses"})
    try:
        course = Course(**course_data.model_dump(), teacher_id=current_user.id)
        db.add(course)
        db.commit()
        db.refresh(course)
        return course
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to create course: {str(e)}"})


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    try:
        course = (
            db.query(Course)
            .options(joinedload(Course.teacher), joinedload(Course.category))
            .filter(Course.id == course_id)
            .first()
        )
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})
        return course
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get course: {str(e)}"})


@router.put("/{course_id}", response_model=CourseOut)
def update_course(course_id: int, course_data: CourseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})
        if course.teacher_id != current_user.id and current_user.role != "admin":
            return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to update this course"})

        update_data = course_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(course, key, value)

        db.commit()
        db.refresh(course)
        return course
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to update course: {str(e)}"})


@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})
        if course.teacher_id != current_user.id and current_user.role != "admin":
            return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to delete this course"})

        db.delete(course)
        db.commit()
        return {"success": True, "message": "Course deleted"}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to delete course: {str(e)}"})
