from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.certificate import Certificate
from app.schemas.schemas import CertificateOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])


@router.post("/generate", response_model=CertificateOut, status_code=201)
def generate_certificate(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        enrollment = db.query(Enrollment).filter(Enrollment.user_id == current_user.id, Enrollment.course_id == course_id).first()
        if not enrollment:
            return JSONResponse(status_code=404, content={"success": False, "message": "Not enrolled in this course"})
        if not enrollment.completed:
            return JSONResponse(status_code=400, content={"success": False, "message": "Course not yet completed"})

        existing = db.query(Certificate).filter(Certificate.user_id == current_user.id, Certificate.course_id == course_id).first()
        if existing:
            return existing

        certificate = Certificate(
            user_id=current_user.id,
            course_id=course_id,
            certificate_url=f"/certificates/{current_user.id}/{course_id}",
        )
        db.add(certificate)
        db.commit()
        db.refresh(certificate)
        return certificate
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to generate certificate: {str(e)}"})


@router.get("/my", response_model=list[CertificateOut])
def my_certificates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        return db.query(Certificate).filter(Certificate.user_id == current_user.id).all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get certificates: {str(e)}"})
