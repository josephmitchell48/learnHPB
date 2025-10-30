from fastapi import APIRouter

from .routes import annotations, cases

api_router = APIRouter()
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(annotations.router, prefix="/cases", tags=["annotations"])
