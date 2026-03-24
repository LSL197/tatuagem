"""sdr agent fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-24
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adiciona phone na ai_conversations para lookup direto sem join com leads
    op.add_column(
        "ai_conversations",
        sa.Column("phone", sa.String(), nullable=True),
    )
    # Flag para indicar que a IA pediu intervenção humana
    op.add_column(
        "ai_conversations",
        sa.Column("awaiting_handoff", sa.Boolean(), server_default="false", nullable=False),
    )
    # Adiciona updated_at para controle de inatividade (reativação)
    op.add_column(
        "ai_conversations",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), onupdate=sa.text("now()")),
    )
    # Índice no phone da ai_conversations para lookup O(log n)
    op.create_index("ix_ai_conversations_phone", "ai_conversations", ["phone"])
    # Índice no phone dos leads (pode não existir)
    op.create_index("ix_leads_phone", "leads", ["phone"], if_not_exists=True)


def downgrade() -> None:
    op.drop_index("ix_leads_phone", table_name="leads")
    op.drop_index("ix_ai_conversations_phone", table_name="ai_conversations")
    op.drop_column("ai_conversations", "updated_at")
    op.drop_column("ai_conversations", "awaiting_handoff")
    op.drop_column("ai_conversations", "phone")
