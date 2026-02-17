from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.payment import Payment
from app.schemas.schemas import AdminStats, UserOut, CourseOut
from app.utils.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        total_users = db.query(User).count()
        total_courses = db.query(Course).count()
        total_enrollments = db.query(Enrollment).count()
        total_revenue = db.query(sql_func.sum(Payment.amount)).filter(Payment.status == "completed").scalar() or 0.0
        total_teachers = db.query(User).filter(User.role == "teacher").count()
        total_students = db.query(User).filter(User.role == "student").count()

        return AdminStats(
            total_users=total_users,
            total_courses=total_courses,
            total_enrollments=total_enrollments,
            total_revenue=total_revenue,
            total_teachers=total_teachers,
            total_students=total_students,
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get stats: {str(e)}"})


@router.get("/users", response_model=list[UserOut])
def admin_list_users(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        return db.query(User).all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to list users: {str(e)}"})


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return JSONResponse(status_code=404, content={"success": False, "message": "User not found"})
        user.is_active = not user.is_active
        db.commit()
        return {"success": True, "message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to toggle user: {str(e)}"})


@router.patch("/users/{user_id}/role")
def change_user_role(user_id: int, role: str, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        if role not in ["student", "teacher", "admin"]:
            return JSONResponse(status_code=400, content={"success": False, "message": "Invalid role. Must be 'student', 'teacher', or 'admin'"})
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return JSONResponse(status_code=404, content={"success": False, "message": "User not found"})
        user.role = role
        db.commit()
        return {"success": True, "message": f"User role changed to {role}"}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to change role: {str(e)}"})


@router.patch("/courses/{course_id}/approve")
def approve_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})
        course.status = "published"
        db.commit()
        return {"success": True, "message": "Course approved and published"}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to approve course: {str(e)}"})


@router.patch("/courses/{course_id}/reject")
def reject_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})
        course.status = "archived"
        db.commit()
        return {"success": True, "message": "Course rejected"}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to reject course: {str(e)}"})


@router.delete("/courses/{course_id}")
def admin_delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})
        db.delete(course)
        db.commit()
        return {"success": True, "message": "Course deleted"}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to delete course: {str(e)}"})
