from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from .document import DocumentRead
from .imaging import ImagingStudyRead
from .patient import PatientRead


class CaseStructureRead(BaseModel):
  id: int
  name: str
  color_hex: str
  mesh_uri: str
  metadata: Optional[dict] = None

  class Config:
    from_attributes = True


class CaseSummary(BaseModel):
  id: int
  slug: str
  title: str
  focus: Optional[str]
  specialty: str
  created_at: datetime

  class Config:
    from_attributes = True


class CaseRead(CaseSummary):
  patient: PatientRead
  encounter_id: Optional[int]
  clinical_summary: Optional[str]
  tags: Optional[list[str]]
  documents: List[DocumentRead]
  imaging_studies: List[ImagingStudyRead]
  structures: List[CaseStructureRead]

  class Config:
    from_attributes = True
