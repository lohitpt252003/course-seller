from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sql_func
from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.models.review import Review
from app.schemas.schemas import ReviewCreate, ReviewOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewOut, status_code=201)
def create_review(data: ReviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        if data.rating < 1 or data.rating > 5:
            return JSONResponse(status_code=400, content={"success": False, "message": "Rating must be between 1 and 5"})

        course = db.query(Course).filter(Course.id == data.course_id).first()
        if not course:
            return JSONResponse(status_code=404, content={"success": False, "message": "Course not found"})

        existing = db.query(Review).filter(Review.user_id == current_user.id, Review.course_id == data.course_id).first()
        if existing:
            return JSONResponse(status_code=400, content={"success": False, "message": "You have already reviewed this course"})

        review = Review(user_id=current_user.id, course_id=data.course_id, rating=data.rating, comment=data.comment)
        db.add(review)
        db.flush()

        avg = db.query(sql_func.avg(Review.rating)).filter(Review.course_id == data.course_id).scalar()
        course.avg_rating = round(float(avg), 2) if avg else 0.0

        db.commit()
        db.refresh(review)
        return review
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to create review: {str(e)}"})


@router.get("/course/{course_id}", response_model=list[ReviewOut])
def get_course_reviews(course_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(Review).options(joinedload(Review.user)).filter(Review.course_id == course_id).order_by(Review.created_at.desc()).all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get reviews: {str(e)}"})


@router.delete("/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            return JSONResponse(status_code=404, content={"success": False, "message": "Review not found"})
        if review.user_id != current_user.id and current_user.role != "admin":
            return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to delete this review"})

        course_id = review.course_id
        db.delete(review)

        avg = db.query(sql_func.avg(Review.rating)).filter(Review.course_id == course_id).scalar()
        course = db.query(Course).filter(Course.id == course_id).first()
        course.avg_rating = round(float(avg), 2) if avg else 0.0

        db.commit()
        return {"success": True, "message": "Review deleted"}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to delete review: {str(e)}"})
