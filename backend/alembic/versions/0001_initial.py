"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-18

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("role", sa.Enum("admin", "artist", "receptionist", "client", name="userrole"), nullable=False, server_default="client"),
        sa.Column("slug", sa.String(), unique=True, nullable=True),
        sa.Column("commission_pct", sa.Float(), server_default="0.5"),
        sa.Column("theme_json", postgresql.JSONB(), server_default="{}"),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("styles", postgresql.ARRAY(sa.String()), server_default="{}"),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("banner_url", sa.String(), nullable=True),
        sa.Column("social_links", postgresql.JSONB(), server_default="{}"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_slug", "users", ["slug"])

    op.create_table(
        "portfolio_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("image_url", sa.String(), nullable=False),
        sa.Column("public_id", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "appointments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("artist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("client_name", sa.String(), nullable=False),
        sa.Column("client_phone", sa.String(), nullable=False),
        sa.Column("service", sa.String(), nullable=False),
        sa.Column("datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), server_default="60"),
        sa.Column("status", sa.Enum("pending", "confirmed", "completed", "cancelled", name="appointmentstatus"), server_default="pending"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "availability",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("artist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("slot_duration_minutes", sa.Integer(), server_default="60"),
    )

    op.create_table(
        "financial_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("artist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", sa.Enum("income", "expense", "commission", name="recordtype"), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("source", sa.Enum("instagram", "whatsapp", "link_bio", "manual", name="leadsource"), server_default="manual"),
        sa.Column("tags", postgresql.ARRAY(sa.String()), server_default="{}"),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "automations",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("trigger_type", sa.Enum("keyword_instagram", "keyword_whatsapp", name="triggertype"), nullable=False),
        sa.Column("trigger_config", postgresql.JSONB(), server_default="{}"),
        sa.Column("flow_json", postgresql.JSONB(), server_default="{}"),
        sa.Column("active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "flow_executions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("automation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("automations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("triggered_by", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("status", sa.Enum("running", "completed", "failed", name="executionstatus"), server_default="running"),
        sa.Column("logs", postgresql.JSONB(), server_default="[]"),
    )

    op.create_table(
        "ai_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("leads.id", ondelete="SET NULL"), nullable=True),
        sa.Column("channel", sa.Enum("instagram", "whatsapp", "web", name="conversationchannel"), server_default="web"),
        sa.Column("messages", postgresql.JSONB(), server_default="[]"),
        sa.Column("brief", postgresql.JSONB(), nullable=True),
        sa.Column("status", sa.Enum("active", "completed", "abandoned", name="conversationstatus"), server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "appointment_briefs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("appointment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ai_conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ai_conversations.id", ondelete="SET NULL"), nullable=True),
        sa.Column("brief", postgresql.JSONB(), nullable=False),
        sa.Column("viewed_by_artist", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "studio_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, server_default="Estúdio de Tatuagem"),
        sa.Column("logo_url", sa.String(), nullable=True),
        sa.Column("theme", postgresql.JSONB(), server_default="{}"),
        sa.Column("ai_provider", sa.Enum("anthropic", "openai", "groq", name="aiprovidertype"), server_default="anthropic"),
        sa.Column("ai_api_key", sa.String(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("studio_settings")
    op.drop_table("appointment_briefs")
    op.drop_table("ai_conversations")
    op.drop_table("flow_executions")
    op.drop_table("automations")
    op.drop_table("leads")
    op.drop_table("financial_records")
    op.drop_table("availability")
    op.drop_table("appointments")
    op.drop_table("portfolio_items")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS appointmentstatus")
    op.execute("DROP TYPE IF EXISTS recordtype")
    op.execute("DROP TYPE IF EXISTS leadsource")
    op.execute("DROP TYPE IF EXISTS triggertype")
    op.execute("DROP TYPE IF EXISTS executionstatus")
    op.execute("DROP TYPE IF EXISTS conversationchannel")
    op.execute("DROP TYPE IF EXISTS conversationstatus")
    op.execute("DROP TYPE IF EXISTS aiprovidertype")
