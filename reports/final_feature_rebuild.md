# Phase 12 — Final Feature Rebuild Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 21:04:52

---

## 1. Overview

This report details the rebuilding of the final ML feature dataset following the data source and missingness audit of Phase 1 to 16.
- **Input File:** `data/processed/property_master_v11.csv` (14,021 unique properties).
- **Output Feature File:** `data/features/final_features_v3.csv` (14,021 rows × 67 columns).
- **Target Leakage Safeguard:** Enforced. Target and metadata variables are excluded from inputs, and macroeconomic indexes are temporal-lagged ($t-1$).

---

## 2. Feature Groups Summary

| Feature Group | Count | Representative Features |
|---|---|---|
| PROPERTY | 12 features |
| SPATIAL | 10 features |
| RERA | 8 features |
| DERIVED | 8 features |
| RBI | 7 features |
| RENTAL | 5 features |
| CPCB | 5 features |
| MARKET | 4 features |
| MOSPI | 4 features |
| METADATA | 1 features |
| TARGET | 1 features |

---

## 3. Features Dropped Audit

The following columns were removed from the modeling feature matrix to enforce data quality and target leakage safety:

| Feature | Group | Reason for Removal |
|---|---|---|
| `year_built` | PROPERTY | >99.9% missing values in raw descriptions. |
| `age_years` | PROPERTY | >99.9% missing values. |
| `super_builtup_area_sqft` | PROPERTY | >99.9% missing. |
| `plot_area_sqft` | PROPERTY | >99.9% missing. |
| `price_per_sqft` | METADATA | Target-derived ratio. Dropped from modeling features to prevent target leakage. |

---

## 4. Derived Feature Calculations (No Imputations)

To prevent the fabrication of artificial values (as highlighted in the audit), derived features are calculated natively keeping missing values as null:

| Derived Feature | Formula | Missing % | Interpretation |
|---|---|---|---|
| `derived_area_per_bhk` | `builtup_area_sqft / bhk` | 0.00% | Unit layout size density |
| `derived_bathrooms_per_bhk` | `bathrooms / bhk` | 0.00% | Bathroom-to-bedroom utility ratio |
| `derived_carpet_efficiency` | `carpet_area_sqft / builtup_area_sqft` | 89.36% | Net usable area ratio |
| `derived_floor_ratio` | `floor_no / total_floors` | 51.52% | Relative elevation inside building |

---

## 5. Target Leakage Validation Log

All monetary and macroeconomic time-series features were audited for potential leakage:

| Feature | Group | Leakage Safeguard Protocol | Status |
|---|---|---|---|
| `hist_hpi_market` | MARKET | Lagged at t-1 quarter relative to property listing date. |
| `hist_cpi_index` | MOSPI | Lagged at t-1 month relative to listing date. |
| `repo_rate` | RBI | Lagged at t-1 month relative to listing date. |
| `rental_yield_pct` | RENTAL | Derived from locality-median MagicBricks rent rates, preventing individual price leaks. |
| `developer_completion_rate` | RERA | Calculates history for projects started strictly before the listing date. |

---

## 6. Output Files

| File | Description | Rows | Columns | Status |
|---|---|---|---|---|
| [`data/features/final_features_v3.csv`](final_features_v3.csv) | Rebuilt feature matrix | 14,021 | 67 | ✅ Saved |
| [`data/features/final_feature_dictionary.csv`](final_feature_dictionary.csv) | Final data dictionary | 67 | 9 | ✅ Saved |
| [`reports/final_feature_rebuild.md`](final_feature_rebuild.md) | This report | — | — | ✅ Saved |

---

*Rebuild complete — final features matrix generated, target-leakage validated.*
