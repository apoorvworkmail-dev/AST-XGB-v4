# Phase 6 — NHB RESIDEX Temporal & Market Regime Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 19:01:00

---

## Market Regime Dashboard

![Phase 6 Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase6_temporal_dashboard.png)

---

## 1. NHB RESIDEX HPI Generation Summary

To capture macroeconomic cycles and real estate pricing trends, city-level quarterly Housing Price Index (HPI) data was generated for the 7 canonical cities from **2018-Q1 to 2026-Q1** based on National Housing Bank publications.

| Metric | Details |
|---|---|
| **Base Year** | FY 2017-18 = 100 |
| **Cities Covered** | Bengaluru, Mumbai, Delhi, Chennai, Pune, Kolkata, Hyderabad |
| **Frequency** | Quarterly (4 quarters per year) |
| **Index Types** | HPI@Assessment Prices, HPI@Market Prices |
| **Metrics Calculated** | Index values, QoQ % growth, YoY % growth |

### Latest City-Level HPI Profile (2026-Q1)

| City | HPI 2018-Q1 | HPI 2026-Q1 | YoY Growth (Latest) | Carpet Area Rate (Est. Q1-26) |
|---|---|---|---|---|
| Bengaluru | 102.5 | 178.8 | 6.4% | ₹8,825 |
| Chennai | 101.8 | 185.1 | 7.9% | ₹9,888 |
| Delhi | 100.5 | 181.1 | 6.6% | ₹14,874 |
| Hyderabad | 103.0 | 187.2 | 6.7% | ₹8,471 |
| Kolkata | 100.8 | 177.0 | 6.6% | ₹7,173 |
| Mumbai | 101.2 | 183.2 | 8.2% | ₹32,515 |
| Pune | 101.0 | 186.9 | 8.7% | ₹10,589 |

---

## 2. Listing Date Assignment (Simulation)

Since the raw Kaggle dataset is a static snapshot scraped around late 2022 and does not contain listing timestamps, realistic listing dates were generated to enable temporal joins:

- **Time Range:** Distributed between **2018-Q2 and 2022-Q4**
- **Distribution:** Uniformly spread across quarters using a stable sha256 hash of the property ID
- **Listing Date:** Formatted as the middle of the quarter (`YYYY-MM-15`)

---

## 3. Leakage-Safe Temporal Join & Lagging

> [!CAUTION]
> **Zero Future Leakage Rule:** A naive join where property listing quarter is matched to the HPI of the *same* quarter would result in target leakage, as HPI indices are published with a lag (typically 1 quarter).
> 
> To prevent leakage, **all RESIDEX indicators are shifted by 1 quarter** (`listing_quarter` matches `quarter + 1` of HPI publication).

```
Property Listing Quarter: 2022-Q3
→ Matched HPI Publication Quarter: 2022-Q2 (Latest known index at time of listing)
```

### Join Validation Audit Sample

| Property ID | City | Listing Quarter | Lagged HPI Quarter | HPI Index (t-1) | Market Regime |
|---|---|---|---|---|---|
| `PROP-245995EFBD96` | Mumbai | 2022-Q3 | 2022-Q2 | 135.4 | **Growth** |
| `PROP-D35189812D63` | Pune | 2018-Q3 | 2018-Q2 | 103.0 | **Declining** |
| `PROP-AABFB17B7D65` | Delhi | 2022-Q3 | 2022-Q2 | 136.8 | **Growth** |
| `PROP-008552FBDAC6` | Pune | 2019-Q3 | 2019-Q2 | 110.1 | **Growth** |
| `PROP-146D1DB2DCCE` | Chennai | 2018-Q4 | 2018-Q3 | 105.2 | **Declining** |

- **Leakage Violations Checked:** **0** violations detected. `listing_quarter > historical_quarter` holds true for 100% of properties.

---

## 4. Market Regime Definitions

Market regimes are classified based only on historical YoY growth (`hist_yoy_growth`) known at the time of listing:

- 🔴 **Declining**: YoY HPI growth < 1%
- 🟡 **Stable**: YoY HPI growth 1% to 5%
- 🟢 **Growth**: YoY HPI growth > 5%

### Dataset Regime Distribution

| Market Regime | Properties | % Share | Valuation Implication |
|---|---|---|---|
| **Growth** | 7,848 | 56.0% | Bull market dynamics; upward pressure on weights |
| **Stable** | 3,206 | 22.9% | Flat growth; balanced baseline weights |
| **Declining** | 2,967 | 21.2% | Slow growth / contraction; downward weight adjustment |

---

## 5. Output Files

| File | Description |
|---|---|
| [`data/external/nhb_residex_clean.csv`](../data/external/nhb_residex_clean.csv) | Quarterly HPI index data for 7 cities (2018-Q1 to 2026-Q1) |
| [`data/features/market_features.csv`](../data/features/market_features.csv) | Lagged historical market indicators |
| [`data/processed/property_master_v3.csv`](../data/processed/property_master_v3.csv) | Property master with 7 market features joined |
| [`reports/phase_6_nhb_temporal_features.md`](phase_6_nhb_temporal_features.md) | This report |
| [`reports/figures/phase6_temporal_dashboard.png`](figures/phase6_temporal_dashboard.png) | 9-panel visual dashboard |

---

*Phase 6 complete — temporal features integrated, market regimes classified, target leakage validated.*
