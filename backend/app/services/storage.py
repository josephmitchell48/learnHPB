from datetime import timedelta
from typing import Optional

import boto3

from ..core.config import get_settings

settings = get_settings()
_s3_client = boto3.client("s3", region_name=settings.aws_region)


def generate_presigned_url(bucket: str, key: str, expires_in: int = 900) -> str:
  return _s3_client.generate_presigned_url(
    "get_object",
    Params={"Bucket": bucket, "Key": key},
    ExpiresIn=expires_in,
  )


def resolve_document_uri(storage_uri: str, *, expires_in: int = 900) -> str:
  if storage_uri.startswith("s3://"):
    _, bucket_and_key = storage_uri.split("s3://", 1)
    bucket, key = bucket_and_key.split("/", 1)
    return generate_presigned_url(bucket, key, expires_in)
  return storage_uri
