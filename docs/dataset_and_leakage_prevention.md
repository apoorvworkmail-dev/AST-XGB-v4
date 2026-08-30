# Dataset & Leakage Prevention Methodology

**Project:** AST-XGB Real Estate Property Price Valuation System  
**Author:** Apoorv Mishra  

---

## 1. Master Feature Matrix v4 (`data/features/final_features_v4.csv`)

*   **Total Observations**: 14,021 unique listing records across 7 Indian metropolitan cities (Bengaluru, Chennai, Delhi, Hyderabad, Kolkata, Mumbai, Pune).
*   **Total Columns**: 66 (1 ID column, 1 target column `price_inr`, 1 target log column `price_inr_log1p`, 63 modeling features).
*   **Duplicate Property IDs**: Exactly 0.

---

## 2. Feature Group Taxonomy (63 Features in 9 Groups)

| Feature Group | Count | Key Exemplar Features |
|---|---|---|
| **`PROPERTY`** | 13 | `builtup_area_sqft`, `bhk`, `bathrooms`, `balconies`, `floor_no`, `total_floors`, `parking`, `property_type`, `city`, `furnishing`, `facing` |
| **`SPATIAL`** | 8 | `schools_distance_km`, `hospitals_distance_km`, `metro_stations_distance_km`, `railway_stations_distance_km`, `malls_distance_km`, `accessibility_score` |
| **`RENTAL`** | 8 | `avg_monthly_rent`, `median_monthly_rent`, `median_rent_per_sqft`, `rental_listing_count`, `historical_rental_yield_pct`, `derived_historical_rental_yield_log1p` |
| **`MARKET`** | 4 | `hist_hpi_market`, `hist_qoq_growth`, `hist_yoy_growth`, `hist_market_regime` |
| **`RBI`** | 7 | `repo_rate`, `bank_rate`, `CRR`, `SLR`, `repo_rate_change`, `repo_rate_3m_change`, `repo_rate_12m_change` |
| **`MOSPI`** | 4 | `hist_cpi_index`, `hist_cpi_yoy_growth`, `hist_cpi_3m_change`, `hist_cpi_12m_change` |
| **`RERA`** | 8 | `rera_registered`, `project_status`, `completion_percent`, `construction_duration_months`, `project_age`, `developer_project_count` |
| **`CPCB`** | 5 | `aqi`, `pm25`, `pm10`, `aqi_30d_avg`, `aqi_90d_avg` |
| **`DERIVED`** | 6 | `derived_area_per_bhk`, `derived_bathrooms_per_bhk`, `derived_carpet_efficiency`, `derived_floor_ratio`, `derived_area_per_bhk_log1p`, `derived_rent_per_sqft_log1p` |

---

## 3. Target Leakage Audit & Repair

### Problem Identified in Earlier Iterations
In earlier iterations (Phase 16.5 audit), three features were identified as containing target leakage:
1. `rental_yield_pct`: Computed directly as `(median_monthly_rent * 12) / target_price_inr * 100`.
2. `derived_rental_yield_log1p`: Derived log transformation of `rental_yield_pct`.
3. `target_locality_median_ppsf`: Included the property's own target price per sqft in locality median aggregation.

### Repair Execution & Validation
*   **Removal**: `rental_yield_pct`, `derived_rental_yield_log1p`, and `target_locality_median_ppsf` were completely dropped from the dataset in Phase 12.
*   **Replacement**:
    *   `historical_locality_median_ppsf`: Computed strictly from past leave-one-out training sales.
    *   `historical_rental_yield_pct`: Computed using historical locality price proxies rather than current target price.
*   **Leakage Verification Result**:
    *   Contaminated features present: **0**
    *   Target inclusion in training inputs: **NO**
    *   Train/Val/Test contamination: **NO**
