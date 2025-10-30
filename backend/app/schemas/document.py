from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DocumentRead(BaseModel):
  id: int
  slug: str
  title: str
  summary: Optional[str]
  mime_type: str
  storage_uri: str
  metadata: Optional[dict]
  created_at: datetime

  class Config:
    from_attributes = True
