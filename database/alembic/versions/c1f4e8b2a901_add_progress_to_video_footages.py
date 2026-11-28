"""Add progress column to video_footages

Revision ID: c1f4e8b2a901
Revises: 93265addf06a
Create Date: 2026-11-28 13:51:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1f4e8b2a901'
down_revision: Union[str, Sequence[str], None] = '93265addf06a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add progress column to video_footages if not already present."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = [col['name'] for col in inspector.get_columns('video_footages')]
    if 'progress' not in existing_columns:
        op.add_column(
            'video_footages',
            sa.Column('progress', sa.Float(), nullable=False, server_default='0.0')
        )


def downgrade() -> None:
    """Remove progress column from video_footages."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = [col['name'] for col in inspector.get_columns('video_footages')]
    if 'progress' in existing_columns:
        op.drop_column('video_footages', 'progress')
