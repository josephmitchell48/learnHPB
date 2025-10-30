# Backend Architecture Overview

## Service Composition

- **API Layer**: FastAPI (`backend/app/main.py`) exposing REST endpoints under `/api/v1`.
- **Domain Models**: SQLAlchemy ORM models inside `backend/app/models/` covering HPB-specific patients, encounters, cases, documents, imaging studies, and annotations.
- **Data Access**: `backend/app/services/cases.py` implements query helpers returning ORM objects consumed by Pydantic response schemas.
- **Schema Serialization**: Pydantic models found in `backend/app/schemas/` ensure the frontend receives typed payloads aligned with the existing React viewer.
- **Infrastructure Glue**: Terraform definitions in `infra/terraform` provision S3 buckets (documents + imaging assets), an SQS ingest queue, RDS Postgres, and a Lambda slot for DICOM conversion.

## Request Flow

1. Frontend calls `GET /api/v1/cases` to obtain HPB case summaries.
2. Selecting a case triggers `GET /api/v1/cases/{id}` returning:
   - Patient demographics
   - Clinical summary + tags
   - Document metadata with storage URIs (convert to presigned URLs before display)
   - Imaging study descriptors (VTI volumes, mesh URIs, metadata)
   - Segmented structures that drive the 3D viewer
3. Optional annotations can be created with `POST /api/v1/cases/{id}/annotations` for collaborative research notes.

## Feature Flags

`feature_flag_lightweight_mode` (via env) mirrors the frontend lightweight toggle. Toggling the flag allows the API to restrict cases or the frontend to switch to UX-only mode without hitting large assets.

## Storage Strategy

- **Documents**: Stored in the `documents` S3 bucket. The API should resolve `storage_uri` values to presigned URLs using `backend/app/services/storage.py` before returning them to the client in production.
- **Imaging Assets**: VTI volumes and VTP meshes live in the `assets` bucket; `imaging_studies.volume_uri` and `case_structures.mesh_uri` reference those objects.
- **Search**: `documents.full_text` is modeled for future Postgres `tsvector` indexes enabling native full-text search over HPB clinical narratives.

## Ingestion Pipeline (Preview)

1. Raw DICOM pushed to upload bucket triggers an SQS message.
2. `dicom_converter` Lambda (packaged separately) reads the payload, performs conversion to VTI/VTP, uploads to the assets bucket, and updates Postgres (via a protected API endpoint or direct DB connection).
3. Seed script `backend/scripts/seed_hpb.py` provides synthetic content until the ingestion worker is implemented.

## Deployment Checklist

1. Deploy Terraform stack (`infra/terraform`).
2. Populate `.env` with Terraform outputs (bucket names, RDS endpoint, credentials).
3. Apply database migrations: `alembic upgrade head`.
4. Seed HPB demo data: `python -m backend.scripts.seed_hpb`.
5. Launch the API via Uvicorn/Gunicorn (containerized or on ECS/EKS/EC2 as budget allows).
6. Update the frontend `.env` with `VITE_API_BASE_URL` pointing to the new FastAPI service.
