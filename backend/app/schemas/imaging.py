from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ImagingStudyRead(BaseModel):
  id: int
  label: str
  modality: str
  volume_uri: str
  preview_uri: Optional[str]
  format: str
  metadata: Optional[dict]
  acquired_at: Optional[datetime]

  class Config:
    from_attributes = True
