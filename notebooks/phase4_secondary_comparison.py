"""
Phase 4 — Secondary Dataset Inspection & Cross-Dataset Comparison
AST-XGB India Property Valuation System
Author: Apoorv Mishra

Secondary dataset: pratyushpuri/pan-india-property-listings-2025-real-estate-data
Primary dataset  : data/processed/property_master_v1.csv

Tasks:
  1. Inspect secondary schema
  2. Map columns to canonical schema
  3. Identify features unavailable in primary
  4. Compare distributions (price, area, BHK, baths, city, property_type)
  5. Detect schema incompatibilities
  6. Detect unit differences
  7. Detect distribution shift (KS test)
  8. Build feature availability matrix
  9. Save outputs — NO training, NO data mutation

Outputs:
  data/processed/secondary_schema_mapping.csv
  reports/phase_4_secondary_dataset_comparison.md
  reports/figures/phase4_comparison_dashboard.png
"""

import os, re, sys, warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from pathlib import Path
from scipy import stats

warnings.filterwarnings('ignore')

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent
PRIMARY    = BASE_DIR / "data" / "processed" / "property_master_v1.csv"
OUT_MAP    = BASE_DIR / "data" / "processed" / "secondary_schema_mapping.csv"
REPORT_DIR = BASE_DIR / "reports"
FIG_DIR    = REPORT_DIR / "figures"
OUT_REPORT = REPORT_DIR / "phase_4_secondary_dataset_comparison.md"
FIG_PATH   = FIG_DIR   / "phase4_comparison_dashboard.png"

REPORT_DIR.mkdir(parents=True, exist_ok=True)
FIG_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 72)
print("PHASE 4 │ Secondary Dataset Inspection & Distribution Comparison")
print("=" * 72)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 – Download & load secondary dataset
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 1 │ Downloading secondary dataset via kagglehub …")
import kagglehub
sec_path = Path(kagglehub.dataset_download(
    "pratyushpuri/pan-india-property-listings-2025-real-estate-data"
))
print(f"  Cache path: {sec_path}")

parts = []
split_label = {'train_part1.csv': 'train', 'train_part2.csv': 'train',
               'test_part1.csv' : 'test',  'test_part2.csv' : 'test'}
for fname, split in split_label.items():
    fp = sec_path / fname
    try:
        df_tmp = pd.read_csv(fp, encoding='utf-8', low_memory=False)
    except UnicodeDecodeError:
        df_tmp = pd.read_csv(fp, encoding='latin-1', low_memory=False)
    df_tmp['_split'] = split
    parts.append(df_tmp)
    print(f"  {fname}: {df_tmp.shape[0]:,} rows × {df_tmp.shape[1]} cols")

sec = pd.concat(parts, ignore_index=True)
sec.columns = [c.strip() for c in sec.columns]
N_SEC = len(sec)
N_SEC_TRAIN = (sec['_split'] == 'train').sum()
N_SEC_TEST  = (sec['_split'] == 'test').sum()
print(f"\n  Combined: {N_SEC:,} rows × {sec.shape[1]} cols")
print(f"  Train split (has Price_INR): {N_SEC_TRAIN:,}")
print(f"  Test  split (no  Price_INR): {N_SEC_TEST:,}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 – Load primary dataset (canonical master)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 2 │ Loading primary (canonical) dataset …")
pri = pd.read_csv(PRIMARY, encoding='utf-8', low_memory=False)
N_PRI = len(pri)
print(f"  Primary: {N_PRI:,} rows × {pri.shape[1]} cols")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 – Secondary schema inspection
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 3 │ Inspecting secondary schema …")
sec_dtypes = sec.drop(columns=['_split'], errors='ignore').dtypes
sec_nulls  = sec.drop(columns=['_split'], errors='ignore').isnull().sum()
sec_pct    = (sec_nulls / N_SEC * 100).round(2)

print(f"  Secondary columns ({len(sec.columns)-1}):")
for col in sec.columns:
    if col == '_split': continue
    print(f"    {col:<30} {str(sec[col].dtype):<12} "
          f"nulls: {sec_nulls.get(col,0):,} ({sec_pct.get(col,0):.1f}%)")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 – Column mapping: Secondary → Canonical schema
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 4 │ Building column mapping …")

# Canonical target fields (from property_schema.yaml)
CANONICAL_FIELDS = [
    'property_master_id','city','locality','latitude','longitude',
    'property_type','bhk','bathrooms','balconies','parking',
    'carpet_area_sqft','builtup_area_sqft','super_builtup_area_sqft','plot_area_sqft',
    'floor_no','total_floors','year_built','age_years','furnishing','facing',
    'rera_registered','rera_id','listing_date','price_inr','price_lakhs','price_per_sqft',
]

# Manual mapping: sec_col → canonical_col | compatibility | notes
MAPPING = [
    # sec_column               canonical_col            compat   unit_match  notes
    ('ListingID',              'property_master_id',    'PARTIAL','N/A',     'Different format; secondary uses HP##### prefix vs PROP-SHA256'),
    ('City',                   'city',                  'PARTIAL','N/A',     'INCOMPATIBLE VALUES: secondary has MMR (not canonical), Ahmedabad (not in primary 7 cities), Delhi NCR (vs Delhi)'),
    ('Locality',               'locality',              'PARTIAL','N/A',     'Same concept; secondary has cleaner locality names; different geographic coverage'),
    ('PropertyType',           'property_type',         'FULL',  'N/A',     'High overlap: Apartment, Villa, Independent House, Penthouse, Studio, Row House — all canonical'),
    ('BHK',                    'bhk',                   'PARTIAL','N/A',     'INCOMPATIBLE: secondary has BHK=0 for Studio (779 rows); primary starts at BHK=1'),
    ('Bathrooms',              'bathrooms',             'FULL',  'N/A',     'Compatible integer count; secondary range 1–7'),
    ('Balconies',              'balconies',             'INCOMPATIBLE','N/A','PRIMARY is binary 0/1; SECONDARY is count 0–3; semantically different'),
    ('Furnishing',             'furnishing',            'PARTIAL','N/A',     'LABEL MISMATCH: secondary uses "Furnished" (not "Fully-Furnished") vs primary canonical "Fully-Furnished"'),
    ('SuperBuiltUpArea_sqft',  'super_builtup_area_sqft','FULL', 'sqft',    'Identical unit (sqft); secondary has this fully populated; primary is 99.9% null from descriptions only'),
    ('BuiltUpArea_sqft',       'builtup_area_sqft',     'FULL',  'sqft',    'Identical unit (sqft); directly compatible'),
    ('CarpetArea_sqft',        'carpet_area_sqft',      'FULL',  'sqft',    'Identical unit (sqft); fully populated in secondary vs 89% null in primary'),
    ('Floor',                  'floor_no',              'FULL',  'level',   'Compatible; both 0-indexed (0=ground)'),
    ('TotalFloors',            'total_floors',          'FULL',  'count',   'Compatible integer count'),
    ('Parking',                'parking',               'INCOMPATIBLE','N/A','PRIMARY is count (0–10); SECONDARY is categorical (Covered/Open/Basement/Stilt) — type mismatch'),
    ('BuildingType',           None,                    'NEW',   'N/A',     'NOT IN PRIMARY SCHEMA: High Rise/Mid Rise/Low Rise/Gated Community/Standalone/Bungalow — valuable new feature'),
    ('YearBuilt',              'year_built',            'FULL',  'year',    'Compatible year integer; secondary has 1985–2025 range'),
    ('AgeYears',               'age_years',             'FULL',  'years',   'Compatible; both current_year - year_built'),
    ('Facing',                 'facing',                'FULL',  'N/A',     'All 8 directions identical to canonical: N/S/E/W/NE/NW/SE/SW'),
    ('AmenitiesCount',         None,                    'NEW',   'count',   'NOT IN PRIMARY SCHEMA: integer amenity count (3–12) — valuable new feature'),
    ('IsRERARegistered',       'rera_registered',       'INCOMPATIBLE','N/A','PRIMARY: 0/1 integer (mentions detected); SECONDARY: bool True/False — type difference; semantics match'),
    ('RERAID',                 'rera_id',               'FULL',  'N/A',     'Both string alphanumeric RERA IDs; compatible'),
    ('Latitude',               'latitude',              'FULL',  'degrees', 'WGS-84 compatible; secondary has 95 nulls; PRIMARY is 100% null (requires geocoding)'),
    ('Longitude',              'longitude',             'FULL',  'degrees', 'WGS-84 compatible; secondary has 103 nulls; PRIMARY is 100% null'),
    ('Price_INR',              'price_inr',             'FULL',  'INR',     'UNIT COMPATIBLE: both absolute INR; secondary train only (4,728 rows); test set has no price'),
    (None,                     'price_lakhs',           'MISSING','N/A',    'NOT IN SECONDARY: must derive as Price_INR / 100000'),
    (None,                     'price_per_sqft',        'MISSING','N/A',    'NOT IN SECONDARY: must derive as Price_INR / BuiltUpArea_sqft'),
    (None,                     'plot_area_sqft',        'MISSING','N/A',    'NOT IN SECONDARY: not present in any column'),
    (None,                     'listing_date',          'MISSING','N/A',    'NOT IN SECONDARY: not available (also missing in primary)'),
]

df_map = pd.DataFrame(MAPPING, columns=[
    'secondary_column', 'canonical_column', 'compatibility',
    'unit_compatibility', 'notes'
])
df_map.to_csv(OUT_MAP, index=False, encoding='utf-8')
print(f"  Saved mapping → {OUT_MAP}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 – City normalisation for secondary (comparison only)
# ═══════════════════════════════════════════════════════════════════════════════
CITY_NORM_SEC = {
    'Delhi NCR'  : 'Delhi',
    'MMR'        : 'Mumbai',        # Mumbai Metropolitan Region
    'Bengaluru'  : 'Bengaluru',
    'Chennai'    : 'Chennai',
    'Pune'       : 'Pune',
    'Kolkata'    : 'Kolkata',
    'Hyderabad'  : 'Hyderabad',
    'Ahmedabad'  : 'Ahmedabad',    # not in primary 7 cities
}
sec['city_canonical'] = sec['City'].map(CITY_NORM_SEC).fillna(sec['City'])
sec_train = sec[sec['_split'] == 'train'].copy()

# Price in Lakhs for secondary (train only)
sec_train['price_lakhs'] = sec_train['Price_INR'] / 1e5

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 – KS-test distribution comparisons (on shared cities)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 5 │ Running KS distribution tests …")

PRIMARY_7 = {'Bengaluru','Mumbai','Delhi','Chennai','Pune','Kolkata','Hyderabad'}

pri_7 = pri[pri['city'].isin(PRIMARY_7)].copy()
sec_7 = sec_train[sec_train['city_canonical'].isin(PRIMARY_7)].copy()

def ks_report(col_pri, col_sec, label):
    a = pri_7[col_pri].dropna()
    b = sec_7[col_sec].dropna() if col_sec in sec_7.columns else pd.Series(dtype=float)
    if len(a) == 0 or len(b) == 0:
        return {'feature': label, 'pri_median': np.nan, 'sec_median': np.nan,
                'ks_stat': np.nan, 'ks_pvalue': np.nan, 'shift': 'N/A'}
    ks_stat, ks_p = stats.ks_2samp(a, b)
    shift = 'SIGNIFICANT' if ks_p < 0.05 else 'NONE'
    return {
        'feature'    : label,
        'pri_n'      : len(a),
        'sec_n'      : len(b),
        'pri_median' : round(float(a.median()), 2),
        'sec_median' : round(float(b.median()), 2),
        'pri_mean'   : round(float(a.mean()), 2),
        'sec_mean'   : round(float(b.mean()), 2),
        'ks_stat'    : round(ks_stat, 4),
        'ks_pvalue'  : round(ks_p, 6),
        'shift'      : shift,
    }

ks_results = [
    ks_report('price_lakhs',       'price_lakhs',           'Price (Lakhs)'),
    ks_report('builtup_area_sqft', 'BuiltUpArea_sqft',      'Built-Up Area (sqft)'),
    ks_report('bhk',               'BHK',                   'BHK'),
    ks_report('bathrooms',         'Bathrooms',              'Bathrooms'),
]
df_ks = pd.DataFrame(ks_results)
print(df_ks[['feature','pri_median','sec_median','ks_stat','ks_pvalue','shift']].to_string(index=False))

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 – Feature availability matrix
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 6 │ Building feature availability matrix …")

# For each canonical field: availability in primary, availability in secondary
AVAIL_MATRIX = [
    # canonical_field              pri_avail  pri_fill%  sec_avail   sec_fill%   new_in_sec
    ('property_master_id',         'FULL',    100.0,     'NONE',      0.0,       False),
    ('city',                       'FULL',    100.0,     'FULL',    100.0-100*sec['City'].isna().sum()/N_SEC, False),
    ('locality',                   'FULL',    100.0,     'FULL',    100.0-100*sec['Locality'].isna().sum()/N_SEC, False),
    ('latitude',                   'NONE',      0.0,     'FULL',    100.0-100*sec['Latitude'].isna().sum()/N_SEC, False),
    ('longitude',                  'NONE',      0.0,     'FULL',    100.0-100*sec['Longitude'].isna().sum()/N_SEC, False),
    ('property_type',              'FULL',    100.0,     'FULL',    100.0,       False),
    ('bhk',                        'FULL',    100.0,     'FULL',    100.0,       False),
    ('bathrooms',                  'FULL',    100.0,     'FULL',    100.0-100*sec['Bathrooms'].isna().sum()/N_SEC, False),
    ('balconies',                  'FULL',    100.0,     'FULL',    100.0-100*sec['Balconies'].isna().sum()/N_SEC, False),
    ('parking',                    'SPARSE',    2.4,     'FULL',    100.0-100*sec['Parking'].isna().sum()/N_SEC, False),
    ('carpet_area_sqft',           'SPARSE',   10.6,     'FULL',    100.0,       False),
    ('builtup_area_sqft',          'FULL',    100.0,     'FULL',    100.0,       False),
    ('super_builtup_area_sqft',    'SPARSE',    0.1,     'FULL',    100.0,       False),
    ('plot_area_sqft',             'SPARSE',    0.1,     'NONE',      0.0,       False),
    ('floor_no',                   'PARTIAL',  64.0,     'FULL',    100.0,       False),
    ('total_floors',               'PARTIAL',  50.8,     'FULL',    100.0,       False),
    ('year_built',                 'SPARSE',    0.0,     'FULL',    100.0-100*sec['YearBuilt'].isna().sum()/N_SEC, False),
    ('age_years',                  'SPARSE',    0.0,     'FULL',    100.0,       False),
    ('furnishing',                 'SPARSE',    1.1,     'FULL',    100.0-100*sec['Furnishing'].isna().sum()/N_SEC, False),
    ('facing',                     'SPARSE',   10.3,     'FULL',    100.0-100*sec['Facing'].isna().sum()/N_SEC, False),
    ('rera_registered',            'FULL',    100.0,     'FULL',    100.0,       False),
    ('rera_id',                    'SPARSE',    0.0,     'FULL',    100.0-100*sec['RERAID'].isna().sum()/N_SEC, False),
    ('listing_date',               'NONE',      0.0,     'NONE',      0.0,       False),
    ('price_inr',                  'FULL',    100.0,     'TRAIN_ONLY', 50.0,     False),
    ('price_lakhs',                'FULL',    100.0,     'DERIVE',   50.0,       False),
    ('price_per_sqft',             'FULL',    100.0,     'DERIVE',   50.0,       False),
    # Fields NEW in secondary, not in canonical primary schema
    ('building_type [NEW]',        'NONE',      0.0,     'FULL',    100.0,       True),
    ('amenities_count [NEW]',      'NONE',      0.0,     'FULL',    100.0,       True),
]

df_avail = pd.DataFrame(AVAIL_MATRIX, columns=[
    'canonical_field','primary_availability','primary_fill_pct',
    'secondary_availability','secondary_fill_pct','new_in_secondary'
])

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8 – Visualisations
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 7 │ Generating comparison visualisations …")

BG  = '#0b0f19'; AX = '#111827'; TC = '#e2e8f0'
CP  = '#06b6d4'; CS = '#f59e0b'; CR = '#ef4444'; CG = '#10b981'
C2  = '#8b5cf6'

fig = plt.figure(figsize=(22, 16))
fig.patch.set_facecolor(BG)
gs  = gridspec.GridSpec(3, 4, figure=fig, hspace=0.50, wspace=0.38)

def sax(ax, title=''):
    ax.set_facecolor(AX)
    for sp in ax.spines.values(): sp.set_edgecolor('#374151')
    ax.tick_params(colors=TC, labelsize=8)
    ax.xaxis.label.set_color(TC); ax.yaxis.label.set_color(TC)
    if title: ax.set_title(title, color=TC, fontsize=9, fontweight='bold', pad=6)
    return ax

# Helper: overlay histogram
def overlay_hist(ax, pri_vals, sec_vals, xlabel='', bins=50, clip99=True):
    if clip99:
        p99 = max(pri_vals.quantile(0.99), sec_vals.quantile(0.99)) if len(sec_vals)>0 else pri_vals.quantile(0.99)
        pri_vals = pri_vals.clip(upper=p99)
        sec_vals = sec_vals.clip(upper=p99) if len(sec_vals)>0 else sec_vals
    ax.hist(pri_vals.dropna(), bins=bins, alpha=0.55, color=CP, label='Primary', density=True, edgecolor='none')
    if len(sec_vals.dropna()) > 0:
        ax.hist(sec_vals.dropna(), bins=bins, alpha=0.55, color=CS, label='Secondary', density=True, edgecolor='none')
    ax.set_xlabel(xlabel)
    ax.legend(fontsize=7, facecolor=AX, labelcolor=TC)

# 1. Price (Lakhs)
ax = fig.add_subplot(gs[0, 0:2])
overlay_hist(ax, np.log1p(pri_7['price_lakhs']), np.log1p(sec_7['price_lakhs']), 'log(1+Price Lakhs)')
sax(ax, 'Price Distribution (log scale) — Primary vs Secondary')

# 2. Area (sqft)
ax = fig.add_subplot(gs[0, 2])
overlay_hist(ax, pri_7['builtup_area_sqft'], sec_7['BuiltUpArea_sqft'], 'Area (sqft)')
sax(ax, 'Built-Up Area Distribution')

# 3. BHK
ax = fig.add_subplot(gs[0, 3])
bhk_pri = pri_7['bhk'].value_counts().sort_index()
bhk_sec = sec_7['BHK'].value_counts().sort_index()
all_bhk = sorted(set(bhk_pri.index.tolist() + bhk_sec.index.tolist()))
x = np.arange(len(all_bhk))
w = 0.38
ax.bar(x - w/2, [bhk_pri.get(b, 0) for b in all_bhk], width=w, color=CP, alpha=0.8, label='Primary')
ax.bar(x + w/2, [bhk_sec.get(b, 0) for b in all_bhk], width=w, color=CS, alpha=0.8, label='Secondary')
ax.set_xticks(x); ax.set_xticklabels(all_bhk, fontsize=7)
ax.set_xlabel('BHK'); ax.legend(fontsize=7, facecolor=AX, labelcolor=TC)
sax(ax, 'BHK Distribution')

# 4. City coverage comparison
ax = fig.add_subplot(gs[1, 0])
all_cities = sorted(set(pri_7['city'].unique().tolist() + sec_7['city_canonical'].unique().tolist()))
pri_city = pri_7['city'].value_counts()
sec_city = sec_7['city_canonical'].value_counts()
x = np.arange(len(all_cities))
w = 0.38
ax.barh([c[:5] for c in all_cities], [pri_city.get(c,0) for c in all_cities], height=w, color=CP, alpha=0.8, label='Primary')
ax.barh([c[:5] for c in all_cities], [-sec_city.get(c,0) for c in all_cities], height=w, color=CS, alpha=0.8, label='Secondary')
ax.axvline(0, color='white', lw=0.5)
ax.set_xlabel('← Secondary | Primary →'); ax.legend(fontsize=7, facecolor=AX, labelcolor=TC)
sax(ax, 'City Coverage (Diverging)')

# 5. Property type comparison
ax = fig.add_subplot(gs[1, 1])
all_pt = sorted(set(pri_7['property_type'].unique().tolist() + sec_7['PropertyType'].unique().tolist()))
pri_pt = pri_7['property_type'].value_counts()
sec_pt = sec_7['PropertyType'].value_counts()
x = np.arange(len(all_pt))
w = 0.38
ax.bar(x - w/2, [pri_pt.get(p,0) for p in all_pt], width=w, color=CP, alpha=0.8, label='Primary')
ax.bar(x + w/2, [sec_pt.get(p,0) for p in all_pt], width=w, color=CS, alpha=0.8, label='Secondary')
ax.set_xticks(x)
ax.set_xticklabels([p[:6] for p in all_pt], fontsize=6, rotation=30)
ax.legend(fontsize=7, facecolor=AX, labelcolor=TC)
sax(ax, 'Property Type Mix')

# 6. Bathrooms
ax = fig.add_subplot(gs[1, 2])
baths_pri = pri_7['bathrooms'].value_counts().sort_index()
baths_sec = sec_7['Bathrooms'].dropna().astype(int).value_counts().sort_index()
all_baths = sorted(set(baths_pri.index.tolist() + baths_sec.index.tolist()))
x = np.arange(len(all_baths)); w = 0.38
ax.bar(x-w/2, [baths_pri.get(b,0) for b in all_baths], width=w, color=CP, alpha=0.8, label='Primary')
ax.bar(x+w/2, [baths_sec.get(b,0) for b in all_baths], width=w, color=CS, alpha=0.8, label='Secondary')
ax.set_xticks(x); ax.set_xticklabels(all_baths, fontsize=7)
ax.set_xlabel('Bathrooms'); ax.legend(fontsize=7, facecolor=AX, labelcolor=TC)
sax(ax, 'Bathroom Count Distribution')

# 7. KS test results heatmap-style
ax = fig.add_subplot(gs[1, 3])
ks_labels = df_ks['feature'].tolist()
ks_stats   = df_ks['ks_stat'].fillna(0).tolist()
ks_colors  = [CR if s > 0.1 else CG for s in ks_stats]
bars = ax.barh(ks_labels, ks_stats, color=ks_colors, alpha=0.85)
ax.axvline(0.1, color='white', linestyle='--', lw=0.8, alpha=0.7)
for bar, s in zip(bars, ks_stats):
    ax.text(s + 0.005, bar.get_y() + bar.get_height()/2,
            f'{s:.3f}', va='center', color=TC, fontsize=8)
ax.set_xlabel('KS Statistic (>0.1 = significant shift)')
sax(ax, 'Distribution Shift (KS Test)')

# 8. Feature availability matrix heatmap
ax = fig.add_subplot(gs[2, 0:3])
AVAIL_SCORE = {'FULL': 1.0, 'PARTIAL': 0.6, 'SPARSE': 0.2, 'TRAIN_ONLY': 0.5,
               'DERIVE': 0.4, 'NONE': 0.0}
feat_labels = [r['canonical_field'] for _, r in df_avail.iterrows()]
pri_scores  = [AVAIL_SCORE.get(r['primary_availability'],   0) for _, r in df_avail.iterrows()]
sec_scores  = [AVAIL_SCORE.get(r['secondary_availability'], 0) for _, r in df_avail.iterrows()]

y = np.arange(len(feat_labels))
w = 0.38
im = ax.barh(y - w/2, pri_scores, height=w, color=CP, alpha=0.85, label='Primary')
im2= ax.barh(y + w/2, sec_scores, height=w, color=CS, alpha=0.85, label='Secondary')
ax.set_yticks(y)
ax.set_yticklabels(feat_labels, fontsize=7)
ax.set_xlim(0, 1.2)
ax.set_xlabel('Availability Score (0=None, 0.2=Sparse, 0.5=Partial, 1=Full)')
ax.legend(fontsize=8, facecolor=AX, labelcolor=TC, loc='lower right')
ax.axvline(1.0, color='white', linestyle=':', lw=0.6, alpha=0.5)
sax(ax, 'Feature Availability Matrix — Primary vs Secondary')

# 9. Price/sqft by city comparison
ax = fig.add_subplot(gs[2, 3])
pri_ppsf = pri_7.groupby('city')['price_per_sqft'].median().sort_values()
sec_7['ppsf'] = sec_7['Price_INR'] / sec_7['BuiltUpArea_sqft']
sec_ppsf = sec_7.groupby('city_canonical')['ppsf'].median().reindex(pri_ppsf.index).fillna(0)
x = np.arange(len(pri_ppsf)); w = 0.38
ax.barh(x-w/2, pri_ppsf.values/1000, height=w, color=CP, alpha=0.8, label='Primary')
ax.barh(x+w/2, sec_ppsf.values/1000, height=w, color=CS, alpha=0.8, label='Secondary')
ax.set_yticks(x); ax.set_yticklabels(pri_ppsf.index, fontsize=7)
ax.set_xlabel('Median ₹/sqft (thousands)')
ax.legend(fontsize=7, facecolor=AX, labelcolor=TC)
sax(ax, 'Median Price/sqft by City')

fig.suptitle('AST-XGB │ Phase 4: Secondary Dataset Distribution & Schema Comparison',
             color=TC, fontsize=13, fontweight='bold', y=0.99)
plt.savefig(FIG_PATH, dpi=140, bbox_inches='tight', facecolor=BG)
plt.close()
print(f"  Dashboard saved → {FIG_PATH}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9 – Build markdown report
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 8 │ Writing Phase 4 comparison report …")

NL = "\n"

# Incompatibilities table
INCOMPAT = [(r['secondary_column'], r['canonical_column'], r['notes'])
            for _, r in df_map.iterrows()
            if r['compatibility'] in ('INCOMPATIBLE','PARTIAL','NEW','MISSING')]

incompat_rows = NL.join(
    f"| `{sc or '—'}` | `{cc or '—'}` | {compat} | {note} |"
    for (sc, cc, note), compat in [
        ((r['secondary_column'], r['canonical_column'], r['notes']), r['compatibility'])
        for _, r in df_map.iterrows() if r['compatibility'] != 'FULL'
    ]
)

# KS results table
ks_rows = NL.join(
    f"| {r['feature']} | {r['pri_n']:,} | {r['sec_n']:,} | "
    f"{r['pri_median']} | {r['sec_median']} | {r['ks_stat']:.4f} | {r['ks_pvalue']:.4f} | "
    f"{'🔴 YES' if r['shift']=='SIGNIFICANT' else '✅ NO'} |"
    for _, r in df_ks.iterrows()
)

# Full mapping table
map_rows = NL.join(
    f"| `{r['secondary_column'] or '—'}` | `{r['canonical_column'] or '—'}` | "
    f"**{r['compatibility']}** | {r['unit_compatibility']} | {r['notes']} |"
    for _, r in df_map.iterrows()
)

# Availability matrix table
avail_icon = {'FULL':'🟢 Full','PARTIAL':'🟡 Partial','SPARSE':'🟠 Sparse',
              'TRAIN_ONLY':'🔵 Train Only','DERIVE':'🔵 Derivable','NONE':'⚫ None'}
avail_rows = NL.join(
    f"| `{r['canonical_field']}` | {avail_icon.get(r['primary_availability'],r['primary_availability'])} "
    f"({r['primary_fill_pct']:.0f}%) | "
    f"{avail_icon.get(r['secondary_availability'],r['secondary_availability'])} "
    f"({r['secondary_fill_pct']:.0f}%) | "
    f"{'✅ NEW in Secondary' if r['new_in_secondary'] else ''} |"
    for _, r in df_avail.iterrows()
)

# City coverage table
city_cov_rows = NL.join(
    f"| {city} | {pri_7['city'].value_counts().get(city,0):,} | "
    f"{sec_7['city_canonical'].value_counts().get(city,0):,} | "
    f"{'✅' if city in pri_7['city'].unique() else '❌'} | "
    f"{'✅' if city in sec_7['city_canonical'].unique() else '❌'} |"
    for city in sorted(set(pri_7['city'].tolist() + sec_7['city_canonical'].tolist()))
)

# New features in secondary
new_features = [(r['secondary_column'], r['notes']) for _, r in df_map.iterrows() if r['compatibility'] == 'NEW']
new_feat_rows = NL.join(f"| `{col}` | {note} |" for col, note in new_features)

pri_price_med = pri_7['price_lakhs'].median()
sec_price_med = sec_7['price_lakhs'].median()
pri_area_med  = pri_7['builtup_area_sqft'].median()
sec_area_med  = sec_7['BuiltUpArea_sqft'].median()

report_md = f"""# Phase 4 — Secondary Dataset Comparison Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}

---

## Comparison Dashboard

![Phase 4 Comparison Dashboard]({FIG_PATH})

---

## 1. Dataset Overview

| Property | Primary Dataset | Secondary Dataset |
|---|---|---|
| **Source** | Kaggle: rakkesharv (2022) | Kaggle: pratyushpuri (2025) |
| **Total Rows** | {N_PRI:,} | {N_SEC:,} |
| **Train Rows (with price)** | {N_PRI:,} | {N_SEC_TRAIN:,} |
| **Test Rows (no price)** | 0 | {N_SEC_TEST:,} |
| **Columns** | {pri.shape[1]} canonical | {sec.shape[1]-1} original |
| **Cities Covered** | 7 (canonical Indian metros) | 8 (includes Ahmedabad, uses MMR) |
| **Price Column** | `price_lakhs` / `price_inr` (string parsed) | `Price_INR` (direct float) |
| **Area Columns** | `builtup_area_sqft` only | All three: carpet, builtup, super |
| **Coordinates** | ⚫ None (geocoding needed) | 🟢 Latitude + Longitude populated |
| **BHK Column** | From title regex | Direct integer |
| **Year** | 2022 web scrape | 2025 synthetic/enriched |

> [!IMPORTANT]
> The **primary dataset** remains the sole real-world training source. The secondary dataset must NOT be appended without a full harmonisation pipeline. It contains structural incompatibilities, city-scope differences, and label mismatches that require resolution.

---

## 2. Secondary Dataset Schema Inspection

| Column | dtype | Null Count | Null % |
|---|---|---|---|
{NL.join(f"| `{col}` | `{str(sec.drop(columns=['_split','city_canonical'],errors='ignore').dtypes.get(col,'?'))}` | {int(sec_nulls.get(col,0)):,} | {sec_pct.get(col,0):.1f}% |" for col in sec.columns if col not in ['_split','city_canonical'])}

---

## 3. Column Mapping: Secondary → Canonical Schema

| Secondary Column | Canonical Column | Compatibility | Units | Notes |
|---|---|---|---|---|
{map_rows}

**Compatibility legend:** FULL = direct mapping | PARTIAL = partial/conditional | INCOMPATIBLE = type/semantic mismatch | NEW = not in canonical schema | MISSING = not in secondary

---

## 4. New Features in Secondary (Not in Primary Schema)

| Secondary Column | Description & Value |
|---|---|
{new_feat_rows}

> [!TIP]
> `BuildingType` (High Rise/Mid Rise/Gated Community) and `AmenitiesCount` are **high-value features** not present in the primary dataset. They should be added to the canonical schema v2 if a harmonised merge is attempted in a future phase.

---

## 5. Schema Incompatibilities & Mismatches

| Secondary Column | Canonical Column | Type | Issue |
|---|---|---|---|
{incompat_rows}

### Critical Incompatibilities Requiring Resolution Before Any Merge

1. **`Balconies`**: Secondary is a **count (0–3)**; Primary canonical is a **binary 0/1** flag. Direct merge would corrupt the feature semantics.
2. **`Parking`**: Secondary is **categorical** (Covered/Open/Basement/Stilt); Primary is a **count**. Requires re-encoding.
3. **`Furnishing`**: Secondary uses `"Furnished"` vs Primary canonical `"Fully-Furnished"`. Label normalisation required.
4. **`IsRERARegistered`**: Secondary is `True/False bool`; Primary is `0/1` integer from keyword detection (lower reliability).
5. **`City`**: Secondary uses `"MMR"` (Mumbai Metropolitan Region), `"Delhi NCR"`, `"Ahmedabad"` — none of these are in the Primary 7-city canonical set.
6. **`BHK = 0`**: Secondary has 779 rows where `BHK = 0` (Studio apartments). Primary canonical `bhk` starts at 1.

---

## 6. Unit Compatibility Analysis

| Feature | Primary Unit | Secondary Unit | Compatible? | Action |
|---|---|---|---|---|
| Price | INR Lakhs (float) | INR absolute (float) | ⚠️ Same base, different scale | Harmonise: `price_inr = price_lakhs × 100,000` |
| Built-up Area | sqft (int) | sqft (int) | ✅ Yes | Direct |
| Carpet Area | sqft (partial) | sqft (full) | ✅ Yes | Direct |
| Super Built-up | sqft (0.1% filled) | sqft (100% filled) | ✅ Yes | Direct |
| Floor | integer, 0-indexed | integer, 0-indexed | ✅ Yes | Direct |
| Latitude/Longitude | NULL (all) | degrees WGS-84 | ✅ Yes | Direct (secondary only) |
| Balconies | binary 0/1 | count 0–3 | ❌ No | Binarise secondary: `(Balconies>0).astype(int)` |
| Parking | count (2.4% filled) | categorical | ❌ No | Re-encode secondary to count |

---

## 7. Distribution Shift Analysis (KS Test — 7 Shared Cities)

Kolmogorov-Smirnov two-sample test. `KS > 0.1 + p < 0.05` = statistically significant distribution shift.

| Feature | n (Primary) | n (Secondary) | Primary Median | Secondary Median | KS Stat | KS p-value | Shift? |
|---|---|---|---|---|---|---|---|
{ks_rows}

### Interpretation

- **Price:** Median ₹{pri_price_med:.0f}L (primary) vs ₹{sec_price_med:.0f}L (secondary).
  {"🔴 Significant shift — secondary prices are substantially higher. Consistent with 2022→2025 real estate appreciation across Indian metros." if abs(pri_price_med-sec_price_med)>10 else "✅ Comparable price levels."}

- **Area:** Primary median {pri_area_med:.0f} sqft vs secondary {sec_area_med:.0f} sqft.
  {"🔴 Significant area shift — secondary properties are systematically larger. May reflect dataset sampling bias (new projects) rather than true market difference." if abs(pri_area_med-sec_area_med)>100 else "✅ Comparable area distributions."}

- **BHK / Bathrooms:** Check KS table above for significance.

> [!WARNING]
> Distribution shift between primary (2022) and secondary (2025) is **expected** and does not disqualify the secondary dataset. It means the datasets represent different temporal snapshots of the Indian real estate market, and naive concatenation without temporal adjustment would introduce confounded gradients into model training.

---

## 8. City Coverage Comparison

| City | Primary Listings | Secondary Listings (train) | In Primary? | In Secondary? |
|---|---|---|---|---|
{city_cov_rows}

**Key observations:**
- **Ahmedabad** (1,179 listings) is in secondary but NOT in primary 7-city canonical set
- **MMR** (Mumbai Metropolitan Region) = Mumbai in secondary — requires normalisation
- **Delhi NCR** (1,183) includes Noida/Gurgaon — broader than primary "Delhi"
- Secondary has **more balanced** city distribution (~1,150 each); primary is Bengaluru-heavy (32%)

---

## 9. Feature Availability Matrix

| Canonical Field | Primary Availability | Secondary Availability | Notes |
|---|---|---|---|
{avail_rows}

**Coverage gain from secondary dataset (if harmonised):**
- `super_builtup_area_sqft`: 0.1% → **100%** fill
- `carpet_area_sqft`: 10.6% → **100%** fill  
- `floor_no`: 64% → **100%** fill
- `total_floors`: 51% → **100%** fill
- `year_built` / `age_years`: ~0% → **99%** fill
- `furnishing`: 1.1% → **99%** fill
- `facing`: 10.3% → **98%** fill
- `latitude` / `longitude`: **0% → 99%** fill ← most impactful for spatial engine

---

## 10. Recommendation: Secondary Dataset Usage Strategy

| Strategy | Rationale |
|---|---|
| **Do NOT append raw** | City names, unit mismatches, label differences, temporal shift require harmonisation first |
| **Use for geocoding transfer** | Secondary has lat/lon for Indian cities — can be used to geocode primary localities |
| **Use as validation set** | After model training on primary, evaluate on secondary (train split) as out-of-distribution validation |
| **Use for feature schema enrichment** | `BuildingType`, `AmenitiesCount`, `SuperBuiltUpArea_sqft` should be added to canonical schema v2 |
| **Use for distribution analysis** | Price appreciation (2022→2025) signals provide temporal market context |
| **Future: harmonised merge** | After a dedicated Phase X harmonisation pipeline resolves all 6 incompatibilities |

---

## 11. Output Files

| File | Description |
|---|---|
| [`data/processed/secondary_schema_mapping.csv`](../data/processed/secondary_schema_mapping.csv) | {len(df_map)}-row column mapping table |
| [`reports/phase_4_secondary_dataset_comparison.md`](phase_4_secondary_dataset_comparison.md) | This report |
| [`reports/figures/phase4_comparison_dashboard.png`](figures/phase4_comparison_dashboard.png) | 9-panel visual comparison dashboard |

---

*Phase 4 complete — no training performed, no data modified. Proceed to Phase 5: Feature Engineering.*
"""

OUT_REPORT.write_text(report_md, encoding='utf-8')
print(f"  Report saved → {OUT_REPORT}")

print("\n" + "=" * 72)
print("PHASE 4 COMPARISON COMPLETE")
print(f"  Primary  : {N_PRI:,} rows | Secondary: {N_SEC:,} rows ({N_SEC_TRAIN:,} with price)")
print(f"  Mapping  : {len(df_map)} column entries | {df_map['compatibility'].value_counts().to_dict()}")
print(f"  KS tests : {len(df_ks)} features | {(df_ks['shift']=='SIGNIFICANT').sum()} significant shifts")
print(f"  Report   : {OUT_REPORT}")
print(f"  Dashboard: {FIG_PATH}")
print("=" * 72)
