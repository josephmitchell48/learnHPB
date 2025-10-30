from functools import lru_cache
from typing import Literal, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
  """Central application configuration derived from environment variables."""

  project_name: str = "LearnHPB Backend"
  api_v1_prefix: str = "/api/v1"
  environment: Literal["local", "staging", "production"] = "local"

  database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/learnhpb"
  alembic_ini_path: str = "alembic.ini"

  aws_region: str = "us-east-1"
  s3_asset_bucket: str = "learnhpb-assets-local"
  s3_document_bucket: str = "learnhpb-documents-local"

  case_asset_base_uri: str = "s3://learnhpb-assets-local"

  feature_flag_lightweight_mode: bool = False

  log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
  log_json: bool = True
  log_retention_days: int = 30

  cors_origins: str = "http://localhost:5173"

  class Config:
    env_file = ".env"
    env_file_encoding = "utf-8"
    case_sensitive = False


@lru_cache
def get_settings() -> Settings:
  return Settings()
