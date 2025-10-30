from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..deps import get_db_session
from ...schemas.case import CaseRead, CaseSummary
from ...services import cases as case_service

router = APIRouter()


@router.get("/", response_model=list[CaseSummary])
def list_cases(
  *,
  db: Session = Depends(get_db_session),
  specialty: Optional[str] = Query(default="HPB", description="Filter by specialty (default HPB)"),
  limit: int = Query(default=25, le=100),
  offset: int = 0,
) -> list[CaseSummary]:
  records = case_service.list_cases(db, specialty=specialty, limit=limit, offset=offset)
  return [CaseSummary.model_validate(record) for record in records]


@router.get("/{case_id}", response_model=CaseRead)
def get_case_detail(case_id: int, db: Session = Depends(get_db_session)) -> CaseRead:
  record = case_service.get_case_detail(db, case_id=case_id)
  if not record:
    raise HTTPException(status_code=404, detail="Case not found")
  return CaseRead.model_validate(record)
