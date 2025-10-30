from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base_class import Base


class ImagingStudy(Base):
  __tablename__ = "imaging_studies"

  case_id: Mapped[int] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
  label: Mapped[str] = mapped_column(String(128))
  modality: Mapped[str] = mapped_column(String(16), default="CT")
  volume_uri: Mapped[str] = mapped_column(String(512))
  preview_uri: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
  format: Mapped[str] = mapped_column(String(16), default="vti")
  metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
  acquired_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

  case: Mapped["CaseStudy"] = relationship(back_populates="imaging_studies")
