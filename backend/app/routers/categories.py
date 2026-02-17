from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.schemas.schemas import CategoryCreate, CategoryOut
from app.utils.auth import require_role

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("/", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    try:
        return db.query(Category).all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to list categories: {str(e)}"})


@router.post("/", response_model=CategoryOut, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        existing = db.query(Category).filter(Category.name == data.name).first()
        if existing:
            return JSONResponse(status_code=400, content={"success": False, "message": "Category already exists"})

        category = Category(**data.model_dump())
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to create category: {str(e)}"})


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            return JSONResponse(status_code=404, content={"success": False, "message": "Category not found"})
        db.delete(category)
        db.commit()
        return {"success": True, "message": "Category deleted"}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to delete category: {str(e)}"})
