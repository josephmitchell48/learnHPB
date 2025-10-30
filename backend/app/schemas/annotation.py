from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AnnotationCreate(BaseModel):
  author: str
  body: str
  metadata: Optional[dict] = None


class AnnotationRead(AnnotationCreate):
  id: int
  case_id: int
  created_at: datetime

  class Config:
    from_attributes = True
