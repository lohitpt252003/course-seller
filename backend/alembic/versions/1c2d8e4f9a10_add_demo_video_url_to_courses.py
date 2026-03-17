"""Add demo_video_url to courses

Revision ID: 1c2d8e4f9a10
Revises: 7b9b933a62a3
Create Date: 2026-03-18
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "1c2d8e4f9a10"
down_revision: Union[str, None] = "7b9b933a62a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("demo_video_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("courses", "demo_video_url")
