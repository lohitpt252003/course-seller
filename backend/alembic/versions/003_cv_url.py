"""003 - Add cv_url to teacher_applications

Revision ID: 003_cv_url
Revises: 002_teacher_applications
Create Date: 2026-03-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003_cv_url"
down_revision: Union[str, None] = "002_teacher_applications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("teacher_applications", sa.Column("cv_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("teacher_applications", "cv_url")
