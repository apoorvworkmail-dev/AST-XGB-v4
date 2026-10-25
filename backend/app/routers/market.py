"""
FastAPI Router: /api/v1/market
Exposes empirical metropolitan macro state indicators, historical NHB RESIDEX trends,
locality-level price distributions, macroeconomic context, and locality-to-locality comparison.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.schemas import MarketStateResponseSchema
from backend.app.services.market_service import market_service

router = APIRouter(prefix="/api/v1", tags=["Market & Locality Analytics"])

CITY_MARKET_DATA = [
    {
        "city": "Bengaluru",
        "locality": "Whitefield",
        "avg_price_inr": 10400000.0,
        "avg_price_formatted": "₹ 1.04 Cr",
        "price_per_sqft": 7172.41,
        "nhb_hpi": 154.2,
        "yoy_growth_pct": 5.8,
        "aqi": 92,
        "regime": "Growth"
    },
    {
        "city": "Mumbai",
        "locality": "Andheri East",
        "avg_price_inr": 21500000.0,
        "avg_price_formatted": "₹ 2.15 Cr",
        "price_per_sqft": 14827.58,
        "nhb_hpi": 162.0,
        "yoy_growth_pct": 6.1,
        "aqi": 135,
        "regime": "Growth"
    },
    {
        "city": "Delhi NCR",
        "locality": "Dwarka",
        "avg_price_inr": 14800000.0,
        "avg_price_formatted": "₹ 1.48 Cr",
        "price_per_sqft": 10206.89,
        "nhb_hpi": 148.9,
        "yoy_growth_pct": 4.2,
        "aqi": 198,
        "regime": "Stable"
    },
    {
        "city": "Hyderabad",
        "locality": "Gachibowli",
        "avg_price_inr": 9800000.0,
        "avg_price_formatted": "₹ 98.00 Lakhs",
        "price_per_sqft": 6758.62,
        "nhb_hpi": 168.4,
        "yoy_growth_pct": 7.4,
        "aqi": 88,
        "regime": "Growth"
    },
    {
        "city": "Pune",
        "locality": "Wakad",
        "avg_price_inr": 8200000.0,
        "avg_price_formatted": "₹ 82.00 Lakhs",
        "price_per_sqft": 5655.17,
        "nhb_hpi": 144.7,
        "yoy_growth_pct": 4.5,
        "aqi": 110,
        "regime": "Stable"
    },
    {
        "city": "Chennai",
        "locality": "Velachery",
        "avg_price_inr": 7800000.0,
        "avg_price_formatted": "₹ 78.00 Lakhs",
        "price_per_sqft": 5379.31,
        "nhb_hpi": 136.5,
        "yoy_growth_pct": 3.9,
        "aqi": 104,
        "regime": "Stable"
    },
    {
        "city": "Kolkata",
        "locality": "New Town",
        "avg_price_inr": 6200000.0,
        "avg_price_formatted": "₹ 62.00 Lakhs",
        "price_per_sqft": 4275.86,
        "nhb_hpi": 128.1,
        "yoy_growth_pct": 2.1,
        "aqi": 142,
        "regime": "Stable"
    }
]


@router.get("/market-state", response_model=MarketStateResponseSchema)
async def get_market_state():
    """Returns backward-compatible macro state schema."""
    return MarketStateResponseSchema(
        active_regime="Growth",
        growth_3m_pct=4.85,
        market_volatility=0.062,
        transaction_volume_90d=1420.0,
        price_dispersion=0.284,
        interest_rate=3.75,
        city_prices=CITY_MARKET_DATA
    )


@router.get("/market/cities")
async def get_market_cities():
    """Returns real summary metrics for 7 Indian metropolitan cities."""
    cities = market_service.get_cities_summary()
    return {"cities": cities}


@router.get("/market/localities")
async def get_market_localities(
    city: str = Query("Bengaluru", description="Target city name"),
    min_sample: int = Query(1, description="Minimum listings threshold")
):
    """Returns empirical localities with listing count and median PPSF for a city."""
    localities = market_service.get_localities_for_city(city, min_sample=min_sample)
    return {
        "city": city,
        "count": len(localities),
        "localities": localities
    }


@router.get("/market/locality-details")
async def get_locality_details(
    city: str = Query("Bengaluru", description="City name"),
    locality: str = Query("Whitefield", description="Locality name")
):
    """Returns full empirical locality statistics, distributions, infrastructure, and macro context."""
    details = market_service.get_locality_details(city, locality)
    if not details:
        raise HTTPException(
            status_code=404,
            detail=f"No listing records found for locality '{locality}' in city '{city}'."
        )
    return details


@router.get("/market/trends")
async def get_market_trends(
    city: str = Query("Bengaluru", description="City name")
):
    """Returns historical quarterly NHB RESIDEX trends and monthly RBI/MoSPI/CPCB time series."""
    trends = market_service.get_market_trends(city)
    return trends


@router.get("/market/compare")
async def compare_localities(
    city: str = Query("Bengaluru", description="City name"),
    localities: str = Query(..., description="Comma-separated list of locality names")
):
    """Returns side-by-side comparison matrix for up to 4 localities."""
    loc_list = [l.strip() for l in localities.split(",") if l.strip()]
    if not loc_list:
        raise HTTPException(status_code=400, detail="Please provide at least one locality name to compare.")

    results = market_service.compare_localities(city, loc_list[:4])
    return {
        "city": city,
        "count": len(results),
        "comparison": results
    }
