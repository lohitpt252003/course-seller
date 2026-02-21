import io
import json
import re
import uuid

from minio import Minio
from app.config import get_settings

_client = None


def get_minio_client() -> Minio:
    """Return a singleton MinIO client."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
    return _client


def ensure_bucket():
    """Create the default bucket if it doesn't exist. Sets public read-only policy."""
    settings = get_settings()
    client = get_minio_client()
    bucket = settings.MINIO_BUCKET_NAME

    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)

    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": "*"},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{bucket}/*"],
            }
        ],
    }
    client.set_bucket_policy(bucket, json.dumps(policy))


def upload_file(file_data: bytes, folder: str, original_filename: str, content_type: str = "application/octet-stream") -> dict:
    """Upload a file to MinIO. Returns dict with 'url' and 'object_name'."""
    settings = get_settings()
    client = get_minio_client()
    bucket = settings.MINIO_BUCKET_NAME

    # Validate folder
    if folder not in {"thumbnails", "pdfs", "videos", "materials"}:
        raise ValueError(f"Invalid folder: {folder}")

    # Extract extension safely
    ext = ""
    if original_filename and "." in original_filename:
        ext = "." + original_filename.rsplit(".", 1)[1].lower().strip()
        ext = re.sub(r"[^a-z0-9.]", "", ext)  # only safe chars

    # UUID-only filename — no user-controlled parts
    object_name = f"{folder}/{uuid.uuid4().hex}{ext}"

    # Sanitize content type
    safe_ct = content_type.split(";")[0].strip().lower() if content_type else "application/octet-stream"

    client.put_object(
        bucket_name=bucket,
        object_name=object_name,
        data=io.BytesIO(file_data),
        length=len(file_data),
        content_type=safe_ct,
    )

    protocol = "https" if settings.MINIO_SECURE else "http"
    url = f"{protocol}://{settings.MINIO_EXTERNAL_ENDPOINT}/{bucket}/{object_name}"

    return {"url": url, "object_name": object_name}


def delete_file(object_name: str):
    """Delete a file from MinIO."""
    if not object_name or ".." in object_name:
        raise ValueError("Invalid object name")
    settings = get_settings()
    client = get_minio_client()
    client.remove_object(settings.MINIO_BUCKET_NAME, object_name)


def get_presigned_url(object_name: str, expires_hours: int = 1) -> str:
    """Generate a presigned URL (max 24h)."""
    from datetime import timedelta

    if not object_name or ".." in object_name:
        raise ValueError("Invalid object name")

    settings = get_settings()
    client = get_minio_client()
    return client.presigned_get_object(
        settings.MINIO_BUCKET_NAME,
        object_name,
        expires=timedelta(hours=max(1, min(expires_hours, 24))),
    )
