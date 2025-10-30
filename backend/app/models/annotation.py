from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base_class import Base


class Annotation(Base):
  __tablename__ = "annotations"

  case_id: Mapped[int] = mapped_column(ForeignKey("cases.id", ondelete="CASCADE"), index=True)
  author: Mapped[str] = mapped_column(String(128))
  body: Mapped[str] = mapped_column(String(2048))
  created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
  metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

  case: Mapped["CaseStudy"] = relationship(back_populates="annotations")
