# System Requirements & Mathematical Specifications

## 1. Functional Specifications

- **Data Ingestion**: Multi-attribute transaction ingestion (Parquet/CSV), spatial POI telemetry (GeoJSON/OpenStreetMap), and macroeconomic time series.
- **Leakage Invariant**: Strict point-in-time calculation enforcing $t_j < t_i$ for all historical aggregations.
- **Model Regressors**: OLS, Ridge, Lasso, Random Forest, Extra Trees, GBR, LightGBM, and Bayesian-Optimized XGBoost.
- **Regime Identification**: GMM clustering of 5D state vector $z_t = [\Delta P_{3m}(t), \sigma_{\text{price}}(t), V_{\text{trans}}(t), \text{Dispersion}(t), \Delta P_{\text{neighborhood}}(t)]^T$ into 4 latent regimes (`Stable`, `Growth`, `Cooling`, `Shock`).
- **Dynamic Weighting**: Softmax error weighting $w_{k,t} = \frac{\exp(-\lambda E_{k,t})}{\sum \exp(-\lambda E_{j,t})}$.
- **Uncertainty Calibration**: Split Conformal Prediction Intervals at 90% confidence level.
- **Local XAI & Counterfactuals**: TreeSHAP feature attributions and constrained local perturbation simulator.
- **API & UI Console**: FastAPI REST backend (<50ms response latency) and interactive React/Vite dashboard.

## 2. Non-Functional Specifications

- **Performance Latency**: Sub-50ms inference payload serialization under containerized deployment.
- **Empirical Accuracy**: Outperform baseline models with $R^2 \ge 0.92$, $\text{MAPE} \le 7.5\%$.
- **Conformal Reliability**: Conformal interval coverage $\ge 90.0\%$ on unseen out-of-time test partitions.
- **Drift Retraining Trigger**: Retraining alert triggered when Population Stability Index ($\text{PSI}$) $> 0.25$ or coverage falls below $85\%$.
