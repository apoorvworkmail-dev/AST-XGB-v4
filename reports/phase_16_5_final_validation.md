# Phase 16.5 — Final Model Validation & Research Readiness Audit
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 22:06:00

---

## Final Decision

========================================
NOT READY FOR PHASE 17
========================================

> [!CAUTION]
> **AUDIT STATUS: FAIL**  
> The project exhibits a critical target leakage in the rental features (`rental_yield_pct` and its derived log transform `derived_rental_yield_log1p`), and a high-severity in-fold target leakage in `target_locality_median_ppsf`. The project is **NOT READY** to proceed to paper figures or publication until these are resolved.

---

## 1. Required Repairs & Action Items

| Issue | Priority | Phase to Revisit | Exact Problem | Why It Matters | Exact Correction Required |
|---|---|---|---|---|---|
| **Rental Yield Target Leakage** | 🔴 CRITICAL | Phase 5 / 12 | `rental_yield_pct` uses the property's own target `price_inr` directly in the denominator. | The target variable leaks directly into the inputs, inflating evaluation performance. | Remove `rental_yield_pct` and `derived_rental_yield_log1p` from inputs, or rebuild using training-fold locality median price as the denominator. |
| **Locality Median In-Fold Leakage** | 🟡 HIGH | Phase 13 | `target_locality_median_ppsf` includes the current property's own price in the training fold median. | Causes in-fold target leakage and overfitting to training listings. | Modify the training median calculation to exclude the index property (leave-one-out median). |
| **Model Stale State** | 🟡 HIGH | Phase 14 / 15 / 16 | Models were trained on leakage-contaminated inputs. | Baseline, tuned models, and SHAP analyses must be rerun to obtain scientifically valid metrics. | Rerun baseline and Optuna scripts after rebuilding leakage-free features. |

---

## 2. PART 1 — Dataset Integrity Audit

- **Property Master Rows:** 14,021  
- **Property Master Columns:** 101  
- **Feature Matrix Rows:** 14,021  
- **Feature Matrix Columns:** 65  
- **Duplicate rows:** 0  
- **Duplicate property_master_id:** 0  
- **Target Price Status:** Valid (`price_inr` exists as numeric).  
- **Missing values:** Documented. RERA missing values (9,000) and rental missing values (3,435) represent expected legimate unmatched listings.

**Classification: PASS** ✅

---

## 3. PART 2 — Feature Inventory & Lineage

Features are structured into 9 domain-focused groups:
- **PROPERTY:** `city`, `property_type`, `bhk`, `bathrooms`, `balconies`, `builtup_area_sqft`, `floor_no`, `total_floors`, `parking`, `furnishing`, `facing`.
- **SPATIAL:** `latitude`, `longitude`, `schools_distance_km`, `hospitals_distance_km`, POI distances, and `accessibility_score`.
- **RENTAL:** `avg_monthly_rent`, `median_monthly_rent`, `median_rent_per_sqft`, `rental_listing_count`, and `rental_yield_pct` (LEAKAGE).
- **MARKET:** `hist_hpi_market`, `hist_qoq_growth`, `hist_yoy_growth`, `hist_market_regime`.
- **RBI:** `repo_rate`, `bank_rate`, `CRR`, `SLR`, momentum differentials (lagged at t-1).
- **MOSPI:** `hist_cpi_index`, `hist_cpi_yoy_growth` (lagged at t-1).
- **RERA:** `rera_registered`, `project_status`, `completion_percent`, `developer_project_count`, `developer_completion_rate`.
- **CPCB:** `aqi`, `pm25`, `pm10` (lagged at t-1).
- **DERIVED:** `derived_area_per_bhk`, `derived_bathrooms_per_bhk`, `derived_carpet_efficiency`, `derived_floor_ratio`.

---

## 4. PART 3 — Critical Target Leakage Audit

Detailed trace of the three investigated features:

### A. `rental_yield_pct`
- **Formula:** `(annual_rent_estimate_inr / price_inr) * 100`
- **Source Columns:** `annual_rent_estimate_inr`, `price_inr` (Target)
- **Uses target price directly:** **Yes.**
- **Uses property's own price:** **Yes.**
- **Uses val/test set target prices:** **Yes.**
- **Legitimate for modeling:** **No.**
- **Classification:** **`LEAKAGE`** 🚨

### B. `derived_rental_yield_log1p`
- **Formula:** `log1p(rental_yield_pct)`
- **Uses target price directly:** **Yes** (inherited).
- **Uses property's own price:** **Yes.**
- **Uses val/test set target prices:** **Yes.**
- **Legitimate for modeling:** **No.**
- **Classification:** **`LEAKAGE`** 🚨

### C. `target_locality_median_ppsf`
- **Formula:** `Median of price_per_sqft of properties in locality`
- **Uses target price directly:** **No** (locality aggregation).
- **Uses property's own price:** **Yes** (in training set calculations, causing in-fold leakage).
- **Uses val/test set target prices:** No (computed strictly on training fold).
- **Legitimate for modeling:** **Yes, but needs repair** (via leave-one-out medians).
- **Classification:** **`NEEDS REPAIR`** 🛠️

---

## 5. PART 5 & 6 & 7 — Splits & Preprocessing Validation

- **Overlap Audit:** Verified. Train $\cap$ Val = 0, Train $\cap$ Test = 0, Val $\cap$ Test = 0.
- **Chronological ordering:** Confirmed. Temporal split respects strict date boundaries:
  `Train Max (2021-08-15) <= Val Min (2021-08-15) <= Test Min (2022-05-15)`
- **Preprocessing Leakage:** **PASS.** Scalers, imputers, and encoders are fit strictly on training partitions of each split.
- **CPCB / RBI Joins:** Correctly aligned historically on $t-1$ lag, preventing future outcome leakage.

---

## 6. PART 12 & 13 — Model Performance Audit

Tuned hyperparameters of the final XGBRegressor model:
- `n_estimators`: 264
- `max_depth`: 6
- `learning_rate`: 0.0527
- `subsample`: 0.803
- `colsample_bytree`: 0.842

### Metrics summary (Temporal test set):

| Model | MAE (INR) | RMSE (INR) | $R^2$ | MAPE |
|---|---|---|---|---|
| **Median Baseline** | ₹7,477,751.90 | ₹19,634,120.67 | -0.0587 | 89.53% |
| **Optimized XGBoost** | ₹1,542,776.88 | ₹6,432,862.22 | 0.8863 | 13.85% |

---

## 7. PART 19 & 20 — Research Claims & Reproducibility

- **Python Version:** 3.11  
- **XGBoost Version:** 2.0.3  
- **Seeds & Preprocessors:** Saved in joblib objects.
- **Research claim validation:**
  - Multi-source features integration: **SUPPORTED**
  - Temporal generalization: **SUPPORTED**
  - Leakage-safe price prediction: **NOT SUPPORTED** (due to rental yield leakage).

---

## 8. PART 21 — Readiness Score Matrix

| Category | Weight | Score | Weighted Score | Status |
|---|---|---|---|---|
| Data integrity | 15% | 100 | 15.0% | PASS |
| Feature validity | 15% | 80 | 12.0% | WARNING |
| Leakage prevention | 25% | 20 | 5.0% | **FAIL** (Target leakage found) |
| Split methodology | 15% | 100 | 15.0% | PASS |
| Model evaluation | 10% | 100 | 10.0% | PASS |
| XGBoost validity | 5% | 100 | 5.0% | PASS |
| SHAP validity | 5% | 80 | 4.0% | WARNING |
| Reproducibility | 5% | 100 | 5.0% | PASS |
| Research validity | 5% | 80 | 4.0% | WARNING |
| **Total Score** | **100%** | **74.4%** | **74.4%** | **NOT READY FOR PHASE 17** |

---
