from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base_class import Base


class Encounter(Base):
  __tablename__ = "encounters"

  patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), index=True)
  encounter_type: Mapped[str] = mapped_column(String(64))
  started_at: Mapped[datetime]
  ended_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
  facility: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
  attending: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

  patient: Mapped["Patient"] = relationship(back_populates="encounters")
  cases: Mapped[list["CaseStudy"]] = relationship(back_populates="encounter")
