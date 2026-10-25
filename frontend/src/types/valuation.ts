import { MultiModelResults } from '../components/MultiModelComparisonView';
import { MarketRegime, PropertyType } from './property';

export interface ValuationInput {
  city: string;
  locality?: string;
  propertyType: PropertyType | string;
  builtupAreaSqft: number;
  bhk: number;
  bathrooms: number;
  age?: number;
  floorNo?: number;
  totalFloors?: number;
  parking?: number;
  furnishing?: string;
  facing?: string;
  selectedModels?: string[];
  ensembleMethod?: 'equal_weight' | 'performance_weighted';
}

export interface ConformalInterval {
  lower90Inr: number;
  upper90Inr: number;
  lowerFormatted: string;
  upperFormatted: string;
}

export interface ValuationResult {
  predictedPriceInr: number;
  predictedPriceFormatted: string;
  pricePerSqft: number;
  conformal: ConformalInterval;
  activeMarketRegime: MarketRegime;
  regimeConfidence: number;
  latencyMs: number;
  modelVersion: string;
  validationWarnings: string[];
  multiModelResults?: MultiModelResults;
}

export interface SHAPDriver {
  feature: string;
  shap_value: number;
  feature_value: any;
  abs_shap: number;
}

export interface ExplainResponse {
  top_positive_drivers: SHAPDriver[];
  top_negative_drivers: SHAPDriver[];
}

export interface CounterfactualScenario {
  scenario: string;
  perturbation: string;
  predicted_price_inr: number;
  predicted_price_formatted: string;
  delta_price_inr: number;
  percentage_change: number;
  validity: string;
}

export interface CounterfactualResponse {
  baseline_prediction_inr: number;
  baseline_prediction_formatted: string;
  scenarios: CounterfactualScenario[];
}

export interface CityMarketData {
  city: string;
  locality: string;
  avgPriceInr: number;
  avgPriceFormatted: string;
  pricePerSqft: number;
  nhbHpi: number;
  yoyGrowthPct: number;
  aqi: number;
  regime: MarketRegime;
}

export interface MarketStateResponse {
  active_regime: MarketRegime;
  growth_3m_pct: number;
  market_volatility: number;
  transaction_volume_90d: number;
  price_dispersion: number;
  interest_rate: number;
  city_prices: CityMarketData[];
}
