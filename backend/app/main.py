from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1 import api_router as api_v1_router
from .core.config import get_settings
from .core.logging import configure_logging


def create_application() -> FastAPI:
  configure_logging()
  settings = get_settings()

  app = FastAPI(
    title=settings.project_name,
    version="0.1.0",
    lifespan=None,
  )

  allowed_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
  origin_regex = settings.cors_origin_regex.strip() if settings.cors_origin_regex else None
  app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
  )

  app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

  @app.get("/healthz", tags=["system"])
  def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

  return app


app = create_application()
