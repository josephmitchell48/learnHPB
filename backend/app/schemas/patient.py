from datetime import date
from typing import Optional

from pydantic import BaseModel


class PatientRead(BaseModel):
  id: int
  mrn: str
  first_name: str
  last_name: str
  date_of_birth: date
  sex: Optional[str]

  class Config:
    from_attributes = True
