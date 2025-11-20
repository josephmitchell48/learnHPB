# learnHPB backend

Serverless backend that exposes liver case metadata stored in S3 through a simple
FastAPI service that runs on AWS Lambda + API Gateway. The single Lambda function
fulfills `GET /cases` and `GET /cases/{id}`.

## Data contract

```
<bucket-root>
├── meta
│   └── cases.json
└── liverCases/
    └── case_demo1/
        ├── volume.vti.gz
        ├── vessels.vtp
        ├── metadata.json
        └── thumbnail.jpg
```

* `meta/cases.json` lists every available case and powers the `GET /cases` endpoint.
* `liverCases/<case-id>/metadata.json` stores the shape/asset manifest for each
  case and powers the `GET /cases/{id}` endpoint.
* Asset paths inside `metadata.json` can be either fully-qualified keys
  (`liverCases/case_demo1/volume.vti.gz`) or file names relative to the case
  directory.

### Example `meta/cases.json`

```json
{
  "cases": [
    {
      "id": "case_demo1",
      "title": "Left Hepatectomy Planning",
      "summary": "Large cholangiocarcinoma encroaching on the left hepatic duct.",
      "tags": ["liver", "demo"],
      "difficulty": "intermediate",
      "path": "liverCases/case_demo1",
      "thumbnail": "liverCases/case_demo1/thumbnail.jpg"
    }
  ]
}
```

### Example `metadata.json`

```json
{
  "id": "case_demo1",
  "title": "Left Hepatectomy Planning",
  "summary": "Large cholangiocarcinoma encroaching on the left hepatic duct.",
  "description": "Demo case that showcases inflow and remnant planning.",
  "studyDate": "2023-08-11",
  "tags": ["liver", "cholangiocarcinoma"],
  "assets": {
    "volume": "volume.vti.gz",
    "vessels": "vessels.vtp",
    "metadata": "metadata.json"
  },
  "notes": {
    "arterial": "Trifurcation with replaced RHA.",
    "venous": "Short hepatic veins drained separately.",
    "remnantVolumeMl": 430
  }
}
```

## Configuration

| Environment variable       | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `CASES_BUCKET`             | **Required.** Bucket that stores `meta/` and `liverCases/`. |
| `CASES_PREFIX`             | Folder that contains per-case directories (default `liverCases`). |
| `CASES_META_KEY`           | Key for `cases.json` (default `meta/cases.json`).           |
| `CASE_SIGNED_URLS`         | `true` to include presigned URLs in responses (default `false`). |
| `CASE_SIGNED_URL_TTL`      | Lifetime in seconds for generated URLs (default `900`).     |

## Local development

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export CASES_BUCKET=<your S3 bucket>
uvicorn src.app:app --reload
```

The service reads directly from S3, so set `AWS_PROFILE` or `AWS_ACCESS_KEY_ID`
according to your preferred credentials chain.

## Deployment (AWS SAM)

```bash
sam build --template template.yaml
sam deploy \
  --stack-name learnHPB-backend \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
      CasesBucketName=<your-bucket> \
      CasePrefix=liverCases \
      CasesMetaKey=meta/cases.json
```

After deployment the stack outputs `ApiUrl`, which Amplify or the frontend can
store in an environment variable such as `VITE_CASES_API_URL`.

The Lambda is provisioned with permissions to read-only from the supplied S3
bucket. Turn on presigned URLs by setting the `IncludeSignedUrls` parameter to
`true` if the frontend needs time-limited download links.
