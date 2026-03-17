"""Add rich learning content and submissions

Revision ID: 5f7c9b2a1d44
Revises: 1c2d8e4f9a10
Create Date: 2026-03-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5f7c9b2a1d44"
down_revision: Union[str, None] = "1c2d8e4f9a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("lessons", sa.Column("ppt_url", sa.String(length=500), nullable=True))
    op.add_column("lessons", sa.Column("code_template", sa.Text(), nullable=True))
    op.add_column("lessons", sa.Column("quiz_data", sa.Text(), nullable=True))
    op.add_column("lessons", sa.Column("autograde_tests", sa.Text(), nullable=True))
    op.add_column("lessons", sa.Column("autograde_language", sa.String(length=20), nullable=True))
    op.alter_column("lessons", "content_type", existing_type=sa.String(length=20), type_=sa.String(length=40))

    op.create_table(
        "lesson_submissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lesson_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("submission_type", sa.String(length=30), nullable=False),
        sa.Column("answer_data", sa.Text(), nullable=True),
        sa.Column("submission_text", sa.Text(), nullable=True),
        sa.Column("submission_code", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("max_score", sa.Float(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("graded_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_lesson_submissions_lesson_id"), "lesson_submissions", ["lesson_id"], unique=False)
    op.create_index(op.f("ix_lesson_submissions_user_id"), "lesson_submissions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lesson_submissions_user_id"), table_name="lesson_submissions")
    op.drop_index(op.f("ix_lesson_submissions_lesson_id"), table_name="lesson_submissions")
    op.drop_table("lesson_submissions")
    op.alter_column("lessons", "content_type", existing_type=sa.String(length=40), type_=sa.String(length=20))
    op.drop_column("lessons", "autograde_language")
    op.drop_column("lessons", "autograde_tests")
    op.drop_column("lessons", "quiz_data")
    op.drop_column("lessons", "code_template")
    op.drop_column("lessons", "ppt_url")
