"""Response models for the learnHPB backend."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CaseAsset(BaseModel):
    """Represents where a single asset lives inside the S3 bucket."""

    key: str = Field(..., description="S3 key of the asset inside the bucket")
    url: Optional[str] = Field(
        default=None, description="Optional pre-signed URL for immediate download"
    )


class CaseSummary(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    difficulty: Optional[str] = None
    path: str
    thumbnail: Optional[str] = None


class CasesResponse(BaseModel):
    cases: List[CaseSummary]


class CaseDetail(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    studyDate: Optional[str] = None
    notes: Optional[Dict[str, Any]] = None
    assets: Dict[str, CaseAsset]
