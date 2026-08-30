# Phase 2 — Production Data Cleaning Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 18:32:22

---

## Cleaning Dashboard

![Phase 2 Cleaning Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase2_cleaning_dashboard.png)

---

## 1. Data Funnel Summary

| Stage | Rows | Removed | Reason |
|---|---|---|---|
| Raw dataset | 14,528 | — | — |
| After exact deduplication | 14,520 | 8 | Identical rows |
| After erroneous record removal | 14,514 | 6 | Price<1L / Area<50sqft or >50k / PPSF anomaly |
| After probable-duplicate removal | 14,021 | 492 | Same city+locality+area+BHK+baths+price |
| **Final cleaned dataset** | **14,021** | **507** | **Total removed (3.5%)** |

---

## 2. Feature Transformation Table

| Feature | missing_before | missing_after | Transformation Applied |
|---|---|---|---|
| `Price` | 0 | 0 | Parsed Lakh/Crore → float (Lakhs); INR = Lakhs × 100,000 |
| `Total_Area` | 0 | 0 | Renamed area_sqft; validated range [50, 50000]; city-median fill |
| `Baths` | 0 | 0 | Clipped [1,15]; global median imputation for outliers |
| `BHK` | 14528 | 0 | Extracted from Property Title via regex; baths-based fallback |
| `Location→city` | 0 | 0 | Regex city extraction; canonical 7-city map; Thane→Mumbai |
| `Location→locality` | 0 | 0 | Prefix before city in Location; cleaned title(), punct stripped |
| `Property Title→property_type` | 0 | 0 | Regex keyword extraction; Flat→Apartment; mode fill |
| `Balcony` | 0 | 0 | Yes/No → binary int 1/0; NaN → 0 |
| `Description` | 0 | 0 | Whitespace collapse; HTML strip; non-printable removal |
| `price_per_sqft` | 14528 | 0 | Derived: price_inr / area_sqft (after cleaning) |

---

## 3. City Standardisation Map

| Raw Value(s) | Canonical City |
|---|---|
| `bangalore`, `Bangalore` | **Bengaluru** |
| `bengaluru` | **Bengaluru** |
| `mumbai`, `bombay`, `thane` | **Mumbai** |
| `delhi`, `new delhi`, `gurugram`, `gurgaon`, `noida` | **Delhi** |
| `chennai`, `madras` | **Chennai** |
| `pune` | **Pune** |
| `kolkata`, `calcutta` | **Kolkata** |
| `hyderabad`, `secunderabad` | **Hyderabad** |

---

## 4. Property Type Taxonomy

| Final Type | Includes | Count |
|---|---|---|
| Apartment | Regex pattern match | 9,331 |
| Independent House | Regex pattern match | 4,049 |
| Villa | Regex pattern match | 641 |

---

## 5. Price Parsing Logic

The `Price` column contained mixed-format strings:

```
₹60.0 L   → 60.0 Lakhs  → INR 6,000,000
₹1.5 Cr   → 150.0 Lakhs → INR 15,000,000
₹25,00,000 → 25.0 Lakhs → INR 2,500,000
```

**Conversion formula:**
- Crore strings: `num × 100` Lakhs
- Lakh strings: `num` Lakhs
- INR base: `price_lakhs × 100,000`

**Result:** Price range = ₹1.0L – ₹4020.0L  
**Median price:** ₹65.0 Lakhs

---

## 6. Outlier Investigation by City (IQR × 3.0 fence)

| City | Price Lo (L) | Price Hi (L) | Price Outliers | Area Lo (sqft) | Area Hi (sqft) | Area Outliers |
|---|---|---|---|---|---|---|
| Bengaluru | -189.0 | 378.0 | 169 | -1,610 | 4,480 | 209 |
| Chennai | -148.0 | 286.0 | 88 | -1,209 | 3,409 | 71 |
| Delhi | -266.0 | 427.0 | 109 | -1,792 | 3,554 | 68 |
| Hyderabad | -165.0 | 360.0 | 27 | -931 | 3,850 | 31 |
| Kolkata | -105.0 | 210.0 | 61 | -1,074 | 3,228 | 54 |
| Mumbai | -310.0 | 530.0 | 52 | -900 | 2,250 | 35 |
| Pune | -111.0 | 211.0 | 118 | -888 | 2,504 | 116 |

### Luxury Property Verification
- **110** verified luxury properties (Villa / Penthouse / Independent House in top 1% price by city) were **retained** as legitimate observations.
- **6** records were removed as clearly erroneous (price < ₹1L, area < 50sqft, area > 50,000sqft, PPSF = 0 or > ₹5L/sqft).

> [!NOTE]
> Luxury outlier records with price > 3×IQR fence but consistent property_type (Villa, Penthouse) and area ratios were classified as legitimate and retained. Automated removal was restricted to statistically impossible values only.

---

## 7. City-Level Statistics (Cleaned Dataset)

| City | Listings | Median Price | Median Area | Median ₹/sqft |
|---|---|---|---|---|
| Bengaluru | 4,295 | 80.0 L | 1,230 sqft | ₹5,800/sqft |
| Chennai | 1,539 | 59.9 L | 1,000 sqft | ₹5,600/sqft |
| Delhi | 2,081 | 62.5 L | 828 sqft | ₹8,125/sqft |
| Hyderabad | 528 | 84.0 L | 1,380 sqft | ₹5,986/sqft |
| Kolkata | 1,368 | 43.0 L | 999 sqft | ₹4,249/sqft |
| Mumbai | 1,330 | 90.0 L | 600 sqft | ₹16,562/sqft |
| Pune | 2,880 | 43.9 L | 752 sqft | ₹5,747/sqft |

---

## 8. Final Column Schema

| Column | Type | Description |
|---|---|---|
| `city` | str | Canonical city (7 cities) |
| `locality` | str | Cleaned sub-locality name |
| `property_type` | str | Apartment / Villa / Independent House / etc. |
| `bhk` | Int64 | Bedroom-Hall-Kitchen count (1–15) |
| `baths` | Int64 | Bathroom count (1–15) |
| `has_balcony` | int | Binary 1/0 |
| `area_sqft` | float | Built-up area in square feet |
| `price_lakhs` | float | **PRIMARY TARGET** — sale price in Indian Rupees Lakhs |
| `price_inr` | float | Absolute INR value |
| `price_per_sqft` | float | Derived: INR per sqft |
| `description_clean` | str | Cleaned free-text description |
| `property_name` | str | Original listing name (traceability) |
| `property_title` | str | Original ad title (traceability) |
| `price_raw` | str | Original price string (traceability) |
| `location_raw` | str | Original location string (traceability) |

---

## 9. Output Files

| File | Description |
|---|---|
| [`data/processed/property_clean.csv`](../data/processed/property_clean.csv) | Final cleaned dataset (14,021 rows × 15 cols) |
| [`reports/figures/phase2_cleaning_dashboard.png`](figures/phase2_cleaning_dashboard.png) | 10-panel cleaning visualisation dashboard |
| [`reports/phase_2_cleaning_report.md`](phase_2_cleaning_report.md) | This report |
| [`notebooks/phase2_cleaning.py`](../notebooks/phase2_cleaning.py) | Reproducible cleaning script |

---

*Phase 2 complete — proceed to Phase 3: Exploratory Data Analysis & Feature Engineering.*
