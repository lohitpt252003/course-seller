from fastapi import APIRouter, Depends, UploadFile, File, Query
from fastapi.responses import JSONResponse
from app.models.user import User
from app.utils.auth import require_role
from app.services.minio_service import upload_file, delete_file

import re

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])

# Max upload size: 500 MB
MAX_FILE_SIZE = 500 * 1024 * 1024

# Block dangerous executables by magic bytes
BLOCKED_MAGIC_BYTES = [
    b"MZ",                      # Windows executables (.exe, .dll)
    b"\x7fELF",                 # Linux executables
    b"\xca\xfe\xba\xbe",       # macOS fat binaries
    b"\xfe\xed\xfa",           # macOS Mach-O
]


def _sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and injection."""
    if not filename:
        return "file"
    name = filename.replace("\x00", "").replace("/", "_").replace("\\", "_").lstrip(".")
    name = re.sub(r"[^a-zA-Z0-9._\- ]", "_", name)
    return name[:200] if name else "file"


def _is_blocked(data: bytes) -> bool:
    """Return True if the file starts with a blocked magic byte sequence."""
    for sig in BLOCKED_MAGIC_BYTES:
        if data[:len(sig)] == sig:
            return True
    return False


def _validate_object_name(object_name: str) -> bool:
    """Validate object_name to prevent path traversal on deletion."""
    if not object_name or ".." in object_name:
        return False
    return bool(re.match(r"^(thumbnails|pdfs|videos|materials)/[a-f0-9]{32}\.[a-z0-9]+$", object_name))


@router.post("/")
async def upload(
    file: UploadFile = File(...),
    folder: str = Query("materials", regex="^(thumbnails|pdfs|videos|materials)$"),
    current_user: User = Depends(require_role(["teacher", "admin"])),
):
    """Upload any file to MinIO. Returns the public URL and object name."""
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Only teachers and admins can upload files"})

    try:
        if not file.filename:
            return JSONResponse(status_code=400, content={"success": False, "message": "No filename provided"})

        contents = await file.read()

        if len(contents) == 0:
            return JSONResponse(status_code=400, content={"success": False, "message": "Empty file is not allowed"})

        if len(contents) > MAX_FILE_SIZE:
            return JSONResponse(status_code=400, content={"success": False, "message": "File too large. Maximum size is 500 MB"})

        if _is_blocked(contents):
            return JSONResponse(status_code=400, content={"success": False, "message": "Executable files are not allowed"})

        safe_name = _sanitize_filename(file.filename)
        result = upload_file(
            file_data=contents,
            folder=folder,
            original_filename=safe_name,
            content_type=file.content_type or "application/octet-stream",
        )

        return {"success": True, "url": result["url"], "object_name": result["object_name"], "size": len(contents)}

    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Upload failed: {str(e)}"})


@router.delete("/{object_name:path}")
def remove_file(
    object_name: str,
    current_user: User = Depends(require_role(["teacher", "admin"])),
):
    """Delete a file from MinIO."""
    if current_user is None:
        return JSONResponse(status_code=403, content={"success": False, "message": "Only teachers and admins can delete files"})
    try:
        if not _validate_object_name(object_name):
            return JSONResponse(status_code=400, content={"success": False, "message": "Invalid file path"})
        delete_file(object_name)
        return {"success": True, "message": "File deleted"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": f"Delete failed: {str(e)}"})
