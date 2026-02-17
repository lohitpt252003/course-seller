import uuid
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.payment import Payment
from app.models.enrollment import Enrollment
from app.schemas.schemas import PaymentCreate, PaymentOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/", response_model=PaymentOut, status_code=201)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        course = db.query(Course).filter(Course.id == data.course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})

        existing_payment = db.query(Payment).filter(
            Payment.user_id == current_user.id,
            Payment.course_id == data.course_id,
            Payment.status == "completed",
        ).first()
        if existing_payment:
            return JSONResponse(status_code=400, content={"success": False, "message": "Already paid for this course"})

        transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        payment = Payment(
            user_id=current_user.id,
            course_id=data.course_id,
            amount=course.price,
            status="completed",
            transaction_id=transaction_id,
        )
        db.add(payment)

        existing_enrollment = db.query(Enrollment).filter(Enrollment.user_id == current_user.id, Enrollment.course_id == data.course_id).first()
        if not existing_enrollment:
            enrollment = Enrollment(user_id=current_user.id, course_id=data.course_id)
            db.add(enrollment)
            course.total_students = (course.total_students or 0) + 1

        db.commit()
        db.refresh(payment)
        return payment
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Payment failed: {str(e)}"})


@router.get("/my", response_model=list[PaymentOut])
def my_payments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        return db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get payments: {str(e)}"})
