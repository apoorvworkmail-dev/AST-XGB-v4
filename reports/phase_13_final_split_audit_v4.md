# Phase 13 — Final Evaluation Splits Report (v4)
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 23:00:13

---

## Evaluation Splits Dashboard v4

![Phase 13 Splits Dashboard v4](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase13_final_splits_dashboard_v4.png)

---

## 1. Overview & Rebuild Context

Following the Phase 16.5 target leakage audit and Phase 12 feature repair, all evaluation splits were regenerated from `data/features/final_features_v4.csv` (14,021 unique rows × 66 columns):
- **Contaminated Features Excluded:** `rental_yield_pct`, `derived_rental_yield_log1p`, and `target_locality_median_ppsf` were completely removed.
- **Corrected Features Included:** `historical_locality_median_ppsf`, `historical_rental_yield_pct`, and `derived_historical_rental_yield_log1p` were verified.
- **Zero In-Fold Target Leakage:** Historical features use strictly past training fold listings (leave-one-out strategy, excluding the current property itself).

---

## 2. Split Strategy Summary Matrix

| Strategy | Partition Logic | Train Rows | Val Rows | Test Rows | Target Application |
|---|---|---|---|---|---|
| **Strategy B (Temporal)** | Sorted by `listing_date` | 9,814 (70%) | 2,103 (15%) | 2,104 (15%) | Primary backtesting benchmark |
| **Strategy A (Random)** | Standard shuffle (seed 42) | 11,216 (80%) | 1,402 (10%) | 1,403 (10%) | Secondary i.i.d. baseline |
| **Strategy C (Geographic)**| Held-out Pune & Kolkata | 9,773 (69.7%) | — | 4,248 (30.3%) | Spatial transferability benchmark |

---

## 3. Primary Temporal Strategy Boundaries

- **Train Set:** [`final_temporal_train_v4.csv`](../data/splits/final_temporal_train_v4.csv) (9,814 rows, 2018-05-15 to 2021-08-15)
- **Validation Set:** [`final_temporal_val_v4.csv`](../data/splits/final_temporal_val_v4.csv) (2,103 rows, 2021-08-15 to 2022-05-15)
- **Test Set:** [`final_temporal_test_v4.csv`](../data/splits/final_temporal_test_v4.csv) (2,104 rows, 2022-05-15 to 2022-11-15)
- **Chronological Boundary Assertion:** `Train Max (2021-08-15) <= Val Min (2021-08-15) <= Test Min (2022-05-15)`

---

## 4. City Distributions & Geographic Holdout

| City | Total Properties | Geographic Partition Role |
|---|---|---|
| Bengaluru | 4,295 | Train |
| Pune | 2,880 | Test (Held-out) |
| Delhi | 2,081 | Train |
| Chennai | 1,539 | Train |
| Kolkata | 1,368 | Test (Held-out) |
| Mumbai | 1,330 | Train |
| Hyderabad | 528 | Train |

---

## 5. Contamination & Overlap Validation Audit

| Split Strategy | Train $\cap$ Val | Train $\cap$ Test | Val $\cap$ Test | Chronological Ordering | Target Leakage Check |
|---|---|---|---|---|---|
| **Temporal v4** | 0 | 0 | 0 | ✅ Validated | ✅ Passed (0.00% leaks) |
| **Random v4** | 0 | 0 | 0 | N/A | ✅ Passed (0.00% leaks) |
| **Geographic v4** | — | 0 | — | N/A | ✅ Passed (0.00% leaks) |

---

## 6. Output Files

| File | Description | Rows | Columns | Status |
|---|---|---|---|---|
| [`data/splits/final_temporal_train_v4.csv`](../data/splits/final_temporal_train_v4.csv) | Primary temporal train fold | 9,814 | 66 | ✅ Saved |
| [`data/splits/final_temporal_val_v4.csv`](../data/splits/final_temporal_val_v4.csv) | Primary temporal validation fold | 2,103 | 66 | ✅ Saved |
| [`data/splits/final_temporal_test_v4.csv`](../data/splits/final_temporal_test_v4.csv) | Primary temporal test fold | 2,104 | 66 | ✅ Saved |
| [`data/splits/final_random_train_v4.csv`](../data/splits/final_random_train_v4.csv) | Secondary random train fold | 11,216 | 66 | ✅ Saved |
| [`data/splits/final_random_val_v4.csv`](../data/splits/final_random_val_v4.csv) | Secondary random validation fold | 1,402 | 66 | ✅ Saved |
| [`data/splits/final_random_test_v4.csv`](../data/splits/final_random_test_v4.csv) | Secondary random test fold | 1,403 | 66 | ✅ Saved |
| [`data/splits/final_geographic_train_v4.csv`](../data/splits/final_geographic_train_v4.csv) | Secondary geographic train fold | 9,773 | 66 | ✅ Saved |
| [`data/splits/final_geographic_test_v4.csv`](../data/splits/final_geographic_test_v4.csv) | Secondary geographic test fold | 4,248 | 66 | ✅ Saved |
| [`data/splits/split_manifest_v4.json`](split_manifest_v4.json) | Structured split manifest | — | — | ✅ Saved |
| [`reports/phase_13_final_split_audit_v4.md`](phase_13_final_split_audit_v4.md) | This audit report | — | — | ✅ Saved |

---

*Phase 13 complete — splits rebuilt from final_features_v4.csv, target leakage resolved.*
