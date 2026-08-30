"""
FastAPI Router: /api/v1/market-state
Exposes metropolitan macro state indicators and active regime distribution.
"""

from fastapi import APIRouter
from backend.app.schemas import MarketStateResponseSchema

router = APIRouter(prefix="/api/v1", tags=["Market Macro State"])

@router.get("/market-state", response_model=MarketStateResponseSchema)
async def get_market_state():
    return MarketStateResponseSchema(
        active_regime="Growth",
        growth_3m_pct=4.85,
        market_volatility=0.062,
        transaction_volume_90d=1420.0,
        price_dispersion=0.284,
        interest_rate=3.75
    )
