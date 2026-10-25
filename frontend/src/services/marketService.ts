/**
 * Market & Locality Analytics Service
 * Connects to the AST-XGB backend (/api/v1/market) for empirical locality statistics,
 * NHB RESIDEX time-series trends, macroeconomic context, and locality comparisons.
 */

import { apiFetch } from '../utils/api';

export interface CitySummary {
  city: string;
  internal_city: string;
  sample_size: number;
  locality_count: number;
  avg_price_inr: number;
  avg_price_formatted: string;
  median_price_formatted: string;
  avg_ppsf: number;
  median_ppsf: number;
  nhb_hpi: number;
  yoy_growth_pct: number;
  aqi: number;
  regime: string;
}

export interface LocalitySummaryItem {
  locality: string;
  city: string;
  sample_size: number;
  avg_price_inr: number;
  avg_price_formatted: string;
  median_price_formatted: string;
  median_ppsf: number;
  top_property_type: string;
}

export interface PpsfHistogramBin {
  range: string;
  count: number;
  pct: number;
}

export interface PropertyTypeStat {
  type: string;
  count: number;
  pct: number;
  avg_price_inr: number;
  avg_price_formatted: string;
  median_price_formatted: string;
  avg_ppsf: number;
  median_ppsf: number;
}

export interface BhkStat {
  bhk: number;
  label: string;
  count: number;
  pct: number;
  avg_price_formatted: string;
}

export interface InfrastructureStats {
  avg_metro_distance_km: number | null;
  avg_hospitals_distance_km: number | null;
  avg_schools_distance_km: number | null;
  avg_malls_distance_km: number | null;
  accessibility_score: number | null;
}

export interface EnvironmentStats {
  aqi: number;
  pm25: number;
  pm10: number;
  aqi_rating: string;
  aqi_30d_avg: number;
  aqi_90d_avg: number;
  station: string;
}

export interface RegulatoryStats {
  rera_registered_count: number;
  rera_registered_pct: number;
  compliance_status: string;
}

export interface MacroStats {
  nhb_hpi_market: number;
  nhb_carpet_area_rate: number;
  nhb_yoy_growth_pct: number;
  nhb_qoq_growth_pct: number;
  rbi_repo_rate_pct: number;
  rbi_bank_rate_pct: number;
  rbi_crr_pct: number;
  rbi_slr_pct: number;
  mospi_cpi_index: number;
  mospi_cpi_yoy_pct: number;
  active_regime: string;
}

export interface RentalStats {
  avg_monthly_rent_formatted: string;
  median_monthly_rent_formatted: string;
  median_rent_per_sqft: number;
  historical_rental_yield_pct: number;
}

export interface ProvenanceSource {
  name: string;
  coverage: string;
  frequency: string;
  updated: string;
}

export interface LocalityDetail {
  locality: string;
  city: string;
  display_city: string;
  sample_size: number;
  price_stats: {
    mean_inr: number;
    median_inr: number;
    min_inr: number;
    max_inr: number;
    p25_inr: number;
    p75_inr: number;
    mean_formatted: string;
    median_formatted: string;
    min_formatted: string;
    max_formatted: string;
    p25_formatted: string;
    p75_formatted: string;
  };
  ppsf_stats: {
    mean_ppsf: number;
    median_ppsf: number;
    min_ppsf: number;
    max_ppsf: number;
    p25_ppsf: number;
    p75_ppsf: number;
    iqr_ppsf: number;
  };
  ppsf_histogram: PpsfHistogramBin[];
  property_types: PropertyTypeStat[];
  bhk_breakdown: BhkStat[];
  infrastructure: InfrastructureStats;
  environment: EnvironmentStats;
  regulatory: RegulatoryStats;
  macro: MacroStats;
  rental?: RentalStats | null;
  provenance: {
    sources: ProvenanceSource[];
    units: Record<string, string>;
    disclosures: string[];
  };
}

export interface NhbQuarterPoint {
  quarter: string;
  hpi_market: number;
  hpi_assessment: number;
  carpet_area_rate_inr: number;
  qoq_growth_market: number;
  yoy_growth_market: number;
}

export interface RbiRatePoint {
  time_key: string;
  year: number;
  month: number;
  repo_rate: number;
  bank_rate: number;
  crr: number;
  slr: number;
  repo_rate_change: number;
  repo_rate_12m_change: number;
}

export interface MarketTrendsData {
  city: string;
  internal_city: string;
  nhb_series: NhbQuarterPoint[];
  rbi_series: RbiRatePoint[];
  cpi_series: Array<{ year_month: string; cpi_index: number; cpi_yoy_growth: number }>;
  cpcb_series: Array<{ time_key: string; aqi: number; pm25: number; pm10: number }>;
  disclosures: string[];
}

/**
 * Fetch 7-city macroeconomic summaries
 */
export async function fetchMarketCities(): Promise<CitySummary[]> {
  try {
    const res = await apiFetch('/market/cities');
    if (res.ok) {
      const data = await res.json();
      return data.cities || [];
    }
  } catch (err) {
    console.warn('Failed to fetch cities from backend, using default fallback:', err);
  }
  return [];
}

/**
 * Fetch localities list for a specific city
 */
export async function fetchCityLocalities(city: string, minSample = 1): Promise<LocalitySummaryItem[]> {
  try {
    const res = await apiFetch(`/market/localities?city=${encodeURIComponent(city)}&min_sample=${minSample}`);
    if (res.ok) {
      const data = await res.json();
      return data.localities || [];
    }
  } catch (err) {
    console.warn(`Failed to fetch localities for ${city}:`, err);
  }
  return [];
}

/**
 * Fetch detailed empirical statistics for a locality
 */
export async function fetchLocalityDetails(city: string, locality: string): Promise<LocalityDetail | null> {
  try {
    const res = await apiFetch(`/market/locality-details?city=${encodeURIComponent(city)}&locality=${encodeURIComponent(locality)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Failed to fetch locality details for ${locality}, ${city}:`, err);
  }
  return null;
}

/**
 * Fetch historical time-series trends (NHB RESIDEX, RBI, MoSPI, CPCB)
 */
export async function fetchMarketTrends(city: string): Promise<MarketTrendsData | null> {
  try {
    const res = await apiFetch(`/market/trends?city=${encodeURIComponent(city)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Failed to fetch market trends for ${city}:`, err);
  }
  return null;
}

/**
 * Compare multiple localities side by side
 */
export async function fetchLocalityComparison(city: string, localities: string[]): Promise<LocalityDetail[]> {
  if (!localities || localities.length === 0) return [];
  try {
    const query = encodeURIComponent(localities.join(','));
    const res = await apiFetch(`/market/compare?city=${encodeURIComponent(city)}&localities=${query}`);
    if (res.ok) {
      const data = await res.json();
      return data.comparison || [];
    }
  } catch (err) {
    console.warn(`Failed to compare localities for ${city}:`, err);
  }
  return [];
}

/**
 * Fetch backward-compatible market state response
 */
export async function fetchMarketState(): Promise<any> {
  try {
    const res = await apiFetch('/market-state');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch market state:', err);
  }
  return null;
}

