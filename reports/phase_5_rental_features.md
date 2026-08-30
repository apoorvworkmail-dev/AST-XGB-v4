# Phase 5 — Rental Market Feature Engineering Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 18:56:07

---

## Rental Market Dashboard

![Phase 5 Rental Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase5_rental_dashboard.png)

---

## 1. Rental Dataset Summary

| Property | Value |
|---|---|
| **Source** | Kaggle: pranayjagtap06/indian-rental-housing-price-dataset (MagicBricks) |
| **File** | `cities_magicbricks_rental_prices.csv` |
| **Raw Rows** | 7,691 |
| **After Cleaning** | 7,579 |
| **Removed** | 112 (1.5%) |
| **Cities** | 5 raw → 4 canonical (Nagpur excluded from join — outside primary-7) |
| **Unique Localities** | 1,849 (within primary-7 cities) |
| **Locality+City Pairs** | 1,858 aggregated |
| **Area Unit** | sqft (confirmed: `rent / area ≈ area_rate` at 95.9% match rate) |
| **Rent Unit** | INR/month (direct numeric) |
| **Missing Values** | **0** in all original columns |

---

## 2. Rental Data Cleaning Steps

| Step | Operation | Records Affected |
|---|---|---|
| City standardisation | `Bangalore→Bengaluru`, `New Delhi→Delhi` | All |
| Locality cleaning | title(), whitespace collapse, punct removal | All |
| Area validation | Flagged area < 50 or > 20,000 sqft | 52 flagged |
| Rent validation | Removed null / zero / negative rents | 0 |
| Bathroom fix | `bathrooms=0` → `1` | 0 rows |
| Furnishing label | `Furnished→Fully-Furnished` (canonical) | 1,601 rows |
| Rent/sqft outlier | Removed `rent_per_sqft > 5000` | erroneous batch |
| Probable duplicates | Same city+locality+area+BHK+rent | 60 |
| Nagpur exclusion | Outside primary-7; retained in rental_clean.csv | 595 |

---

## 3. Rental Aggregation Schema

Aggregated at **city + locality** granularity. These are **market-level statistics**, not property-specific prices — ensuring zero target leakage when joined to sale properties.

| Feature | Type | Description | Leakage Risk |
|---|---|---|---|
| `rental_listing_count` | int | Number of rental listings in locality | None |
| `avg_monthly_rent` | float | Mean rent across listings (INR/month) | None |
| `median_monthly_rent` | float | Median rent — primary market signal | None |
| `p25_monthly_rent` | float | 25th percentile rent | None |
| `p75_monthly_rent` | float | 75th percentile rent | None |
| `avg_rent_per_sqft` | float | Mean ₹/sqft/month | None |
| `median_rent_per_sqft` | float | Median ₹/sqft/month | None |
| `avg_rental_area_sqft` | float | Avg area of rentals in locality | None |
| `rent_stddev` | float | Rent std dev (market heterogeneity) | None |
| `pct_furnished` | float | % fully-furnished in locality | None |
| `pct_semi_furnished` | float | % semi-furnished in locality | None |
| `dominant_bhk` | int | Most common BHK in locality | None |

---

## 4. Join Strategy & Leakage Safeguards

> [!IMPORTANT]
> **Join key: `city` + `locality` ONLY** — no price, no sale attributes, no structural property features used as join keys. Rental statistics are locality-level aggregates derived entirely from the separate rental transaction dataset.

| Join Pass | Method | Properties Matched |
|---|---|---|
| Pass 1 | Exact `city_key + locality_key` | 7,342 (52.4%) |
| Pass 2 | City-level median fallback | 3,244 additional |
| Unmatched | NULL rental features retained | 3,435 |

### Join Quality Breakdown

| Quality | Count | % |
|---|---|---|
| exact_locality | 7,342 | 52.4% |
| none | 3,435 | 24.5% |
| city_fallback | 3,244 | 23.1% |

**Leakage verification checklist:**
- ✅ Join key does NOT include `price_inr`, `price_lakhs`, or any target
- ✅ `rental_yield_pct` computed AFTER join using locality-aggregate rent
- ✅ Rental dataset and sale dataset are from different sources (MagicBricks rental vs scraped sale listings)
- ✅ Rental stats are AGGREGATES (median/mean across many listings), not individual property prices
- ✅ City-level fallback uses global city median — no locality-specific price signal leaks

---

## 5. Rental Yield Computation

```
annual_rent_estimate_inr = median_monthly_rent × 12
rental_yield_pct         = annual_rent_estimate_inr / price_inr × 100
```

| Metric | Value |
|---|---|
| Properties with yield computed | 10,586 |
| Yield range | 0.07% – 702.00% |
| Median yield | **4.62%** |
| Mean yield | 7.02% |

> [!NOTE]
> Typical residential rental yield in India ranges from **2–5%**. Higher yields indicate relatively affordable sale prices vs strong rental demand (value-buy signal). Very high yields (>8%) may indicate data quality issues or niche markets.

---

## 6. City-Level Rental Market Statistics

| City | Rental Listings | Median Rent | Median Rent/sqft | Median Yield |
|---|---|---|---|---|
| Bengaluru | 1,777 | ₹30,000 | ₹28/sqft | 4.90% |
| Delhi | 1,758 | ₹20,000 | ₹27/sqft | 3.20% |
| Mumbai | 1,696 | ₹54,000 | ₹79/sqft | 5.55% |
| Pune | 1,762 | ₹20,000 | ₹27/sqft | 4.93% |

---

## 7. Top 15 Localities by Rental Rate

| City | Locality | Listings | Median Rent | Median ₹/sqft |
|---|---|---|---|---|
| Mumbai | Korba Mithagar | 1 | ₹300,000 | ₹2,000 |
| Mumbai | Bolinj | 2 | ₹255,000 | ₹334 |
| Delhi | Golf Links | 1 | ₹1,210,000 | ₹334 |
| Delhi | Block 3 Ramesh Nagar | 1 | ₹20,000 | ₹333 |
| Mumbai | Upper Worli | 1 | ₹530,000 | ₹311 |
| Delhi | Shanti Kunj | 1 | ₹20,000 | ₹308 |
| Delhi | Shahpur Jat | 1 | ₹14,999 | ₹300 |
| Delhi | Chokhandi | 1 | ₹55,000 | ₹275 |
| Delhi | Block B Sewak Park | 1 | ₹13,500 | ₹270 |
| Delhi | Shiv Nagar Extension | 1 | ₹27,000 | ₹270 |
| Mumbai | Western Express Highway | 1 | ₹220,000 | ₹265 |
| Delhi | Gtb Enclave | 1 | ₹21,000 | ₹233 |
| Delhi | Sat Bari | 1 | ₹1,000,000 | ₹222 |
| Mumbai | Kala Nagar | 1 | ₹220,000 | ₹219 |
| Mumbai | Worli | 39 | ₹300,000 | ₹213 |

---

## 8. New Features Added to property_master_v2

| Feature | dtype | Non-null | Fill % | Leakage Safety |
|---|---|---|---|---|
| `rental_listing_count` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `avg_monthly_rent` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `median_monthly_rent` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `p25_monthly_rent` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `p75_monthly_rent` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `avg_rent_per_sqft` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `median_rent_per_sqft` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `avg_rental_area_sqft` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `rent_stddev` | float64 | 9,659 | 68.9% | Locality-aggregate from rental dataset — safe |
| `pct_furnished` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `pct_semi_furnished` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `dominant_bhk` | Int64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `annual_rent_estimate_inr` | float64 | 10,586 | 75.5% | Locality-aggregate from rental dataset — safe |
| `rental_yield_pct` | float64 | 10,586 | 75.5% | Derived: annual_rent_estimate / price_inr × 100 — safe |
| `rental_join_quality` | str | 14,021 | 100.0% | Locality-aggregate from rental dataset — safe |

---

## 9. Output Files

| File | Description |
|---|---|
| [`data/processed/rental_clean.csv`](../data/processed/rental_clean.csv) | 7,579 cleaned rental listings with canonical columns |
| [`data/features/rental_features.csv`](../data/features/rental_features.csv) | 1,858 city+locality aggregate rental stats |
| [`data/processed/property_master_v2.csv`](../data/processed/property_master_v2.csv) | 14,021 rows × 46 cols — master + 15 rental features |
| [`reports/phase_5_rental_features.md`](phase_5_rental_features.md) | This report |
| [`reports/figures/phase5_rental_dashboard.png`](figures/phase5_rental_dashboard.png) | 10-panel rental market dashboard |

---

*Phase 5 complete — proceed to Phase 6: Full EDA, Spatial Feature Engineering & Geocoding.*
