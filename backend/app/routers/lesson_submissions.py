import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_submission import LessonSubmission
from app.models.user import User
from app.schemas.schemas import LessonSubmissionCreate, LessonSubmissionOut
from app.services.autograder_service import run_autograder
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/lessons", tags=["Lesson Submissions"])


def _has_lesson_access(db: Session, lesson: Lesson, current_user: User) -> bool:
    if current_user.role == "admin":
        return True

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    if course and course.teacher_id == current_user.id:
        return True

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == lesson.course_id,
    ).first()
    return enrollment is not None


@router.get("/{lesson_id}/my-submissions", response_model=list[LessonSubmissionOut])
def my_submissions(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        return JSONResponse(status_code=404, content={"success": False, "message": "Lesson not found"})
    if not _has_lesson_access(db, lesson, current_user):
        return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to access this lesson"})

    submissions = (
        db.query(LessonSubmission)
        .filter(LessonSubmission.lesson_id == lesson_id, LessonSubmission.user_id == current_user.id)
        .order_by(LessonSubmission.created_at.desc())
        .all()
    )
    return submissions


@router.post("/{lesson_id}/submit", response_model=LessonSubmissionOut, status_code=201)
def submit_lesson(
    lesson_id: int,
    payload: LessonSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        return JSONResponse(status_code=404, content={"success": False, "message": "Lesson not found"})
    if not _has_lesson_access(db, lesson, current_user):
        return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to access this lesson"})

    try:
        if lesson.content_type == "quiz":
            return _submit_quiz(lesson, payload, db, current_user)
        if lesson.content_type == "assignment_autograded":
            return _submit_autograded_assignment(lesson, payload, db, current_user)
        if lesson.content_type == "assignment_manual":
            return _submit_manual_assignment(lesson, payload, db, current_user)

        return JSONResponse(status_code=400, content={"success": False, "message": "This lesson type does not accept submissions"})
    except Exception as exc:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to submit lesson: {str(exc)}"})


def _submit_quiz(lesson: Lesson, payload: LessonSubmissionCreate, db: Session, current_user: User):
    quiz_payload = json.loads(lesson.quiz_data or "{}")
    questions = quiz_payload.get("questions") or []
    try:
        answers_payload = json.loads(payload.answer_data or "{}")
    except json.JSONDecodeError:
        return JSONResponse(status_code=400, content={"success": False, "message": "Quiz answers must be valid JSON"})

    answers = answers_payload.get("answers") or []
    score = 0
    feedback = []

    for index, question in enumerate(questions):
        expected = question.get("answer_index")
        given = answers[index] if index < len(answers) else None
        if given == expected:
            score += 1
            feedback.append(f"Q{index + 1}: correct")
        else:
            feedback.append(f"Q{index + 1}: incorrect")

    submission = LessonSubmission(
        lesson_id=lesson.id,
        user_id=current_user.id,
        submission_type="quiz",
        answer_data=payload.answer_data,
        status="graded",
        score=float(score),
        max_score=float(len(questions)),
        feedback="\n".join(feedback),
        graded_at=datetime.now(timezone.utc),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def _submit_autograded_assignment(lesson: Lesson, payload: LessonSubmissionCreate, db: Session, current_user: User):
    if not payload.submission_code:
        return JSONResponse(status_code=400, content={"success": False, "message": "Code submission is required"})

    result = run_autograder(
        code=payload.submission_code,
        language=lesson.autograde_language or "python",
        tests_json=lesson.autograde_tests or "{}",
    )
    submission = LessonSubmission(
        lesson_id=lesson.id,
        user_id=current_user.id,
        submission_type="assignment_autograded",
        submission_code=payload.submission_code,
        status=result["status"],
        score=result.get("score"),
        max_score=result.get("max_score"),
        feedback=result.get("feedback"),
        graded_at=datetime.now(timezone.utc) if result["status"] != "pending_manual_review" else None,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def _submit_manual_assignment(lesson: Lesson, payload: LessonSubmissionCreate, db: Session, current_user: User):
    if not payload.submission_text and not payload.submission_code:
        return JSONResponse(status_code=400, content={"success": False, "message": "Assignment submission cannot be empty"})

    submission = LessonSubmission(
        lesson_id=lesson.id,
        user_id=current_user.id,
        submission_type="assignment_manual",
        submission_text=payload.submission_text,
        submission_code=payload.submission_code,
        status="submitted",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission
