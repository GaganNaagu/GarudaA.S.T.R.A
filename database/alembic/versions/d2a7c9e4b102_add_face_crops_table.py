"""Add face_crops table

Revision ID: d2a7c9e4b102
Revises: c1f4e8b2a901
Create Date: 2026-11-28 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2a7c9e4b102'
down_revision: Union[str, Sequence[str], None] = 'c1f4e8b2a901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create face_crops table if not already present."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table('face_crops'):
        op.create_table(
            'face_crops',
            sa.Column('video_id', sa.Uuid(), nullable=False),
            sa.Column('frame_idx', sa.Integer(), nullable=False),
            sa.Column('image_path', sa.String(length=1024), nullable=False),
            sa.Column('embedding', sa.JSON(), nullable=True),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['video_id'], ['video_footages.id']),
            sa.PrimaryKeyConstraint('id'),
        )


def downgrade() -> None:
    """Drop face_crops table if present."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table('face_crops'):
        op.drop_table('face_crops')
