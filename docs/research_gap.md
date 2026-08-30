# Consolidated Research Literature & Gap Analysis

## 1. Foundational Literature Review Matrix

| Reference / Study | Methodology & Algorithmic Focus | Empirical Findings & Metrics | Identified Limitations | AST-XGB Solution |
|---|---|---|---|---|
| **Ayaz & Manoharan (2025)**<br>*Dubai Real Estate Study* | SVR, RF, GBR, XGBoost, Ridge, Lasso; IQR outlier filtering; One-Hot Encoding; RandomizedSearchCV. | GBR ($R^2 = 0.9034$), XGBoost ($R^2 = 0.9000$), RF ($R^2 = 0.8998$), SVR ($R^2 = 0.6080$) on Dubai DLD data. | Relies exclusively on static historical data; excludes real-time market shift adaptation and dynamic temporal indicators. | Implements dynamic temporal indicators, rolling validation, and leakage-safe temporal aggregations. |
| **Zhao, Chetty, & Tran (2019)**<br>*Multimodal Appraisal* | MobileNet on AVA dataset for aesthetic scores ($S \in [1, 10]$); CNN visual extractor; MLP tabular; top-level XGBoost. | Hybrid XGBoost achieved MAPE = 8.70% vs. MLP (10.09%) and KNN (13.01%) on 248 Canberra records. | Micro-dataset ($N=248$); no uncertainty bounds; ignores market drift and temporal context. | Modular visual embedding ingestion combined with conformal prediction intervals and drift detection. |
| **Prakash et al. (2025)**<br>*Feature-Driven Valuation* | Tabular preprocessing (KNN/MICE, Min-Max scaling); CTGAN synthetic data generation for rare regions; XGBoost regressor. | Synthetic data generation improved generalization and reduced out-of-region variance. | Risk of synthetic leakage across partitions; does not model temporal macroeconomic shifts. | Strict pre-split conditional CTGAN augmentation bounded exclusively within the training fold. |
| **Gupta et al. (2023)**<br>*End-to-End ML Pipeline* | Standard 7-stage workflow: Collection $\to$ Cleaning $\to$ 70/30 Split $\to$ Linear & Polynomial Regression. | Linear Regression reached 85.64% baseline accuracy on suburban Bengaluru housing data. | Random train/test split causes spatio-temporal leakage; static deployment without drift monitoring. | Chronological rolling-origin evaluation, strict spatio-temporal isolation, and PSI drift monitoring. |
| **Deng & Zhang (2025)**<br>*Hong Kong 3-Level Ensemble* | 3-Level Bagging/Stacking/Voting (RF, ET, XGBoost, LightGBM); MRMR feature selection; Bayesian Optimization; SHAP, PFI, PDP, ALE, ICE. | Level-3 Voting achieved $R^2 = 0.838$, MAE = 1157.79, outperforming standalone ET ($R^2=0.825$) and XGBoost ($R^2=0.798$). | Static ensemble weights fail during macro market shifts; subjective POI radiuses; no prediction intervals or counterfactuals. | Replaces static voting with dynamic Softmax Error weighting across GMM market regimes + Conformal Prediction. |
| **Mishra (2026)**<br>*Proposed AST-XGB System* | Unifies leakage-safe spatio-temporal graphs, GMM market regimes, Conformal Prediction, and counterfactual scenario modeling. | Mathematical convergence of adaptive weighting: $w_{k,t} = \frac{\exp(-\lambda E_{k,t})}{\sum_j \exp(-\lambda E_{j,t})}$. | Requires high transaction density and geocoded timestamps for optimal rolling feature stability. | Fully operationalized production blueprint across 19 sequential execution phases. |

---

## 2. Identified Theoretical & Practical Gaps

1. **Spatio-Temporal Data Leakage**: Standard machine learning workflows use random K-Fold cross-validation, which inadvertently incorporates future transaction data to predict past valuation prices ($t_{\text{train}} > t_{\text{test}}$).
2. **Static Ensemble Failure in Dynamic Regimes**: Existing multi-model ensembles (Deng & Zhang 2025) use fixed equal weights or static meta-learners. During macroeconomic shocks, market corrections, or hyper-growth cycles, learner performance diverges significantly, causing static ensembles to sub-optimize.
3. **Absence of Calibrated Uncertainty**: Point-estimate models provide single scalar outputs without reliability bounds. Real estate financial transactions require mathematically guaranteed decision-grade prediction intervals.
4. **Lack of Actionable Counterfactual Reasoning**: Existing XAI techniques (SHAP, PDP) explain feature importance globally or locally, but fail to provide actionable sensitivity bounds for property owners (e.g., "What is the expected valuation delta if 1 bathroom is added or transit distance is reduced?").

---

## 3. AST-XGB Technical Breakthroughs

- **Leakage-Free Spatio-Temporal Engine**: Strict point-in-time calculation enforcing $t_{\text{obs}} < t_{\text{eval}}$ for all rolling spatial rollups, momentum signals, and dynamic neighborhood comparables.
- **Adaptive Market-Regime GMM Softmax Ensemble**: Gaussian Mixture Model clustering of 5D market state vectors $z_t$ paired with real-time error-loss Softmax re-weighting of base estimators.
- **Decision-Grade Conformal Prediction**: Split Conformal Quantile Predictor generating guaranteed 90% prediction intervals $[\hat{y} - q_{0.90}, \hat{y} + q_{0.90}]$.
- **Constrained Counterfactual Simulator**: Local optimization operator $\Delta \hat{y} = f(x + \Delta x) - f(x)$ enforcing physical and legal domain constraints $\mathcal{S}_{\text{feasible}}$.
