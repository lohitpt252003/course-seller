"""001 - Create all tables

Revision ID: 001_initial
Revises: None
Create Date: 2026-02-17
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Users ---
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="student"),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- Categories ---
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
    )

    # --- Courses ---
    op.create_table(
        "courses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Float(), nullable=False, server_default=sa.text("0.0")),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("teacher_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("avg_rating", sa.Float(), server_default=sa.text("0.0")),
        sa.Column("total_students", sa.Integer(), server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_courses_teacher_id", "courses", ["teacher_id"])
    op.create_index("ix_courses_category_id", "courses", ["category_id"])

    # --- Lessons ---
    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(20), nullable=False, server_default="text"),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("video_url", sa.String(500), nullable=True),
        sa.Column("pdf_url", sa.String(500), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_lessons_course_id", "lessons", ["course_id"])

    # --- Enrollments ---
    op.create_table(
        "enrollments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed", sa.Boolean(), server_default=sa.text("false")),
    )
    op.create_index("ix_enrollments_user_course", "enrollments", ["user_id", "course_id"], unique=True)

    # --- Progress ---
    op.create_table(
        "progress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("enrollment_id", sa.Integer(), sa.ForeignKey("enrollments.id"), nullable=False),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("completed", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- Payments ---
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("transaction_id", sa.String(255), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- Reviews ---
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- Certificates ---
    op.create_table(
        "certificates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("certificate_url", sa.String(500), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("certificates")
    op.drop_table("reviews")
    op.drop_table("payments")
    op.drop_table("progress")
    op.drop_table("enrollments")
    op.drop_table("lessons")
    op.drop_table("courses")
    op.drop_table("categories")
    op.drop_table("users")
