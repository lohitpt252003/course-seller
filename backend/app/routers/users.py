from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.schemas.schemas import UserOut, UserUpdate
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=list[UserOut])
def list_users(role: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        return query.all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to list users: {str(e)}"})


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return JSONResponse(status_code=404, content={"success": False, "message": "User not found"})
        return user
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get user: {str(e)}"})


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        if current_user.id != user_id and current_user.role != "admin":
            return JSONResponse(status_code=403, content={"success": False, "message": "Not authorized to update this user"})

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return JSONResponse(status_code=404, content={"success": False, "message": "User not found"})

        update_data = user_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)

        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to update user: {str(e)}"})


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Admin access required"})
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return JSONResponse(status_code=404, content={"success": False, "message": "User not found"})
        user.is_active = False
        db.commit()
        return {"success": True, "message": "User deactivated"}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to delete user: {str(e)}"})
