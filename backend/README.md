# LearnHPB Backend

The backend is now a single serverless codebase located in `learnHPB-backend/`.
It exposes read-only case metadata stored in S3 through a FastAPI application
that runs inside AWS Lambda via API Gateway.

## Layout

- `learnHPB-backend/src/` – FastAPI app, AWS Lambda Powertools logging/tracing,
  and the service layer that fetches metadata from S3.
- `learnHPB-backend/sample-data/` – Example `meta/cases.json` and per-case
  `metadata.json` files that illustrate the expected bucket structure.
- `learnHPB-backend/template.yaml` – AWS SAM template that provisions the Lambda
  function plus API Gateway routes (`GET /cases`, `GET /cases/{id}`).
- `learnHPB-backend/requirements.txt` – Python dependencies for local
  development and SAM packaging.

For setup, configuration, and deployment instructions see
`learnHPB-backend/README.md`.
