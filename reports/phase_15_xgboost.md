# Phase 15 — XGBoost Hyperparameter Optimization Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 21:49:14

---

## 1. Overview & Optimization Protocol

This phase optimizes the `XGBRegressor` baseline model using Optuna search over **30 trials**:
- **Objective:** Minimize back-transformed validation set RMSE (to align directly with original scale price_inr predictions).
- **Split Strategy:** Temporal split (9,814 Train / 2,103 Val / 2,104 Test).
- **Preprocessing:** Fitted ColumnTransformer strictly on the training partition for trials.
- **Combined Training:** After finding the optimal parameters, the model was retrained on combined **Train + Validation (11,917 properties)** inputs, with final metrics assessed **exactly once** on the untouched Test set.

---

## 2. Optuna Trials Summary (Top 5 Trials)

| Trial | Trees | Max Depth | Learning Rate | Subsample | Colsample | Val RMSE (INR) | Val $R^2$ |
|---|---|---|---|---|---|---|---|
| #19 | 397 | 5 | 0.0326 | 0.74 | 0.94 | 6,077,986.14 | 0.8372 |
| #23 | 369 | 7 | 0.0145 | 0.86 | 0.75 | 6,342,285.34 | 0.8228 |
| #27 | 373 | 7 | 0.0276 | 0.80 | 0.60 | 6,563,729.13 | 0.8102 |
| #21 | 369 | 7 | 0.0111 | 0.86 | 0.75 | 6,598,959.82 | 0.8081 |
| #20 | 361 | 7 | 0.0109 | 0.84 | 0.77 | 6,679,253.02 | 0.8034 |

---

## 3. Best Hyperparameters found

```json
{
  "n_estimators": 397,
  "max_depth": 5,
  "learning_rate": 0.032582879920477946,
  "subsample": 0.7412350028396926,
  "colsample_bytree": 0.9408954454979035,
  "min_child_weight": 9,
  "gamma": 0.04780353180036301,
  "reg_alpha": 0.00034994784396495513,
  "reg_lambda": 3.8264419101657475e-08,
  "random_state": 42,
  "n_jobs": -1
}
```

---

## 4. Final Untouched Test Set Performance

The final model trained on combined Train+Val data was evaluated on the isolated Test set (2,104 properties):

| Metric | Basic XGBoost (Phase 14) | Optimized XGBoost (Phase 15) | Improvement | Status |
|---|---|---|---|---|
| **MAE** | ₹1,698,859.50 | **₹1,542,776.88** | +9.19% | ✅ Better fit |
| **RMSE** | ₹7,696,396.53 | **₹6,432,862.22** | +16.42% | ✅ Reduced variance |
| **$R^2$** | 0.8373 | **0.8863** | +0.0490 | ✅ Improved variance explained |
| **MAPE** | 14.13% | **13.85%** | +1.96% | ✅ Increased percentage accuracy |
| **MedAE** | ₹1,034,200.00 | **₹491,365.00** | +52.49% | ✅ Lower median error |

---

## 5. Output Files

| File | Description | Status |
|---|---|---|
| [`models/xgboost/best_model.pkl`](best_model.pkl) | Final trained XGBoost model | ✅ Saved |
| [`models/xgboost/best_params.json`](best_params.json) | Optimal hyperparameters JSON | ✅ Saved |
| [`results/xgboost_experiments.csv`](../results/xgboost_experiments.csv) | Trials history log | ✅ Saved |
| [`reports/phase_15_xgboost.md`](phase_15_xgboost.md) | This report | ✅ Saved |

---

*Phase 15 complete — hyperparameter tuning completed, final model validated.*
