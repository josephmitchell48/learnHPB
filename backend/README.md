# LearnHPB Backend

FastAPI service providing HPB-focused case metadata, documents, and imaging descriptors for the LearnHPB frontend.

## Local Development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Start Postgres (example with docker)
docker run --name learnhpb-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15

# Apply migrations
cd backend
alembic upgrade head

# Seed synthetic HPB data
python -m backend.scripts.seed_hpb

# Run the API
uvicorn backend.app.main:app --reload
```

The API is served at `http://localhost:8000/api/v1` with documentation via `/docs` and `/redoc`.

## Configuration

Environment variables (or `.env`) supported via `pydantic-settings`:

- `DATABASE_URL` – SQLAlchemy URL for Postgres (defaults to local instance)
- `AWS_REGION`, `S3_ASSET_BUCKET`, `S3_DOCUMENT_BUCKET` – used for presigned URL generation
- `FEATURE_FLAG_LIGHTWEIGHT_MODE` – allow frontend to request lightweight dataset

## Terraform Deployment

Initial AWS resources live under `infra/terraform`. Configure variables in `terraform.tfvars`:

```hcl
aws_region         = "us-east-1"
vpc_id             = "vpc-1234567890abc"
private_subnet_ids = ["subnet-abc", "subnet-def"]
app_cidr_blocks    = ["10.1.0.0/16"]
db_username        = "learnhpb"
db_password        = "super-secret"
lambda_package_path = "../../dist/dicom_converter.zip"
```

Then deploy:

```bash
cd infra/terraform
terraform init
terraform apply
```

The apply output includes S3 bucket names and the database endpoint. Update your `.env` with those values for the API service.

## Next Steps

- Expand seed data with additional synthetic HPB encounters.
- Implement secure auth (OIDC) and role-based access checks.
- Build ingestion Lambda (`dicom_converter`) to transform raw DICOM into VTI/VTP assets referenced by `imaging_studies`.
- Integrate CloudWatch metrics/log shipping for audit compliance.
