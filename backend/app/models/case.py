from datetime import datetime
from typing import List, Optional

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base_class import Base


class CaseStudy(Base):
  __tablename__ = "cases"
  __table_args__ = (UniqueConstraint("patient_id", "slug", name="uq_case_patient_slug"),)

  patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
  encounter_id: Mapped[Optional[int]] = mapped_column(ForeignKey("encounters.id", ondelete="SET NULL"), nullable=True)
  slug: Mapped[str] = mapped_column(String(64))
  title: Mapped[str] = mapped_column(String(256))
  focus: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
  specialty: Mapped[str] = mapped_column(String(64), default="HPB")
  clinical_summary: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
  tags: Mapped[Optional[list[str]]] = mapped_column(JSONB, nullable=True)
  created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

  patient: Mapped["Patient"] = relationship(back_populates="cases")
  encounter: Mapped[Optional["Encounter"]] = relationship(back_populates="cases")
  documents: Mapped[List["Document"]] = relationship(
    secondary="case_documents",
    back_populates="cases",
  )
  imaging_studies: Mapped[List["ImagingStudy"]] = relationship(back_populates="case", cascade="all, delete-orphan")
  structures: Mapped[List["CaseStructure"]] = relationship(back_populates="case", cascade="all, delete-orphan")
  annotations: Mapped[List["Annotation"]] = relationship(back_populates="case", cascade="all, delete-orphan")


class CaseStructure(Base):
  __tablename__ = "case_structures"

  case_id: Mapped[int] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
  name: Mapped[str] = mapped_column(String(128))
  color_hex: Mapped[str] = mapped_column(String(7))
  mesh_uri: Mapped[str] = mapped_column(String(512))
  metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

  case: Mapped["CaseStudy"] = relationship(back_populates="structures")
