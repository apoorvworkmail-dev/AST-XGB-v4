# AST-XGB v4 — Phase 0 Product Audit

**Audit Date:** 2026-10-25
**Repository:** `AST-XGB-v4` — `c:\Users\apoorv mishra\Desktop\Ml_project`
**Purpose:** Establish a verified current-state baseline before evolving towards an Indian real-estate discovery and AI valuation platform. No production behavior was changed during this audit.

---

## 1. Executive Summary

The AST-XGB v4 repository is a **functional ML research system** with a working FastAPI backend, a React 18/Vite frontend, and a trained XGBoost model. The backend inference pipeline, all 4 REST endpoints, and the frontend build all pass their test suites. However, multiple claimed capabilities are **mocked, hard-coded, or structurally missing** — notably SHAP (wired to a formula, not TreeExplainer), market regime detection (static fixture), and the What-If Simulator (local multiplier math, not the model). The README's performance claims differ materially from the `model_metadata.json` ground truth.

---

## 2. Stack Verification

| Claimed | Verified |
|---|---|
| React 18 | ✅ React 18.2.0 (`frontend/package.json`) |
| TypeScript 5 | ✅ TypeScript 5.0.2 |
| Vite 4 | ✅ Vite 4.4.5 |
| FastAPI | ✅ FastAPI >=0.100.0 (`requirements.txt`) |
| Python 3.11 | ✅ Python 3.11.5 (`model_metadata.json`) |
| XGBoost 2.0 | ⚠️ `requirements.txt` says >=2.0.0, but model was trained on **XGBoost 3.2.0** |
| Pydantic 2 | ✅ Pydantic >=2.0.0 (but schemas use **v1-style** `@validator`, `Field(example=)`, `class Config` — 26 deprecation warnings) |
| LightGBM, CatBoost, MLP, RF, GBR | ✅ `.pkl` files present in `models/multi_model/` |
| SHAP (TreeExplainer) | ❌ Not wired in production API — `/explain` uses a hand-written formula |
| GMM Regime Detection | ❌ Not wired in production API — `active_market_regime` is hard-coded `"Stable"` |
| Conformal calibration from file | ⚠️ Loaded from `results/phase_19_calibration_summary.csv` if it exists; falls back to hard-coded constant |

---

## 3. Backend Route Inventory

All routes registered under prefix `/api/v1`:

| Method | Path | Router File | Data Source | Status |
|---|---|---|---|---|
| GET | `/` | `main.py` | Static JSON | ✅ VERIFIED |
| GET | `/health` | `main.py` | `pipeline_instance._is_loaded` | ✅ VERIFIED |
| GET | `/api/v1/health` | `main.py` | Same as above | ✅ VERIFIED |
| POST | `/api/v1/predict` | `routers/predict.py` | **Real XGBoost model** + multi-model registry | ✅ VERIFIED |
| POST | `/api/v1/explain` | `routers/explain.py` | **Hardcoded formula** (not TreeSHAP) | ⚠️ MOCKED |
| POST | `/api/v1/counterfactual` | `routers/counterfactual.py` | **Real model** (3 perturbed predictions) | ✅ VERIFIED |
| GET | `/api/v1/market-state` | `routers/market.py` | **Static fixture dict** in code | ⚠️ STATIC FIXTURE |

### Request / Response Schemas (`backend/app/schemas.py`)

**`PropertyInputSchema`** (POST body):
`builtup_area_sqft`, `area`, `bhk`, `bedrooms`, `bathrooms`, `property_type`, `city`, `project_age`, `age`, `floor_no`, `total_floors`, `parking`, `furnishing`, `facing`, `locality`, `latitude`, `longitude`, `selected_models`, `ensemble_method`

Valid cities: `Bengaluru, Chennai, Delhi, Delhi NCR, Hyderabad, Kolkata, Mumbai, Pune`
Valid property types: `Apartment, Independent House, Penthouse, Villa, Builder Floor`

**`PredictionResponseSchema`** (POST /predict response):
`predicted_price_inr`, `predicted_price_formatted`, `price_per_sqft`, `conformal_lower_90_inr/upper_90_inr`, `active_market_regime` (hard-coded `"Stable"`), `regime_confidence` (hard-coded `0.942`), `latency_ms`, `model_version`, `feature_version`, `validation_warnings`, `multi_model_results`

---

## 4. Frontend Page and Component Inventory

### Navigation Tabs (sidebar, `App.tsx` L338-360)

| Tab ID | Label | Component | Backend Data | Fallback |
|---|---|---|---|---|
| `Overview` | Overview | Inline JSX in `App.tsx` | `prediction` state (real) | Hard-coded `1.04 Cr`, `20.81 ms`, etc. |
| `Prediction` | Price Prediction | Inline JSX in `App.tsx` | `prediction`, `shapPositives/Negatives`, `scenarios` (real) | Hard-coded sample values |
| `Analysis` | Property Deep-Dive | `PropertyAnalysisView.tsx` | Props passed from `App.tsx` | Uses `10400000` default |
| `Market` | Market Trends | `MarketInsightsView.tsx` | `/api/v1/market-state` (static fixture) | Inline `defaultCityPrices` array |
| `Simulator` | What-If Simulator | `WhatIfSimulatorView.tsx` | **None — local multiplier math** | Always local computation |
| `Saved` | Saved Properties | `SavedPropertiesView.tsx` | `localStorage` | 2 hard-coded default properties |
| `Settings` | Settings | `SettingsView.tsx` | `/health` for diagnostics | Offline message |

### Component Audit

| Component | File | Size | Verified Functionality |
|---|---|---|---|
| `ModelSelectionPanel` | `ModelSelectionPanel.tsx` | 8.7 KB | ✅ Checkbox UI for 7 models + ensemble method toggle |
| `MultiModelComparisonView` | `MultiModelComparisonView.tsx` | 23.6 KB | ✅ Renders real API `multi_model_results` data |
| `PropertyAnalysisView` | `PropertyAnalysisView.tsx` | 12.1 KB | ⚠️ Uses prediction props; stat cards use hard-coded market comparables |
| `MarketInsightsView` | `MarketInsightsView.tsx` | 12.7 KB | ⚠️ Fetches `/market-state` (fixture); fallback duplicates same fixture |
| `WhatIfSimulatorView` | `WhatIfSimulatorView.tsx` | 11.4 KB | ❌ Fully local calculation — does NOT call the model |
| `SavedPropertiesView` | `SavedPropertiesView.tsx` | 8.3 KB | ✅ localStorage CRUD, CSV export work |
| `SettingsView` | `SettingsView.tsx` | 8.3 KB | ✅ Theme toggle, diagnostics health check work |
| `ApiDocsView` | `ApiDocsView.tsx` | 7.8 KB | ✅ Live test runner against real API |
| `ReportsView` | `ReportsView.tsx` | 26.3 KB | ⚠️ Renders figure metadata only — images reference `figures/` PNG paths, not embedded |

### Data and Utility Files

| File | Purpose | Status |
|---|---|---|
| `frontend/src/data/cityLocalities.ts` | Lookup of localities by city (36.9 KB) | ✅ Populated, used in city-change handler |
| `frontend/src/utils/api.ts` | API URL resolution, fetch wrapper, health check | ✅ Verified |

**API utility routing:** On localhost tries Vite proxy first, falls back to `http://localhost:8000/api/v1`. On production (Vercel) hits `https://ast-xgb-v4.onrender.com/api/v1` directly. No secrets in bundle.

---

## 5. Model and Inference Pipeline Audit

### Model Artifact Inventory

| File | Size | Description |
|---|---|---|
| `models/xgboost_final_v4/final_xgboost_model.pkl` | 1.19 MB | Optuna-tuned XGBoost regressor (Phase 15, XGBoost 3.2.0) |
| `models/xgboost_final_v4/preprocessing_pipeline.pkl` | 9.98 KB | Fitted `ColumnTransformer` for 86 features |
| `models/xgboost_final_v4/model_metadata.json` | 851 B | Ground-truth metrics: R2=0.3943, MAPE=39.96% |
| `models/multi_model/xgboost.pkl` | 451 KB | Secondary XGBoost for registry |
| `models/multi_model/lightgbm.pkl` | 410 KB | LightGBM |
| `models/multi_model/catboost.pkl` | 242 KB | CatBoost |
| `models/multi_model/random_forest.pkl` | 12.2 MB | Random Forest (largest artifact) |
| `models/multi_model/gradient_boosting.pkl` | 373 KB | Gradient Boosting |
| `models/multi_model/linear_regression.pkl` | 27 KB | OLS Linear Regression |
| `models/multi_model/mlp.pkl` | 2.58 MB | MLP Neural Net |
| `models/multi_model/preprocessing_pipeline.pkl` | 32.9 KB | Shared preprocessor for multi-model |
| `models/multi_model/multi_model_leaderboard.json` | 1.7 KB | Benchmark metrics per model |

### What IS Real vs. What Is Mocked

| Capability | Reality |
|---|---|
| `/predict` price point | ✅ **REAL** — XGBoost model inference |
| `/predict` multi-model ensemble | ✅ **REAL** — 7 model PKLs loaded; falls back to multiplier if PKL missing |
| Conformal interval (90%) | ⚠️ **PARTIALLY REAL** — correct margin constant, applied additively (not per-input calibrated) |
| `/explain` SHAP drivers | ❌ **MOCKED** — formula: `area_shap = (area - 1200) * 280 + 450000`; not TreeSHAP |
| `/counterfactual` what-if scenarios | ✅ **REAL** — 3 genuine model re-inferences with perturbed inputs |
| Market regime detection | ❌ **MOCKED** — always returns `"Stable"` / `"Growth"` from static dict |
| What-If Simulator tab | ❌ **LOCAL ONLY** — multiplier math, not a model call |
| GMM regime classifier | ❌ **NOT WIRED** — `regime_gmm.py` exists in `src/models/` but is not called by API |
| Adaptive ensemble (softmax weighting) | ❌ **NOT WIRED** — `adaptive_ensemble.py` exists but not imported by any router |

---

## 6. True Model Performance (Ground Truth)

From `models/xgboost_final_v4/model_metadata.json`:

| Metric | Actual Value | README Claims |
|---|---|---|
| MAE | Rs.42,85,145 | Rs.42,85,419.50 (~match) |
| RMSE | Rs.1,44,08,575 | Not prominently shown |
| R2 | **0.3943** | **0.4099** <- discrepancy |
| MAPE | **39.96%** | **39.50%** <- discrepancy |
| MedAE | Rs.13,40,292 | Rs.13,40,000 (~match) |
| Conformal q90 | Rs.58,76,387.66 | Rs.58,76,387.66 (match) |
| Training rows | 11,917 | — |
| Test rows | 2,104 | 2,104 (match) |

> [!WARNING]
> The README claims R2=0.4099 but the model artifact metadata records R2=0.3943. MAPE discrepancy is 39.50% vs 39.96%. Do not modify the model or retrain — note the discrepancy only.

---

## 7. Baseline Test Results

### Test Run 1 — backend/tests + Phase 21/22 suites
```
Command: python -m pytest backend/tests/test_api.py tests/test_phase21_inference.py tests/test_phase22_backend_api.py -v
Result:  20 passed in 33.43s
```

### Test Run 2 — All tests/ (6 test files)
```
Command: python -m pytest tests/ -v --tb=short
Result:  25 passed in 26.24s
```

| Suite | Tests | Result |
|---|---|---|
| `test_phase21_inference.py` | 6 | ✅ PASS |
| `test_phase22_backend_api.py` | 9 | ✅ PASS |
| `test_phase24_integration.py` | 6 | ✅ PASS |
| `test_phase26_deployment.py` | 3 | ✅ PASS |
| `test_phase27_documentation.py` | 1 | ✅ PASS |

> [!NOTE]
> `test_phase25_audit.py` has NO pytest-collectible functions (all named `audit_*`, not `test_*`). Run as: `python tests/test_phase25_audit.py`

### Test Run 3 — Frontend Build
```
Command:  npm run build   (from frontend/)
Result:   Exit 0 in 6.18s — 1259 modules transformed
Artifacts:
  dist/assets/index-2474659e.js   274.54 kB (gzip 77.07 kB)
  dist/assets/index-660cfd87.css   16.85 kB (gzip 3.65 kB)
TypeScript: 0 errors.
```

### Non-blocking Warnings
26 Pydantic v1 deprecation warnings from `backend/app/schemas.py`:
- `@validator` should be `@field_validator`
- `Field(example=...)` should use `json_schema_extra`
- `class Config` should be `model_config = ConfigDict(...)`

---

## 8. Security Audit

| Check | Result |
|---|---|
| Secrets in frontend bundle | ✅ SAFE — only public Render URL embedded |
| `.env` in `.gitignore` | ✅ `.env` and `.env.local` are gitignored |
| `.env.production` committed | ⚠️ Committed but contains only public URL — acceptable |
| Hardcoded local paths in `src/` or `backend/` | ✅ None found (test_phase26 confirmed) |
| Path traversal via invalid city input | ✅ Returns 422 (Pydantic validator) |
| Stack trace exposure on 500 errors | ✅ Global exception handler returns clean JSON |
| Model path user override | ✅ Not possible — paths relative to `BASE_DIR` only |

---

## 9. Identified Defects

| ID | Severity | Location | Description |
|---|---|---|---|
| D-01 | HIGH | `routers/explain.py` | SHAP endpoint returns formula-computed values, not real TreeSHAP |
| D-02 | HIGH | `WhatIfSimulatorView.tsx` | What-If Simulator tab uses local multipliers, not the model |
| D-03 | MEDIUM | `routers/predict.py` L83-84 | `active_market_regime` hard-coded `"Stable"`, `regime_confidence` hard-coded `0.942` |
| D-04 | MEDIUM | `routers/market.py` | All market state figures are a static fixture in code, not computed |
| D-05 | MEDIUM | `backend/app/schemas.py` | 26 Pydantic v1 deprecation warnings, will break on Pydantic v3 |
| D-06 | LOW | `README.md` | R2=0.4099 conflicts with model_metadata.json R2=0.3943 |
| D-07 | LOW | `routers/predict.py` L64-65 | Conformal bounds applied as flat +/-Rs.58.76L regardless of input |
| D-08 | LOW | `src/models/` | `regime_gmm.py` and `adaptive_ensemble.py` exist but are never imported by any router |
| D-09 | LOW | `ReportsView.tsx` | References `figures/` PNG paths not served by Vite dev server |
| D-10 | LOW | `vite.config.ts` vs README | Dev server is port 3000; README says 5173 |

---

## 10. Functionality Status Matrix

| Feature | Status | Evidence |
|---|---|---|
| Property price prediction (XGBoost) | ✅ VERIFIED | Model PKL loaded, inference runs, tests pass |
| Multi-model ensemble (7 models) | ✅ VERIFIED | All 7 PKLs present, loaded in `MultiModelRegistry` |
| 90% Conformal prediction interval | ⚠️ PARTIAL | Correct margin, but flat (not per-input); calibration CSV may not exist |
| SHAP feature attribution | ❌ MOCKED | `/explain` returns formula output, not TreeSHAP |
| GMM regime detection | ❌ NOT WIRED | `regime_gmm.py` exists, never called |
| Counterfactual simulation | ✅ VERIFIED | `/counterfactual` calls real model x4 |
| Market macro state API | ⚠️ STATIC | `/market-state` returns hard-coded dict |
| What-If Simulator (frontend) | ❌ LOCAL ONLY | No model call; multiplier math only |
| Saved Properties (localStorage) | ✅ VERIFIED | CRUD + CSV export functional |
| Dark/Light theme toggle | ✅ VERIFIED | `data-theme` attribute on root div |
| Report export (text file download) | ✅ VERIFIED | `handleExportReport` generates `.txt` |
| Share results (clipboard) | ✅ VERIFIED | `navigator.clipboard.writeText` |
| API health check and auto-reconnect | ✅ VERIFIED | 5-second polling when OFFLINE |
| City-locality auto-population | ✅ VERIFIED | `CITY_LOCALITIES` data file drives dropdown |
| Docker deployment config | ✅ VERIFIED | `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml` valid |
| Vercel deployment config | ✅ VERIFIED | `frontend/vercel.json`, root `vercel.json` present |

---

## 11. Architecture (Verified)

```
+--------------------------------------------------------------+
| FRONTEND  React 18 + TypeScript + Vite 4                     |
| Entry: frontend/src/main.tsx -> App.tsx (1405 lines)         |
| Port: localhost:3000 (vite.config.ts)                        |
|                                                              |
| 7 Nav Tabs: Overview | Prediction | Analysis |               |
|             Market | Simulator | Saved | Settings            |
| 9 Component files in frontend/src/components/               |
| 1 Data file: cityLocalities.ts (36.9 KB)                    |
| 1 Util file: api.ts (env-aware fetch wrapper)               |
+--------------------------------------------------------------+
                   | HTTP/HTTPS
+--------------------------------------------------------------+
| BACKEND  FastAPI + Uvicorn  Port 8000                        |
| Entry: backend/app/main.py                                   |
|                                                              |
| POST /api/v1/predict        -> routers/predict.py            |
| POST /api/v1/explain        -> routers/explain.py  [MOCKED]  |
| POST /api/v1/counterfactual -> routers/counterfactual.py     |
| GET  /api/v1/market-state   -> routers/market.py  [STATIC]   |
| GET  /api/v1/health         -> main.py                       |
+--------------------------------------------------------------+
                   | joblib.load()
+--------------------------------------------------------------+
| ML ARTIFACTS                                                 |
| models/xgboost_final_v4/                                     |
|   final_xgboost_model.pkl     1.19 MB  <- PRIMARY MODEL      |
|   preprocessing_pipeline.pkl  9.98 KB  <- ColumnTransformer  |
|   model_metadata.json                  <- Metrics registry   |
| models/multi_model/   (9 files, 7 model PKLs + leaderboard)  |
+--------------------------------------------------------------+
```

---

## 12. What Must Not Be Removed

1. `models/xgboost_final_v4/` — Primary production model artifacts (3 files)
2. `models/multi_model/` — All 9 multi-model artifacts
3. `src/models/inference.py` — `ProductionInferencePipeline` and `pipeline_instance` singleton
4. `src/models/multi_model_registry.py` — `MultiModelRegistry` and `multi_model_registry` singleton
5. `backend/app/routers/predict.py` — `/api/v1/predict` handler
6. `backend/app/routers/counterfactual.py` — `/api/v1/counterfactual` handler
7. `backend/app/schemas.py` — Input validation and leakage prevention logic
8. `frontend/src/data/cityLocalities.ts` — City-locality mapping
9. All test files in `tests/` and `backend/tests/`
10. `results/phase_19_calibration_summary.csv` — Conformal calibration data
11. All model training methodology files in `src/`, `notebooks/`, `experiments/`

---

## 13. Implementation Priorities (Magicbricks-Inspired Evolution)

### Priority 1 — Fix Core Integrity Gaps

| Task | Defect |
|---|---|
| Wire real TreeSHAP into `/explain` using `shap.TreeExplainer(pipeline_instance.model)` | D-01 |
| Migrate `backend/app/schemas.py` to Pydantic v2 (`@field_validator`, `model_config`) | D-05 |
| Correct R2/MAPE figures in README and UI to match model_metadata.json | D-06 |

### Priority 2 — Expand Data and Discovery Layer

| Task |
|---|
| Add property search/discovery API endpoint with filters (city, BHK, price range, locality) |
| Add a listings dataset (static or live) to power a browse/search experience |
| Implement real NHB HPI + RBI repo rate fetch for market state |

### Priority 3 — UI/UX Evolution (Magicbricks-Inspired)

| Task |
|---|
| Property listing cards with gallery, filters, map pins |
| Search bar with locality/city/BHK autocomplete |
| Valuation report PDF export (replace current .txt download) |
| Map integration (Leaflet.js) showing listing pins and locality heat-map |
| Mobile responsiveness audit and CSS grid breakpoints |

### Priority 4 — Backend Hardening

| Task |
|---|
| Wire GMM regime classifier (`regime_gmm.py`) into `/predict` response |
| Per-input conformal bounds (replace flat +/-Rs.58.76L) |
| Add `catboost>=1.2.0` to requirements.txt (PKL exists but package not listed) |
| Add rate limiting and request logging middleware |

---

## 14. Commands to Run the Project

### Backend (FastAPI)
```powershell
python -m uvicorn backend.app.main:app --reload --port 8000
```
Swagger UI: http://localhost:8000/docs

### Frontend (Vite Dev Server)
```powershell
cd frontend
npm run dev
```
App: http://localhost:3000

### Both Together (Concurrently via npm)
```powershell
cd frontend
npm run dev
```

### Run All Tests
```powershell
python -m pytest tests/ -v
python -m pytest backend/tests/test_api.py -v
python tests/test_phase25_audit.py
```

### Frontend Build (Production)
```powershell
cd frontend
npm run build
```

### Docker Full Stack
```powershell
docker-compose up --build -d
```

---

## 15. Known Open Risks

| Risk | Mitigation |
|---|---|
| XGBoost version mismatch (trained on 3.2.0, requirements.txt says >=2.0.0) | Pin `xgboost==3.2.0` in requirements |
| `results/phase_19_calibration_summary.csv` may not exist in clean clone | Commit the file or document the fallback |
| Pydantic v1 style will break on Pydantic v3 | Migrate to v2 style validators |
| Render free-tier cold starts (30+ seconds) | Already handled with 3-retry health check |
| No CatBoost in requirements.txt | Add `catboost>=1.2.0` |
| `frontend/.env.production` committed to git | Acceptable — no secrets, only public URL |

---

*Audit completed. No production behavior was modified. All baseline test/build results are real execution outputs recorded above.*
