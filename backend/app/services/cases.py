from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from .. import models


def list_cases(db: Session, *, specialty: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[models.CaseStudy]:
  query = db.query(models.CaseStudy)
  if specialty:
    query = query.filter(models.CaseStudy.specialty == specialty)
  return query.order_by(models.CaseStudy.created_at.desc()).offset(offset).limit(limit).all()


def get_case_detail(db: Session, case_id: int) -> Optional[models.CaseStudy]:
  return (
    db.query(models.CaseStudy)
    .options(
      joinedload(models.CaseStudy.patient),
      joinedload(models.CaseStudy.documents),
      joinedload(models.CaseStudy.imaging_studies),
      joinedload(models.CaseStudy.structures),
    )
    .filter(models.CaseStudy.id == case_id)
    .one_or_none()
  )


def create_annotation(db: Session, case_id: int, *, author: str, body: str, metadata: Optional[dict] = None) -> models.Annotation:
  annotation = models.Annotation(case_id=case_id, author=author, body=body, metadata=metadata)
  db.add(annotation)
  db.commit()
  db.refresh(annotation)
  return annotation
