"""Runtime configuration helpers for the learnHPB backend Lambda."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import os


def _get_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() in {"1", "true", "t", "yes", "y"}


@dataclass(frozen=True)
class Settings:
    """Configuration resolved from environment variables."""

    bucket: str
    cases_meta_key: str = "meta/cases.json"
    case_prefix: str = "liverCases"
    include_signed_urls: bool = False
    signed_url_ttl_seconds: int = 900

    @property
    def normalized_case_prefix(self) -> str:
        prefix = self.case_prefix.strip("/")
        return prefix


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    bucket = os.getenv("CASES_BUCKET", "")
    if not bucket:
        raise RuntimeError("CASES_BUCKET environment variable is required")

    return Settings(
        bucket=bucket,
        cases_meta_key=os.getenv("CASES_META_KEY", "meta/cases.json"),
        case_prefix=os.getenv("CASES_PREFIX", "liverCases"),
        include_signed_urls=_get_bool(os.getenv("CASE_SIGNED_URLS"), False),
        signed_url_ttl_seconds=int(os.getenv("CASE_SIGNED_URL_TTL", "900")),
    )
