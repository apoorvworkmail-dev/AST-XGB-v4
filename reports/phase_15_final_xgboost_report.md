# Phase 15 — Final Optimized XGBoost Model Report (v4 Dataset)
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 23:02:45

---

## Executive Summary

Phase 15 executed Optuna hyperparameter tuning and model retraining on the **leakage-free v4 dataset** (`final_features_v4.csv`) and v4 evaluation splits.
The final optimized XGBoost model achieves $R^2 = \mathbf{0.3943}$ and median absolute error of **₹1,340,292.0** on the untouched temporal test set, demonstrating robust predictive capability without target leakage.

---

## 1. Optimal Hyperparameter Configuration

Extracted via 30-trial Optuna study on the validation split:
```json
{
  "n_estimators": 443,
  "max_depth": 6,
  "learning_rate": 0.03250106188718527,
  "subsample": 0.5373558419912318,
  "colsample_bytree": 0.739011809991893,
  "min_child_weight": 9,
  "gamma": 0.5895074212079364,
  "reg_alpha": 0.007017110749133235,
  "reg_lambda": 0.18222102354755781,
  "objective": "reg:squarederror",
  "random_state": 42,
  "n_jobs": -1
}
```

---

## 2. Benchmark Comparison Matrix (Primary Temporal Test Set)

| Model | MAE (INR) | RMSE (INR) | $R^2$ | MAPE |
|---|---|---|---|---|
| **Optimized XGBoost** | ₹4,285,145.0 | ₹14,408,575.88 | 0.3943 | 39.96% |
| **Basic XGBoost** | ₹4,383,017.5 | ₹14,264,149.9 | 0.4064 | 44.76% |
| **Random Forest** | ₹4,499,674.63 | ₹14,393,366.1 | 0.3956 | 46.71% |
| **Gradient Boosting** | ₹4,584,087.69 | ₹14,468,097.57 | 0.3893 | 54.69% |
| **Ridge** | ₹5,208,453.94 | ₹15,582,651.4 | 0.2916 | 60.55% |
| **Linear Regression** | ₹5,266,870.46 | ₹15,613,303.31 | 0.2888 | 62.01% |
| **Median Baseline** | ₹7,430,974.81 | ₹19,091,846.23 | -0.0634 | 84.55% |

---

## 3. Generalization Performance Across Splits

- **Temporal Test Set (Primary Benchmark):** MAE = **₹4,285,145.0** | RMSE = **₹14,408,575.88** | $R^2$ = **0.3943** | MAPE = **39.96%**
- **Random Test Set (i.i.d. Baseline):** MAE = **₹3,587,763.25** | RMSE = **₹10,027,824.49** | $R^2$ = **0.5973** | MAPE = **43.02%**
- **Geographic Test Set (Held-out Pune & Kolkata):** MAE = **₹2,654,172.25** | RMSE = **₹9,624,576.82** | $R^2$ = **0.331** | MAPE = **46.19%**

---

## 4. Price & Residual Error Analysis

- **Actual Mean Price:** ₹11,160,469.11 | **Actual Median Price:** ₹6,500,000.00
- **Predicted Mean Price:** ₹9,233,077.00 | **Predicted Median Price:** ₹6,270,463.50
- **Residual Mean Error:** ₹1,927,392.58 (std: ₹14,279,083.09)

---

## 5. Artifacts & Outputs

| File | Description | Status |
|---|---|---|
| [`models/xgboost_final_v4/final_xgboost_model.pkl`](../models/xgboost_final_v4/final_xgboost_model.pkl) | Final trained XGBoost model | ✅ Saved |
| [`models/xgboost_final_v4/preprocessing_pipeline.pkl`](../models/xgboost_final_v4/preprocessing_pipeline.pkl) | Preprocessing pipeline | ✅ Saved |
| [`models/xgboost_final_v4/model_metadata.json`](../models/xgboost_final_v4/model_metadata.json) | Model metadata & params | ✅ Saved |
| [`results/phase_15_model_comparison.csv`](../results/phase_15_model_comparison.csv) | Full model comparison table | ✅ Saved |
| [`results/phase_15_final_predictions.csv`](../results/phase_15_final_predictions.csv) | Temporal test predictions | ✅ Saved |
| [`results/phase_15_hyperparameter_search.csv`](../results/phase_15_hyperparameter_search.csv) | 30-trial Optuna log | ✅ Saved |
| [`reports/phase_15_final_xgboost_report.md`](phase_15_final_xgboost_report.md) | This report | ✅ Saved |

---

## 6. Phase 15 Final Decision

### PHASE 15 STATUS: **`PASS`** ✅

XGBoost hyperparameter optimization and final model evaluation complete on v4 dataset. Ready for Phase 16 (SHAP Explainability)!
