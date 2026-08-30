"""
Phase 22 — Main FastAPI Application Entrypoint for AST-XGB Valuation Backend Server.
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra
"""

import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.routers import predict, explain, counterfactual, market
from src.models.inference import pipeline_instance

app = FastAPI(
    title="AST-XGB Real Estate Property Valuation System API",
    description="Production-grade Spatial AI, Conformal Prediction Intervals, SHAP Explainability, and Counterfactual Simulator API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Router Endpoints
app.include_router(predict.router)
app.include_router(explain.router)
app.include_router(counterfactual.router)
app.include_router(market.router)


@app.get("/")
async def root():
    return {
        "system": "AST-XGB Property Valuation Engine",
        "status": "ONLINE",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    """Production health check endpoint verifying model artifact loading."""
    return {
        "status": "HEALTHY",
        "model_loaded": pipeline_instance._is_loaded,
        "model_version": pipeline_instance.metadata.get('model_version', 'Phase 15 XGBoost v4'),
        "feature_version": "v4",
        "conformal_q90_inr": round(pipeline_instance.q_90_inr, 2)
    }


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Please verify request input parameters."}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)
