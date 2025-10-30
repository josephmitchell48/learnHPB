from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from ..deps import get_db_session
from ...schemas.annotation import AnnotationCreate, AnnotationRead
from ...services import cases as case_service

router = APIRouter()


@router.post(
  "/{case_id}/annotations",
  response_model=AnnotationRead,
  status_code=201,
  summary="Create annotation for a case",
)
def create_annotation(
  *,
  case_id: int = Path(..., description="Target case identifier"),
  payload: AnnotationCreate,
  db: Session = Depends(get_db_session),
) -> AnnotationRead:
  case = case_service.get_case_detail(db, case_id=case_id)
  if not case:
    raise HTTPException(status_code=404, detail="Case not found")

  record = case_service.create_annotation(
    db,
    case_id=case_id,
    author=payload.author,
    body=payload.body,
    metadata=payload.metadata,
  )
  return AnnotationRead.model_validate(record)
