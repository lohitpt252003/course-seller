from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.review import Review
from app.schemas.schemas import ReviewCreate, ReviewOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check if user already reviewed
    existing = (
        db.query(Review)
        .filter(Review.user_id == current_user.id, Review.course_id == data.course_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this course")

    review = Review(
        user_id=current_user.id,
        course_id=data.course_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.flush()

    # Update course average rating
    avg = (
        db.query(sql_func.avg(Review.rating))
        .filter(Review.course_id == data.course_id)
        .scalar()
    )
    course.avg_rating = round(float(avg), 2) if avg else 0.0

    db.commit()
    db.refresh(review)
    return review


@router.get("/course/{course_id}", response_model=list[ReviewOut])
def get_course_reviews(course_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.course_id == course_id)
        .order_by(Review.created_at.desc())
        .all()
    )


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    course_id = review.course_id
    db.delete(review)

    # Recalculate average rating
    avg = (
        db.query(sql_func.avg(Review.rating))
        .filter(Review.course_id == course_id)
        .scalar()
    )
    course = db.query(Course).filter(Course.id == course_id).first()
    course.avg_rating = round(float(avg), 2) if avg else 0.0

    db.commit()
