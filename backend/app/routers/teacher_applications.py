from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.teacher_application import TeacherApplication
from app.schemas.schemas import TeacherApplicationCreate, TeacherApplicationOut
from app.utils.auth import get_current_user, require_permission
from app.services.minio_service import upload_file as minio_upload

router = APIRouter(prefix="/api/teacher-applications", tags=["Teacher Applications"])

# Max resume size: 10 MB
MAX_RESUME_SIZE = 10 * 1024 * 1024


@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF resume for a teacher application. Returns the URL."""
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        if not file.filename:
            return JSONResponse(status_code=400, content={"success": False, "message": "No file provided"})

        # Validate file extension
        if not file.filename.lower().endswith(".pdf"):
            return JSONResponse(status_code=400, content={"success": False, "message": "Only PDF files are accepted"})

        # Validate content type
        if file.content_type and file.content_type != "application/pdf":
            return JSONResponse(status_code=400, content={"success": False, "message": "Only PDF files are accepted"})

        contents = await file.read()

        if len(contents) == 0:
            return JSONResponse(status_code=400, content={"success": False, "message": "Empty file"})

        if len(contents) > MAX_RESUME_SIZE:
            return JSONResponse(status_code=400, content={"success": False, "message": "File too large. Maximum size is 10 MB"})

        # Verify PDF magic bytes (%PDF)
        if not contents[:4] == b"%PDF":
            return JSONResponse(status_code=400, content={"success": False, "message": "Invalid PDF file"})

        result = minio_upload(
            file_data=contents,
            folder="pdfs",
            original_filename=file.filename,
            content_type="application/pdf",
        )

        return {"success": True, "url": result["url"], "object_name": result["object_name"]}

    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Upload failed: {str(e)}"})


@router.post("/", response_model=TeacherApplicationOut, status_code=201)
def submit_application(
    data: TeacherApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        if current_user.role == "teacher":
            return JSONResponse(status_code=400, content={"success": False, "message": "You are already a teacher"})

        # Check for any existing application (pending, approved, or rejected)
        existing = (
            db.query(TeacherApplication)
            .filter(TeacherApplication.user_id == current_user.id)
            .first()
        )
        if existing:
            status_msg = {
                "pending": "You already have a pending application. Please wait for admin review.",
                "approved": "Your application has already been approved!",
                "rejected": "Your previous application was rejected. Please contact support.",
            }
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": status_msg.get(existing.status, "You already have an application on file.")},
            )

        application = TeacherApplication(
            user_id=current_user.id,
            requirements=data.requirements,
            cv=data.cv,
            cv_url=data.cv_url,
            course_description=data.course_description,
            course_overview=data.course_overview,
            expected_lectures=data.expected_lectures,
            demo_video_url=data.demo_video_url,
        )
        db.add(application)
        db.commit()
        db.refresh(application)

        # Eagerly load the applicant relationship
        application = (
            db.query(TeacherApplication)
            .options(joinedload(TeacherApplication.applicant))
            .filter(TeacherApplication.id == application.id)
            .first()
        )
        return application
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to submit application: {str(e)}"})


@router.get("/my", response_model=list[TeacherApplicationOut])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user is None:
        return JSONResponse(status_code=401, content={"success": False, "message": "Not authenticated"})
    try:
        apps = (
            db.query(TeacherApplication)
            .options(joinedload(TeacherApplication.applicant))
            .filter(TeacherApplication.user_id == current_user.id)
            .order_by(TeacherApplication.created_at.desc())
            .all()
        )
        return apps
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to fetch applications: {str(e)}"})


@router.get("/", response_model=list[TeacherApplicationOut])
def list_applications(
    status: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_applications")),
):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Manager/Admin access required"})
    try:
        query = db.query(TeacherApplication).options(joinedload(TeacherApplication.applicant))
        if status:
            query = query.filter(TeacherApplication.status == status)
        return query.order_by(TeacherApplication.created_at.desc()).offset(skip).limit(limit).all()
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to list applications: {str(e)}"})


@router.get("/{application_id}", response_model=TeacherApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_applications")),
):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Manager/Admin access required"})
    try:
        app = (
            db.query(TeacherApplication)
            .options(joinedload(TeacherApplication.applicant))
            .filter(TeacherApplication.id == application_id)
            .first()
        )
        if not app:
            return JSONResponse(status_code=404, content={"success": False, "message": "Application not found"})
        return app
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to get application: {str(e)}"})


@router.patch("/{application_id}/approve")
def approve_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_applications")),
):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Manager/Admin access required"})
    try:
        app = db.query(TeacherApplication).filter(TeacherApplication.id == application_id).first()
        if not app:
            return JSONResponse(status_code=404, content={"success": False, "message": "Application not found"})
        if app.status != "pending":
            return JSONResponse(status_code=400, content={"success": False, "message": f"Application is already {app.status}"})

        # Approve the application
        app.status = "approved"
        app.reviewed_at = datetime.now(timezone.utc)

        # Promote the user to teacher
        user = db.query(User).filter(User.id == app.user_id).first()
        if user:
            user.role = "teacher"

        db.commit()
        return {"success": True, "message": "Application approved. User has been promoted to teacher."}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to approve application: {str(e)}"})


@router.patch("/{application_id}/reject")
def reject_application(
    application_id: int,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_applications")),
):
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Manager/Admin access required"})
    try:
        app = db.query(TeacherApplication).filter(TeacherApplication.id == application_id).first()
        if not app:
            return JSONResponse(status_code=404, content={"success": False, "message": "Application not found"})
        if app.status != "pending":
            return JSONResponse(status_code=400, content={"success": False, "message": f"Application is already {app.status}"})

        app.status = "rejected"
        app.admin_notes = notes
        app.reviewed_at = datetime.now(timezone.utc)
        db.commit()
        return {"success": True, "message": "Application rejected."}
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Failed to reject application: {str(e)}"})
