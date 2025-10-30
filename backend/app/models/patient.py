from datetime import date
from typing import List, Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base_class import Base


class Patient(Base):
  __tablename__ = "patients"

  mrn: Mapped[str] = mapped_column(String(32), unique=True, index=True)
  first_name: Mapped[str] = mapped_column(String(128))
  last_name: Mapped[str] = mapped_column(String(128))
  date_of_birth: Mapped[date]
  sex: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
  notes: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

  encounters: Mapped[List["Encounter"]] = relationship(back_populates="patient", cascade="all, delete-orphan")
  cases: Mapped[List["CaseStudy"]] = relationship(back_populates="patient", cascade="all, delete-orphan")
