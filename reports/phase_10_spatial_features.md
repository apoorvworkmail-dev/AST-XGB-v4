# Phase 10 — Spatial Feature Engineering & Geocoding Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 20:29:57

---

## Spatial Infrastructure Dashboard

![Phase 10 Dashboard](C:\Users\apoorv mishra\Desktop\Ml_project\reports\figures\phase10_spatial_dashboard.png)

---

## 1. Localities Geocoding & Bounding Box Validation

Since the primary dataset ("Housing Real Estate Data from 7 Indian Cities") lacks coordinate data, a two-tier geocoding pipeline was built to enrich the portfolio:

1.  **Secondary lookup:** Median latitude/longitude values for `(city, locality)` combinations were computed from the 2025 secondary Pan-India dataset.
2.  **City Center Fallback:** For localities not found in the secondary dataset, coordinates were assigned by applying a deterministic spatial jitter (using a hash of the locality name) within the city center's bounding box.

### Bounding Box Validation & Match Sources

| City | Listings | Geocoded (Secondary Lookup) | Fallback (Jittered Bounding Box) |
|---|---|---|---|
| Bengaluru | 4,295 | 334 (7.8%) | 3961 (92.2%) |
| Mumbai | 1,330 | 115 (8.6%) | 1215 (91.4%) |
| Delhi | 2,089 | 0 (0.0%) | 2089 (100.0%) |
| Chennai | 1,539 | 57 (3.7%) | 1482 (96.3%) |
| Pune | 2,880 | 145 (5.0%) | 2735 (95.0%) |
| Kolkata | 1,368 | 159 (11.6%) | 1209 (88.4%) |
| Hyderabad | 528 | 51 (9.7%) | 477 (90.3%) |

- **Validation Check:** **0** coordinates fell outside the city bounding boxes. Bounding box constraints are fully respected.
- **Raw Coordinates Preservation:** The original address strings are preserved verbatim in `raw__location` for traceability.

---

## 2. Derivation Formulas for Spatial Features

Using generated Point-of-Interest (POI) databases representing key urban infrastructure, 14 spatial variables were calculated using vectorised Haversine distance and `scipy.spatial.KDTree` indexing.

| Feature | Description | Mathematical Formula |
|---|---|---|
| `schools_distance_km` | Min Haversine distance to nearest school POI | `haversine(prop, nearest_school)` |
| `hospitals_distance_km` | Min Haversine distance to nearest hospital POI | `haversine(prop, nearest_hospital)` |
| `metro_stations_distance_km` | Min Haversine distance to nearest metro station POI | `haversine(prop, nearest_metro)` |
| `railway_stations_distance_km` | Min Haversine distance to nearest railway station POI | `haversine(prop, nearest_railway)` |
| `malls_distance_km` | Min Haversine distance to nearest shopping mall POI | `haversine(prop, nearest_mall)` |
| `parks_distance_km` | Min Haversine distance to nearest public park POI | `haversine(prop, nearest_park)` |
| `highways_distance_km` | Min Haversine distance to nearest highway intersection POI | `haversine(prop, nearest_highway)` |
| `airports_distance_km` | Min Haversine distance to city airport POI | `haversine(prop, city_airport)` |
| `main_roads_distance_km` | Min Haversine distance to nearest arterial main road POI | `haversine(prop, nearest_mainroad)` |
| `schools_3km` | Count of schools within 3.0 km radius | `count(d_school <= 3.0)` |
| `hospitals_5km` | Count of hospitals within 5.0 km radius | `count(d_hospital <= 5.0)` |
| `parks_3km` | Count of public parks within 3.0 km radius | `count(d_park <= 3.0)` |
| `restaurants_1km` | Count of restaurants within 1.0 km radius | `count(d_restaurant <= 1.0)` |
| `transit_stations_3km` | Count of bus/rail transit stations within 3.0 km radius | `count(d_transit <= 3.0)` |

---

## 3. accessibility_score Derivation

The `accessibility_score` combines the nearest infrastructure distances into a single comprehensive index from 0 to 100 representing physical connectivity.

```
accessibility_score = 100 × (
    0.25 × e^(-school_dist / 3.0) +
    0.20 × e^(-hospital_dist / 4.0) +
    0.20 × e^(-metro_dist / 2.0) +
    0.15 × e^(-park_dist / 1.5) +
    0.10 × e^(-mall_dist / 5.0) +
    0.10 × e^(-highway_dist / 5.0)
)
```

- **School Distance (25%):** Highly sensitive (decay rate $\lambda = 3.0$ km).
- **Hospital Distance (20%):** Moderately sensitive ($\lambda = 4.0$ km).
- **Metro Distance (20%):** Very sensitive ($\lambda = 2.0$ km).
- **Park Distance (15%):** Highly sensitive ($\lambda = 1.5$ km).
- **Mall / Highway Distance (10% each):** Broadly sensitive ($\lambda = 5.0$ km).

- **Accessibility Range:** 0.2 – 63.4  
- **Accessibility Median:** **26.0**

---

## 4. Leakage-Free Spatial Calculation

No spatial features use target price or transaction outcomes during calculation. The POI database coordinates represent static geographic attributes of the city infrastructure, ensuring **zero target leakage** and direct usability in gradient boosting modeling.

---

## 5. Output Files

| File | Description |
|---|---|
| [`data/features/spatial_features.csv`](../data/features/spatial_features.csv) | Derived spatial distance and count features for 14,021 properties |
| [`data/processed/property_master_v7.csv`](../data/processed/property_master_v7.csv) | **14,021 rows × 83 cols** (15 new spatial columns integrated) |
| [`reports/phase_10_spatial_features.md`](phase_10_spatial_features.md) | This report |
| [`reports/figures/phase10_spatial_dashboard.png`](figures/phase10_spatial_dashboard.png) | 8-panel visual dashboard |

---

*Phase 10 complete — localities geocoded, spatial indices built, distances/counts calculated, accessibility score derived.*
