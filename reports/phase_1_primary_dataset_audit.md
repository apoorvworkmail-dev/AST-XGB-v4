# Phase 1 — Primary Dataset Audit Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 18:24:49  
**Dataset:** Housing Real Estate Data from 7 Indian Cities (Kaggle: rakkesharv)

---

## 1. Dataset Acquisition

| Item | Detail |
|---|---|
| Source | [Kaggle – rakkesharv/real-estate-data-from-7-indian-cities](https://www.kaggle.com/datasets/rakkesharv/real-estate-data-from-7-indian-cities) |
| Download Method | `kagglehub.dataset_download()` |
| Saved To | `data/raw/primary_property.csv` |
| License | CC0: Public Domain |

**Source files loaded:**
- `Real Estate Data V21.csv` (10642.3 KB)

---

## 2. Dataset Dimensions

| Metric | Value |
|---|---|
| **Total Rows** | 14,528 |
| **Total Columns** | 10 |

### Column Names & Data Types

| Column | dtype |
|---|---|
| `Name` | `str` |
| `Property Title` | `str` |
| `Price` | `str` |
| `Location` | `str` |
| `Total_Area` | `int64` |
| `Price_per_SQFT` | `float64` |
| `Description` | `str` |
| `Baths` | `int64` |
| `Balcony` | `str` |
| `source_file` | `str` |

---

## 3. Target Variable Identification

| Role | Column | Notes |
|---|---|---|
| **Primary Target** | `Price` | Property sale price — raw string with Lakh/Crore mixed units |
| **Derived Target** | `Price_per_SQFT` | Price per sqft — secondary regression target |
| Area | `Total_Area` | Total built-up area in sqft (mixed units) |
| Bathrooms | `Baths` | Physical structural attribute |
| BHK / Bedrooms | `None` | Apartment/unit size classification |
| Location | `Location` | City + locality string — requires parsing |
| Property Name | `Name` | Listing name — textual |
| Property Title | `Property Title` | Ad title — textual |
| Description | `Description` | Free-text paragraph — NLP candidate |
| Balcony | `Balcony` | Binary structural flag |

### Feature Category Map

| Category | Columns |
|---|---|
| **Price / Target** | `Price`, `Price_per_SQFT` |
| **Area / Size** | `Total_Area` |
| **Structural** | `Baths`, `Balcony`, `None` |
| **Spatial / Location** | `Location` |
| **Textual / NLP** | `Name`, `Property Title`, `Description` |

---

## 4. Missing Value Analysis

> [!NOTE]
> Missing values are documented below — **no imputation performed at this stage**.

| Column | Missing Count | Missing % | Severity |
|---|---|---|---|
| — | 0 | 0.00% | ✅ None |


---

## 5. Duplicate Detection

| Check | Count |
|---|---|
| Full row exact duplicates | **8** |
| Near-duplicates (Name + Location + Price + Area) | **685** |

> [!WARNING]
> **685 near-duplicate listings** detected. These must be deduplicated before model training to prevent data leakage.

---

## 6. Categorical Column Cardinality

| Column | Unique Values |
|---|---|
| `Name` | 9,998 |
| `Property Title` | 6,507 |
| `Price` | 891 |
| `Location` | 7,050 |
| `Description` | 14,490 |
| `Balcony` | 2 |
| `source_file` | 1 |

---

## 7. Inconsistent Units in Price & Area

### Price Column (`Price`)

Raw price values contain mixed formats requiring harmonisation before any numeric analysis:

| Format Pattern | Count |
|---|---|
| Lakh pattern | 10,295 |
| Crore pattern | 4,229 |
| Plain numeric | 0 |
| Text/other | 4 |

> [!CAUTION]
> **Action Required:** The `Price` column contains mixed Lakh/Crore string suffixes alongside plain numerics. A unit-normalisation pipeline converting all prices to a single base unit (e.g. Indian Rupees) must be implemented in Phase 2 before any exploratory analysis or modelling.

### Area Column (`Total_Area`)

| Format Pattern | Count |
|---|---|
| SQFT pattern | 0 |
| SQM pattern | 0 |
| Yard pattern | 0 |

---

## 8. Impossible & Anomalous Value Detection

| Anomaly | Count |
|---|---|
| Negative price | ✅ 0 |
| Zero price | ✅ 0 |
| Zero area | ✅ 0 |
| Negative area | ✅ 0 |
| Area < 50 sqft | ✅ 0 |
| Area > 500k sqft | ✅ 0 |
| Negative baths | ✅ 0 |
| Zero baths | ✅ 0 |
| Baths > 20 | ✅ 0 |
| Unknown city in Location | ⚠️ **6** |

> [!WARNING]
> All flagged anomalies must be **investigated and manually reviewed** before imputation or model training. Do NOT blindly remove or fill these records.

---

## 9. City Distribution (extracted from `Location`)

| City | Listings |
|---|---|
| Bangalore | 4,512 |
| Pune | 2,964 |
| Delhi | 2,165 |
| Chennai | 1,595 |
| Kolkata | 1,392 |
| Mumbai | 1,353 |
| Hyderabad | 540 |
| Unknown | 6 |
| Bengaluru | 1 |

---

## 10. Numeric Summary Statistics

```
                  count          mean           std   min     50%       max
Name              14528           NaN           NaN   NaN     NaN       NaN
Property Title    14528           NaN           NaN   NaN     NaN       NaN
Price             14528           NaN           NaN   NaN     NaN       NaN
Location          14528           NaN           NaN   NaN     NaN       NaN
Total_Area      14528.0   1297.916988   1245.694305  70.0  1000.0   35000.0
Price_per_SQFT  14528.0  11719.456222  49036.068632   0.0  6050.0  999000.0
Description       14528           NaN           NaN   NaN     NaN       NaN
Baths           14528.0      2.751239      0.898243   1.0     3.0       6.0
Balcony           14528           NaN           NaN   NaN     NaN       NaN
source_file       14528           NaN           NaN   NaN     NaN       NaN
```

---

## 11. Audit Visualisation Dashboard

![Phase 1 Audit Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase1_audit_dashboard.png)

---

## 12. Priority Action Items for Phase 2

| Priority | Action Required | Impacted Column(s) |
|---|---|---|
| 🔴 P0 | **Unit harmonisation** — parse Lakh/Crore/plain numeric → INR base | `Price`, `Price_per_SQFT` |
| 🔴 P0 | **Area unit standardisation** — enforce uniform SQFT | `Total_Area` |
| 🔴 P0 | **Deduplicate** — remove 685 near-duplicate listings | All columns |
| 🟡 P1 | **City extraction** — parse city name from free-text location string | `Location` |
| 🟡 P1 | **Locality normalisation** — cluster sub-locality spelling variants | `Location` |
| 🟡 P1 | **BHK extraction** — extract integer BHK from name/title if missing | `Name`, `Property Title` |
| 🟡 P1 | **Missingness investigation** — audit missing patterns before imputation strategy | See Section 4 |
| 🟢 P2 | **Textual feature preparation** — tokenise Description for NLP embeddings | `Description` |
| 🟢 P2 | **Spatial geocoding** — geocode locality strings → lat/lon for spatial engine | `Location` |

---

## 13. Files Saved

| File | Description |
|---|---|
| [`data/raw/primary_property.csv`](../data/raw/primary_property.csv) | Combined raw dataset (unmodified) |
| [`reports/figures/phase1_audit_dashboard.png`](figures/phase1_audit_dashboard.png) | 8-panel visual audit dashboard |
| [`reports/phase_1_primary_dataset_audit.md`](phase_1_primary_dataset_audit.md) | This audit report |

---

*Phase 1 audit complete. Proceed to Phase 2: Data Cleaning & Unit Harmonisation.*
