"""FastAPI application that powers the learnHPB Lambda."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from mangum import Mangum
from aws_lambda_powertools import Logger, Tracer

from models import CaseDetail, CasesResponse
from services.cases import (
    CaseDataNotFound,
    CaseDataValidationError,
    get_case,
    list_cases,
)

logger = Logger(service="learnHPB-backend")
tracer = Tracer(service="learnHPB-backend")

app = FastAPI(title="learnHPB Backend", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/cases", response_model=CasesResponse)
@tracer.capture_method
def read_cases() -> CasesResponse:
    try:
        cases = list_cases()
    except CaseDataNotFound as exc:
        logger.error("cases index missing", error=str(exc))
        raise HTTPException(status_code=404, detail="Case index not found") from exc
    except CaseDataValidationError as exc:
        logger.exception("invalid case index")
        raise HTTPException(status_code=500, detail="Invalid case index") from exc

    return CasesResponse(cases=cases)


@app.get("/cases/{case_id}", response_model=CaseDetail)
@tracer.capture_method
def read_case(case_id: str) -> CaseDetail:
    try:
        return get_case(case_id)
    except CaseDataNotFound as exc:
        logger.warning("case metadata missing", case_id=case_id)
        raise HTTPException(status_code=404, detail="Case not found") from exc
    except CaseDataValidationError as exc:
        logger.exception("invalid case metadata", case_id=case_id)
        raise HTTPException(status_code=500, detail="Invalid case metadata") from exc


handler = Mangum(app, api_gateway_base_path=None)
