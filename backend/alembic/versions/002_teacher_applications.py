"""002 - Create teacher_applications table

Revision ID: 002_teacher_applications
Revises: 001_initial
Create Date: 2026-03-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = "002_teacher_applications"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "teacher_applications",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("requirements", sa.Text(), nullable=False),
        sa.Column("cv", sa.Text(), nullable=False),
        sa.Column("course_description", sa.Text(), nullable=False),
        sa.Column("course_overview", sa.Text(), nullable=False),
        sa.Column("expected_lectures", sa.Integer(), nullable=False),
        sa.Column("demo_video_url", sa.String(500), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_teacher_applications_user_id", "teacher_applications", ["user_id"])
    op.create_index("ix_teacher_applications_status", "teacher_applications", ["status"])


def downgrade() -> None:
    op.drop_table("teacher_applications")
