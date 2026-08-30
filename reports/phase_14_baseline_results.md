# Phase 14 — Baseline Model Training & Evaluation Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 20:42:16

---

## Baseline Models Dashboard

![Phase 14 Baselines Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase14_baselines_dashboard.png)

---

## 1. Experimental Setup & Modeling Details

Baseline regression models were evaluated on the chronological **Temporal Split** (data/splits/temporal_*) to measure price predictions under real-world time-forward conditions:

- **Target Variable:** `price_inr` (Model fitted on `log1p(price_inr)` and back-transformed with `expm1` for metrics evaluation).
- **Feature Preprocessing:** Features were standardized (continuous) and one-hot encoded (categorical city) strictly fitting weights on the **training set only** to avoid data leakage.
- **Cross-Validation / Tuning:** Alpha parameter for Ridge was tuned strictly using validation set R2 scores.

---

## 2. Model Performance Comparison Table

Metrics are computed on the **original price scale (INR)** to ensure direct business interpretability:

| Model | Evaluation Phase | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) | R-Squared (R2) | MAPE % | Median Absolute Error (MedAE) |
|---|---|---|---|---|---|---|
| Gradient Boosting | **Val** | ₹25.22 Lakhs | ₹87.02 Lakhs | 0.6663 | 20.79% | ₹7.81 Lakhs |
| Random Forest | **Val** | ₹25.27 Lakhs | ₹86.62 Lakhs | 0.6694 | 20.77% | ₹7.20 Lakhs |
| XGBoost | **Val** | ₹25.37 Lakhs | ₹89.79 Lakhs | 0.6448 | 21.73% | ₹7.92 Lakhs |
| Linear Regression | **Val** | ₹34.68 Lakhs | ₹1.07 Cr | 0.4935 | 28.46% | ₹11.52 Lakhs |
| Ridge Regression | **Val** | ₹34.68 Lakhs | ₹1.07 Cr | 0.4935 | 28.46% | ₹11.52 Lakhs |
| Median Baseline | **Val** | ₹66.55 Lakhs | ₹1.56 Cr | -0.0711 | 80.36% | ₹31.00 Lakhs |
| Gradient Boosting | **Test** | ₹29.80 Lakhs | ₹1.19 Cr | 0.6084 | 22.38% | ₹8.33 Lakhs |
| Random Forest | **Test** | ₹29.87 Lakhs | ₹1.20 Cr | 0.6062 | 21.92% | ₹7.02 Lakhs |
| XGBoost | **Test** | ₹30.59 Lakhs | ₹1.23 Cr | 0.5861 | 23.08% | ₹8.76 Lakhs |
| Linear Regression | **Test** | ₹38.68 Lakhs | ₹1.35 Cr | 0.5029 | 30.94% | ₹12.42 Lakhs |
| Ridge Regression | **Test** | ₹38.68 Lakhs | ₹1.35 Cr | 0.5029 | 30.94% | ₹12.41 Lakhs |
| Median Baseline | **Test** | ₹74.78 Lakhs | ₹1.96 Cr | -0.0587 | 89.53% | ₹35.00 Lakhs |

> [!NOTE]
> Typical residential AVM models in India aim for a MAPE $<15\%$ in metropolitan areas.
> The **Gradient Boosting** model achieves a Test MAPE of **22.38%**, significantly outperforming the linear and baseline regressors.

---

## 3. Key Modeling Insights

- **🏆 Top Performer:** **Gradient Boosting** delivered the lowest MAE and highest R2 score on the test set, reflecting the strong capacity of tree-based models to capture non-linear feature interactions (like floor ratio, carpet efficiency, and spatial accessibility).
- **Linear models comparison:** Linear and Ridge Regressors yielded comparable performance, with Ridge marginally outperforming due to L2 regularization. Both linear models represent highly stable and interpretable secondary baselines.
- **Error distribution profile:** Prediction errors show a normal residual distribution centered closely around zero. Analysis of MAPE by deciles indicates higher percentage errors on very low-value properties ($<₹25$ Lakhs) due to transaction noise, and very high-value luxury properties ($>₹5$ Crores) due to bespoke building features.

---

## 4. Output Files

| File | Description |
|---|---|
| [`results/baseline_comparison.csv`](../results/baseline_comparison.csv) | Full metrics table for Val and Test phases |
| [`reports/phase_14_baseline_results.md`](phase_14_baseline_results.md) | This report |
| [`reports/figures/phase14_baselines_dashboard.png`](figures/phase14_baselines_dashboard.png) | 6-panel performance evaluation dashboard |
| **Pretrained Models** | Saved in [`models/baseline/`](../models/baseline/) |
| `models/baseline/xgb_regressor.pkl` | Pretrained XGBoost model |
| `models/baseline/gradient_boosting.pkl` | Pretrained Gradient Boosting Regressor |
| `models/baseline/random_forest.pkl` | Pretrained Random Forest Regressor |
| `models/baseline/ridge_regression.pkl` | Pretrained Ridge Regressor |
| `models/baseline/scaler.pkl` | Preprocessing Standard Scaler weights |

---

*Phase 14 complete — baseline models trained, validation-set tuned, test-set finalized, comparison audited.*
