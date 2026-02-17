from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.progress import Progress
from app.models.lesson import Lesson
from app.schemas.schemas import EnrollmentCreate, EnrollmentOut, ProgressUpdate, ProgressOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/enrollments", tags=["Enrollments"])


@router.post("/", response_model=EnrollmentOut, status_code=201)
def enroll(data: EnrollmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        course = db.query(Course).filter(Course.id == data.course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})
        if course.status != "published":
            return JSONResponse(status_code=400, content={"success": False, "message": "Course is not available for enrollment"})

        existing = db.query(Enrollment).filter(Enrollment.user_id == current_user.id, Enrollment.course_id == data.course_id).first()
        if existing:
            return JSONResponse(status_code=400, content={"success": False, "message": "Already enrolled in this course"})

        enrollment = Enrollment(user_id=current_user.id, course_id=data.course_id)
        db.add(enrollment)
        course.total_students = (course.total_students or 0) + 1
        db.commit()
        db.refresh(enrollment)
        return enrollment
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Enrollment failed: {str(e)}"})


@router.get("/my", response_model=list[EnrollmentOut])
def my_enrollments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        return db.query(Enrollment).options(joinedload(Enrollment.course)).filter(Enrollment.user_id == current_user.id).all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get enrollments: {str(e)}"})


@router.patch("/progress", response_model=ProgressOut)
def update_progress(data: ProgressUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        lesson = db.query(Lesson).filter(Lesson.id == data.lesson_id).first()
        if not lesson:
            return JSONResponse(status_code=404, content={"success": False, "message": "Lesson not found"})

        enrollment = db.query(Enrollment).filter(Enrollment.user_id == current_user.id, Enrollment.course_id == lesson.course_id).first()
        if not enrollment:
            return JSONResponse(status_code=403, content={"success": False, "message": "Not enrolled in this course"})

        progress = db.query(Progress).filter(Progress.enrollment_id == enrollment.id, Progress.lesson_id == data.lesson_id).first()

        if progress:
            progress.completed = data.completed
            progress.completed_at = datetime.now(timezone.utc) if data.completed else None
        else:
            progress = Progress(
                enrollment_id=enrollment.id,
                lesson_id=data.lesson_id,
                completed=data.completed,
                completed_at=datetime.now(timezone.utc) if data.completed else None,
            )
            db.add(progress)

        total_lessons = db.query(Lesson).filter(Lesson.course_id == lesson.course_id).count()
        completed_lessons = db.query(Progress).filter(Progress.enrollment_id == enrollment.id, Progress.completed == True).count()
        if data.completed:
            completed_lessons += 1 if not progress.id else 0
        enrollment.completed = completed_lessons >= total_lessons

        db.commit()
        db.refresh(progress)
        return progress
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to update progress: {str(e)}"})


@router.get("/{enrollment_id}/progress", response_model=list[ProgressOut])
def get_progress(enrollment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
        if not enrollment:
            return JSONResponse(status_code=404, content={"success": False, "message": "Enrollment not found"})
        if enrollment.user_id != current_user.id and current_user.role != "admin":
            return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to view this progress"})

        return db.query(Progress).filter(Progress.enrollment_id == enrollment_id).all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get progress: {str(e)}"})
