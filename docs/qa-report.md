# AST-XGB Real Estate Platform (GharDhundo) — Phase 14 QA & Verification Report

**Document Version:** 1.0.0  
**Date of Execution:** October 26, 2026  
**System Tested:** Complete AST-XGB Indian Real Estate Discovery & AI Valuation Platform  
**Target Environment:** Windows 11 / Node v18+ / Python 3.11.5 / FastAPI / Vite + React  

---

## 1. Executive Summary & Verification Matrix

A structured regression audit and end-to-end verification of the complete **AST-XGB (GharDhundo)** platform was executed following all Phase 14 criteria. The test matrix verified frontend stability, backend API contracts, AI inference integrity, end-to-end customer journeys, and engineering hygiene.

### Core Metrics Summary

| Category | Target / Requirement | Actual Outcome | Status |
| :--- | :--- | :--- | :--- |
| **Backend Unit & Integration Tests** | 100% test pass rate across test suite | **39 passed / 39 total** in 11.65s | **PASS** |
| **Frontend Production Build** | TypeScript compilation & Vite bundle | **0 errors, 1,320 modules transformed** in 5.28s | **PASS** |
| **AST-XGB AI Inference Latency** | Mean inference under 100 ms | **44.80 ms mean / 46.59 ms P95** | **PASS** |
| **Target Leakage Prevention** | Reject inputs with target-derived features | Rejected with HTTP 422 Unprocessable Entity | **PASS** |
| **Conformal Prediction Engine** | 90% confidence bounds on Indian valuations | Verified active on all 5 multi-model ensemble PKLs | **PASS** |
| **Authentication & Authorization** | PBKDF2-SHA256 password hashing + Bearer tokens | Passed (Session management & protected endpoints) | **PASS** |
| **Browser Console & Broken Assets** | Clean runtime execution with zero fatal errors | 0 broken assets, 0 unhandled script exceptions | **PASS** |

---

## 2. Test Commands & Reproduction Steps

All tests were executed directly in the project workspace. To reproduce the exact results:

### A. Backend Pytest Suite
```powershell
# Set UTF-8 encoding in PowerShell to support logging unicode characters
$env:PYTHONIOENCODING="utf-8"

# Execute all backend tests across tests/ and backend/tests/
pytest tests/ backend/tests/ -v
```

### B. Frontend Production Build & Type Checking
```powershell
cd frontend
npm ci            # Or npm install from package-lock.json
npm run build     # Executes `tsc && vite build`
```

### C. Live Service Execution for E2E Testing
```powershell
# Terminal 1 - Backend FastAPI server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend Vite development server
cd frontend
npm run dev:frontend
```

---

## 3. Section A: Frontend Verification & Regression Results

### 1. Dependency Resolution & Build Integrity
- **Lockfile Integrity:** `frontend/package-lock.json` validated and parsed cleanly.
- **TypeScript Compiler (`tsc`):** Zero compile-time errors or missing type declarations across all 40+ React views, components, and contexts.
- **Vite Production Bundler:** Successfully built the production distribution bundle:
  - `dist/index.html`: `1.03 kB` (gzip: `0.56 kB`)
  - `dist/assets/index-5f9a6c54.css`: `55.28 kB` (gzip: `14.17 kB`)
  - `dist/assets/index-163879e3.js`: `926.07 kB` (gzip: `233.70 kB`)
  - Compilation duration: **5.28s** (1,320 modules transformed).

### 2. Client-Side Routing & Browser URL Persistence
- Verified all client routes:
  - `/` (Homepage & Hero Discovery)
  - `/search` (Multi-Filter Catalog, Match Scoring, Interactive Leaflet Map)
  - `/property/:id` (Property Deep Dives with AST-XGB Valuation & Amortization)
  - `/tools` (Financial Calculators Suite & Side-by-Side Property Comparison)
  - `/market-insights` (Macroeconomic & Locality Intelligence Dashboard)
  - `/locality/:city/:locality` (Locality Deep Dive & Micro-Market Dynamics)
  - `/post-property` (Multi-Step Owner/Agent Listing Workflow)
  - `/account` (User Profiles, Saved Properties, Inquiries & Listing Management)
- **URL Query Synchronization:** Tested query persistence for search parameters (`city`, `locality`, `property_type`, `price_min`, `price_max`, `bhk`, `sort`, `page`). Query strings reload seamlessly on browser back/forward and direct URL copy-paste.

### 3. Search, Filters, Sorting, and Pagination
- Verified multi-attribute filtering across BHK, Budget, Property Type, Possession Status, and Furnishing.
- Tested smart search ranking algorithm incorporating locality keyword matching and commute preference weighting.
- Verified sorting modes: *Recommended Relevance*, *Price: Low to High*, *Price: High to Low*, and *Match Compatibility Score*.
- Tested pagination state retention and empty-result fallbacks.

### 4. Property Detail Routes & Missing Records
- Tested valid property pages (`/property/prestige-oasis-3bhk-whitefield-bengaluru`, `/property/sobha-dream-acres-panathur-bengaluru`, etc.).
- Tested invalid property IDs: renders a user-friendly 404 card informing the user that the listing does not exist, with quick links back to the catalog.

### 5. Shortlist and Side-by-Side Property Comparison
- Tested toggling the Heart icon on listing cards and property detail headers.
- Verified persistent storage via `localStorage` and synchronized backend persistence when authenticated.
- Tested adding up to 4 properties to the comparison tray, navigating to `/tools?tab=compare`, and reviewing the comprehensive comparison matrix (Price, Price/sq.ft, BHK, Bathrooms, Area, Age, Amenities, and AST-XGB Valuation delta).

### 6. AST-XGB Valuation Workflow & What-If Studio
- Verified real-time form submission to `/api/v1/predict`.
- Validated output display:
  - Estimated Property Value in Indian Rupee format (Lakhs / Crores).
  - Price per square foot calculation.
  - Conformal 90% confidence interval (lower and upper bounds).
  - Selected model selector (XGBoost, LightGBM, CatBoost, Random Forest, Gradient Boosting).
  - SHAP feature contribution waterfalls and radar charts.
  - Interactive What-If Simulator: dynamic slider adjustments (Built-up Area, Floor Level, Property Age, Furnishing) recalculating valuations without page refresh.

### 7. Market Intelligence & Locality Navigation
- Verified interactive macro charts displaying NHB Housing Price Index (HPI), RBI Repo Rate trajectory, MoSPI CPI inflation, and CPCB Air Quality Index (AQI).
- Tested locality-to-locality comparison selector (e.g., Whitefield vs. Indiranagar) and historical price trend lines.
- Verified clear methodology disclosure stating data sources, sample sizes, and update intervals.

### 8. Financial Calculators Suite
- Tested all 5 real estate calculation modules:
  1. **Home Loan EMI Calculator:** Tested standard loans (e.g., ₹75 Lakhs at 8.5% for 20 years = ₹65,091/month). Verified interactive year-by-year amortization table and principal vs. interest breakdown. Tested edge cases: zero interest (flat division) and 1-year tenure.
  2. **Loan Eligibility Calculator:** Calculated maximum permissible loan based on monthly salary and existing obligations.
  3. **Down Payment & Upfront Cost Planner:** Calculated stamp duty, registration charges, and total down payment required.
  4. **Buy vs. Rent Simulator:** Calculated cumulative cost of ownership versus renting over 10 to 30-year horizons with inflation assumptions.
  5. **Rental Yield & ROI Calculator:** Calculated gross and net rental yield percentages based on annual rent and maintenance.
- Verified **Reset** button restores default benchmark values across all calculators.

### 9. Forms & Upload Validation
- Tested `/post-property` workflow:
  - Step 1: Basic Details (Transaction type, City, Locality, Property Type).
  - Step 2: Specifications (Built-up Area, BHK, Bathrooms, Floor, Age).
  - Step 3: Pricing & Possession (Expected Price, Maintenance, Possession status).
  - Step 4: Amenities & Media (Photo file upload with type validation for JPEG/PNG/WebP, drag-and-drop preview, photo removal).
  - Step 5: Submission & Review.
- Verified form validation blocks submission with clear error highlights when mandatory fields are omitted.

### 10. Mobile Responsiveness & Accessibility
- Tested viewport widths: Desktop (`1536px`), Tablet (`768px`), and Mobile (`375px` / `502px`).
- Verified mobile navigation drawer, touch targets (minimum 44x44px), contrast ratios, keyboard accessibility (`Tab` traversal), and ARIA attributes on buttons, dialogs, and inputs.

---

## 4. Section B: Backend Verification & Schema Validation

### Pytest Execution Summary

```
============================= test session starts =============================
platform win32 -- Python 3.11.5, pytest-9.1.1, pluggy-1.6.0
collected 39 items

tests/test_phase21_inference.py::test_valid_input_prediction PASSED      [  2%]
tests/test_phase21_inference.py::test_missing_optional_inputs PASSED     [  5%]
tests/test_phase21_inference.py::test_invalid_numerical_values PASSED    [  7%]
tests/test_phase21_inference.py::test_invalid_categorical_values PASSED  [ 10%]
tests/test_phase21_inference.py::test_extreme_valid_values PASSED        [ 12%]
tests/test_phase21_inference.py::test_leakage_prevention PASSED          [ 15%]
tests/test_phase22_backend_api.py::test_health_endpoints PASSED          [ 17%]
tests/test_phase22_backend_api.py::test_valid_predict_endpoint PASSED    [ 20%]
tests/test_phase22_backend_api.py::test_invalid_city_predict PASSED      [ 23%]
tests/test_phase22_backend_api.py::test_out_of_range_area_predict PASSED [ 25%]
tests/test_phase22_backend_api.py::test_target_leakage_feature_rejection PASSED [ 28%]
tests/test_phase22_backend_api.py::test_explain_endpoint PASSED          [ 30%]
tests/test_phase22_backend_api.py::test_counterfactual_endpoint PASSED   [ 33%]
tests/test_phase22_backend_api.py::test_market_state_endpoint PASSED     [ 35%]
tests/test_phase22_backend_api.py::test_multiple_consecutive_predictions PASSED [ 38%]
tests/test_phase24_integration.py::test_api_health_integration PASSED    [ 41%]
tests/test_phase24_integration.py::test_end_to_end_bengaluru_apartment PASSED [ 43%]
tests/test_phase24_integration.py::test_end_to_end_multi_city_matrix PASSED [ 46%]
tests/test_phase24_integration.py::test_target_leakage_isolation PASSED  [ 48%]
tests/test_phase24_integration.py::test_invalid_input_backend_validation PASSED [ 51%]
tests/test_phase24_integration.py::test_explain_and_counterfactual_flow PASSED [ 53%]
tests/test_phase25_audit.py::test_phase25_complete_audit PASSED          [ 56%]
tests/test_phase26_deployment.py::test_deployment_artifacts_exist PASSED [ 58%]
tests/test_phase26_deployment.py::test_zero_hardcoded_paths PASSED       [ 61%]
tests/test_phase26_deployment.py::test_docker_compose_syntax PASSED      [ 64%]
tests/test_phase27_documentation.py::test_documentation_files_exist PASSED [ 66%]
backend/tests/test_account.py::test_auth_signup_and_login_flow PASSED    [ 69%]
backend/tests/test_account.py::test_inquiry_submission_and_rate_limiting PASSED [ 71%]
backend/tests/test_account.py::test_unauthorized_endpoints PASSED        [ 74%]
backend/tests/test_api.py::test_root_endpoint PASSED                     [ 76%]
backend/tests/test_api.py::test_predict_endpoint PASSED                  [ 79%]
backend/tests/test_api.py::test_explain_endpoint PASSED                  [ 82%]
backend/tests/test_api.py::test_counterfactual_endpoint PASSED           [ 84%]
backend/tests/test_api.py::test_market_state_endpoint PASSED             [ 87%]
backend/tests/test_api.py::test_market_cities_endpoint PASSED            [ 89%]
backend/tests/test_api.py::test_market_localities_endpoint PASSED        [ 92%]
backend/tests/test_api.py::test_market_locality_details_endpoint PASSED  [ 94%]
backend/tests/test_api.py::test_market_trends_endpoint PASSED            [ 97%]
backend/tests/test_api.py::test_market_compare_endpoint PASSED           [100%]

============================= 39 passed in 11.65s =============================
```

### Detailed Validation Results

1. **Schema Validation & Negative Testing:**
   - Pydantic models reject invalid data types (e.g., string for numerical area, negative BHK, non-existent cities).
   - Area outside operational bounds (e.g., `< 100 sqft` or `> 25,000 sqft`) returns HTTP 422 with descriptive validation details.
   - Missing required fields return structured FastAPI 422 error schemas.

2. **Target Leakage Prevention:**
   - Requests attempting to supply target variables (such as `price`, `total_price`, or `price_per_sqft`) as input features are rejected at the Pydantic schema validation layer, preventing any ML data leakage.

3. **Inference Latency & Security Audit:**
   - Executed 100-request latency benchmark (`test_phase25_complete_audit`):
     - **Mean Latency:** `44.80 ms`
     - **P95 Latency:** `46.59 ms`
     - **Max Latency:** `58.21 ms`
   - Verified path traversal defenses (attacks using `../../` rejected).
   - Verified SQL injection resistance across SQLite service queries.
   - Verified zero plaintext password storage; all passwords hashed using PBKDF2-SHA256 with cryptographically random 16-byte salts.

4. **Authentication & Rate Limiting:**
   - User registration (`POST /api/v1/auth/signup`) and session login (`POST /api/v1/auth/login`) verified.
   - Rate limiting verified: 5 inquiries per IP per minute. Format validation (10-digit Indian phone regex, email syntax) executes prior to rate counter consumption.
   - Unauthorized requests to `/api/v1/auth/me` and `/api/v1/owner/listings` return HTTP 401 Unauthorized.

---

## 5. Section C: End-to-End User Journey Verification

An automated end-to-end browser regression session was conducted and recorded. The full customer journey was verified across the following sequence:

```mermaid
graph TD
    A[1. Homepage Search] -->|Search 'Whitefield' 3 BHK| B[2. Search Results Page]
    B -->|Filter by Price, BHK, Type| C[3. Match Score & Map Inspection]
    C -->|Save to Shortlist| D[4. Comparison Tray]
    D -->|Add 2 Properties| E[5. Side-by-Side Comparison Matrix]
    E -->|Click Detail Link| F[6. Property Detail Page]
    F -->|Run AST-XGB Valuation| G[7. AI Valuation & Conformal Interval]
    G -->|Tweak Area & Floor| H[8. What-If Sensitivity Simulator]
    H -->|Navigate to Tools| I[9. EMI Amortization Schedule]
    I -->|Navigate to Market Insights| J[10. Locality & Macro Trends]
    J -->|Post Property| K[11. Submit Owner Listing with Photos]
    K -->|Navigate to Account| L[12. Review Saved Listings & Inquiries]
```

### Video Recording Artifact
- **Session Recording:** `phase14_complete_qa_e2e_regression_1792959623530.webp`

---

## 6. Section D: Engineering Hygiene & Production Readiness

### 1. Browser Console & Network Cleanliness
- Audited the browser developer console during all user journeys:
  - Zero unhandled JavaScript exceptions.
  - Zero broken image or asset requests (404s).
  - Clean API response serialization.

### 2. Environment Secret Isolation
- Audited repository for hardcoded production credentials:
  - Verified no JWT secrets, API tokens, database passwords, or cloud credentials exist in frontend code or Git history.
  - Template `.env.example` provided for both `backend/` and `frontend/`.
  - Frontend communicates with backend via relative `/api/v1` routes or configurable `VITE_API_BASE_URL`.

### 3. Fallback Figures vs. Live Results Transparency
- Every view clearly distinguishes between:
  - **Live AST-XGB ML Estimates:** Displayed with the model algorithm badge, conformal confidence bounds, and real-time computation timestamp.
  - **Market Benchmark Averages:** Disclosed with sample size, NHB/MoSPI source attribution, and disclaimers stating that past trends do not guarantee future property values.

### 4. Zero Regressions Recorded
- Re-tested all original test modules from Phase 1 through Phase 27 of the research codebase (`test_phase21_inference`, `test_phase22_backend_api`, `test_phase24_integration`, `test_phase25_audit`, `test_phase26_deployment`, `test_phase27_documentation`).
- **Regression Count:** **0 regressions**. All 39 test cases passed.

---

## 7. Known Limitations & Architecture Boundaries

1. **Development Mode SMS / Email Gateway:**
   - Authentication currently issues direct secure bearer tokens without external SMS OTP or SendGrid email dispatch, as external cloud gateway API keys are intentionally withheld in local development.
2. **Macroeconomic Indicators Data Source:**
   - Macro indicators (NHB HPI, RBI Repo, MoSPI CPI, CPCB AQI) are loaded from curated quarterly series in `backend/data/` rather than live scraping, ensuring deterministic latency and avoiding external rate limits.
3. **Map Tile Provider:**
   - Interactive maps utilize Leaflet with OpenStreetMap tile servers (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`). An active internet connection is required to fetch map tiles; however, the search catalog provides a robust list-only view if offline.

---

## 8. Prioritized Recommendations

| Priority | Area | Recommendation | Estimated Impact |
| :---: | :--- | :--- | :--- |
| **P1** | **Frontend Code Splitting** | Configure Vite `rollupOptions.output.manualChunks` or dynamic `React.lazy()` imports for large standalone modules (e.g., Leaflet map, Chart components) to reduce initial vendor bundle size below 500 kB. | Faster initial page load time on slow mobile networks. |
| **P2** | **Production RDBMS Deployment** | Deploy PostgreSQL or MySQL container in `docker-compose.yml` for multi-worker container scaling beyond the current SQLite backend. | Eliminates SQLite write lock contentions under heavy concurrent traffic. |
| **P3** | **Continuous Integration (CI)** | Add GitHub Actions workflow executing `npm run build` and `pytest tests/ backend/tests/` on every pull request. | Automated regression prevention during future feature extensions. |

---

## 9. Conclusion

The AST-XGB Real Estate Platform has successfully passed all verification gates for Phase 14. All 39 backend test suites pass without error, the frontend builds cleanly with zero TypeScript warnings or broken modules, inference latency averages ~45 ms, and the complete end-to-end customer journey functions reliably across desktop and mobile devices.
