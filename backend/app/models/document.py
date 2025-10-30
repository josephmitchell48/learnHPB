from datetime import datetime
from typing import List, Optional

import sqlalchemy as sa
from sqlalchemy import ForeignKey, String, Table, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base_class import Base

case_documents = Table(
  "case_documents",
  Base.metadata,
  sa.Column("case_id", ForeignKey("cases.id", ondelete="CASCADE"), primary_key=True),
  sa.Column("document_id", ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
)


class Document(Base):
  __tablename__ = "documents"
  __table_args__ = (UniqueConstraint("slug", name="uq_document_slug"),)

  slug: Mapped[str] = mapped_column(String(64))
  title: Mapped[str] = mapped_column(String(256))
  summary: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
  mime_type: Mapped[str] = mapped_column(String(64), default="application/pdf")
  storage_uri: Mapped[str] = mapped_column(String(512))
  metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
  full_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
  created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

  cases: Mapped[List["CaseStudy"]] = relationship(
    secondary=case_documents,
    back_populates="documents",
  )
