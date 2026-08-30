"""
Phase 26 — Production Environment Configuration Module
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra
"""

import os
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    ENV: str = os.getenv("ENV", "production")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Model Artifacts Directory
    MODEL_DIR: Path = Path(os.getenv("MODEL_DIR", BASE_DIR / "models" / "xgboost_final_v4"))
    
    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")

settings = Settings()
