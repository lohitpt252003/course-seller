from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.course import Course

router = APIRouter(prefix="/api/landing", tags=["Landing"])

@router.get("/stats")
def get_landing_stats(db: Session = Depends(get_db)):
    """
    Public and free API for landing page statistics.
    """
    try:
        total_courses = db.query(Course).filter(Course.status == "published").count()
        total_students = db.query(User).filter(User.role == "student").count()
        total_teachers = db.query(User).filter(User.role == "teacher").count()
        return {
            "total_courses": total_courses,
            "total_students": total_students,
            "total_teachers": total_teachers
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get landing stats: {str(e)}"})
