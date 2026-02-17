import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.payment import Payment
from app.models.enrollment import Enrollment
from app.schemas.schemas import PaymentCreate, PaymentOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post("/", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if already paid
    existing_payment = (
        db.query(Payment)
        .filter(
            Payment.user_id == current_user.id,
            Payment.course_id == data.course_id,
            Payment.status == "completed",
        )
        .first()
    )
    if existing_payment:
        raise HTTPException(status_code=400, detail="Already paid for this course")

    # Dummy payment — always succeeds
    transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    payment = Payment(
        user_id=current_user.id,
        course_id=data.course_id,
        amount=course.price,
        status="completed",
        transaction_id=transaction_id,
    )
    db.add(payment)

    # Auto-enroll after payment
    existing_enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id, Enrollment.course_id == data.course_id)
        .first()
    )
    if not existing_enrollment:
        enrollment = Enrollment(user_id=current_user.id, course_id=data.course_id)
        db.add(enrollment)
        course.total_students = (course.total_students or 0) + 1

    db.commit()
    db.refresh(payment)
    return payment


@router.get("/my", response_model=list[PaymentOut])
def my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()
