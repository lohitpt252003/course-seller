from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import *  # noqa: F401, F403 — imports all models for relationship resolution
from app.routers import auth, users, courses, lessons, enrollments, payments, reviews, categories, certificates, admin

app = FastAPI(
    title="Course Seller API",
    description="A full-featured course selling platform API",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/")
def root():
    return {"message": "Welcome to Course Seller API", "docs": "/docs"}
