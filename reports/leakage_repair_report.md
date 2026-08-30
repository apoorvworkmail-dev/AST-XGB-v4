# Target Leakage Repair & Validation Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 22:58:33

---

## Executive Summary

The Phase 16.5 validation audit identified three severe target leakage issues in the modeling feature layer of `final_features_v3.csv`. This script performs a full repair of Phase 12 features, exporting `final_features_v4.csv` and validating safety.

### Validation Status: **`LEAKAGE REPAIRED`** ✅

---

## 1. Feature Repair Ledger

| Feature | Original Formula | Problem Identified | Corrected Formula / Remedy |
|---|---|---|---|
| `rental_yield_pct` | `(annual_rent / price_inr) * 100` | **Target Leakage:** Directly contains target `price_inr` in denominator. | **REMOVED** and replaced with `historical_rental_yield_pct`. |
| `derived_rental_yield_log1p` | `log1p(rental_yield_pct)` | **Target Leakage:** Inherits leakage from `rental_yield_pct`. | **REMOVED** and replaced with `derived_historical_rental_yield_log1p`. |
| `target_locality_median_ppsf`| `Median(price_per_sqft)` | **In-Fold Leakage:** Included the current property's price in training fold median. | **REPLACED** with `historical_locality_median_ppsf` (leave-one-out historical median). |

---

## 2. Rebuilt Leakage-Safe Formulas

To restore scientific validity, we rebuilt the locality value indices and rental features as follows:

### A. `historical_locality_median_ppsf`
Computes the price per square foot benchmark of the locality using strictly historical past properties:
$$historical\_locality\_median\_ppsf_i = \text{Median}\left(\left\{price\_per\_sqft_j \mid j \in \text{Train}, \text{ld}_j < \text{ld}_i, j \neq i, \text{locality}_j = \text{locality}_i\right\}\right)$$
*   **Fallback Hierarchy:** If fewer than 3 historical listings exist in the locality, it falls back to the historical city median (listed before $t$, excluding self). If still empty, it falls back to the global historical training median.

### B. `historical_rental_yield_pct`
Instead of using the property's own target sale price, we use the historical locality median benchmark as a capital value proxy:
$$historical\_rental\_yield\_pct_i = \frac{annual\_rent\_estimate\_inr_i}{historical\_locality\_median\_ppsf_i \times builtup\_area\_sqft_i} \times 100$$
This calculates a highly realistic yield percentage based on the property's estimated capital value without any target price leakage!

---

## 3. Train / Validation / Test Isolation Protocols

*   **Train Set:** Historical aggregates use strictly train set properties listed prior to the index date, excluding the index property itself (leave-one-out).
*   **Validation Set:** Features are calculated using only train set properties listed before the validation date. Zero validation targets are used.
*   **Test Set:** Features are calculated using only train set properties listed before the test date. Zero test targets are used.

---

## 4. Automated Leakage Validation Checks

We implemented four assertions to verify the integrity of the rebuilt features:
1.  **Dropped Check:** Confirmed that `rental_yield_pct`, `derived_rental_yield_log1p`, and `target_locality_median_ppsf` are completely absent from the feature matrix.
2.  **Leave-One-Out Check:** Modifying a training listing's target price and re-evaluating its feature resulted in **0.00% changes**, proving its own price is excluded.
3.  **Causal Causal Check:** Modifying a future listing's price did **not** affect any past property's features.
4.  **Test Set Isolation:** Set all validation/test target prices to zero and verified training set features remained **exactly identical**.

---

## 5. Output Files

| File | Description | Rows | Columns | Status |
|---|---|---|---|---|
| [`data/features/final_features_v4.csv`](final_features_v4.csv) | Rebuilt feature matrix | 14,021 | 65 | ✅ Saved |
| [`data/features/final_feature_dictionary_v4.csv`](final_feature_dictionary_v4.csv) | Final data dictionary v4 | 65 | 11 | ✅ Saved |
| [`reports/leakage_repair_report.md`](leakage_repair_report.md) | This report | — | — | ✅ Saved |

---
