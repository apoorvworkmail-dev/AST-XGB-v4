# Phase 13 — Leakage-Safe Evaluation Splits Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 20:35:28

---

## Evaluation Splits Dashboard

![Phase 13 Splits Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase13_splits_dashboard.png)

---

## 1. Overview of Split Strategies

To evaluate model performance under different realistic constraints, three partition strategies were generated from `data/features/final_features.csv` (14,029 properties):

| Strategy | Partition Logic | Train Rows | Val Rows | Test Rows | Target Application |
|---|---|---|---|---|---|
| **Strategy A (Random)** | Standard shuffle | 11,216 (80%) | 1,402 (10%) | 1,403 (10%) | Baseline i.i.d. generalization |
| **Strategy B (Temporal)** | Sorted by `listing_date` | 9,814 (70%) | 2,103 (15%) | 2,104 (15%) | Backtesting / time-forward prediction |
| **Strategy C (Geographic)**| Held-out cities | 9,773 (79.7%) | — | 4,248 (20.3%) | Cross-city spatial transferability |

---

## 2. Target Leakage Prevention & Locality Aggregation

A common source of target leakage in real estate models is calculating locality-level target aggregates (like median property price) on the *entire* dataset, which leaks information from validation/test sets back into training.

### Safeguard Protocol
*   **Training-Only Aggregates:** Locality-level target aggregates (`target_locality_median_ppsf` - median price per sqft of properties in each locality) are calculated **strictly from the training partition** of each split.
*   **Zero Leakage Validation:** The computed aggregates are joined to validation/test sets. If a locality in validation/test is not present in the training set, it falls back to the **city-level median computed strictly from the training set**.
*   **Exact Match Audit:** Audit confirms **0.00% exact matches** between the aggregate feature and the property target price in validation/test sets, verifying that no individual property price leaked directly.

---

## 3. Split Strategy Details & Boundaries

### Strategy A: Random Split
- **Train split:** [`random_train.csv`](../data/splits/random_train.csv)
- **Validation split:** [`random_val.csv`](../data/splits/random_val.csv)
- **Test split:** [`random_test.csv`](../data/splits/random_test.csv)
- **Overlap Audit:** **0** properties appear across multiple splits.

### Strategy B: Temporal Split
- **Train split:** [`temporal_train.csv`](../data/splits/temporal_train.csv) (oldest 70%, up to 2021-08-15)
- **Validation split:** [`temporal_val.csv`](../data/splits/temporal_val.csv) (next 15%, 2021-08-15 to 2022-05-15)
- **Test split:** [`temporal_test.csv`](../data/splits/temporal_test.csv) (latest 15%, starting 2022-05-15)
- **Overlap Audit:** **0** properties overlap. Strict date boundaries are respected:
  `Train Max (2021-08-15) <= Val Min (2021-08-15) <= Test Min (2022-05-15)`

### Strategy C: Geographic Split
- **Train split:** [`geographic_train.csv`](../data/splits/geographic_train.csv) (5 cities: Bengaluru, Mumbai, Delhi, Chennai, Hyderabad)
- **Test split:** [`geographic_test.csv`](../data/splits/geographic_test.csv) (2 held-out cities: Pune, Kolkata)
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
| [`data/splits/random_train.csv`](../data/splits/random_train.csv) | Random train set (11,216 rows × 34 cols) |
| [`data/splits/random_val.csv`](../data/splits/random_val.csv) | Random validation set (1,402 rows) |
| [`data/splits/random_test.csv`](../data/splits/random_test.csv) | Random test set (1,403 rows) |
| **Strategy B** | |
| [`data/splits/temporal_train.csv`](../data/splits/temporal_train.csv) | Temporal train set (9,814 rows × 34 cols) |
| [`data/splits/temporal_val.csv`](../data/splits/temporal_val.csv) | Temporal validation set (2,103 rows) |
| [`data/splits/temporal_test.csv`](../data/splits/temporal_test.csv) | Temporal test set (2,104 rows) |
| **Strategy C** | |
| [`data/splits/geographic_train.csv`](../data/splits/geographic_train.csv) | Geographic train set (9,773 rows × 34 cols) |
| [`data/splits/geographic_test.csv`](../data/splits/geographic_test.csv) | Geographic test set (4,248 rows) |
| **Audit Report** | |
| [`reports/phase_13_split_audit.md`](phase_13_split_audit.md) | This report |
| [`reports/figures/phase13_splits_dashboard.png`](figures/phase13_splits_dashboard.png) | 5-panel partition dashboard |

---

*Phase 13 complete — splits generated, target-leakage aggregates calculated safely, temporal dates validated.*
