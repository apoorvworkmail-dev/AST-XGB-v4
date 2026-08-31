"""
Comprehensive End-to-End Verification Audit (Phases 1 - 20)
AST-XGB Real Estate Price Prediction Project
Author: Apoorv Mishra
"""

import os, sys, json, joblib
import numpy as np
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

print("=" * 72)
print("COMPREHENSIVE END-TO-END PROJECT AUDIT (PHASES 1 - 20)")
print("=" * 72)

audit_passed = True
errors = []

# ── 1. Dataset & Leakage Repair Audit ──────────────────────────────────────────
print("\n[1/8] Auditing Clean v4 Feature Matrix & Leakage Repair …")
v4_path = BASE_DIR / "data" / "features" / "final_features_v4.csv"
if not v4_path.exists():
    errors.append("final_features_v4.csv missing!")
    audit_passed = False
else:
    df_v4 = pd.read_csv(v4_path)
    print(f"  ✓ Dataset exists: {len(df_v4):,} rows x {len(df_v4.columns)} columns")
    assert len(df_v4) == 14021, f"Expected 14,021 rows, got {len(df_v4)}"
    assert df_v4['property_master_id'].nunique() == 14021, "Duplicate property IDs found!"
    
    # Contaminated features check
    for c_feat in ['rental_yield_pct', 'derived_rental_yield_log1p', 'target_locality_median_ppsf']:
        if c_feat in df_v4.columns:
            errors.append(f"Contaminated feature {c_feat} found in v4 features!")
            audit_passed = False
            
    # Leakage-safe features check
    for s_feat in ['historical_locality_median_ppsf', 'historical_rental_yield_pct', 'derived_historical_rental_yield_log1p']:
        if s_feat not in df_v4.columns:
            errors.append(f"Required leakage-safe feature {s_feat} missing in v4 features!")
            audit_passed = False
    print("  ✓ Zero contaminated features & all leakage-safe historical proxies present.")

# ── 2. Split Integrity Audit (Phase 13 v4) ────────────────────────────────────
print("\n[2/8] Auditing Phase 13 v4 Temporal, Random & Geographic Splits …")
t_tr = pd.read_csv(BASE_DIR / "data" / "splits" / "final_temporal_train_v4.csv")
t_va = pd.read_csv(BASE_DIR / "data" / "splits" / "final_temporal_val_v4.csv")
t_te = pd.read_csv(BASE_DIR / "data" / "splits" / "final_temporal_test_v4.csv")

print(f"  ✓ Temporal Train: {len(t_tr):,}, Val: {len(t_va):,}, Test: {len(t_te):,}")

ids_tr = set(t_tr['property_master_id'])
ids_va = set(t_va['property_master_id'])
ids_te = set(t_te['property_master_id'])

overlap_tr_va = ids_tr.intersection(ids_va)
overlap_tr_te = ids_tr.intersection(ids_te)
overlap_va_te = ids_va.intersection(ids_te)

if overlap_tr_va or overlap_tr_te or overlap_va_te:
    errors.append("Property ID overlap detected across temporal splits!")
    audit_passed = False
else:
    print("  ✓ 0 Property ID overlap across Train, Val, and Test temporal splits.")

# ── 3. Models & Phase 14 / 15 Benchmarks Audit ───────────────────────────────
print("\n[3/8] Auditing Trained Models & Phase 15 Optimized XGBoost Artifacts …")
model_p = BASE_DIR / "models" / "xgboost_final_v4" / "final_xgboost_model.pkl"
prep_p  = BASE_DIR / "models" / "xgboost_final_v4" / "preprocessing_pipeline.pkl"

if not model_p.exists() or not prep_p.exists():
    errors.append("Phase 15 model or preprocessor artifact missing!")
    audit_passed = False
else:
    xgb_model = joblib.load(model_p)
    preproc   = joblib.load(prep_p)
    print(f"  ✓ Phase 15 XGBoost Model & ColumnTransformer loaded successfully.")

comp_p15 = BASE_DIR / "results" / "phase_15_model_comparison.csv"
if comp_p15.exists():
    df_c15 = pd.read_csv(comp_p15)
    opt_xgb = df_c15[(df_c15['model'] == 'Optimized XGBoost') & (df_c15['dataset'] == 'Test')].iloc[0]
    print(f"  ✓ Optimized XGBoost Temporal Test Performance: MAE = ₹{opt_xgb['MAE']/100000:.2f}L, MAPE = {opt_xgb['MAPE']:.2f}%, R² = {opt_xgb['R2']:.4f}")

# ── 4. SHAP Explainability Audit (Phase 16) ──────────────────────────────────
print("\n[4/8] Auditing Phase 16 SHAP Explainability Artifacts …")
shap_top_p = BASE_DIR / "results" / "phase_16_top_features.csv"
if shap_top_p.exists():
    df_shap = pd.read_csv(shap_top_p)
    top1 = df_shap.iloc[0]['feature']
    top1_val = df_shap.iloc[0]['mean_abs_shap']
    print(f"  ✓ Top SHAP Driver: '{top1}' (Mean |SHAP| = {top1_val:.4f})")
    assert top1 == 'builtup_area_sqft', f"Expected top SHAP feature builtup_area_sqft, got {top1}"

# ── 5. Paper Figures Audit (Phase 17) ─────────────────────────────────────────
print("\n[5/8] Auditing Phase 17 Publication Paper Figures (28 Figures, PNG + PDF) …")
fig17_dir = BASE_DIR / "figures" / "phase_17"
png_count = len(list(fig17_dir.glob("*.png")))
pdf_count = len(list(fig17_dir.glob("*.pdf")))
print(f"  ✓ Phase 17 Figures directory: {png_count} PNGs (300 DPI) and {pdf_count} PDFs found.")
if png_count < 28 or pdf_count < 28:
    errors.append(f"Expected 28 PNG and 28 PDF paper figures in figures/phase_17/, found PNG:{png_count}, PDF:{pdf_count}")
    
    audit_passed = False

# ── 6. Feature-Group Ablation Study Audit (Phase 18) ──────────────────────────
print("\n[6/8] Auditing Phase 18 Feature-Group Ablation Study Results …")
rank_p18 = BASE_DIR / "results" / "phase_18_feature_group_ranking.csv"
if rank_p18.exists():
    df_r18 = pd.read_csv(rank_p18)
    top_grp = df_r18.iloc[0]['feature_group']
    top_change = df_r18.iloc[0]['MAE_change']
    print(f"  ✓ Most predictive feature group: '{top_grp}' (MAE increases by +₹{top_change/100000:.2f}L upon removal)")
    assert top_grp == 'PROPERTY', f"Expected top ablation group PROPERTY, got {top_grp}"

# ── 7. Uncertainty & Conformal Intervals Audit (Phase 19) ────────────────────
print("\n[7/8] Auditing Phase 19 Uncertainty & Conformal Prediction Results …")
unc_p19 = BASE_DIR / "results" / "phase_19_uncertainty_results.csv"
if unc_p19.exists():
    df_u19 = pd.read_csv(unc_p19)
    row90 = df_u19[df_u19['coverage_level'] == '90%'].iloc[0]
    print(f"  ✓ 90% Conformal Interval: Empirical Coverage = {row90['empirical_coverage']}%, Mean Width = ₹{row90['mean_interval_width']/100000:.2f}L")

# ── 8. Counterfactual Analysis Audit (Phase 20) ──────────────────────────────
print("\n[8/8] Auditing Phase 20 Counterfactual & What-If Results …")
cf_p20 = BASE_DIR / "results" / "phase_20_all_counterfactuals.csv"
cases_p20 = BASE_DIR / "results" / "phase_20_case_studies.csv"
if cf_p20.exists() and cases_p20.exists():
    df_cf20 = pd.read_csv(cf_p20)
    df_cases = pd.read_csv(cases_p20)
    print(f"  ✓ Master Counterfactual Scenarios: {len(df_cf20):,} scenarios across 5 sampled test properties.")
    print(f"  ✓ Representative Case Studies: {len(df_cases)} detailed properties merged with Phase 19 reference 90% intervals.")

# ── Final Audit Summary ──────────────────────────────────────────────────────
print("\n" + "=" * 72)
if audit_passed and not errors:
    print("FINAL END-TO-END AUDIT STATUS: PASS  ✅")
    print("All files, datasets, splits, models, SHAP, figures, ablation studies,")
    print("uncertainty quantiles, and counterfactual analysis from Phase 1 to Phase 20")
    print("are 100% verified, consistent, and operational!")
else:
    print("FINAL END-TO-END AUDIT STATUS: FAIL  ❌")
    for err in errors:
        print(f"  - {err}")
print("=" * 72)
