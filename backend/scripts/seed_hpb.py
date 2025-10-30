"""
Generate synthetic HPB cases to bootstrap the learning environment.
Run with: `python -m backend.scripts.seed_hpb`
"""

from datetime import date, datetime

from sqlalchemy.orm import Session

from backend.app import models
from backend.app.core.config import get_settings
from backend.app.db.session import SessionLocal

settings = get_settings()


def create_hpb_cases(db: Session) -> None:
  patient = models.Patient(
    mrn="HPB0001",
    first_name="Alex",
    last_name="Rivera",
    date_of_birth=date(1978, 6, 2),
    sex="M",
    notes="Synthetic HPB oncology patient.",
  )
  db.add(patient)
  db.flush()

  encounter = models.Encounter(
    patient_id=patient.id,
    encounter_type="Inpatient",
    started_at=datetime(2024, 9, 12),
    facility="LearnHPB Medical Center",
    attending="Dr. Helena Lin",
  )
  db.add(encounter)
  db.flush()

  case = models.CaseStudy(
    patient_id=patient.id,
    encounter_id=encounter.id,
    slug="hepatic-resection-001",
    title="Segment VII Hepatectomy Planning",
    focus="HCC in cirrhotic liver",
    specialty="HPB",
    clinical_summary=(
      "55-year-old with Child-Pugh A cirrhosis presents with a 3.2 cm "
      "arterially enhancing lesion in segment VII abutting the right hepatic vein."
    ),
    tags=["HCC", "resection", "segment-vii"],
  )
  db.add(case)
  db.flush()

  arterial_doc = models.Document(
    slug="hepatic-resection-001-radiology",
    title="Triphasic CT Report",
    summary="Arterial phase hyperenhancement with portal venous washout.",
    mime_type="application/pdf",
    storage_uri=f"s3://{settings.s3_document_bucket}/reports/hepatic002_report.pdf",
  )
  db.add(arterial_doc)
  db.flush()

  case.documents.append(arterial_doc)

  study = models.ImagingStudy(
    case_id=case.id,
    label="Triphasic CT",
    modality="CT",
    volume_uri=f"s3://{settings.s3_asset_bucket}/hepaticvessel_002/hepaticvessel_002_volume.vti",
    preview_uri=f"s3://{settings.s3_asset_bucket}/hepaticvessel_002/preview.png",
    format="vti",
    metadata={
      "voxels": "512x512x320",
      "spacing": [0.75, 0.75, 1.0],
      "phase": "arterial",
    },
    acquired_at=datetime(2024, 9, 8),
  )
  db.add(study)
  db.flush()

  structures = [
    models.CaseStructure(
      case_id=case.id,
      name="Liver Parenchyma",
      color_hex="#f8b195",
      mesh_uri=f"s3://{settings.s3_asset_bucket}/hepaticvessel_002/segmentations/hepaticvessel_002_liver.vtp",
      metadata={"derived_from": "segmentator-v1"},
    ),
    models.CaseStructure(
      case_id=case.id,
      name="Portal Vein",
      color_hex="#355c7d",
      mesh_uri=f"s3://{settings.s3_asset_bucket}/hepaticvessel_002/segmentations/hepaticvessel_002_vsnet.vtp",
    ),
    models.CaseStructure(
      case_id=case.id,
      name="Index Lesion",
      color_hex="#6c5b7b",
      mesh_uri=f"s3://{settings.s3_asset_bucket}/hepaticvessel_002/segmentations/hepaticvessel_002_task008.vtp",
    ),
  ]
  db.add_all(structures)

  db.commit()


def main():
  with SessionLocal() as db:
    create_hpb_cases(db)
    print("Seeded synthetic HPB case data.")


if __name__ == "__main__":
  main()
