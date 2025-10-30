import logging
from logging.config import dictConfig
from typing import Any

from pythonjsonlogger import jsonlogger

from .config import get_settings


class StructuredJsonFormatter(jsonlogger.JsonFormatter):
  def add_fields(self, log_record: dict[str, Any], record: logging.LogRecord, message_dict: dict[str, Any]) -> None:
    super().add_fields(log_record, record, message_dict)
    if "level" not in log_record:
      log_record["level"] = record.levelname
    if "logger" not in log_record:
      log_record["logger"] = record.name


def configure_logging() -> None:
  settings = get_settings()

  if settings.log_json:
    handler_config = {
      "class": "logging.StreamHandler",
      "formatter": "json",
    }
    formatter_config = {
      "json": {
        "()": StructuredJsonFormatter,
        "fmt": "%(asctime)s %(levelname)s %(name)s %(message)s",
      }
    }
  else:
    handler_config = {
      "class": "logging.StreamHandler",
      "formatter": "standard",
    }
    formatter_config = {
      "standard": {
        "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
      }
    }

  dictConfig(
    {
      "version": 1,
      "disable_existing_loggers": False,
      "formatters": formatter_config,
      "handlers": {
        "default": handler_config,
      },
      "root": {
        "handlers": ["default"],
        "level": settings.log_level,
      },
    }
  )
