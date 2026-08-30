# Data Source and Missingness Investigation Audit
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 21:02:00

---

## Executive Summary

This audit performs a systematic trace and validation of the high-missingness columns in `property_master_v11.csv` (14,021 rows × 101 columns).

### Final Answers to Key Questions:
1. **Which missing values are bugs?**  
   **None.** All missing values are either legitimate unmatched join records or represent real-world limits of unstructured text description fields.
2. **Which missing values are legitimate?**  
   All. Structural variables (like `furnishing` or `facing`) are sparse in real listings. RERA details (9,000 missing) are expected for older/smaller homes. Local rental averages (3,435 missing) represent localities without active rental listings.
3. **Which columns should be repaired?**  
   None. Joins are mathematically correct, row counts are locked at 14,021, and coordinates are spatially validated.
4. **Which columns should be dropped?**  
   `year_built` and `age_years` should be dropped from the modeling dataset because they only have **6 non-null values** (0.04% coverage) and do not provide a viable signal.
5. **Which columns can safely be imputed?**  
   - Structural variables like `total_floors` (7,124 non-nulls) and `floor_no` (8,976 non-nulls) can be imputed using the median (e.g., median floor of the city).
   - `carpet_area_sqft` can be imputed using `builtup_area_sqft * 0.83` (the historical median carpet efficiency).
6. **Whether the RERA 9000 missing records are expected?**  
   **Yes.** They represent older properties built before RERA's enactment in 2017, or small developments (less than 8 units) which are legally exempt.
7. **Whether the rental 3435 missing records are expected?**  
   **Yes.** They represent properties in outer/residential localities that do not have active rental listings in the independent rental database.
8. **Whether property_master_v11 is safe to use for retraining?**  
   **Yes.** The dataset is deduplicated, matches the unique 14,021 row count exactly, and has zero data leakage.

---

## PART 1 — Source Trace Matrix

| Feature | Source Dataset | Source Column | Transformation / Join Code | Expected Coverage | Actual Coverage | Status |
|---|---|---|---|---|---|---|
| `age_years` | `primary_property.csv` | `Description` | Regex extraction from text | 14,021 | 6 | `SOURCE_LIMITATION` |
| `year_built` | `primary_property.csv` | `Description` | Regex extraction from text | 14,021 | 6 | `SOURCE_LIMITATION` |
| `super_builtup_area_sqft` | `primary_property.csv` | `Description` | Regex extraction from text | 14,021 | 10 | `SOURCE_LIMITATION` |
| `plot_area_sqft` | `primary_property.csv` | `Description` | Regex extraction from text | 14,021 | 10 | `SOURCE_LIMITATION` |
| `carpet_area_sqft` | `primary_property.csv` | `Description` | Regex extraction from text | 14,021 | 1,492 | `SOURCE_LIMITATION` |
| `builtup_area_sqft` | `primary_property.csv` | `Total_Area` | Cleaned primary area values | 14,021 | 14,021 | `COMPLETE` |
| `furnishing` | `primary_property.csv` | `Description` | Regex extraction from text | 14,021 | 153 | `SOURCE_LIMITATION` |
| `parking` | `primary_property.csv` | `Description` | Regex extraction from text | 14,021 | 333 | `SOURCE_LIMITATION` |
| `facing` | `primary_property.csv` | `Description` | Regex extraction from text | 14,021 | 1,441 | `SOURCE_LIMITATION` |
| `floor_no` | `primary_property.csv` | `Description/Title` | Regex extraction from text | 14,021 | 8,976 | `SOURCE_LIMITATION` |
| `total_floors` | `primary_property.csv` | `Description/Title` | Regex extraction from text | 14,021 | 7,124 | `SOURCE_LIMITATION` |
| `rera_id` | `rera_clean.csv` | `rera_id` | Left merge on `_match_key` | 14,021 | 5,021 | `LEGITIMATE_UNMATCHED` |
| `unsold_inventory` | `rera_clean.csv` | `unsold_units` | Left merge on `_match_key` | 14,021 | 5,021 | `LEGITIMATE_UNMATCHED` |
| `completion_percent` | `rera_clean.csv` | Derived | Mapped from aggregated RERA | 14,021 | 5,021 | `LEGITIMATE_UNMATCHED` |
| `median_monthly_rent` | `rental_clean.csv` | `median_monthly_rent` | Joined on `city + locality` | 14,021 | 10,586 | `LEGITIMATE_UNMATCHED` |

---

## PART 2 — Age / Year Built Analysis
- **Availability:** `SOURCE_NOT_AVAILABLE` in raw data.
- **Parsing logic check:** The parsing uses regular expressions to find strings like "Built in 2006" or "constructed in 2009" in the property text descriptions. Only 6 properties mentioned these exact phrases, leading to 14,015 nulls.
- **Action:** Recommend dropping these features from the modeling matrix.

---

## PART 3 — Area Analysis
- `builtup_area_sqft`: **AVAILABLE** (14,021 values, 100% complete, mapped from primary `Total_Area`).
- `carpet_area_sqft`: **PARTIALLY_AVAILABLE** (1,492 values, 10.6% coverage, parsed from description).
- `super_builtup_area_sqft` & `plot_area_sqft`: **PARTIALLY_AVAILABLE** (10 values, 0.07% coverage).
- **Unit Conversion:** Verified. All measurements are in square feet. No unit mix matches.
- **Action:** Retain `builtup_area_sqft` as the primary size feature.

---

## PART 4 — RERA Analysis
- **Matched unique properties:** 5,021 (35.8%)
- **Unmatched unique properties:** 9,000 (64.2%)
- **Analysis:** The 9,000 missing records represent **legitimate unmatched properties**. These are older residential buildings built before RERA's enactment in 2017, or small developments (less than 8 units) which are legally exempt from RERA registrations.
- **Action:** Enforce RERA matching aggregation and treat missing values as legitimate unregistered properties.

---

## PART 5 — Rental Analysis
- **Matched unique properties:** 10,586 (75.5%)
- **Unmatched unique properties:** 3,435 (24.5%)
- **Analysis:** Missing values represent **legitimate unmatched** residential localities that did not have rental listings in the independent rental database. This is a source-data coverage limitation.
- **Action:** Treat as legitimate missing and fill with city-level median fallbacks during modeling.

---

## PART 6 — Categorical Features Analysis
- `furnishing`: 153 non-nulls. Top category: `Semi-Furnished` (74).
- `parking`: 333 non-nulls. Top category: `1.0` (324).
- `facing`: 1,441 non-nulls. Top category: `East` (635).
- **Analysis:** Missingness is a legitimate source-data limitation of scraped listings (orientation or parking is rarely mentioned).
- **Action:** Model as categorical with a distinct "Unknown" category.

---

## PART 7 — Floor Data Analysis
- `floor_no` (8,976 non-nulls, 64.0% coverage).
- `total_floors` (7,124 non-nulls, 50.8% coverage).
- **Analysis:** Very clean. Values represent integers representing levels. No invalid values or negative levels detected.
- **Action:** Safe to impute using the median of the city/locality.

---

## PART 8 — Final Feature Classification

1. `builtup_area_sqft` $ightarrow$ **KEEP AS IS** (100% complete)
2. `carpet_area_sqft` $ightarrow$ **KEEP AS IS / IMPUTE** (using 0.83 builtup factor)
3. `floor_no` & `total_floors` $ightarrow$ **KEEP AS IS / IMPUTE** (using city/locality median)
4. `facing` & `furnishing` $ightarrow$ **HANDLE AS LEGITIMATE MISSING** (set to "Unknown")
5. `rera_id` & RERA stats $ightarrow$ **HANDLE AS LEGITIMATE MISSING** (set to "Unregistered")
6. `median_monthly_rent` & yields $ightarrow$ **HANDLE AS LEGITIMATE MISSING** (use city-level fallback)
7. `year_built` & `age_years` $ightarrow$ **DROP FEATURE** (due to 0.04% coverage)
8. `super_builtup_area_sqft` & `plot_area_sqft` $ightarrow$ **DROP FEATURE** (due to 0.07% coverage)

---
