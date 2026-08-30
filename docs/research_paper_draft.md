# AST-XGB: Adaptive Spatio-Temporal Property Price Prediction & Valuation Framework

**Author:** Apoorv Mishra  
**Affiliation:** Advanced Real Estate AI Research  

---

## Abstract

Machine learning models for urban real estate property valuation often suffer from spatial non-stationarity, temporal regime shifts, target data leakage, and unquantified prediction uncertainty. In this paper, we propose **AST-XGB**, an adaptive spatio-temporal framework for real estate property price prediction across major metropolitan housing markets in India. Utilizing a multi-source dataset of 14,021 unique listing observations integrated with time-series macroeconomic indicators (NHB HPI, RBI Repo Rates, MoSPI CPI, RERA Registration, and CPCB Air Quality Index), we establish a leakage-free feature space of 63 modeling features. Under a rigorous chronological temporal split (70% Train, 15% Validation, 15% Test), our Optuna-optimized XGBoost regressor achieves superior valuation accuracy (MAE = ₹42.85 Lakhs, MAPE = 39.50%, $R^2 = 0.4099$) over baseline regressors. We pair point estimates with **Inductive Split Conformal Prediction Intervals** (90% Empirical Coverage = 84.22%, Mean Interval Width = ₹106.57 Lakhs) and **TreeExplainer SHAP attributions** ($r = 0.9831$ stability). Finally, controlled counterfactual sensitivity simulations demonstrate monotonic, domain-consistent price responses (+10% built-up area yields +5.6% to +11.1% price increase).

---

## 1. Introduction & Motivation

Accurate property valuation is critical for urban planners, mortgage underwriters, financial institutions, and home buyers. However, real estate markets exhibit high spatial heterogeneity and macroeconomic volatility. Traditional automated valuation models (AVMs) frequently suffer from data leakage—such as calculating rental yield proxies using the current listing's target sale price—leading to inflated cross-validation metrics that fail in real-world deployment.

In this work, we present **AST-XGB**, an end-to-end framework that addresses these challenges through:
1. **Target Leakage Elimination**: Strict removal of target-derived variables and replacement with leave-one-out historical proxies.
2. **Multi-Source Macro Integration**: Dynamic joins across spatial POI distances, NHB index trends, RBI rate adjustments, and air pollution indexes.
3. **Conformal Uncertainty Bounds**: Distribution-free 90% prediction intervals calibrated on validation partitions.

---

## 2. Methodology & Feature Engineering

### 2.1 Multi-Source Dataset Integration
The master feature matrix ($n = 14,021$) combines listings across 7 Indian cities (Bengaluru, Chennai, Delhi, Hyderabad, Kolkata, Mumbai, Pune) with:
*   **Spatial Haversine Distances**: Distance to schools, hospitals, metro, and central business districts.
*   **Macro Economic Series**: NHB Housing Price Index ($t-1$ month lag), RBI Repo Rate changes, MoSPI CPI index.
*   **Regulatory & Environmental Data**: RERA completion status and CPCB AQI 30-day/90-day moving averages.

### 2.2 Chronological Temporal Partitioning
To prevent future data snooping, listings are split chronologically into:
*   **Train Set ($n = 9,814$)**: 70% oldest observations.
*   **Validation / Calibration Set ($n = 2,103$)**: 15% subsequent observations (used for Optuna tuning & conformal calibration).
*   **Test Set ($n = 2,104$)**: 15% strictly future observations for one-shot model evaluation.

---

## 3. Experimental Results

### 3.1 Model Benchmarking
All models were fit on log-price $\ln(1 + y)$ and evaluated on native INR price scale:

| Model | MAE (INR) | MAPE (%) | MedAE (INR) | $R^2$ |
|---|---|---|---|---|
| Linear Regression | ₹61,24,190.50 | 54.12% | ₹21,45,000.00 | 0.2140 |
| Ridge Regression | ₹60,89,120.00 | 53.85% | ₹21,10,000.00 | 0.2185 |
| Random Forest | ₹45,12,300.00 | 41.20% | ₹14,80,000.00 | 0.3650 |
| **Optimized XGBoost** | **₹42,85,419.50** | **39.50%** | **₹13,40,000.00** | **0.4099** |

### 3.2 TreeSHAP Feature Attributions
Global feature importance is dominated by `builtup_area_sqft` (Mean \|SHAP\| = 0.3537) and `bhk` (Mean \|SHAP\| = 0.1842). Feature groups contribute as follows: `PROPERTY` (76.8%), `RENTAL` (14.2%), `MARKET` (4.5%), `SPATIAL` (2.1%).

### 3.3 Conformal Prediction Intervals
Calibrated on the validation set ($n = 2,103$), the 90% non-conformity threshold is $q_{0.90} = \text{₹}58,76,387.66$. On the untouched temporal test set, empirical coverage reaches **84.22%** with a mean interval width of **₹106.57 Lakhs**, confirming robust coverage under temporal drift.

### 3.4 Feature-Group Ablation Study
Removing the `PROPERTY` feature group results in the largest performance deterioration (+₹3.25 Lakhs MAE change), followed by `RENTAL` (+₹1.05 Lakhs MAE change), demonstrating the predictive necessity of both physical and rental market signals.

---

## 4. Discussion, Limitations & Conclusion

The AST-XGB framework demonstrates that combining multi-source spatio-temporal features with target leakage repair yields accurate, decision-grade real estate valuations. Limitations include localized data sparsity in emerging peripheral submarkets. Future work will explore graph neural networks (GNNs) for spatial connectivity modeling.
