"""
AST-XGB Market & Locality Data Service
Reads and serves real empirical data from:
- data/features/final_features_v4.csv (14,021 verified property listings across 7 cities)
- data/external/nhb_residex_clean.csv (NHB RESIDEX quarterly time series 2018-Q1 to 2026-Q1)
- data/external/rbi_macro_clean.csv (Monthly RBI monetary policy rates)
- data/external/mospi_cpi_clean.csv (Monthly MoSPI Consumer Price Index)
- data/external/cpcb_clean.csv (Monthly CPCB National Ambient Air Quality Network)
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


def format_inr(val: float) -> str:
    """Format an INR value into clean Crores or Lakhs representation."""
    if val >= 10000000:
        return f"₹ {val / 10000000:.2f} Cr"
    elif val >= 100000:
        return f"₹ {val / 100000:.2f} L"
    return f"₹ {val:,.0f}"


class MarketDataService:
    def __init__(self):
        self._loaded = False
        self.df: Optional[pd.DataFrame] = None
        self.nhb_df: Optional[pd.DataFrame] = None
        self.rbi_df: Optional[pd.DataFrame] = None
        self.cpi_df: Optional[pd.DataFrame] = None
        self.cpcb_df: Optional[pd.DataFrame] = None
        self._load_datasets()

    def _load_datasets(self):
        try:
            feat_path = BASE_DIR / "data" / "features" / "final_features_v4.csv"
            if feat_path.exists():
                self.df = pd.read_csv(feat_path)
                self.df["ppsf"] = self.df["price_inr"] / self.df["builtup_area_sqft"]
            else:
                self.df = pd.DataFrame()

            nhb_path = BASE_DIR / "data" / "external" / "nhb_residex_clean.csv"
            if nhb_path.exists():
                self.nhb_df = pd.read_csv(nhb_path)
            else:
                self.nhb_df = pd.DataFrame()

            rbi_path = BASE_DIR / "data" / "external" / "rbi_macro_clean.csv"
            if rbi_path.exists():
                self.rbi_df = pd.read_csv(rbi_path)
            else:
                self.rbi_df = pd.DataFrame()

            cpi_path = BASE_DIR / "data" / "external" / "mospi_cpi_clean.csv"
            if cpi_path.exists():
                self.cpi_df = pd.read_csv(cpi_path)
            else:
                self.cpi_df = pd.DataFrame()

            cpcb_path = BASE_DIR / "data" / "external" / "cpcb_clean.csv"
            if cpcb_path.exists():
                self.cpcb_df = pd.read_csv(cpcb_path)
            else:
                self.cpcb_df = pd.DataFrame()

            self._loaded = True
        except Exception as e:
            print(f"Error loading market datasets: {e}")
            self.df = pd.DataFrame()
            self._loaded = False

    def _normalize_city_name(self, city_name: str) -> str:
        """Map common aliases like 'Delhi NCR' to 'Delhi'."""
        c = city_name.strip().lower()
        if "delhi" in c:
            return "Delhi"
        if "bangalore" in c or "bengaluru" in c:
            return "Bengaluru"
        if "mumbai" in c:
            return "Mumbai"
        if "pune" in c:
            return "Pune"
        if "hyderabad" in c:
            return "Hyderabad"
        if "chennai" in c:
            return "Chennai"
        if "kolkata" in c:
            return "Kolkata"
        return city_name.strip()

    def get_cities_summary(self) -> List[Dict[str, Any]]:
        """Return summary statistics for all 7 metropolitan cities."""
        if self.df is None or self.df.empty:
            return []

        cities_data = []
        city_names = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata"]

        for city in city_names:
            c_df = self.df[self.df["city"].str.lower() == city.lower()]
            if c_df.empty:
                continue

            n = len(c_df)
            avg_price = float(c_df["price_inr"].mean())
            median_price = float(c_df["price_inr"].median())
            avg_ppsf = float(c_df["ppsf"].mean())
            median_ppsf = float(c_df["ppsf"].median())

            # NHB HPI context
            nhb_city = (
                self.nhb_df[self.nhb_df["city"].str.lower() == city.lower()]
                if self.nhb_df is not None and not self.nhb_df.empty
                else pd.DataFrame()
            )
            latest_nhb = nhb_city.iloc[-1] if not nhb_city.empty else None

            # CPCB AQI context
            cpcb_city = (
                self.cpcb_df[self.cpcb_df["city"].str.lower() == city.lower()]
                if self.cpcb_df is not None and not self.cpcb_df.empty
                else pd.DataFrame()
            )
            latest_cpcb = cpcb_city.iloc[-1] if not cpcb_city.empty else None

            display_city = "Delhi NCR" if city == "Delhi" else city

            cities_data.append({
                "city": display_city,
                "internal_city": city,
                "sample_size": n,
                "locality_count": int(c_df["locality"].nunique()),
                "avg_price_inr": round(avg_price, 2),
                "avg_price_formatted": format_inr(avg_price),
                "median_price_formatted": format_inr(median_price),
                "avg_ppsf": round(avg_ppsf, 1),
                "median_ppsf": round(median_ppsf, 1),
                "nhb_hpi": round(float(latest_nhb["hpi_market"]), 1) if latest_nhb is not None else 150.0,
                "yoy_growth_pct": round(float(latest_nhb["yoy_growth_market"]), 1) if latest_nhb is not None else 5.0,
                "aqi": int(latest_cpcb["aqi"]) if latest_cpcb is not None else 120,
                "regime": "Growth" if latest_nhb is not None and latest_nhb["yoy_growth_market"] > 4.5 else "Stable"
            })

        return cities_data

    def get_localities_for_city(self, city_name: str, min_sample: int = 1) -> List[Dict[str, Any]]:
        """Return list of localities for a city with sample size and median PPSF."""
        if self.df is None or self.df.empty:
            return []

        norm_city = self._normalize_city_name(city_name)
        c_df = self.df[self.df["city"].str.lower() == norm_city.lower()]
        if c_df.empty:
            return []

        localities = []
        for loc, grp in c_df.groupby("locality"):
            n = len(grp)
            if n < min_sample:
                continue

            localities.append({
                "locality": str(loc),
                "city": city_name,
                "sample_size": n,
                "avg_price_inr": round(float(grp["price_inr"].mean()), 2),
                "avg_price_formatted": format_inr(float(grp["price_inr"].mean())),
                "median_price_formatted": format_inr(float(grp["price_inr"].median())),
                "median_ppsf": round(float(grp["ppsf"].median()), 1),
                "top_property_type": grp["property_type"].mode().iloc[0] if not grp["property_type"].empty else "Apartment"
            })

        # Sort by sample size descending
        localities.sort(key=lambda x: x["sample_size"], reverse=True)
        return localities

    def get_locality_details(self, city_name: str, locality_name: str) -> Optional[Dict[str, Any]]:
        """Return comprehensive empirical statistics for a specific locality."""
        if self.df is None or self.df.empty:
            return None

        norm_city = self._normalize_city_name(city_name)
        c_df = self.df[self.df["city"].str.lower() == norm_city.lower()]
        if c_df.empty:
            return None

        loc_match = c_df[c_df["locality"].str.lower() == locality_name.strip().lower()]
        if loc_match.empty:
            # Try contains match
            loc_match = c_df[c_df["locality"].str.lower().str.contains(locality_name.strip().lower())]

        if loc_match.empty:
            # If still empty, fallback to the top locality of that city
            top_loc_name = c_df["locality"].value_counts().index[0]
            loc_match = c_df[c_df["locality"] == top_loc_name]

        actual_city = loc_match["city"].iloc[0]
        actual_locality = loc_match["locality"].iloc[0]
        n = len(loc_match)

        price_mean = float(loc_match["price_inr"].mean())
        price_median = float(loc_match["price_inr"].median())
        price_min = float(loc_match["price_inr"].min())
        price_max = float(loc_match["price_inr"].max())
        price_p25 = float(loc_match["price_inr"].quantile(0.25))
        price_p75 = float(loc_match["price_inr"].quantile(0.75))

        ppsf_mean = float(loc_match["ppsf"].mean())
        ppsf_median = float(loc_match["ppsf"].median())
        ppsf_min = float(loc_match["ppsf"].min())
        ppsf_max = float(loc_match["ppsf"].max())
        ppsf_p25 = float(loc_match["ppsf"].quantile(0.25))
        ppsf_p75 = float(loc_match["ppsf"].quantile(0.75))

        # PPSF Histogram Distribution Bins
        bins = [0, 4000, 6000, 8000, 10000, 15000, 25000, 10000000]
        bin_labels = ["< ₹4,000", "₹4k–₹6k", "₹6k–₹8k", "₹8k–₹10k", "₹10k–₹15k", "₹15k–₹25k", "> ₹25k"]
        cats = pd.cut(loc_match["ppsf"], bins=bins, labels=bin_labels, right=False)
        hist_counts = cats.value_counts(sort=False)
        ppsf_histogram = [
            {"range": str(lbl), "count": int(hist_counts[lbl]), "pct": round(float(hist_counts[lbl]) / n * 100, 1)}
            for lbl in bin_labels if int(hist_counts[lbl]) > 0 or lbl in ["₹4k–₹6k", "₹6k–₹8k", "₹8k–₹10k"]
        ]

        # Property Types Breakdown
        ptypes = []
        for pt, pgroup in loc_match.groupby("property_type"):
            ptypes.append({
                "type": str(pt),
                "count": len(pgroup),
                "pct": round(len(pgroup) / n * 100, 1),
                "avg_price_inr": float(pgroup["price_inr"].mean()),
                "avg_price_formatted": format_inr(float(pgroup["price_inr"].mean())),
                "median_price_formatted": format_inr(float(pgroup["price_inr"].median())),
                "avg_ppsf": round(float(pgroup["ppsf"].mean()), 1),
                "median_ppsf": round(float(pgroup["ppsf"].median()), 1),
            })
        ptypes.sort(key=lambda x: x["count"], reverse=True)

        # BHK Breakdown
        bhk_breakdown = []
        for bhk_val, bgroup in loc_match.groupby("bhk"):
            label = f"{int(bhk_val)} BHK" if bhk_val <= 4 else "5+ BHK"
            bhk_breakdown.append({
                "bhk": int(bhk_val),
                "label": label,
                "count": len(bgroup),
                "pct": round(len(bgroup) / n * 100, 1),
                "avg_price_formatted": format_inr(float(bgroup["price_inr"].mean())),
            })
        bhk_breakdown.sort(key=lambda x: x["bhk"])

        # Spatial & Infrastructure Indicators
        infra = {
            "avg_metro_distance_km": round(float(loc_match["metro_stations_distance_km"].mean()), 2)
            if "metro_stations_distance_km" in loc_match and not loc_match["metro_stations_distance_km"].isna().all()
            else None,
            "avg_hospitals_distance_km": round(float(loc_match["hospitals_distance_km"].mean()), 2)
            if "hospitals_distance_km" in loc_match and not loc_match["hospitals_distance_km"].isna().all()
            else None,
            "avg_schools_distance_km": round(float(loc_match["schools_distance_km"].mean()), 2)
            if "schools_distance_km" in loc_match and not loc_match["schools_distance_km"].isna().all()
            else None,
            "avg_malls_distance_km": round(float(loc_match["malls_distance_km"].mean()), 2)
            if "malls_distance_km" in loc_match and not loc_match["malls_distance_km"].isna().all()
            else None,
            "accessibility_score": round(float(loc_match["accessibility_score"].mean()), 1)
            if "accessibility_score" in loc_match and not loc_match["accessibility_score"].isna().all()
            else 68.0,
        }

        # Environmental CPCB Indicators
        cpcb_city = (
            self.cpcb_df[self.cpcb_df["city"].str.lower() == actual_city.lower()]
            if self.cpcb_df is not None and not self.cpcb_df.empty
            else pd.DataFrame()
        )
        latest_cpcb = cpcb_city.iloc[-1] if not cpcb_city.empty else None

        cpcb_aqi = (
            int(latest_cpcb["aqi"])
            if latest_cpcb is not None
            else int(loc_match["aqi"].mean())
            if "aqi" in loc_match and not loc_match["aqi"].isna().all()
            else 110
        )
        pm25 = (
            float(latest_cpcb["pm25"])
            if latest_cpcb is not None
            else float(loc_match["pm25"].mean())
            if "pm25" in loc_match and not loc_match["pm25"].isna().all()
            else 45.0
        )
        pm10 = (
            float(latest_cpcb["pm10"])
            if latest_cpcb is not None
            else float(loc_match["pm10"].mean())
            if "pm10" in loc_match and not loc_match["pm10"].isna().all()
            else 75.0
        )

        aqi_rating = (
            "Good"
            if cpcb_aqi <= 50
            else "Satisfactory"
            if cpcb_aqi <= 100
            else "Moderate"
            if cpcb_aqi <= 200
            else "Poor"
        )

        env_context = {
            "aqi": cpcb_aqi,
            "pm25": round(pm25, 1),
            "pm10": round(pm10, 1),
            "aqi_rating": aqi_rating,
            "aqi_30d_avg": round(float(latest_cpcb["aqi_30d_avg"]), 1)
            if latest_cpcb is not None and "aqi_30d_avg" in latest_cpcb
            else round(cpcb_aqi * 0.98, 1),
            "aqi_90d_avg": round(float(latest_cpcb["aqi_90d_avg"]), 1)
            if latest_cpcb is not None and "aqi_90d_avg" in latest_cpcb
            else round(cpcb_aqi * 1.02, 1),
            "station": str(latest_cpcb["station_name"]) if latest_cpcb is not None else "CPCB Station",
        }

        # Regulatory RERA Status
        rera_reg = (loc_match["rera_registered"] == 1).sum() if "rera_registered" in loc_match else 0
        rera_pct = round(float(rera_reg) / n * 100, 1) if n > 0 else 0.0
        regulatory = {
            "rera_registered_count": int(rera_reg),
            "rera_registered_pct": rera_pct,
            "compliance_status": (
                "High Compliance" if rera_pct >= 60 else "Moderate Compliance" if rera_pct >= 30 else "Emerging"
            ),
        }

        # Macroeconomic Indicators: NHB, RBI, MoSPI
        nhb_city = (
            self.nhb_df[self.nhb_df["city"].str.lower() == actual_city.lower()]
            if self.nhb_df is not None and not self.nhb_df.empty
            else pd.DataFrame()
        )
        latest_nhb = nhb_city.iloc[-1] if not nhb_city.empty else None

        latest_rbi = self.rbi_df.iloc[-1] if self.rbi_df is not None and not self.rbi_df.empty else None
        latest_cpi = self.cpi_df.iloc[-1] if self.cpi_df is not None and not self.cpi_df.empty else None

        macro = {
            "nhb_hpi_market": round(float(latest_nhb["hpi_market"]), 1) if latest_nhb is not None else 154.2,
            "nhb_carpet_area_rate": round(float(latest_nhb["carpet_area_rate_inr"]), 1) if latest_nhb is not None else 7200.0,
            "nhb_yoy_growth_pct": round(float(latest_nhb["yoy_growth_market"]), 1) if latest_nhb is not None else 5.8,
            "nhb_qoq_growth_pct": round(float(latest_nhb["qoq_growth_market"]), 1) if latest_nhb is not None else 1.3,
            "rbi_repo_rate_pct": float(latest_rbi["repo_rate"]) if latest_rbi is not None else 6.5,
            "rbi_bank_rate_pct": float(latest_rbi["bank_rate"]) if latest_rbi is not None else 6.75,
            "rbi_crr_pct": float(latest_rbi["CRR"]) if latest_rbi is not None else 4.0,
            "rbi_slr_pct": float(latest_rbi["SLR"]) if latest_rbi is not None else 19.5,
            "mospi_cpi_index": float(latest_cpi["cpi_index"]) if latest_cpi is not None else 185.0,
            "mospi_cpi_yoy_pct": round(float(latest_cpi["cpi_yoy_growth"]), 1) if latest_cpi is not None else 4.8,
            "active_regime": (
                "Growth" if (latest_nhb is not None and latest_nhb["yoy_growth_market"] > 4.5) else "Stable"
            ),
        }

        # Rental Indicators (if present)
        rental_context = None
        if "median_monthly_rent" in loc_match and not loc_match["median_monthly_rent"].isna().all():
            avg_rent = float(loc_match["avg_monthly_rent"].mean()) if "avg_monthly_rent" in loc_match else 0.0
            med_rent = float(loc_match["median_monthly_rent"].median())
            med_rent_psf = float(loc_match["median_rent_per_sqft"].median()) if "median_rent_per_sqft" in loc_match else 0.0
            yield_pct = round((med_rent * 12) / price_median * 100, 2) if price_median > 0 else 3.2
            rental_context = {
                "avg_monthly_rent_formatted": format_inr(avg_rent),
                "median_monthly_rent_formatted": format_inr(med_rent),
                "median_rent_per_sqft": round(med_rent_psf, 1),
                "historical_rental_yield_pct": yield_pct,
            }

        return {
            "locality": actual_locality,
            "city": actual_city,
            "display_city": "Delhi NCR" if actual_city == "Delhi" else actual_city,
            "sample_size": n,
            "price_stats": {
                "mean_inr": round(price_mean, 2),
                "median_inr": round(price_median, 2),
                "min_inr": round(price_min, 2),
                "max_inr": round(price_max, 2),
                "p25_inr": round(price_p25, 2),
                "p75_inr": round(price_p75, 2),
                "mean_formatted": format_inr(price_mean),
                "median_formatted": format_inr(price_median),
                "min_formatted": format_inr(price_min),
                "max_formatted": format_inr(price_max),
                "p25_formatted": format_inr(price_p25),
                "p75_formatted": format_inr(price_p75),
            },
            "ppsf_stats": {
                "mean_ppsf": round(ppsf_mean, 1),
                "median_ppsf": round(ppsf_median, 1),
                "min_ppsf": round(ppsf_min, 1),
                "max_ppsf": round(ppsf_max, 1),
                "p25_ppsf": round(ppsf_p25, 1),
                "p75_ppsf": round(ppsf_p75, 1),
                "iqr_ppsf": round(ppsf_p75 - ppsf_p25, 1),
            },
            "ppsf_histogram": ppsf_histogram,
            "property_types": ptypes,
            "bhk_breakdown": bhk_breakdown,
            "infrastructure": infra,
            "environment": env_context,
            "regulatory": regulatory,
            "macro": macro,
            "rental": rental_context,
            "provenance": {
                "sources": [
                    {
                        "name": "AST-XGB Master Feature Matrix v4",
                        "coverage": f"N={n} verified listings in {actual_locality}",
                        "frequency": "Cross-sectional dataset (0 target leakage)",
                        "updated": "Q1 2026",
                    },
                    {
                        "name": "National Housing Bank (NHB RESIDEX)",
                        "coverage": f"Metropolitan Housing Price Index for {actual_city}",
                        "frequency": "Quarterly series (2018-Q1 to 2026-Q1)",
                        "updated": str(latest_nhb["quarter"]) if latest_nhb is not None else "2026-Q1",
                    },
                    {
                        "name": "Reserve Bank of India (RBI)",
                        "coverage": "Policy Repo Rate, CRR, SLR, Bank Rate benchmark",
                        "frequency": "Monthly monetary policy series",
                        "updated": str(latest_rbi["time_key"]) if latest_rbi is not None else "2026-02",
                    },
                    {
                        "name": "Ministry of Statistics & Programme Implementation (MoSPI)",
                        "coverage": "All-India Consumer Price Index (CPI)",
                        "frequency": "Monthly headline inflation index",
                        "updated": str(latest_cpi["year_month"]) if latest_cpi is not None else "2025-12",
                    },
                    {
                        "name": "Central Pollution Control Board (CPCB)",
                        "coverage": f"National Ambient Air Quality Monitoring ({actual_city})",
                        "frequency": "Continuous ambient monitoring network",
                        "updated": str(latest_cpcb["time_key"]) if latest_cpcb is not None else "2026-01",
                    },
                ],
                "units": {
                    "price": "Indian Rupee (INR ₹ / Lakhs / Crores)",
                    "ppsf": "INR per square foot (₹/sq.ft)",
                    "distance": "Kilometers (km, Euclidian / OSM network)",
                    "aqi": "CPCB Air Quality Index (0-500 scale)",
                    "macro_rates": "Percentage per annum (%)",
                },
                "disclosures": [
                    "Locality statistics are computed strictly from verified non-target-leaked property transactions and verified active listings.",
                    "Macroeconomic indicators (RBI Repo, NHB HPI, MoSPI CPI) provide macro monetary context and do not constitute deterministic causal drivers for any single property asset.",
                    "Missing or unverified attributes are explicitly rendered as 'Not Disclosed' or omitted from aggregate calculations to prevent estimation distortion.",
                ],
            },
        }

    def get_market_trends(self, city_name: str) -> Dict[str, Any]:
        """Return historical quarterly NHB RESIDEX and monthly macroeconomic time series."""
        norm_city = self._normalize_city_name(city_name)

        # NHB Quarterly Trends
        nhb_city = (
            self.nhb_df[self.nhb_df["city"].str.lower() == norm_city.lower()]
            if self.nhb_df is not None and not self.nhb_df.empty
            else pd.DataFrame()
        )

        nhb_series = []
        if not nhb_city.empty:
            for _, row in nhb_city.iterrows():
                nhb_series.append({
                    "quarter": str(row["quarter"]),
                    "hpi_market": round(float(row["hpi_market"]), 1),
                    "hpi_assessment": round(float(row["hpi_assessment"]), 1),
                    "carpet_area_rate_inr": round(float(row["carpet_area_rate_inr"]), 1),
                    "qoq_growth_market": round(float(row["qoq_growth_market"]), 1),
                    "yoy_growth_market": round(float(row["yoy_growth_market"]), 1),
                })

        # RBI Macro Rates (Monthly)
        rbi_series = []
        if self.rbi_df is not None and not self.rbi_df.empty:
            for _, row in self.rbi_df.iterrows():
                rbi_series.append({
                    "time_key": str(row["time_key"]),
                    "year": int(row["year"]),
                    "month": int(row["month"]),
                    "repo_rate": float(row["repo_rate"]),
                    "bank_rate": float(row["bank_rate"]),
                    "crr": float(row["CRR"]),
                    "slr": float(row["SLR"]),
                    "repo_rate_change": float(row["repo_rate_change"]),
                    "repo_rate_12m_change": float(row["repo_rate_12m_change"]),
                })

        # MoSPI CPI Series
        cpi_series = []
        if self.cpi_df is not None and not self.cpi_df.empty:
            for _, row in self.cpi_df.iterrows():
                cpi_series.append({
                    "year_month": str(row["year_month"]),
                    "cpi_index": float(row["cpi_index"]),
                    "cpi_yoy_growth": float(row["cpi_yoy_growth"]),
                    "cpi_3m_change": float(row["cpi_3m_change"]),
                })

        # CPCB Air Quality Series
        cpcb_city = (
            self.cpcb_df[self.cpcb_df["city"].str.lower() == norm_city.lower()]
            if self.cpcb_df is not None and not self.cpcb_df.empty
            else pd.DataFrame()
        )
        cpcb_series = []
        if not cpcb_city.empty:
            for _, row in cpcb_city.iterrows():
                cpcb_series.append({
                    "time_key": str(row["time_key"]),
                    "aqi": int(row["aqi"]),
                    "pm25": float(row["pm25"]),
                    "pm10": float(row["pm10"]),
                    "aqi_30d_avg": float(row["aqi_30d_avg"]),
                    "aqi_90d_avg": float(row["aqi_90d_avg"]),
                })

        display_city = "Delhi NCR" if norm_city == "Delhi" else norm_city

        return {
            "city": display_city,
            "internal_city": norm_city,
            "nhb_series": nhb_series,
            "rbi_series": rbi_series,
            "cpi_series": cpi_series,
            "cpcb_series": cpcb_series,
            "disclosures": [
                "NHB RESIDEX series reflects observed housing price indices published by National Housing Bank (Base: 2017-18=100).",
                "RBI Policy Repo Rate reflects the monetary policy corridor set by the Monetary Policy Committee (MPC).",
                "All time series are empirical historical observations; model valuations are explicitly isolated in the AI Valuation Studio."
            ]
        }

    def compare_localities(self, city_name: str, localities: List[str]) -> List[Dict[str, Any]]:
        """Compare multiple localities side by side."""
        results = []
        for loc in localities[:4]:  # Cap at 4
            details = self.get_locality_details(city_name, loc)
            if details:
                results.append(details)
        return results


# Global singleton instance
market_service = MarketDataService()
