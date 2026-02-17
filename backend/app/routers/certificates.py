from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.certificate import Certificate
from app.schemas.schemas import CertificateOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])


@router.post("/generate", response_model=CertificateOut, status_code=status.HTTP_201_CREATED)
def generate_certificate(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id, Enrollment.course_id == course_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Not enrolled in this course")
    if not enrollment.completed:
        raise HTTPException(status_code=400, detail="Course not yet completed")

    # Check if certificate already exists
    existing = (
        db.query(Certificate)
        .filter(Certificate.user_id == current_user.id, Certificate.course_id == course_id)
        .first()
    )
    if existing:
        return existing

    course = db.query(Course).filter(Course.id == course_id).first()
    certificate = Certificate(
        user_id=current_user.id,
        course_id=course_id,
        certificate_url=f"/certificates/{current_user.id}/{course_id}",
    )
    db.add(certificate)
    db.commit()
    db.refresh(certificate)
    return certificate


@router.get("/my", response_model=list[CertificateOut])
def my_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Certificate).filter(Certificate.user_id == current_user.id).all()
