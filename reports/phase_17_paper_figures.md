# Phase 17 — Paper Figures & Publication-Ready Visualization Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 23:03:33

---

## Executive Summary

Phase 17 successfully generated **27 completed publication-grade figures** and **1 future experiment manifest** using matplotlib on the **leakage-free v4 dataset** (`final_features_v4.csv`) and Phase 15/16 evaluation results.
Every completed figure has been saved in both **high-resolution 300 DPI PNG** and **vector PDF format** under [`figures/phase_17/`](../figures/phase_17/).

---

## Final Status Ledger

```text
PHASE 17 STATUS:              PASS
COMPLETED FIGURES:            27
PENDING FIGURES:              1 (Fig 28 Future Experiments Manifest)
MODEL VERSION:                Phase 15 v4 (final_xgboost_model.pkl)
FEATURE VERSION:              final_features_v4.csv (66 features)
FINAL DATASET ROWS:           14,021
FINAL FEATURE COUNT:          66
FIGURE FORMATS:               300 DPI PNG & Vector PDF
```

---

## Completed Figures Overview

1.  **Architecture & Pipeline:** Fig 1 (System Architecture), Fig 2 (Data Pipeline)
2.  **Dataset & Exploratory:** Fig 3 (Price Distribution), Fig 4 (City Price Distribution), Fig 5 (Characteristics), Fig 6 (Spatial), Fig 7 (Rental), Fig 8 (HPI Trend), Fig 9 (Macroeconomics), Fig 10 (RERA), Fig 11 (Environmental)
3.  **Model Evaluation & Benchmarks:** Fig 12A-D (Model MAE/RMSE/$R^2$/MAPE), Fig 13 (Actual vs Predicted), Fig 14A-D (Residual Analysis), Fig 17 (City Performance), Fig 18 (Property Types), Fig 19 (Price Segments), Fig 20 (Generalization Splits), Fig 25-26 (Error Boxplots)
4.  **Explainability:** Fig 15 (SHAP Summary), Fig 16 (SHAP Feature Groups), Fig 27 (Gain vs SHAP)
5.  **Data Quality:** Fig 21 (Feature Groups), Fig 22 (Missingness), Fig 23 (Temporal Coverage), Fig 24 (Geographic Coverage)
6.  **Future Manifest:** Fig 28 (Pending Experiments Manifest)

---

## Artifacts & Outputs

| File | Description | Status |
|---|---|---|
| [`figures/phase_17/`](../figures/phase_17/) | 28 PNG and 28 PDF publication figures | ✅ Saved |
| [`reports/phase_17_figure_manifest.csv`](../reports/phase_17_figure_manifest.csv) | Full figure manifest table | ✅ Saved |
| [`reports/phase_17_figure_captions.md`](phase_17_figure_captions.md) | Academic figure captions | ✅ Saved |
| [`reports/phase_17_paper_figure_mapping.md`](phase_17_paper_figure_mapping.md) | Paper section mapping | ✅ Saved |
| [`reports/phase_17_paper_figures.md`](phase_17_paper_figures.md) | This summary report | ✅ Saved |

---

## Phase 17 Final Decision

### PHASE 17 STATUS: **`PASS`** ✅

All paper figures generated, documented, and verified.
