import { apiFetch } from '../utils/api';
import {
  ValuationInput,
  ValuationResult,
  ExplainResponse,
  CounterfactualResponse,
  MarketStateResponse,
} from '../types/valuation';

function buildPayload(input: ValuationInput) {
  return {
    city: input.city,
    locality: input.locality || 'Whitefield',
    property_type: input.propertyType || 'Apartment',
    builtup_area_sqft: input.builtupAreaSqft,
    bhk: input.bhk,
    bathrooms: input.bathrooms,
    project_age: input.age ?? 3,
    floor_no: input.floorNo ?? 3,
    total_floors: input.totalFloors ?? 10,
    parking: input.parking ?? 1,
    furnishing: input.furnishing ?? 'Unfurnished',
    facing: input.facing ?? 'North',
    selected_models: input.selectedModels && input.selectedModels.length > 0 ? input.selectedModels : ['xgboost'],
    ensemble_method: input.ensembleMethod || 'equal_weight',
  };
}

export async function runPrediction(input: ValuationInput): Promise<ValuationResult> {
  const payload = buildPayload(input);

  const res = await apiFetch('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Prediction request failed' }));
    throw new Error(errorData.detail || `Prediction request failed (${res.status})`);
  }

  const data = await res.json();
  return {
    predictedPriceInr: data.predicted_price_inr,
    predictedPriceFormatted: data.predicted_price_formatted,
    pricePerSqft: data.price_per_sqft,
    conformal: {
      lower90Inr: data.conformal_lower_90_inr,
      upper90Inr: data.conformal_upper_90_inr,
      lowerFormatted: data.conformal_lower_90_formatted,
      upperFormatted: data.conformal_upper_90_formatted,
    },
    activeMarketRegime: data.active_market_regime,
    regimeConfidence: data.regime_confidence,
    latencyMs: data.latency_ms,
    modelVersion: data.model_version,
    validationWarnings: data.validation_warnings || [],
    multiModelResults: data.multi_model_results,
  };
}

export async function runExplain(input: ValuationInput): Promise<ExplainResponse> {
  const payload = buildPayload(input);

  const res = await apiFetch('/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Explain request failed' }));
    throw new Error(errorData.detail || `Explainability request failed (${res.status})`);
  }

  return await res.json();
}

export async function runCounterfactual(input: ValuationInput): Promise<CounterfactualResponse> {
  const payload = buildPayload(input);

  const res = await apiFetch('/counterfactual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Counterfactual simulation failed' }));
    throw new Error(errorData.detail || `Counterfactual request failed (${res.status})`);
  }

  return await res.json();
}

export async function getMarketState(): Promise<MarketStateResponse> {
  const res = await apiFetch('/market-state');
  if (!res.ok) {
    throw new Error(`Failed to fetch market state (${res.status})`);
  }
  return await res.json();
}

export async function getBackendHealth(): Promise<{
  status: string;
  model_loaded: boolean;
  model_version: string;
  feature_version: string;
  conformal_q90_inr: number;
}> {
  const res = await apiFetch('/health');
  if (!res.ok) {
    throw new Error(`Backend health check failed (${res.status})`);
  }
  return await res.json();
}
