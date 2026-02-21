from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.models import *  # noqa: F401, F403 — imports all models for relationship resolution
from app.routers import auth, users, courses, lessons, enrollments, payments, reviews, categories, certificates, admin, uploads

app = FastAPI(
    title="Course Seller API",
    description="A full-featured course selling platform API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://course-selling.frontend.test:3000",
        "http://course-selling.frontend.test:5173",
        "http://course-selling.frontend.test:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler — catches anything that slips through
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "An unexpected error occurred", "error": str(exc)},
    )


# MinIO bucket initialization on startup
@app.on_event("startup")
def init_minio():
    import time
    from app.services.minio_service import ensure_bucket
    max_retries = 5
    for attempt in range(max_retries):
        try:
            ensure_bucket()
            print("✅ MinIO bucket ready")
            return
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⏳ MinIO not ready (attempt {attempt + 1}/{max_retries}), retrying in 2s... ({e})")
                time.sleep(2)
            else:
                print(f"⚠️ MinIO init failed after {max_retries} attempts: {e}")


# Include all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(lessons.router)
app.include_router(enrollments.router)
app.include_router(payments.router)
app.include_router(reviews.router)
app.include_router(categories.router)
app.include_router(certificates.router)
app.include_router(admin.router)
app.include_router(uploads.router)


@app.get("/")
def root():
    return {"message": "Welcome to Course Seller API", "docs": "/docs"}

