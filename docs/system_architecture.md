# System Architecture Specification

**Project:** AST-XGB Real Estate Property Price Valuation System  
**Author:** Apoorv Mishra  

---

## 1. Architectural Principles

The AST-XGB framework is built on four core design principles:
1. **Target Leakage Isolation**: Data preprocessing, feature engineering, and inference pipelines strictly enforce the total absence of target-derived variables (`rental_yield_pct`, `derived_rental_yield_log1p`, `target_locality_median_ppsf`).
2. **Temporal Validity**: Data splits and macro-economic joins strictly preserve chronological ordering ($T_{\text{train}} < T_{\text{val}} < T_{\text{test}}$).
3. **Distribution-Free Uncertainty**: Machine learning point estimates are paired with mathematically guaranteed **Inductive Split Conformal Prediction Intervals** (90% confidence).
4. **Modularity & Separation of Concerns**: Inference logic (`src/models/inference.py`), API routing (`backend/app/routers/`), and presentation (`frontend/src/App.tsx`) operate independently.

---

## 2. Pipeline Stage Breakdown

### Stage A: Ingestion & Feature Engineering (`data/features/final_features_v4.csv`)
*   **Property Micro-Attributes**: Built-up area, BHK count, bathrooms, floor level, total floors, project age, furnishing, facing direction.
*   **Spatial POI Distances**: Haversine distance calculations to schools, hospitals, metro stations, railway stations, malls, parks, transit hubs, and composite accessibility score.
*   **Rental Market Integration**: Locality median rent, median rent/sqft, rental listing counts, historical rental yield proxy (`historical_rental_yield_pct`).
*   **Macro-Economic Integration**: NHB HPI indices, RBI repo rates, bank rates, CRR, SLR, MoSPI CPI inflation indices.
*   **RERA Regulatory Integration**: Project completion percentages, construction duration, developer project counts, lapsed project ratios.
*   **CPCB Environmental Integration**: Station AQI, PM2.5, PM10, 30-day and 90-day moving averages.

---

### Stage B: Chronological Splitting Engine (`data/splits/`)
*   **Primary Strategy**: Chronological Temporal Split ($n = 14,021$).
    *   Train: 9,814 listings (70%)
    *   Validation / Calibration: 2,103 listings (15%)
    *   Test: 2,104 listings (15%)
*   **Overlap Verification**: 0 property ID overlap across partitions.

---

### Stage C: Model Selection & Tuning (`models/xgboost_final_v4/`)
*   **Algorithm**: `xgb.XGBRegressor` fit on log-transformed price $\ln(1 + \text{price\_inr})$.
*   **Hyperparameter Optimization**: 30 Optuna trials tuning depth, learning rate, subsample, colsample_bytree, and regularization penalties (`reg_alpha`, `reg_lambda`).
*   **ColumnTransformer Preprocessing**: Fitted strictly on training set data with `SimpleImputer`, `StandardScaler`, and `OneHotEncoder`.

---

### Stage D: Conformal Uncertainty & Explainability Engine
*   **Split Conformal Prediction**: Calibrated non-conformity threshold $q_{0.90} = \text{₹}58,76,387.66$ computed on validation set.
*   **TreeExplainer SHAP**: Computes global and local feature attributions without data snooping.

---

### Stage E: Production Inference & Service Layer
*   **Inference Module**: [`src/models/inference.py`](file:///c:/Users/apoorv%20mishra/Desktop/Ml_project/src/models/inference.py)
*   **FastAPI REST API**: [`backend/app/main.py`](file:///c:/Users/apoorv%20mishra/Desktop/Ml_project/backend/app/main.py) (Sub-50ms latency, Pydantic input validation, CORS, clean JSON error handling).
*   **Vite React Frontend**: [`frontend/src/App.tsx`](file:///c:/Users/apoorv%20mishra/Desktop/Ml_project/frontend/src/App.tsx) (Dark glassmorphism UI, client-side input validation, INR currency formatting, TreeSHAP charts, counterfactual simulator).
