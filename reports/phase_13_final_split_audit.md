# Phase 13 — Final Evaluation Splits Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 21:21:10

---

## Evaluation Splits Dashboard

![Phase 13 Splits Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase13_final_splits_dashboard.png)

---

## 1. Overview of Split Strategies

To evaluate model performance under different realistic constraints, three partition strategies were generated from `data/features/final_features_v3.csv` (14,021 unique properties):

| Strategy | Partition Logic | Train Rows | Val Rows | Test Rows | Target Application |
|---|---|---|---|---|---|
| **Strategy A (Random)** | Standard shuffle | 11,216 (80%) | 1,402 (10%) | 1,403 (10%) | Baseline i.i.d. generalization |
| **Strategy B (Temporal)** | Sorted by `listing_date` | 9,814 (70%) | 2,103 (15%) | 2,104 (15%) | Backtesting / time-forward prediction |
| **Strategy C (Geographic)**| Held-out cities | 9,773 (69.7%) | — | 4,248 (30.3%) | Cross-city spatial transferability |

---

## 2. Target Leakage Prevention & Locality Aggregation

To completely eliminate target leakage from validation/test sets back into training, the globally calculated `target_locality_median_ppsf` feature from Phase 12 was **dropped** from the input feature matrix.

### Safeguard Protocol
*   **Training-Only Aggregates:** Locality-level target aggregates (`target_locality_median_ppsf` - median price per sqft of properties in each locality) are calculated **strictly from the training partition** of each split.
*   **Zero Leakage Validation:** The computed aggregates are joined to validation/test sets. Unseen localities fallback to the **city-level median computed strictly from the training set**.
*   **Exact Match Audit:** Audit confirms **0.00% exact matches** between the aggregate feature and the property target price in validation/test sets, verifying that no individual property price leaked directly.

---

## 3. Split Strategy Details & Boundaries

### Strategy A: Random Split
- **Train split:** [`final_random_train.csv`](../data/splits/final_random_train.csv)
- **Validation split:** [`final_random_val.csv`](../data/splits/final_random_val.csv)
- **Test split:** [`final_random_test.csv`](../data/splits/final_random_test.csv)
- **Overlap Audit:** **0** properties appear across multiple splits.

### Strategy B: Temporal Split
- **Train split:** [`final_temporal_train.csv`](../data/splits/final_temporal_train.csv) (oldest 70%, up to 2021-08-15)
- **Validation split:** [`final_temporal_val.csv`](../data/splits/final_temporal_val.csv) (next 15%, 2021-08-15 to 2022-05-15)
- **Test split:** [`final_temporal_test.csv`](../data/splits/final_temporal_test.csv) (latest 15%, starting 2022-05-15)
- **Overlap Audit:** **0** properties overlap. Strict date boundaries are respected:
  `Train Max (2021-08-15) <= Val Min (2021-08-15) <= Test Min (2022-05-15)`

### Strategy C: Geographic Split
- **Train split:** [`final_geographic_train.csv`](../data/splits/final_geographic_train.csv) (5 cities: Bengaluru, Mumbai, Delhi, Chennai, Hyderabad)
- **Test split:** [`final_geographic_test.csv`](../data/splits/final_geographic_test.csv) (2 held-out cities: Pune, Kolkata)
- **Overlap Audit:** **0** properties overlap.

#### City Allocations

| City | Properties | Partition Role |
|---|---|---|
| Bengaluru | 4,295 | Train |
| Pune | 2,880 | Test (Held-out) |
| Delhi | 2,081 | Train |
| Chennai | 1,539 | Train |
| Kolkata | 1,368 | Test (Held-out) |
| Mumbai | 1,330 | Train |
| Hyderabad | 528 | Train |

---

## 4. Leakage Validation Audit Log

| Split Strategy | Train $\cap$ Val Overlap | Train $\cap$ Test Overlap | Val $\cap$ Test Overlap | Date Ordering | Target Leakage Check |
|---|---|---|---|---|---|
| **Random** | 0 | 0 | 0 | N/A | ✅ Passed (0.00% leaks) |
| **Temporal** | 0 | 0 | 0 | ✅ Validated | ✅ Passed (0.00% leaks) |
| **Geographic** | — | 0 | — | N/A | ✅ Passed (0.00% leaks) |

---

## 5. Output Files

| File | Description |
|---|---|
| **Strategy A** | |
| [`data/splits/final_random_train.csv`](../data/splits/final_random_train.csv) | Random train set (11,216 rows × 68 cols) |
| [`data/splits/final_random_val.csv`](../data/splits/final_random_val.csv) | Random validation set (1,402 rows) |
| [`data/splits/final_random_test.csv`](../data/splits/final_random_test.csv) | Random test set (1,403 rows) |
| **Strategy B** | |
| [`data/splits/final_temporal_train.csv`](../data/splits/final_temporal_train.csv) | Temporal train set (9,814 rows × 68 cols) |
| [`data/splits/final_temporal_val.csv`](../data/splits/final_temporal_val.csv) | Temporal validation set (2,103 rows) |
| [`data/splits/final_temporal_test.csv`](../data/splits/final_temporal_test.csv) | Temporal test set (2,104 rows) |
| **Strategy C** | |
| [`data/splits/final_geographic_train.csv`](../data/splits/final_geographic_train.csv) | Geographic train set (9,773 rows × 68 cols) |
| [`data/splits/final_geographic_test.csv`](../data/splits/final_geographic_test.csv) | Geographic test set (4,248 rows) |
| **Audit Report & Manifest** | |
| [`data/splits/split_manifest.json`](split_manifest.json) | Structured split definitions and metadata |
| [`reports/phase_13_final_split_audit.md`](phase_13_final_split_audit.md) | This report |
| [`reports/figures/phase13_final_splits_dashboard.png`](figures/phase13_final_splits_dashboard.png) | Visual dashboard of splits |

---

*Phase 13 complete — splits generated, target-leakage aggregates calculated safely, temporal dates validated.*
