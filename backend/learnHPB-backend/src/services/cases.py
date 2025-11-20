"""Case retrieval service that reads metadata from S3."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Dict, Iterable, List

import boto3
from botocore.exceptions import ClientError

from ..config import get_settings
from ..models import CaseAsset, CaseDetail, CaseSummary


class CaseDataNotFound(Exception):
    """Raised when a case or metadata file cannot be located."""


class CaseDataValidationError(Exception):
    """Raised when a metadata file is missing required fields."""


@lru_cache(maxsize=1)
def _get_s3_client():
    return boto3.client("s3")


def _read_json_from_s3(key: str) -> dict:
    settings = get_settings()
    client = _get_s3_client()

    try:
        response = client.get_object(Bucket=settings.bucket, Key=key)
    except ClientError as exc:  # pragma: no cover - requires AWS credentials at runtime
        error_code = exc.response.get("Error", {}).get("Code")
        if error_code in {"NoSuchKey", "404"}:
            raise CaseDataNotFound(f"S3 key {key} not found") from exc
        raise

    body = response["Body"].read()
    return json.loads(body)


def _normalize_case_asset_key(case_id: str, asset_path: str) -> str:
    settings = get_settings()
    cleaned = asset_path.lstrip("/")
    if cleaned.startswith(settings.normalized_case_prefix):
        return cleaned

    return f"{settings.normalized_case_prefix}/{case_id}/{cleaned}".strip("/")


def _maybe_build_url(key: str) -> str | None:
    settings = get_settings()
    if not settings.include_signed_urls:
        return None

    client = _get_s3_client()
    return client.generate_presigned_url(  # pragma: no cover - network side effect
        "get_object",
        Params={"Bucket": settings.bucket, "Key": key},
        ExpiresIn=settings.signed_url_ttl_seconds,
    )


def list_cases() -> List[CaseSummary]:
    """Return case summaries from the meta/cases.json document."""

    settings = get_settings()
    raw_payload = _read_json_from_s3(settings.cases_meta_key)
    raw_cases: Iterable[dict] = raw_payload.get("cases", [])

    summaries: List[CaseSummary] = []
    for entry in raw_cases:
        try:
            summaries.append(CaseSummary.model_validate(entry))
        except Exception as exc:  # pragma: no cover - validation errors
            raise CaseDataValidationError(
                f"Invalid case entry inside {settings.cases_meta_key}: {entry}"
            ) from exc

    return summaries


def get_case(case_id: str) -> CaseDetail:
    """Return all metadata for a particular case."""

    settings = get_settings()
    metadata_key = f"{settings.normalized_case_prefix}/{case_id}/metadata.json"
    metadata = _read_json_from_s3(metadata_key)

    assets_section: Dict[str, str] = metadata.get("assets", {})
    if not assets_section:
        raise CaseDataValidationError(
            f"Case {case_id} metadata is missing an 'assets' section"
        )

    assets: Dict[str, CaseAsset] = {}
    for name, relative_path in assets_section.items():
        asset_key = _normalize_case_asset_key(case_id, relative_path)
        assets[name] = CaseAsset(key=asset_key, url=_maybe_build_url(asset_key))

    metadata_payload = {
        key: metadata.get(key)
        for key in ["id", "title", "summary", "description", "tags", "studyDate", "notes"]
        if key in metadata
    }

    metadata_payload.setdefault("id", case_id)
    metadata_payload["assets"] = assets

    try:
        return CaseDetail.model_validate(metadata_payload)
    except Exception as exc:  # pragma: no cover - validation errors
        raise CaseDataValidationError(
            f"Metadata file {metadata_key} is missing required fields"
        ) from exc
