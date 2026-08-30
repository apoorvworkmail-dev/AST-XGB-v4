# Phase 3 — Canonical Schema Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 18:38:07  
**Schema version:** v1.0.0

---

## 1. Overview

| Item | Value |
|---|---|
| Input | `data/processed/property_clean.csv` (14,021 rows) |
| Output | `data/processed/property_master_v1.csv` (14,021 rows × 31 cols) |
| Primary Key | `property_master_id` (SHA-256 deterministic hash) |
| Regression Target | `price_inr` (INR absolute) / `price_lakhs` (human-readable) |
| Canonical fields | 26 |
| Raw traceability fields | 5 |

---

## 2. property_master_id Generation

Each property receives a **stable, deterministic unique identifier**:

```python
key = f"{city}|{locality}|{property_type}|{bhk}|{baths}|{area_sqft}|{price_inr}|{row_index}"
property_master_id = f"PROP-{SHA256(key)[:12].upper()}"
# Example: PROP-3AF1B29CD041
```

- **Collision-free**: row index appended ensures uniqueness for properties with identical attributes  
- **Stable**: same inputs always produce the same ID (deterministic)  
- **Format**: `PROP-` prefix + 12 uppercase hex chars

---

## 3. Canonical Field Null Profile

| Field | NULL Count | NULL % | Status |
|---|---|---|---|
| `property_master_id` | 0 | 0.0% | ✅ Complete |
| `city` | 0 | 0.0% | ✅ Complete |
| `locality` | 0 | 0.0% | ✅ Complete |
| `latitude` | 14,021 | 100.0% | 🔴 Sparse |
| `longitude` | 14,021 | 100.0% | 🔴 Sparse |
| `property_type` | 0 | 0.0% | ✅ Complete |
| `bhk` | 0 | 0.0% | ✅ Complete |
| `bathrooms` | 0 | 0.0% | ✅ Complete |
| `balconies` | 0 | 0.0% | ✅ Complete |
| `parking` | 13,688 | 97.6% | 🔴 Sparse |
| `carpet_area_sqft` | 12,529 | 89.4% | 🔴 Sparse |
| `builtup_area_sqft` | 0 | 0.0% | ✅ Complete |
| `super_builtup_area_sqft` | 14,011 | 99.9% | 🔴 Sparse |
| `plot_area_sqft` | 14,011 | 99.9% | 🔴 Sparse |
| `floor_no` | 5,045 | 36.0% | 🟡 Partial |
| `total_floors` | 6,897 | 49.2% | 🟡 Partial |
| `year_built` | 14,015 | 100.0% | 🔴 Sparse |
| `age_years` | 14,015 | 100.0% | 🔴 Sparse |
| `furnishing` | 13,868 | 98.9% | 🔴 Sparse |
| `facing` | 12,580 | 89.7% | 🔴 Sparse |
| `rera_registered` | 0 | 0.0% | ✅ Complete |
| `rera_id` | 14,017 | 100.0% | 🔴 Sparse |
| `listing_date` | 14,021 | 100.0% | 🔴 Sparse |
| `price_inr` | 0 | 0.0% | ✅ Complete |
| `price_lakhs` | 0 | 0.0% | ✅ Complete |
| `price_per_sqft` | 0 | 0.0% | ✅ Complete |

> [!NOTE]
> **Fields with 100% NULL** (`latitude`, `longitude`, `listing_date`) are architecturally reserved — they are not missing due to data quality issues but because the source dataset does not contain geocoordinates or listing timestamps. These will be populated via OpenStreetMap geocoding in Phase 4.

---

## 4. Description-Mining Extraction Yields

The `description_clean` field contains semi-structured text from which the following fields were extracted via validated regex:

| Field | Records Extracted | Yield |
|---|---|---|
| `floor_no` | 8,976 | 64.0% |
| `total_floors` | 7,124 | 50.8% |
| `carpet_area_sqft` | 1,492 | 10.6% |
| `super_builtup_area_sqft` | 10 | 0.1% |
| `plot_area_sqft` | 10 | 0.1% |
| `parking` | 333 | 2.4% |
| `furnishing` | 153 | 1.1% |
| `facing` | 1,441 | 10.3% |
| `year_built` | 6 | 0.0% |
| `rera_registered (=1)` | 49 | 0.3% |
| `rera_id` | 4 | 0.0% |

> [!TIP]
> `floor_no` and `total_floors` have the highest yield from descriptions (~50%+). `year_built`, `facing`, and `rera_id` are sparse — available for <15% of listings.

---

## 5. Column Mapping: Source → Canonical

| Canonical Field | Source Column | Transformation | Availability | NULL % |
|---|---|---|---|---|
| `property_master_id` | `generated` | SHA-256 hash of key fields + row index | Full | 0.0% |
| `city` | `Location / Property Title` | Regex city extraction + canonical map | Full | 0.0% |
| `locality` | `Location / Property Title` | Prefix before city; title() + punct strip | Full | 0.0% |
| `latitude` | `NOT IN SOURCE` | None — NULL; geocoding in Phase 4 | None | 100.0% |
| `longitude` | `NOT IN SOURCE` | None — NULL; geocoding in Phase 4 | None | 100.0% |
| `property_type` | `Property Title` | Keyword regex (Flat/Apt/Villa/House/Plot) | Full | 0.0% |
| `bhk` | `Property Title` | Prefix integer before "BHK" in title | Full | 0.0% |
| `bathrooms` | `Baths` | Cast to Int64; clipped [1,15] | Full | 0.0% |
| `balconies` | `Balcony` | Yes→1 / No→0; NaN→0 | Full | 0.0% |
| `parking` | `Description` | Regex: "(N) parking" or keyword present→1 | Partial | 97.6% |
| `carpet_area_sqft` | `Description` | Regex: "carpet area of (N)" | Partial | 89.4% |
| `builtup_area_sqft` | `Total_Area` | Cast to float; validated [50,50000] | Full | 0.0% |
| `super_builtup_area_sqft` | `Description` | Regex: "super built-up area (N)" | Partial | 99.9% |
| `plot_area_sqft` | `Description` | Regex: "plot area / plot size (N)" | Partial | 99.9% |
| `floor_no` | `Description` | Regex: "on floor (N)" / "floor number (N)" | Partial | 36.0% |
| `total_floors` | `Description` | Regex: "total number of floors is (N)" | Partial | 49.2% |
| `year_built` | `Description` | Regex: "built/constructed in (YYYY)" | Sparse | 100.0% |
| `age_years` | `Description (derived)` | current_year - year_built | Sparse | 100.0% |
| `furnishing` | `Description` | Regex: fully/semi-furnished / unfurnished | Partial | 98.9% |
| `facing` | `Description` | Regex: "(direction)-facing" | Sparse | 89.7% |
| `rera_registered` | `Description` | Keyword match "RERA registered" → 1 else 0 | Full | 0.0% |
| `rera_id` | `Description` | Regex: "RERA (alphanumeric ID)" | Sparse | 100.0% |
| `listing_date` | `NOT IN SOURCE` | None — NULL; reserved for future enrichment | None | 100.0% |
| `price_inr` | `Price` | parse_price_to_lakhs × 100000; cast Int64 | Full | 0.0% |
| `price_lakhs` | `Price` | parse Lakh/Crore strings → float Lakhs | Full | 0.0% |
| `price_per_sqft` | `Derived` | price_inr / builtup_area_sqft | Full | 0.0% |
| `raw__property_name` | `Name` | Verbatim copy | Full | 0.0% |
| `raw__property_title` | `Property Title` | Verbatim copy | Full | 0.0% |
| `raw__price` | `Price` | Verbatim copy | Full | 0.0% |
| `raw__location` | `Location` | Verbatim copy | Full | 0.0% |
| `raw__description` | `Description` | Cleaned (whitespace + HTML strip) | Full | 0.0% |

---

## 6. Property Type Distribution

| Property Type | Count | % |
|---|---|---|
| Apartment | 9,331 | 66.6% |
| Independent House | 4,049 | 28.9% |
| Villa | 641 | 4.6% |

---

## 7. Furnishing Status Distribution

| Furnishing | Count | % |
|---|---|---|
| Not Mentioned | 13,868 | 98.9% |
| Semi-Furnished | 74 | 0.5% |
| Fully-Furnished | 70 | 0.5% |
| Unfurnished | 9 | 0.1% |

---

## 8. RERA Registration

| Status | Count | % |
|---|---|---|
| RERA mentioned in description | 49 | 0.3% |
| RERA ID extracted | 4 | 0.0% |
| Not mentioned | 13,972 | 99.7% |

> [!WARNING]
> `rera_registered = 0` means RERA was **not mentioned** in the listing description — it does NOT confirm the property is unregistered. This field should be treated as a noisy proxy, not ground truth.

---

## 9. Schema YAML Structure

```yaml
schema_name: AST-XGB India Property Master Schema v1
version: 1.0.0
primary_key: property_master_id
target_variable: price_inr
# Each field includes: type | nullable | description | source | valid_range/allowed_values
```

Full schema: [`data/processed/schema/property_schema.yaml`](../data/processed/schema/property_schema.yaml)

---

## 10. Output Files

| File | Description |
|---|---|
| [`data/processed/property_master_v1.csv`](../data/processed/property_master_v1.csv) | Canonical master table (14,021 rows × 31 cols) |
| [`data/processed/schema/property_schema.yaml`](../data/processed/schema/property_schema.yaml) | Full data dictionary (YAML, 31 fields) |
| [`data/processed/schema/column_mapping.csv`](../data/processed/schema/column_mapping.csv) | Source-to-canonical column mapping (31 entries) |
| [`reports/phase_3_schema.md`](phase_3_schema.md) | This report |
| [`notebooks/phase3_schema.py`](../notebooks/phase3_schema.py) | Reproducible schema builder |

---

*Phase 3 complete — proceed to Phase 4: Geocoding, Feature Engineering & EDA.*
