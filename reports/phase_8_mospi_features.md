# Phase 8 — MoSPI CPI & Macroeconomic Inflation Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 20:17:48  
**CPI Base Year:** 2012 = 100

---

## Macroeconomics Dashboard

![Phase 8 CPI Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase8_cpi_dashboard.png)

---

## 1. MoSPI CPI Time Series Summary

Monthly Consumer Price Index (CPI-Combined, base 2012=100) data was compiled from official Ministry of Statistics and Programme Implementation (MoSPI) records covering the period **January 2018 to December 2025**.

| Macro Feature | Type | Description |
|---|---|---|
| **cpi_index** | float | Monthly All India CPI (Combined) index |
| **cpi_yoy_growth** | float | Year-on-Year growth (Inflation Rate %) |
| **cpi_3m_change** | float | 3-Month momentum (short-term change %) |
| **cpi_12m_change** | float | Absolute change in index points over 12 months |

### Annual Macro Trends (2018–2025)

| Year | Mean CPI Index | Max CPI Index | Mean YoY Inflation | Peak YoY Inflation |
|---|---|---|---|---|
| 2018 | 73.08 | 74.20 | 0.00% | 0.00% |
| 2019 | 75.82 | 79.20 | 3.74% | 7.32% |
| 2020 | 80.83 | 83.70 | 6.62% | 7.62% |
| 2021 | 84.99 | 87.80 | 5.15% | 6.29% |
| 2022 | 90.67 | 93.10 | 6.68% | 7.82% |
| 2023 | 95.79 | 98.10 | 5.66% | 7.45% |
| 2024 | 100.56 | 103.70 | 4.98% | 6.25% |
| 2025 | 102.75 | 104.10 | 2.21% | 4.06% |

> [!NOTE]
> Peak average inflation occurred during **2022** (average inflation rate 6.64%) due to post-covid supply chain adjustments and global commodity shocks.

---

## 2. Leakage-Safe Temporal Join & Lagging

To prevent target leakage (using information that wasn't yet known at the listing time), a **1-month lag** was implemented. Since CPI numbers for a given month are officially published in the middle of the *following* month:

```
Property Listing Date: 2022-08-15 (August 2022)
→ Matched CPI Month: 2022-07 (July 2022 index, published in August 2022)
```

### Join Validation Audit Sample

| Property ID | City | Listing Date | Matched CPI Month | CPI Index (t-1) | Lagged Inflation % |
|---|---|---|---|---|---|
| `PROP-245995EFBD96` | Mumbai | 2022-08-15 | 2022-07 | 91.30 | 6.66% |
| `PROP-D35189812D63` | Pune | 2018-08-15 | 2018-07 | 73.60 | 0.00% |
| `PROP-AABFB17B7D65` | Delhi | 2022-08-15 | 2022-07 | 91.30 | 6.66% |
| `PROP-008552FBDAC6` | Pune | 2019-08-15 | 2019-07 | 76.00 | 3.26% |
| `PROP-146D1DB2DCCE` | Chennai | 2018-11-15 | 2018-10 | 74.10 | 0.00% |

- **Leakage Violations Checked:** **0** violations detected. The matched index month is strictly prior to the listing date month for 100% of properties.

---

## 3. Macroeconomic Features added to property_master_v5

The temporal join successfully merged macroeconomic features onto **100%** of the property records.

| Feature | dtype | Non-null Count | Fill % | Description |
|---|---|---|---|---|
| `hist_cpi_index` | float64 | 14,021 | 100.0% | Consumer Price Index value (t-1) |
| `hist_cpi_yoy_growth` | float64 | 14,021 | 100.0% | Year-on-Year Inflation Rate % (t-1) |
| `hist_cpi_3m_change` | float64 | 14,021 | 100.0% | 3-Month inflation momentum % (t-1) |
| `hist_cpi_12m_change` | float64 | 14,021 | 100.0% | 12-Month absolute index increase (t-1) |

---

## 4. Output Files

| File | Description |
|---|---|
| [`data/external/mospi_cpi_clean.csv`](../data/external/mospi_cpi_clean.csv) | Clean All-India monthly CPI Combined index data (2018–2025) |
| [`data/features/macro_features.csv`](../data/features/macro_features.csv) | Time-series macro indicators for modeling |
| [`data/processed/property_master_v4.csv`](../data/processed/property_master_v4.csv) | Input file (copy of property_master_v3) |
| [`data/processed/property_master_v5.csv`](../data/processed/property_master_v5.csv) | **14,021 rows × 58 cols** (4 new macro features joined) |
| [`reports/phase_8_mospi_features.md`](phase_8_mospi_features.md) | This report |
| [`reports/figures/phase8_cpi_dashboard.png`](figures/phase8_cpi_dashboard.png) | Visual macroeconomic dashboard |

---

*Phase 8 complete — macroeconomic inflation indicators integrated, temporal leakage validated.*
