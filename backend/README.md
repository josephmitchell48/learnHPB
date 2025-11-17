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
- `CORS_ORIGINS` – comma-separated list of exact origins that can call the API (defaults to `http://localhost:5173`)
- `CORS_ORIGIN_REGEX` – optional regex used when you need to allow patterned domains such as Amplify branch URLs (e.g., `https://.*\.amplifyapp\.com`)

## Frontend Hosting (Amplify)

- `amplify.yml` at the repo root instructs AWS Amplify Hosting to install dependencies and run the Vite build inside `frontend/` and publish the `dist/` output.
- When Amplify finishes the first deploy, copy the generated domain name (e.g., `https://main.abc123.amplifyapp.com`) into your backend `.env` via `CORS_ORIGINS` or set `CORS_ORIGIN_REGEX=https://.*\.amplifyapp\.com` to trust every branch build.
- If you later move the backend behind a different domain, update the frontend environment variables (`VITE_*`) through Amplify console so API calls point at the right host.

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
