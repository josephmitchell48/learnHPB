"""create core tables

Revision ID: 0001
Revises:
Create Date: 2025-01-09 00:00:00.000000
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
  op.create_table(
    "patients",
    sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
    sa.Column("mrn", sa.String(length=32), nullable=False),
    sa.Column("first_name", sa.String(length=128), nullable=False),
    sa.Column("last_name", sa.String(length=128), nullable=False),
    sa.Column("date_of_birth", sa.Date(), nullable=False),
    sa.Column("sex", sa.String(length=16), nullable=True),
    sa.Column("notes", sa.String(length=1024), nullable=True),
    sa.PrimaryKeyConstraint("id"),
    sa.UniqueConstraint("mrn"),
  )
  op.create_index(op.f("ix_patients_mrn"), "patients", ["mrn"], unique=False)

  op.create_table(
    "encounters",
    sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
    sa.Column("patient_id", sa.Integer(), nullable=False),
    sa.Column("encounter_type", sa.String(length=64), nullable=False),
    sa.Column("started_at", sa.DateTime(), nullable=False),
    sa.Column("ended_at", sa.DateTime(), nullable=True),
    sa.Column("facility", sa.String(length=128), nullable=True),
    sa.Column("attending", sa.String(length=128), nullable=True),
    sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id"),
  )
  op.create_index(op.f("ix_encounters_patient_id"), "encounters", ["patient_id"], unique=False)

  op.create_table(
    "documents",
    sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
    sa.Column("slug", sa.String(length=64), nullable=False),
    sa.Column("title", sa.String(length=256), nullable=False),
    sa.Column("summary", sa.String(length=1024), nullable=True),
    sa.Column("mime_type", sa.String(length=64), nullable=False),
    sa.Column("storage_uri", sa.String(length=512), nullable=False),
    sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column("full_text", sa.String(), nullable=True),
    sa.Column("created_at", sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint("id"),
    sa.UniqueConstraint("slug"),
  )

  op.create_table(
    "cases",
    sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
    sa.Column("patient_id", sa.Integer(), nullable=False),
    sa.Column("encounter_id", sa.Integer(), nullable=True),
    sa.Column("slug", sa.String(length=64), nullable=False),
    sa.Column("title", sa.String(length=256), nullable=False),
    sa.Column("focus", sa.String(length=256), nullable=True),
    sa.Column("specialty", sa.String(length=64), nullable=False),
    sa.Column("clinical_summary", sa.String(length=2048), nullable=True),
    sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column("created_at", sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(["encounter_id"], ["encounters.id"], ondelete="SET NULL"),
    sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id"),
    sa.UniqueConstraint("patient_id", "slug", name="uq_case_patient_slug"),
  )
  op.create_index(op.f("ix_cases_patient_id"), "cases", ["patient_id"], unique=False)

  op.create_table(
    "annotations",
    sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
    sa.Column("case_id", sa.Integer(), nullable=False),
    sa.Column("author", sa.String(length=128), nullable=False),
    sa.Column("body", sa.String(length=2048), nullable=False),
    sa.Column("created_at", sa.DateTime(), nullable=False),
    sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id"),
  )
  op.create_index(op.f("ix_annotations_case_id"), "annotations", ["case_id"], unique=False)

  op.create_table(
    "imaging_studies",
    sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
    sa.Column("case_id", sa.Integer(), nullable=False),
    sa.Column("label", sa.String(length=128), nullable=False),
    sa.Column("modality", sa.String(length=16), nullable=False),
    sa.Column("volume_uri", sa.String(length=512), nullable=False),
    sa.Column("preview_uri", sa.String(length=512), nullable=True),
    sa.Column("format", sa.String(length=16), nullable=False),
    sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column("acquired_at", sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id"),
  )
  op.create_index(op.f("ix_imaging_studies_case_id"), "imaging_studies", ["case_id"], unique=False)

  op.create_table(
    "case_structures",
    sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
    sa.Column("case_id", sa.Integer(), nullable=False),
    sa.Column("name", sa.String(length=128), nullable=False),
    sa.Column("color_hex", sa.String(length=7), nullable=False),
    sa.Column("mesh_uri", sa.String(length=512), nullable=False),
    sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("id"),
  )
  op.create_index(op.f("ix_case_structures_case_id"), "case_structures", ["case_id"], unique=False)

  op.create_table(
    "case_documents",
    sa.Column("case_id", sa.Integer(), nullable=False),
    sa.Column("document_id", sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
    sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
    sa.PrimaryKeyConstraint("case_id", "document_id"),
  )


def downgrade() -> None:
  op.drop_table("case_documents")
  op.drop_index(op.f("ix_case_structures_case_id"), table_name="case_structures")
  op.drop_table("case_structures")
  op.drop_index(op.f("ix_imaging_studies_case_id"), table_name="imaging_studies")
  op.drop_table("imaging_studies")
  op.drop_index(op.f("ix_annotations_case_id"), table_name="annotations")
  op.drop_table("annotations")
  op.drop_index(op.f("ix_cases_patient_id"), table_name="cases")
  op.drop_table("cases")
  op.drop_table("documents")
  op.drop_index(op.f("ix_encounters_patient_id"), table_name="encounters")
  op.drop_table("encounters")
  op.drop_index(op.f("ix_patients_mrn"), table_name="patients")
  op.drop_table("patients")
