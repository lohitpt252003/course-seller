from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.lesson import Lesson
from app.schemas.schemas import LessonCreate, LessonUpdate, LessonOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Lessons"])


@router.get("/courses/{course_id}/lessons", response_model=list[LessonOut])
def list_lessons(course_id: int, db: Session = Depends(get_db)):
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})
        return db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order_index).all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to list lessons: {str(e)}"})


@router.post("/courses/{course_id}/lessons", response_model=LessonOut, status_code=201)
def create_lesson(course_id: int, lesson_data: LessonCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})
        if course.teacher_id != current_user.id and current_user.role != "admin":
            return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to add lessons to this course"})

        lesson = Lesson(**lesson_data.model_dump(), course_id=course_id)
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
        return lesson
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to create lesson: {str(e)}"})


@router.put("/lessons/{lesson_id}", response_model=LessonOut)
def update_lesson(lesson_id: int, lesson_data: LessonUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            return JSONResponse(status_code=404, content={"success": False, "message": "Lesson not found"})

        course = db.query(Course).filter(Course.id == lesson.course_id).first()
        if course.teacher_id != current_user.id and current_user.role != "admin":
            return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to update this lesson"})

        update_data = lesson_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(lesson, key, value)

        db.commit()
        db.refresh(lesson)
        return lesson
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to update lesson: {str(e)}"})


@router.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            return JSONResponse(status_code=404, content={"success": False, "message": "Lesson not found"})

        course = db.query(Course).filter(Course.id == lesson.course_id).first()
        if course.teacher_id != current_user.id and current_user.role != "admin":
            return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to delete this lesson"})

        db.delete(lesson)
        db.commit()
        return {"success": True, "message": "Lesson deleted"}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to delete lesson: {str(e)}"})
