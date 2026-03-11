from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.testimonial import Testimonial
from app.schemas.schemas import TestimonialCreate, TestimonialOut
from app.utils.auth import require_permission

router = APIRouter(prefix="/api/testimonials", tags=["Testimonials"])


@router.get("/", response_model=List[TestimonialOut])
def get_testimonials(db: Session = Depends(get_db)):
    """Get all featured testimonials (Public)"""
    return db.query(Testimonial).filter(Testimonial.is_featured == True).order_by(Testimonial.created_at.desc()).all()


@router.post("/", response_model=TestimonialOut, status_code=status.HTTP_201_CREATED)
def create_testimonial(
    data: TestimonialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users"))
):
    """Create a new testimonial (Admin/Manager with permission)"""
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Manager/Admin access required"})
    try:
        testimonial = Testimonial(**data.model_dump())
        db.add(testimonial)
        db.commit()
        db.refresh(testimonial)
        return testimonial
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to create testimonial: {str(e)}"})


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users"))
):
    """Delete a testimonial (Admin/Manager with permission)"""
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Manager/Admin access required"})
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    db.delete(testimonial)
    db.commit()
