"""“baseline”

Revision ID: 11b2f4d1f46b
Revises: 
Create Date: 2022-10-13 07:38:22.729984

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '11b2f4d1f46b'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('documents',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=512), nullable=True),
    sa.Column('data', sa.JSON(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('documents')
    # ### end Alembic commands ###
