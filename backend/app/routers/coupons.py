from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime, timezone
from typing import List
from app.database import get_db
from app.models.coupon import Coupon
from app.schemas.schemas import CouponCreate, CouponOut
from app.schemas.schemas import CouponCreate, CouponOut
from app.utils.auth import get_current_user, require_role

router = APIRouter(
    prefix="/api/coupons",
    tags=["Coupons"]
)


@router.get("/", response_model=List[CouponOut])
def get_coupons(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Get all coupons (Admin only)"""
    return db.query(Coupon).order_by(Coupon.created_at.desc()).all()


@router.post("/", response_model=CouponOut, status_code=status.HTTP_201_CREATED)
def create_coupon(
    coupon: CouponCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Create a new coupon (Admin only)"""
    # Check if code already exists
    existing = db.query(Coupon).filter(Coupon.code == coupon.code.upper()).first()
    if existing:
        return JSONResponse(status_code=400, content={"detail": "Coupon code already exists"})
    
    # Validate discount
    if not (1 <= coupon.discount_percentage <= 100):
        return JSONResponse(status_code=400, content={"detail": "Discount must be between 1 and 100"})

    db_coupon = Coupon(
        code=coupon.code.upper(),
        discount_percentage=coupon.discount_percentage,
        is_active=coupon.is_active,
        expires_at=coupon.expires_at
    )
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Delete a coupon (Admin only)"""
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        return JSONResponse(status_code=404, content={"detail": "Coupon not found"})
    
    db.delete(coupon)
    db.commit()


@router.get("/validate/{code}")
def validate_coupon(code: str, db: Session = Depends(get_db)):
    """Validate a coupon code (Public)"""
    coupon = db.query(Coupon).filter(Coupon.code == code.upper(), Coupon.is_active == True).first()
    if not coupon:
        return JSONResponse(status_code=404, content={"detail": "Invalid or expired coupon code"})
    
    # Check expiry
    if coupon.expires_at and coupon.expires_at < datetime.now(timezone.utc):
        return JSONResponse(status_code=400, content={"detail": "This coupon code has expired"})
    
    return {
        "valid": True,
        "discount_percentage": coupon.discount_percentage
    }
