# Phase 17 — Publication Figure Captions Documentation
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  

---

### Figure 1: Complete System Architecture (AST-XGB Pipeline)
*   **Caption:** Architectural workflow showing multi-source data ingestion (MagicBricks, CPCB, RBI, MoSPI, RERA), cleaning, feature group structuring, leakage-safe partitioning, XGBoost Optuna hyperparameter tuning, and TreeExplainer SHAP explainability.
*   **Data Source:** Pipeline Architecture.

### Figure 2: Data Processing & Integration Pipeline
*   **Caption:** Step-by-step data engineering pipeline ensuring 14,021 unique property listings, pre-join RERA aggregation, spatial Haversine distance matching, and $t-1$ lag environmental/macroeconomic joins.
*   **Data Source:** Data Pipeline Architecture.

### Figure 3: Target Price Distribution Analysis
*   **Caption:** Distribution of raw property sale prices in INR (Panel A) highlighting positive right-skewness, and log1p-transformed target distribution (Panel B) demonstrating log-normal approximation for model fitting.
*   **Data Source:** `final_features_v4.csv` (14,021 properties).

### Figure 4: Property Price Distribution across Major Indian Cities
*   **Caption:** Boxplot distributions of property prices across 7 major Indian cities (Mumbai, Bengaluru, Delhi, Pune, Chennai, Hyderabad, Kolkata) without outliers.
*   **Data Source:** `final_features_v4.csv`.

### Figure 5: Association between Property Characteristics and Price
*   **Caption:** Bivariate relationships demonstrating associations between property prices and built-up area (Panel A), BHK count (Panel B), bathroom count (Panel C), and building floor count (Panel D).
*   **Data Source:** `final_features_v4.csv`.

### Figure 6: Spatial Infrastructure Relationships with Property Price
*   **Caption:** Scatter plots showing observed property prices relative to nearest metro station distance (Panel A) and spatial accessibility score (Panel B).
*   **Data Source:** Spatial POI features.

### Figure 7: Legitimate Rental Market Feature Relationships
*   **Caption:** Scatter plot of locality median monthly rent vs property sale price (Panel A) and distribution of the rebuilt leakage-free historical rental yield proxy (Panel B).
*   **Data Source:** `final_features_v4.csv`.

### Figure 8: Historical NHB Housing Price Index Trend
*   **Caption:** Quarterly aggregate trend of National Housing Bank (NHB) HPI index across the dataset listing timeline (2018–2022).
*   **Data Source:** NHB HPI Time Series.

### Figure 9: Macroeconomic Indicators Alignment
*   **Caption:** Alignment of monthly RBI repo rate changes (%) and MoSPI Consumer Price Index (CPI) across property listing dates.
*   **Data Source:** RBI & MoSPI Data.

### Figure 10: Integrated RERA Feature Distributions
*   **Caption:** Distribution of RERA project completion rates (Panel A) and breakdown of listings across RERA project statuses (Panel B).
*   **Data Source:** Integrated RERA dataset.

### Figure 11: CPCB Environmental Feature Integration
*   **Caption:** Property exposure to CPCB Air Quality Index (AQI) levels (Panel A) and association between 30-day rolling AQI and sale price (Panel B).
*   **Data Source:** CPCB Monthly Station Data.

### Figure 12: Model Performance Comparison
*   **Caption:** Comparative performance of 7 valuation models evaluated on the primary temporal test set across MAE (Panel A), RMSE (Panel B), $R^2$ (Panel C), and MAPE (Panel D).
*   **Data Source:** `phase_15_model_comparison.csv`.

### Figure 13: Actual vs Predicted Price (Optimized XGBoost v4)
*   **Caption:** Scatter plot of actual vs predicted sale prices in ₹ Lakhs for the final optimized XGBoost model evaluated on the untouched temporal test set (2,104 properties).
*   **Data Source:** `phase_15_final_predictions.csv`.

### Figure 14: Residual Analysis
*   **Caption:** Comprehensive residual error plots showing residual histogram (14A), residual vs predicted price (14B), residual vs actual price (14C), and residual vs built-up area (14D).
*   **Data Source:** `phase_15_final_predictions.csv`.

### Figure 15: Top 20 Global Features by Mean |SHAP Value|
*   **Caption:** Horizontal bar chart ranking top 20 features by global SHAP TreeExplainer importance on the temporal test set.
*   **Data Source:** `phase_16_top_features.csv`.

### Figure 16: SHAP Feature Group Importance Breakdown
*   **Caption:** Aggregate percentage contribution of 8 domain feature groups to total model predictive variance.
*   **Data Source:** `phase_16_shap_feature_groups.csv`.

### Figure 17–19: Segmented Model Performance (City, Property Type, Price Segment)
*   **Captions:** Model error breakdowns across individual cities (Fig 17), property types (Fig 18), and price valuation tiers (Fig 19).
*   **Data Source:** `phase_15_final_predictions.csv`.

### Figure 20: Generalization Performance across Evaluation Split Strategies
*   **Caption:** Comparison of model test set MAE across Temporal backtest, Random i.i.d., and Geographic hold-out (Pune & Kolkata) splits.
*   **Data Source:** `phase_15_model_comparison.csv`.

### Figure 21–24: Dataset Descriptive Figures
*   **Captions:** Feature group coverage (Fig 21), master missingness overview (Fig 22), temporal listing volume coverage (Fig 23), and city sample volume coverage (Fig 24).
*   **Data Source:** `final_features_v4.csv`.

### Figure 25–26: Error Distributions (City & Property Type)
*   **Captions:** Boxplot distributions of absolute prediction errors across cities (Fig 25) and property types (Fig 26).
*   **Data Source:** `phase_15_final_predictions.csv`.

### Figure 27: Comparison of XGBoost Native Gain Importance vs TreeExplainer SHAP
*   **Caption:** Dual axis chart comparing tree-native gain metrics against SHAP mean absolute attribution scores for top features.
*   **Data Source:** XGBoost Booster & SHAP.

### Figure 28: Future Research Experiments Manifest
*   **Caption:** Status manifest designating pending future phases (Ablation, Uncertainty Quantiles, DiCE Recourse, AST-XGB Graph Attention).
