# Phase 9 — RERA Duplicate Join Repair Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** 2026-08-30 20:56:24

---

## 1. Audit Summary

During the Phase 1 to 16 verification audit, a duplicate join bug was detected in the RERA matching step. 
This script performs a full repair of Phase 9 RERA integration:
1. Groups and aggregates multi-phase RERA records in `rera_clean.csv` sharing identical `clean_developer + clean_project_name + city + locality` keys prior to matching.
2. Eliminates many-to-many join hazards, ensuring the row count remains exactly unchanged at **14,021 unique property records**.
3. Recomputes temporal-aware property-level and developer-level track records.

---

## 2. Join Metrics & Audit Log

| Metric | Before Fix | After Fix | Target / Status |
|---|---|---|---|
| **Property Master Rows** | 14,029 | **14,021** | ✅ Restored to unique canonical count |
| **RERA Rows (branded)** | 4,166 | 4,166 | Baseline DB |
| **Duplicate Property IDs** | 8 | **0** | ✅ Duplicate rows resolved |
| **Matched properties** | 5,029 | 5,021 | Unique project matches |
| **Unmatched properties** | 9,000 | 9,000 | Preserved as Unregistered |
| **Multi-match properties** | 8 | **0** | ✅ All multi-matches aggregated |
| **Max RERA matches per property**| 2 | **1** | ✅ Aggregation rule enforced |

---

## 3. RERA Aggregation Rules

For projects with multiple phases/records in the RERA database sharing the same lowercased matching key:
- **`rera_id`**: Set to the `first` matching RERA ID.
- **`project_start_date`**: Set to the `min` (earliest start date among phases) to capture the true project age.
- **`project_completion_date`**: Set to the `max` (latest completion date of any phase) to capture the overall construction duration.
- **`total_units`, `sold_units`, `unsold_units`**: Summed across all phases to reflect the full scale of the development.
- **`project_status`**: Historically determined. If `listing_date < project_completion_date`, status is `Ongoing`, else `Completed`.

---

## 4. Output Files

| File | Description | Rows | Columns | Status |
|---|---|---|---|---|
| [`data/features/rera_features_clean.csv`](../data/features/rera_features_clean.csv) | Clean RERA features mapping table | 14,021 | 11 | ✅ Saved |
| [`data/processed/property_master_v10.csv`](property_master_v10.csv) | Final cleaned master dataset | 14,021 | 93 | ✅ Saved |

---

*Phase 9 complete — RERA duplication bug resolved, master dataset v10 validated.*
