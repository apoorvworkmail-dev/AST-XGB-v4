# Phase 16 — Final XGBoost SHAP Explainability Report (v4 Dataset)
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 23:03:07

---

## Final Verification Ledger

```text
PHASE 16 STATUS:              PASS
SHAP LEAKAGE CHECK:           PASS (0.00% contaminated features)
SHAP RECONSTRUCTION CHECK:    PASS (Max error: 3.4332e-05)
MODEL VERSION:                Phase 15 v4 (final_xgboost_model.pkl)
FEATURE VERSION:              final_features_v4.csv (66 features)
TOP SHAP FEATURE:             builtup_area_sqft
TOP FEATURE GROUP:            PROPERTY (67.8%)
```

---

## 1. Executive Summary & Methodological Disclaimer

This report details the model explainability analysis performed on the final leakage-free XGBoost valuation model using **SHAP (SHapley Additive exPlanations)** TreeExplainer:
> [!IMPORTANT]
> **Scientific Disclaimer:** SHAP values represent model contribution/association and do NOT establish causality. Relationships describe how feature variations influence model output predictions (`np.log1p(price_inr)`).

---

## 2. Top 20 Global Feature Importance Table

| Rank | Feature | Feature Group | Mean \|SHAP\| | Model Association Direction |
|---|---|---|---|---|
| 1 | **`builtup_area_sqft`** | PROPERTY | 0.3537 | Positive Association |
| 2 | **`bhk`** | PROPERTY | 0.1545 | Positive Association |
| 3 | **`historical_locality_median_ppsf`** | PROPERTY | 0.1450 | Positive Association |
| 4 | **`median_rent_per_sqft`** | RENTAL | 0.0701 | Inverse/Negative Association |
| 5 | **`bathrooms`** | PROPERTY | 0.0492 | Positive Association |
| 6 | **`hist_yoy_growth`** | MARKET | 0.0429 | Inverse/Negative Association |
| 7 | **`derived_area_per_bhk`** | PROPERTY | 0.0362 | Positive Association |
| 8 | **`rental_listing_count`** | RENTAL | 0.0302 | Positive Association |
| 9 | **`derived_bathrooms_per_bhk`** | PROPERTY | 0.0240 | Positive Association |
| 10 | **`total_floors`** | PROPERTY | 0.0230 | Positive Association |
| 11 | **`historical_rental_yield_pct`** | RENTAL | 0.0229 | Positive Association |
| 12 | **`median_monthly_rent`** | RENTAL | 0.0222 | Inverse/Negative Association |
| 13 | **`longitude`** | SPATIAL | 0.0220 | Inverse/Negative Association |
| 14 | **`derived_floor_ratio`** | PROPERTY | 0.0186 | Positive Association |
| 15 | **`railway_stations_distance_km`** | SPATIAL | 0.0178 | Inverse/Negative Association |
| 16 | **`property_type_Apartment`** | PROPERTY | 0.0172 | Positive Association |
| 17 | **`derived_rent_per_sqft_log1p`** | RENTAL | 0.0164 | Inverse/Negative Association |
| 18 | **`floor_no`** | PROPERTY | 0.0160 | Positive Association |
| 19 | **`property_type_Independent House`** | PROPERTY | 0.0158 | Positive Association |
| 20 | **`malls_distance_km`** | SPATIAL | 0.0150 | Inverse/Negative Association |

---

## 3. Feature Group SHAP Importance

Aggregated contribution of feature categories to total model variance:

| Rank | Feature Group | Total Mean \|SHAP\| | Percentage Contribution (%) |
|---|---|---|---|
| 1 | **PROPERTY** | 0.8899 | **67.82%** |
| 2 | **RENTAL** | 0.1720 | **13.10%** |
| 3 | **SPATIAL** | 0.1349 | **10.28%** |
| 4 | **MARKET** | 0.0665 | **5.07%** |
| 5 | **CPCB** | 0.0183 | **1.39%** |
| 6 | **RERA** | 0.0138 | **1.05%** |
| 7 | **MOSPI** | 0.0088 | **0.67%** |
| 8 | **RBI** | 0.0080 | **0.61%** |

---

## 4. Leakage & Reconstruction Audits

1.  **No-Leakage Check:** Verified that `rental_yield_pct`, `derived_rental_yield_log1p`, and `target_locality_median_ppsf` are **0% present** in SHAP matrices.
2.  **Corrected Features Validation:** Confirmed that `historical_locality_median_ppsf` and `historical_rental_yield_pct` are derived using leave-one-out historical benchmarks.
3.  **Exact Reconstruction:** Verified $\sum \text{SHAP} + \text{base\_value} = \hat{y}_{\text{log}}$ with maximum error $3.4332e-05 < 10^{-4}$.

---

## 5. Artifacts & Outputs

| File | Description | Status |
|---|---|---|
| [`results/phase_16_final_shap_importance.csv`](../results/phase_16_final_shap_importance.csv) | Full SHAP importance matrix | ✅ Saved |
| [`results/phase_16_top_features.csv`](../results/phase_16_top_features.csv) | Top 20 features list & interpretations | ✅ Saved |
| [`results/phase_16_shap_feature_groups.csv`](../results/phase_16_shap_feature_groups.csv) | Feature group SHAP breakdown | ✅ Saved |
| [`results/phase_16_individual_explanations.csv`](../results/phase_16_individual_explanations.csv) | 10 representative listing explanations | ✅ Saved |
| [`results/phase_16_city_shap.csv`](../results/phase_16_city_shap.csv) | City-wise top SHAP drivers | ✅ Saved |
| [`results/phase_16_shap_stability.csv`](../results/phase_16_shap_stability.csv) | Val vs Test rank correlation | ✅ Saved |
| [`reports/phase_16_final_shap_report.md`](phase_16_final_shap_report.md) | This report | ✅ Saved |

---

## 6. Phase 16 Final Decision

### PHASE 16 STATUS: **`PASS`** ✅

SHAP explainability audit complete on v4 dataset and model. All diagnostic charts and reports exported.
