from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.payment import Payment
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


@router.get("/my/revenue")
def my_revenue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    if current_user.role not in ["teacher", "admin"]:
        return JSONResponse(status_code=403, content={"success": False, "message": "Only teachers can view revenue"})
    try:
        # Total revenue across all teacher's courses
        total_revenue = (
            db.query(sql_func.coalesce(sql_func.sum(Payment.amount), 0.0))
            .join(Course, Payment.course_id == Course.id)
            .filter(Course.teacher_id == current_user.id, Payment.status == "completed")
            .scalar()
        )

        # Per-course revenue breakdown
        course_stats = (
            db.query(
                Course.id,
                Course.title,
                Course.price,
                Course.total_students,
                sql_func.coalesce(sql_func.sum(Payment.amount), 0.0).label("revenue"),
                sql_func.count(Payment.id).label("sales"),
            )
            .outerjoin(Payment, (Payment.course_id == Course.id) & (Payment.status == "completed"))
            .filter(Course.teacher_id == current_user.id)
            .group_by(Course.id, Course.title, Course.price, Course.total_students)
            .order_by(sql_func.coalesce(sql_func.sum(Payment.amount), 0.0).desc())
            .all()
        )

        return {
            "total_revenue": float(total_revenue),
            "course_revenue": [
                {
                    "course_id": row.id,
                    "title": row.title,
                    "price": row.price,
                    "total_students": row.total_students or 0,
                    "revenue": float(row.revenue),
                    "sales": row.sales,
                }
                for row in course_stats
            ],
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get revenue: {str(e)}"})


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
