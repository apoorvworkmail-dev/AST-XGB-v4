"""
Phase 22 — FastAPI Router: /api/v1/counterfactual
Exposes constrained what-if sensitivity scenario simulations using src/models/inference.py.
"""

from fastapi import APIRouter, HTTPException
from backend.app.schemas import PropertyInputSchema, CounterfactualResponseSchema, CounterfactualScenarioSchema
from src.models.inference import pipeline_instance

router = APIRouter(prefix="/api/v1", tags=["Counterfactual Simulation"])

@router.post("/counterfactual", response_model=CounterfactualResponseSchema)
async def simulate_counterfactuals(prop: PropertyInputSchema):
    try:
        base_dict = {
            'builtup_area_sqft': prop.builtup_area_sqft or 1200.0,
            'bhk': prop.bhk or 2,
            'bathrooms': prop.bathrooms or 2,
            'city': prop.city,
            'property_type': prop.property_type,
            'locality': prop.locality
        }
        
        base_res = pipeline_instance.predict_single_property(base_dict)
        base_val = base_res['predicted_price_inr']

        # Scenario A: +10% Area
        p_a = base_dict.copy()
        p_a['builtup_area_sqft'] = base_dict['builtup_area_sqft'] * 1.10
        res_a = pipeline_instance.predict_single_property(p_a)
        val_a = res_a['predicted_price_inr']

        # Scenario B: +1 BHK
        p_b = base_dict.copy()
        p_b['bhk'] = base_dict['bhk'] + 1
        res_b = pipeline_instance.predict_single_property(p_b)
        val_b = res_b['predicted_price_inr']

        # Scenario C: +1 Bathroom
        p_c = base_dict.copy()
        p_c['bathrooms'] = base_dict['bathrooms'] + 1
        res_c = pipeline_instance.predict_single_property(p_c)
        val_c = res_c['predicted_price_inr']

        scenarios = [
            CounterfactualScenarioSchema(
                scenario="Expand Built-up Area (+10%)",
                perturbation="+10% Area",
                predicted_price_inr=val_a,
                predicted_price_formatted=res_a['predicted_price_formatted'],
                delta_price_inr=round(val_a - base_val, 2),
                percentage_change=round(((val_a - base_val) / base_val) * 100.0, 2),
                validity="VALID"
            ),
            CounterfactualScenarioSchema(
                scenario="Add 1 BHK Bedroom",
                perturbation="+1 BHK",
                predicted_price_inr=val_b,
                predicted_price_formatted=res_b['predicted_price_formatted'],
                delta_price_inr=round(val_b - base_val, 2),
                percentage_change=round(((val_b - base_val) / base_val) * 100.0, 2),
                validity="VALID"
            ),
            CounterfactualScenarioSchema(
                scenario="Add 1 Bathroom",
                perturbation="+1 Bathroom",
                predicted_price_inr=val_c,
                predicted_price_formatted=res_c['predicted_price_formatted'],
                delta_price_inr=round(val_c - base_val, 2),
                percentage_change=round(((val_c - base_val) / base_val) * 100.0, 2),
                validity="VALID"
            )
        ]

        return CounterfactualResponseSchema(
            baseline_prediction_inr=base_val,
            baseline_prediction_formatted=base_res['predicted_price_formatted'],
            scenarios=scenarios
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Counterfactual Error: {str(e)}")
