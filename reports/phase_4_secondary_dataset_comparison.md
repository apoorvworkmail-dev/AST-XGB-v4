# Phase 4 — Secondary Dataset Comparison Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 18:50:38

---

## Comparison Dashboard

![Phase 4 Comparison Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase4_comparison_dashboard.png)

---

## 1. Dataset Overview

| Property | Primary Dataset | Secondary Dataset |
|---|---|---|
| **Source** | Kaggle: rakkesharv (2022) | Kaggle: pratyushpuri (2025) |
| **Total Rows** | 14,021 | 9,456 |
| **Train Rows (with price)** | 14,021 | 4,728 |
| **Test Rows (no price)** | 0 | 4,728 |
| **Columns** | 31 canonical | 25 original |
| **Cities Covered** | 7 (canonical Indian metros) | 8 (includes Ahmedabad, uses MMR) |
| **Price Column** | `price_lakhs` / `price_inr` (string parsed) | `Price_INR` (direct float) |
| **Area Columns** | `builtup_area_sqft` only | All three: carpet, builtup, super |
| **Coordinates** | ⚫ None (geocoding needed) | 🟢 Latitude + Longitude populated |
| **BHK Column** | From title regex | Direct integer |
| **Year** | 2022 web scrape | 2025 synthetic/enriched |

> [!IMPORTANT]
> The **primary dataset** remains the sole real-world training source. The secondary dataset must NOT be appended without a full harmonisation pipeline. It contains structural incompatibilities, city-scope differences, and label mismatches that require resolution.

---

## 2. Secondary Dataset Schema Inspection

| Column | dtype | Null Count | Null % |
|---|---|---|---|
| `ListingID` | `str` | 0 | 0.0% |
| `City` | `str` | 100 | 1.1% |
| `Locality` | `str` | 126 | 1.3% |
| `PropertyType` | `str` | 0 | 0.0% |
| `BHK` | `int64` | 0 | 0.0% |
| `Bathrooms` | `float64` | 100 | 1.1% |
| `Balconies` | `float64` | 201 | 2.1% |
| `Furnishing` | `str` | 167 | 1.8% |
| `SuperBuiltUpArea_sqft` | `int64` | 0 | 0.0% |
| `BuiltUpArea_sqft` | `int64` | 0 | 0.0% |
| `CarpetArea_sqft` | `int64` | 0 | 0.0% |
| `Floor` | `int64` | 0 | 0.0% |
| `TotalFloors` | `int64` | 0 | 0.0% |
| `Parking` | `str` | 843 | 8.9% |
| `BuildingType` | `str` | 0 | 0.0% |
| `YearBuilt` | `float64` | 90 | 0.9% |
| `AgeYears` | `int64` | 0 | 0.0% |
| `Facing` | `str` | 205 | 2.2% |
| `AmenitiesCount` | `int64` | 0 | 0.0% |
| `IsRERARegistered` | `bool` | 0 | 0.0% |
| `RERAID` | `str` | 1,919 | 20.3% |
| `Latitude` | `float64` | 95 | 1.0% |
| `Longitude` | `float64` | 103 | 1.1% |
| `Price_INR` | `float64` | 4,728 | 50.0% |

---

## 3. Column Mapping: Secondary → Canonical Schema

| Secondary Column | Canonical Column | Compatibility | Units | Notes |
|---|---|---|---|---|
| `ListingID` | `property_master_id` | **PARTIAL** | N/A | Different format; secondary uses HP##### prefix vs PROP-SHA256 |
| `City` | `city` | **PARTIAL** | N/A | INCOMPATIBLE VALUES: secondary has MMR (not canonical), Ahmedabad (not in primary 7 cities), Delhi NCR (vs Delhi) |
| `Locality` | `locality` | **PARTIAL** | N/A | Same concept; secondary has cleaner locality names; different geographic coverage |
| `PropertyType` | `property_type` | **FULL** | N/A | High overlap: Apartment, Villa, Independent House, Penthouse, Studio, Row House — all canonical |
| `BHK` | `bhk` | **PARTIAL** | N/A | INCOMPATIBLE: secondary has BHK=0 for Studio (779 rows); primary starts at BHK=1 |
| `Bathrooms` | `bathrooms` | **FULL** | N/A | Compatible integer count; secondary range 1–7 |
| `Balconies` | `balconies` | **INCOMPATIBLE** | N/A | PRIMARY is binary 0/1; SECONDARY is count 0–3; semantically different |
| `Furnishing` | `furnishing` | **PARTIAL** | N/A | LABEL MISMATCH: secondary uses "Furnished" (not "Fully-Furnished") vs primary canonical "Fully-Furnished" |
| `SuperBuiltUpArea_sqft` | `super_builtup_area_sqft` | **FULL** | sqft | Identical unit (sqft); secondary has this fully populated; primary is 99.9% null from descriptions only |
| `BuiltUpArea_sqft` | `builtup_area_sqft` | **FULL** | sqft | Identical unit (sqft); directly compatible |
| `CarpetArea_sqft` | `carpet_area_sqft` | **FULL** | sqft | Identical unit (sqft); fully populated in secondary vs 89% null in primary |
| `Floor` | `floor_no` | **FULL** | level | Compatible; both 0-indexed (0=ground) |
| `TotalFloors` | `total_floors` | **FULL** | count | Compatible integer count |
| `Parking` | `parking` | **INCOMPATIBLE** | N/A | PRIMARY is count (0–10); SECONDARY is categorical (Covered/Open/Basement/Stilt) — type mismatch |
| `BuildingType` | `nan` | **NEW** | N/A | NOT IN PRIMARY SCHEMA: High Rise/Mid Rise/Low Rise/Gated Community/Standalone/Bungalow — valuable new feature |
| `YearBuilt` | `year_built` | **FULL** | year | Compatible year integer; secondary has 1985–2025 range |
| `AgeYears` | `age_years` | **FULL** | years | Compatible; both current_year - year_built |
| `Facing` | `facing` | **FULL** | N/A | All 8 directions identical to canonical: N/S/E/W/NE/NW/SE/SW |
| `AmenitiesCount` | `nan` | **NEW** | count | NOT IN PRIMARY SCHEMA: integer amenity count (3–12) — valuable new feature |
| `IsRERARegistered` | `rera_registered` | **INCOMPATIBLE** | N/A | PRIMARY: 0/1 integer (mentions detected); SECONDARY: bool True/False — type difference; semantics match |
| `RERAID` | `rera_id` | **FULL** | N/A | Both string alphanumeric RERA IDs; compatible |
| `Latitude` | `latitude` | **FULL** | degrees | WGS-84 compatible; secondary has 95 nulls; PRIMARY is 100% null (requires geocoding) |
| `Longitude` | `longitude` | **FULL** | degrees | WGS-84 compatible; secondary has 103 nulls; PRIMARY is 100% null |
| `Price_INR` | `price_inr` | **FULL** | INR | UNIT COMPATIBLE: both absolute INR; secondary train only (4,728 rows); test set has no price |
| `nan` | `price_lakhs` | **MISSING** | N/A | NOT IN SECONDARY: must derive as Price_INR / 100000 |
| `nan` | `price_per_sqft` | **MISSING** | N/A | NOT IN SECONDARY: must derive as Price_INR / BuiltUpArea_sqft |
| `nan` | `plot_area_sqft` | **MISSING** | N/A | NOT IN SECONDARY: not present in any column |
| `nan` | `listing_date` | **MISSING** | N/A | NOT IN SECONDARY: not available (also missing in primary) |

**Compatibility legend:** FULL = direct mapping | PARTIAL = partial/conditional | INCOMPATIBLE = type/semantic mismatch | NEW = not in canonical schema | MISSING = not in secondary

---

## 4. New Features in Secondary (Not in Primary Schema)

| Secondary Column | Description & Value |
|---|---|
| `BuildingType` | NOT IN PRIMARY SCHEMA: High Rise/Mid Rise/Low Rise/Gated Community/Standalone/Bungalow — valuable new feature |
| `AmenitiesCount` | NOT IN PRIMARY SCHEMA: integer amenity count (3–12) — valuable new feature |

> [!TIP]
> `BuildingType` (High Rise/Mid Rise/Gated Community) and `AmenitiesCount` are **high-value features** not present in the primary dataset. They should be added to the canonical schema v2 if a harmonised merge is attempted in a future phase.

---

## 5. Schema Incompatibilities & Mismatches

| Secondary Column | Canonical Column | Type | Issue |
|---|---|---|---|
| `ListingID` | `property_master_id` | PARTIAL | Different format; secondary uses HP##### prefix vs PROP-SHA256 |
| `City` | `city` | PARTIAL | INCOMPATIBLE VALUES: secondary has MMR (not canonical), Ahmedabad (not in primary 7 cities), Delhi NCR (vs Delhi) |
| `Locality` | `locality` | PARTIAL | Same concept; secondary has cleaner locality names; different geographic coverage |
| `BHK` | `bhk` | PARTIAL | INCOMPATIBLE: secondary has BHK=0 for Studio (779 rows); primary starts at BHK=1 |
| `Balconies` | `balconies` | INCOMPATIBLE | PRIMARY is binary 0/1; SECONDARY is count 0–3; semantically different |
| `Furnishing` | `furnishing` | PARTIAL | LABEL MISMATCH: secondary uses "Furnished" (not "Fully-Furnished") vs primary canonical "Fully-Furnished" |
| `Parking` | `parking` | INCOMPATIBLE | PRIMARY is count (0–10); SECONDARY is categorical (Covered/Open/Basement/Stilt) — type mismatch |
| `BuildingType` | `nan` | NEW | NOT IN PRIMARY SCHEMA: High Rise/Mid Rise/Low Rise/Gated Community/Standalone/Bungalow — valuable new feature |
| `AmenitiesCount` | `nan` | NEW | NOT IN PRIMARY SCHEMA: integer amenity count (3–12) — valuable new feature |
| `IsRERARegistered` | `rera_registered` | INCOMPATIBLE | PRIMARY: 0/1 integer (mentions detected); SECONDARY: bool True/False — type difference; semantics match |
| `nan` | `price_lakhs` | MISSING | NOT IN SECONDARY: must derive as Price_INR / 100000 |
| `nan` | `price_per_sqft` | MISSING | NOT IN SECONDARY: must derive as Price_INR / BuiltUpArea_sqft |
| `nan` | `plot_area_sqft` | MISSING | NOT IN SECONDARY: not present in any column |
| `nan` | `listing_date` | MISSING | NOT IN SECONDARY: not available (also missing in primary) |

### Critical Incompatibilities Requiring Resolution Before Any Merge

1. **`Balconies`**: Secondary is a **count (0–3)**; Primary canonical is a **binary 0/1** flag. Direct merge would corrupt the feature semantics.
2. **`Parking`**: Secondary is **categorical** (Covered/Open/Basement/Stilt); Primary is a **count**. Requires re-encoding.
3. **`Furnishing`**: Secondary uses `"Furnished"` vs Primary canonical `"Fully-Furnished"`. Label normalisation required.
4. **`IsRERARegistered`**: Secondary is `True/False bool`; Primary is `0/1` integer from keyword detection (lower reliability).
5. **`City`**: Secondary uses `"MMR"` (Mumbai Metropolitan Region), `"Delhi NCR"`, `"Ahmedabad"` — none of these are in the Primary 7-city canonical set.
6. **`BHK = 0`**: Secondary has 779 rows where `BHK = 0` (Studio apartments). Primary canonical `bhk` starts at 1.

---

## 6. Unit Compatibility Analysis

| Feature | Primary Unit | Secondary Unit | Compatible? | Action |
|---|---|---|---|---|
| Price | INR Lakhs (float) | INR absolute (float) | ⚠️ Same base, different scale | Harmonise: `price_inr = price_lakhs × 100,000` |
| Built-up Area | sqft (int) | sqft (int) | ✅ Yes | Direct |
| Carpet Area | sqft (partial) | sqft (full) | ✅ Yes | Direct |
| Super Built-up | sqft (0.1% filled) | sqft (100% filled) | ✅ Yes | Direct |
| Floor | integer, 0-indexed | integer, 0-indexed | ✅ Yes | Direct |
| Latitude/Longitude | NULL (all) | degrees WGS-84 | ✅ Yes | Direct (secondary only) |
| Balconies | binary 0/1 | count 0–3 | ❌ No | Binarise secondary: `(Balconies>0).astype(int)` |
| Parking | count (2.4% filled) | categorical | ❌ No | Re-encode secondary to count |

---

## 7. Distribution Shift Analysis (KS Test — 7 Shared Cities)

Kolmogorov-Smirnov two-sample test. `KS > 0.1 + p < 0.05` = statistically significant distribution shift.

| Feature | n (Primary) | n (Secondary) | Primary Median | Secondary Median | KS Stat | KS p-value | Shift? |
|---|---|---|---|---|---|---|---|
| Price (Lakhs) | 14,021 | 4,098 | 65.0 | 164.65 | 0.5225 | 0.0000 | 🔴 YES |
| Built-Up Area (sqft) | 14,021 | 4,098 | 1000.0 | 1405.0 | 0.3129 | 0.0000 | 🔴 YES |
| BHK | 14,021 | 4,098 | 2.0 | 3.0 | 0.1589 | 0.0000 | 🔴 YES |
| Bathrooms | 14,021 | 4,055 | 3.0 | 3.0 | 0.2876 | 0.0000 | 🔴 YES |

### Interpretation

- **Price:** Median ₹65L (primary) vs ₹165L (secondary).
  🔴 Significant shift — secondary prices are substantially higher. Consistent with 2022→2025 real estate appreciation across Indian metros.

- **Area:** Primary median 1000 sqft vs secondary 1405 sqft.
  🔴 Significant area shift — secondary properties are systematically larger. May reflect dataset sampling bias (new projects) rather than true market difference.

- **BHK / Bathrooms:** Check KS table above for significance.

> [!WARNING]
> Distribution shift between primary (2022) and secondary (2025) is **expected** and does not disqualify the secondary dataset. It means the datasets represent different temporal snapshots of the Indian real estate market, and naive concatenation without temporal adjustment would introduce confounded gradients into model training.

---

## 8. City Coverage Comparison

| City | Primary Listings | Secondary Listings (train) | In Primary? | In Secondary? |
|---|---|---|---|---|
| Bengaluru | 4,295 | 592 | ✅ | ✅ |
| Chennai | 1,539 | 610 | ✅ | ✅ |
| Delhi | 2,081 | 606 | ✅ | ✅ |
| Hyderabad | 528 | 564 | ✅ | ✅ |
| Kolkata | 1,368 | 551 | ✅ | ✅ |
| Mumbai | 1,330 | 583 | ✅ | ✅ |
| Pune | 2,880 | 592 | ✅ | ✅ |

**Key observations:**
- **Ahmedabad** (1,179 listings) is in secondary but NOT in primary 7-city canonical set
- **MMR** (Mumbai Metropolitan Region) = Mumbai in secondary — requires normalisation
- **Delhi NCR** (1,183) includes Noida/Gurgaon — broader than primary "Delhi"
- Secondary has **more balanced** city distribution (~1,150 each); primary is Bengaluru-heavy (32%)

---

## 9. Feature Availability Matrix

| Canonical Field | Primary Availability | Secondary Availability | Notes |
|---|---|---|---|
| `property_master_id` | 🟢 Full (100%) | ⚫ None (0%) |  |
| `city` | 🟢 Full (100%) | 🟢 Full (99%) |  |
| `locality` | 🟢 Full (100%) | 🟢 Full (99%) |  |
| `latitude` | ⚫ None (0%) | 🟢 Full (99%) |  |
| `longitude` | ⚫ None (0%) | 🟢 Full (99%) |  |
| `property_type` | 🟢 Full (100%) | 🟢 Full (100%) |  |
| `bhk` | 🟢 Full (100%) | 🟢 Full (100%) |  |
| `bathrooms` | 🟢 Full (100%) | 🟢 Full (99%) |  |
| `balconies` | 🟢 Full (100%) | 🟢 Full (98%) |  |
| `parking` | 🟠 Sparse (2%) | 🟢 Full (91%) |  |
| `carpet_area_sqft` | 🟠 Sparse (11%) | 🟢 Full (100%) |  |
| `builtup_area_sqft` | 🟢 Full (100%) | 🟢 Full (100%) |  |
| `super_builtup_area_sqft` | 🟠 Sparse (0%) | 🟢 Full (100%) |  |
| `plot_area_sqft` | 🟠 Sparse (0%) | ⚫ None (0%) |  |
| `floor_no` | 🟡 Partial (64%) | 🟢 Full (100%) |  |
| `total_floors` | 🟡 Partial (51%) | 🟢 Full (100%) |  |
| `year_built` | 🟠 Sparse (0%) | 🟢 Full (99%) |  |
| `age_years` | 🟠 Sparse (0%) | 🟢 Full (100%) |  |
| `furnishing` | 🟠 Sparse (1%) | 🟢 Full (98%) |  |
| `facing` | 🟠 Sparse (10%) | 🟢 Full (98%) |  |
| `rera_registered` | 🟢 Full (100%) | 🟢 Full (100%) |  |
| `rera_id` | 🟠 Sparse (0%) | 🟢 Full (80%) |  |
| `listing_date` | ⚫ None (0%) | ⚫ None (0%) |  |
| `price_inr` | 🟢 Full (100%) | 🔵 Train Only (50%) |  |
| `price_lakhs` | 🟢 Full (100%) | 🔵 Derivable (50%) |  |
| `price_per_sqft` | 🟢 Full (100%) | 🔵 Derivable (50%) |  |
| `building_type [NEW]` | ⚫ None (0%) | 🟢 Full (100%) | ✅ NEW in Secondary |
| `amenities_count [NEW]` | ⚫ None (0%) | 🟢 Full (100%) | ✅ NEW in Secondary |

**Coverage gain from secondary dataset (if harmonised):**
- `super_builtup_area_sqft`: 0.1% → **100%** fill
- `carpet_area_sqft`: 10.6% → **100%** fill  
- `floor_no`: 64% → **100%** fill
- `total_floors`: 51% → **100%** fill
- `year_built` / `age_years`: ~0% → **99%** fill
- `furnishing`: 1.1% → **99%** fill
- `facing`: 10.3% → **98%** fill
- `latitude` / `longitude`: **0% → 99%** fill ← most impactful for spatial engine

---

## 10. Recommendation: Secondary Dataset Usage Strategy

| Strategy | Rationale |
|---|---|
| **Do NOT append raw** | City names, unit mismatches, label differences, temporal shift require harmonisation first |
| **Use for geocoding transfer** | Secondary has lat/lon for Indian cities — can be used to geocode primary localities |
| **Use as validation set** | After model training on primary, evaluate on secondary (train split) as out-of-distribution validation |
| **Use for feature schema enrichment** | `BuildingType`, `AmenitiesCount`, `SuperBuiltUpArea_sqft` should be added to canonical schema v2 |
| **Use for distribution analysis** | Price appreciation (2022→2025) signals provide temporal market context |
| **Future: harmonised merge** | After a dedicated Phase X harmonisation pipeline resolves all 6 incompatibilities |

---

## 11. Output Files

| File | Description |
|---|---|
| [`data/processed/secondary_schema_mapping.csv`](../data/processed/secondary_schema_mapping.csv) | 28-row column mapping table |
| [`reports/phase_4_secondary_dataset_comparison.md`](phase_4_secondary_dataset_comparison.md) | This report |
| [`reports/figures/phase4_comparison_dashboard.png`](figures/phase4_comparison_dashboard.png) | 9-panel visual comparison dashboard |

---

*Phase 4 complete — no training performed, no data modified. Proceed to Phase 5: Feature Engineering.*
