"""
Pydantic Request & Response Schemas for FastAPI Valuation Backend.
Supports Single-Model and Multi-Model Ensemble Inferences.
AST-XGB Real Estate Property Price Valuation System
Author: Apoorv Mishra
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional

VALID_CITIES = ['Bengaluru', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai', 'Pune']
VALID_PROPERTY_TYPES = ['Apartment', 'Independent House', 'Penthouse', 'Villa', 'Builder Floor']

class PropertyInputSchema(BaseModel):
    builtup_area_sqft: Optional[float] = Field(None, example=1450.0, description="Property built-up area in sqft (100 to 50000)")
    area: Optional[float] = Field(None, example=1450.0, description="Alternative field for built-up area in sqft")
    
    bhk: Optional[int] = Field(None, example=3, description="Number of bedrooms / BHK (1 to 20)")
    bedrooms: Optional[int] = Field(None, example=3, description="Alternative field for bedrooms / BHK")
    
    bathrooms: Optional[int] = Field(2, example=2, description="Number of bathrooms")
    property_type: str = Field("Apartment", example="Apartment", description="Property classification")
    city: str = Field("Bengaluru", example="Bengaluru", description="Indian city")
    
    project_age: Optional[float] = Field(None, example=3.0, description="Property age in years")
    age: Optional[float] = Field(None, example=3.0, description="Alternative field for property age")
    
    floor_no: Optional[int] = Field(3, example=3, description="Floor number")
    total_floors: Optional[int] = Field(10, example=10, description="Total building floors")
    parking: Optional[int] = Field(1, example=1, description="Reserved parking spaces")
    furnishing: Optional[str] = Field("Unfurnished", example="Unfurnished", description="Furnishing status")
    facing: Optional[str] = Field("North", example="North", description="Main entrance facing direction")
    locality: Optional[str] = Field("Whitefield", example="Whitefield", description="Neighborhood / locality name")
    latitude: Optional[float] = Field(12.9716, example=12.9716, description="Property latitude")
    longitude: Optional[float] = Field(77.5946, example=77.5946, description="Property longitude")

    # Multi-model platform extensions
    selected_models: Optional[List[str]] = Field(
        default=["xgboost"],
        example=["linear_regression", "xgboost", "lightgbm"],
        description="List of selected ML models for inference"
    )
    ensemble_method: Optional[str] = Field(
        default="equal_weight",
        example="equal_weight",
        description="Ensemble method: 'equal_weight' or 'performance_weighted'"
    )

    @validator('builtup_area_sqft', pre=True, always=True)
    def validate_area(cls, v, values):
        val = v if v is not None else values.get('area')
        if val is None:
            return 1200.0
        try:
            val_f = float(val)
            if val_f < 100 or val_f > 50000:
                raise ValueError("Built-up area must be between 100 and 50,000 sqft.")
            return val_f
        except (ValueError, TypeError):
            raise ValueError("Built-up area must be a valid positive number.")

    @validator('bhk', pre=True, always=True)
    def validate_bhk(cls, v, values):
        val = v if v is not None else values.get('bedrooms')
        if val is None:
            return 2
        try:
            val_i = int(val)
            if val_i < 1 or val_i > 20:
                raise ValueError("BHK must be between 1 and 20.")
            return val_i
        except (ValueError, TypeError):
            raise ValueError("BHK must be a valid integer.")

    @validator('city')
    def validate_city(cls, v):
        if v not in VALID_CITIES:
            raise ValueError(f"Invalid city '{v}'. Must be one of: {', '.join(VALID_CITIES)}")
        return v

    @validator('property_type')
    def validate_property_type(cls, v):
        if v not in VALID_PROPERTY_TYPES:
            raise ValueError(f"Invalid property type '{v}'. Must be one of: {', '.join(VALID_PROPERTY_TYPES)}")
        return v

    class Config:
        schema_extra = {
            "example": {
                "builtup_area_sqft": 1450.0,
                "bhk": 3,
                "bathrooms": 2,
                "city": "Bengaluru",
                "property_type": "Apartment",
                "locality": "Whitefield",
                "selected_models": ["linear_regression", "xgboost", "lightgbm"],
                "ensemble_method": "equal_weight"
            }
        }


class PredictionResponseSchema(BaseModel):
    predicted_price_inr: float = Field(..., description="Point price prediction or Ensemble estimate in INR")
    predicted_price_formatted: str = Field(..., description="User-friendly formatted price in Lakhs/Crores")
    price_per_sqft: float = Field(..., description="Valuation per sqft in INR")
    conformal_lower_90_inr: float = Field(..., description="90% Conformal prediction interval lower bound in INR")
    conformal_upper_90_inr: float = Field(..., description="90% Conformal prediction interval upper bound in INR")
    conformal_lower_90_formatted: str = Field(..., description="Formatted 90% lower bound")
    conformal_upper_90_formatted: str = Field(..., description="Formatted 90% upper bound")
    active_market_regime: str = Field("Stable", description="Detected market regime")
    regime_confidence: float = Field(0.942, description="Regime posterior probability")
    latency_ms: float = Field(..., description="Inference execution latency in milliseconds")
    model_version: str = Field(..., description="Validated ML model version string")
    feature_version: str = Field("v4", description="Feature engineering version")
    validation_warnings: List[str] = Field(default=[], description="Input validation warnings if any")
    multi_model_results: Optional[Dict[str, Any]] = Field(None, description="Multi-model predictions, spread, and comparison matrix")


class SHAPDriverSchema(BaseModel):
    feature: str
    shap_value: float
    feature_value: Any
    abs_shap: float


class ExplainResponseSchema(BaseModel):
    top_positive_drivers: List[SHAPDriverSchema]
    top_negative_drivers: List[SHAPDriverSchema]


class CounterfactualScenarioSchema(BaseModel):
    scenario: str
    perturbation: str
    predicted_price_inr: float
    predicted_price_formatted: str
    delta_price_inr: float
    percentage_change: float
    validity: str


class CounterfactualResponseSchema(BaseModel):
    baseline_prediction_inr: float
    baseline_prediction_formatted: str
    scenarios: List[CounterfactualScenarioSchema]


class MarketStateResponseSchema(BaseModel):
    active_regime: str
    growth_3m_pct: float
    market_volatility: float
    transaction_volume_90d: float
    price_dispersion: float
    interest_rate: float
    city_prices: Optional[List[Dict[str, Any]]] = Field(None, description="Actual predicted prices and rates per city")


class HealthCheckResponseSchema(BaseModel):
    status: str
    backend_version: str
    model_loaded: bool
