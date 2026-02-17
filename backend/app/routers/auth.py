from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.schemas import UserRegister, UserLogin, Token, UserOut
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    try:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            return JSONResponse(status_code=400, content={"success": False, "message": "Email already registered"})

        if user_data.role not in ["student", "teacher"]:
            return JSONResponse(status_code=400, content={"success": False, "message": "Role must be 'student' or 'teacher'"})

        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            name=user_data.name,
            role=user_data.role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Registration failed: {str(e)}"})


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == user_data.email).first()
        if not user or not verify_password(user_data.password, user.password_hash):
            return JSONResponse(status_code=401, content={"success": False, "message": "Invalid email or password"})
        if not user.is_active:
            return JSONResponse(status_code=403, content={"success": False, "message": "Account is deactivated"})

        token = create_access_token(data={"sub": user.id, "role": user.role})
        return {"access_token": token}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Login failed: {str(e)}"})


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    return current_user
