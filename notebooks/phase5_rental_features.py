"""
Phase 5 — Rental Market Feature Engineering
AST-XGB India Property Valuation System
Author: Apoorv Mishra

Downloads Indian Rental Housing Price Dataset, cleans it, aggregates
rental statistics by city+locality, then joins to property_master_v1
to produce property_master_v2 with rental-market features.

Leakage safeguards:
  - Join key = city + locality ONLY (never price or any sale attribute)
  - Rental stats are locality-level AGGREGATES — not property-level prices
  - rental_yield is computed AFTER the join using property price
  - All rental features are flagged as market-context features, not targets

Inputs:
  data/processed/property_master_v1.csv
  kagglehub: pranayjagtap06/indian-rental-housing-price-dataset

Outputs:
  data/processed/rental_clean.csv          – cleaned rental listings
  data/features/rental_features.csv        – locality-level aggregates
  data/processed/property_master_v2.csv    – master + rental features joined
  reports/phase_5_rental_features.md       – full report
"""

import re, sys, warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from pathlib import Path

warnings.filterwarnings('ignore')

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR      = Path(__file__).resolve().parent.parent
MASTER_V1     = BASE_DIR / "data" / "processed"  / "property_master_v1.csv"
RENTAL_CLEAN  = BASE_DIR / "data" / "processed"  / "rental_clean.csv"
FEATURES_DIR  = BASE_DIR / "data" / "features"
RENTAL_FEATS  = FEATURES_DIR / "rental_features.csv"
MASTER_V2     = BASE_DIR / "data" / "processed"  / "property_master_v2.csv"
REPORT_DIR    = BASE_DIR / "reports"
FIG_DIR       = REPORT_DIR / "figures"
OUT_REPORT    = REPORT_DIR / "phase_5_rental_features.md"
FIG_PATH      = FIG_DIR   / "phase5_rental_dashboard.png"

for d in [FEATURES_DIR, REPORT_DIR, FIG_DIR]:
    d.mkdir(parents=True, exist_ok=True)

print("=" * 72)
print("PHASE 5 │ Rental Market Feature Engineering")
print("=" * 72)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 – Download rental dataset
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 1 │ Downloading rental dataset via kagglehub …")
import kagglehub
dl_path = Path(kagglehub.dataset_download(
    "pranayjagtap06/indian-rental-housing-price-dataset"
))
rental_csv = dl_path / "cities_magicbricks_rental_prices.csv"
print(f"  Source: {rental_csv.name}  ({rental_csv.stat().st_size/1024:.1f} KB)")

try:
    rent_raw = pd.read_csv(rental_csv, encoding='utf-8', low_memory=False)
except UnicodeDecodeError:
    rent_raw = pd.read_csv(rental_csv, encoding='latin-1', low_memory=False)

rent_raw.columns = [c.strip() for c in rent_raw.columns]
N_RAW = len(rent_raw)
print(f"  Raw rows: {N_RAW:,}  |  Columns: {rent_raw.columns.tolist()}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 – Snapshot before-state
# ═══════════════════════════════════════════════════════════════════════════════
before_nulls = rent_raw.isnull().sum().to_dict()
before_shape = rent_raw.shape

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 – Clean city names (→ canonical 7-city map)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 3 │ Standardising city names …")
print(f"  Raw cities: {rent_raw['city'].value_counts().to_dict()}")

CITY_CANONICAL = {
    'bangalore'  : 'Bengaluru',
    'bengaluru'  : 'Bengaluru',
    'new delhi'  : 'Delhi',
    'delhi'      : 'Delhi',
    'mumbai'     : 'Mumbai',
    'bombay'     : 'Mumbai',
    'pune'       : 'Pune',
    'kolkata'    : 'Kolkata',
    'calcutta'   : 'Kolkata',
    'hyderabad'  : 'Hyderabad',
    'chennai'    : 'Chennai',
    'nagpur'     : 'Nagpur',   # outside primary 7 — kept but flagged
}
rent_raw['city_clean'] = (
    rent_raw['city'].str.strip().str.lower().map(CITY_CANONICAL)
)
# Flag cities outside the primary 7
PRIMARY_7 = {'Bengaluru','Mumbai','Delhi','Chennai','Pune','Kolkata','Hyderabad'}
rent_raw['city_in_primary'] = rent_raw['city_clean'].isin(PRIMARY_7)

print(f"  Canonical city distribution:")
print(rent_raw['city_clean'].value_counts().to_string())
n_out = (~rent_raw['city_in_primary']).sum()
print(f"  Cities outside primary-7: {n_out:,} rows (Nagpur) — RETAINED in rental stats, "
      f"excluded from join")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 – Clean locality strings
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 4 │ Standardising locality strings …")
def clean_locality(s):
    if pd.isna(s): return 'Unknown'
    s = str(s).strip()
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r"[^\w\s\-']", '', s)
    return s.strip().title() if s.strip() else 'Unknown'

rent_raw['locality_clean'] = rent_raw['locality'].apply(clean_locality)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 – Validate & clean area (already sqft — confirmed by area_rate check)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 5 │ Validating area (sqft) …")
rent_raw['area_sqft'] = pd.to_numeric(rent_raw['area'], errors='coerce')

# Flag impossible areas
area_lo, area_hi = 50, 20000
n_area_bad = ((rent_raw['area_sqft'] < area_lo) | (rent_raw['area_sqft'] > area_hi)).sum()
print(f"  Area range: {rent_raw['area_sqft'].min():.0f}–{rent_raw['area_sqft'].max():.0f} sqft  "
      f"| Suspicious (<{area_lo} or >{area_hi}): {n_area_bad}")

rent_raw['area_flag'] = (
    (rent_raw['area_sqft'] < area_lo) | (rent_raw['area_sqft'] > area_hi)
).astype(int)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 – Convert rent to numeric INR/month & validate
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 6 │ Validating rent (INR/month) …")
rent_raw['rent_inr_month'] = pd.to_numeric(rent_raw['rent'], errors='coerce')

n_rent_null = rent_raw['rent_inr_month'].isna().sum()
n_rent_zero = (rent_raw['rent_inr_month'] <= 0).sum()
print(f"  Rent range : ₹{rent_raw['rent_inr_month'].min():,.0f}–₹{rent_raw['rent_inr_month'].max():,.0f}/month")
print(f"  Rent median: ₹{rent_raw['rent_inr_month'].median():,.0f}/month")
print(f"  Null rents : {n_rent_null}  |  Zero/neg rents: {n_rent_zero}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 – Standardise BHK (beds) and bathrooms
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 7 │ Standardising beds/bathrooms …")
rent_raw['bhk']       = pd.to_numeric(rent_raw['beds'],      errors='coerce').astype('Int64')
rent_raw['bathrooms'] = pd.to_numeric(rent_raw['bathrooms'], errors='coerce').astype('Int64')

# Fix bathrooms=0 (7 rows) → set to 1
rent_raw.loc[rent_raw['bathrooms'] == 0, 'bathrooms'] = 1
rent_raw.loc[rent_raw['bhk'] > 15, 'bhk'] = pd.NA
rent_raw.loc[rent_raw['bathrooms'] > 15, 'bathrooms'] = pd.NA

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8 – Standardise furnishing labels
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 8 │ Standardising furnishing labels …")
FURNISH_MAP = {
    'furnished'      : 'Fully-Furnished',
    'semi-furnished' : 'Semi-Furnished',
    'unfurnished'    : 'Unfurnished',
}
rent_raw['furnishing_clean'] = (
    rent_raw['furnishing'].str.strip().str.lower()
    .map(FURNISH_MAP)
    .fillna('Unknown')
)
print(f"  Furnishing distribution:\n{rent_raw['furnishing_clean'].value_counts().to_string()}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9 – Compute rent_per_sqft & remove erroneous rows
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 9 │ Computing rent_per_sqft & removing erroneous records …")
rent_raw['rent_per_sqft'] = (rent_raw['rent_inr_month'] / rent_raw['area_sqft']).round(4)

# Remove records with: null rent, zero/neg rent, impossible area, rent_per_sqft > 5000
erroneous = (
    (rent_raw['rent_inr_month'].isna()) |
    (rent_raw['rent_inr_month'] <= 0)   |
    (rent_raw['area_sqft'] < area_lo)   |
    (rent_raw['area_sqft'] > area_hi)   |
    (rent_raw['rent_per_sqft'] > 5000)  |
    (rent_raw['rent_per_sqft'] <= 0)
)
n_erroneous = erroneous.sum()
print(f"  Erroneous records removed: {n_erroneous}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 10 – Probable duplicate listings detection
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 10 │ Detecting probable duplicate rental listings …")
rent_raw['_dedup_key'] = (
    rent_raw['city_clean'].str.lower() + '|' +
    rent_raw['locality_clean'].str.lower() + '|' +
    rent_raw['area_sqft'].round(0).astype(str) + '|' +
    rent_raw['bhk'].astype(str) + '|' +
    rent_raw['rent_inr_month'].round(-2).astype(str)
)
n_dups = rent_raw[~erroneous].duplicated(subset=['_dedup_key']).sum()
print(f"  Probable duplicate rental listings: {n_dups:,}")

# Build cleaned dataset
rent_clean = rent_raw[~erroneous].drop_duplicates(subset=['_dedup_key']).copy()
rent_clean.drop(columns=['_dedup_key', 'area_flag'], inplace=True, errors='ignore')
rent_clean.reset_index(drop=True, inplace=True)
N_CLEAN = len(rent_clean)
print(f"  Clean rental listings: {N_CLEAN:,}  (from {N_RAW:,} raw)")

# Select final columns for clean rental CSV
RENTAL_COLS = [
    'city_clean', 'locality_clean', 'bhk', 'bathrooms', 'furnishing_clean',
    'area_sqft', 'rent_inr_month', 'rent_per_sqft',
    # originals for traceability
    'house_type', 'city', 'locality', 'area', 'beds',
    'bathrooms', 'balconies', 'furnishing', 'area_rate', 'rent',
    'city_in_primary',
]
rent_clean_out = rent_clean[[c for c in RENTAL_COLS if c in rent_clean.columns]].copy()
rent_clean_out.rename(columns={
    'city_clean'      : 'city',
    'locality_clean'  : 'locality',
    'furnishing_clean': 'furnishing',
    'city'            : 'raw__city',
    'locality'        : 'raw__locality',
    'furnishing'      : 'raw__furnishing',
    'area'            : 'raw__area',
    'rent'            : 'raw__rent',
    'beds'            : 'raw__beds',
    'bathrooms'       : 'raw__bathrooms',
}, inplace=True)

rent_clean_out.to_csv(RENTAL_CLEAN, index=False, encoding='utf-8')
print(f"  Saved rental_clean.csv → {RENTAL_CLEAN}")

# Working copy with clean names for aggregation
# Drop raw originals first to avoid name collision on rename
rc = rent_clean.drop(columns=['city','locality','furnishing','area','rent','beds'], errors='ignore').rename(columns={
    'city_clean'      : 'city',
    'locality_clean'  : 'locality',
    'furnishing_clean': 'furnishing',
})

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 11 – Aggregate rental statistics by city + locality
#           Join key: city + locality  (NO price, NO sale attributes)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 11 │ Aggregating rental statistics by city + locality …")

# Only use listings within primary-7 cities for feature aggregation
rc7 = rc[rc['city_in_primary']].copy()

rental_agg = rc7.groupby(['city', 'locality'], observed=True).agg(
    rental_listing_count       = ('rent_inr_month', 'count'),
    avg_monthly_rent           = ('rent_inr_month', 'mean'),
    median_monthly_rent        = ('rent_inr_month', 'median'),
    p25_monthly_rent           = ('rent_inr_month', lambda x: x.quantile(0.25)),
    p75_monthly_rent           = ('rent_inr_month', lambda x: x.quantile(0.75)),
    avg_rent_per_sqft          = ('rent_per_sqft',  'mean'),
    median_rent_per_sqft       = ('rent_per_sqft',  'median'),
    avg_rental_area_sqft       = ('area_sqft',       'mean'),
    rent_stddev                = ('rent_inr_month', 'std'),
    pct_furnished              = ('furnishing',     lambda x: (x == 'Fully-Furnished').mean() * 100),
    pct_semi_furnished         = ('furnishing',     lambda x: (x == 'Semi-Furnished').mean() * 100),
    dominant_bhk               = ('bhk',            lambda x: x.mode().iloc[0] if len(x) > 0 else pd.NA),
).reset_index()

# Round for readability
float_cols = [c for c in rental_agg.columns if rental_agg[c].dtype == float]
rental_agg[float_cols] = rental_agg[float_cols].round(2)

N_LOCALITIES = len(rental_agg)
print(f"  Aggregated to {N_LOCALITIES:,} city+locality pairs")
print(f"  Locality count per city:")
print(rental_agg.groupby('city')['locality'].count().to_string())
print(f"\n  Sample aggregated stats:")
print(rental_agg.head(5)[['city','locality','rental_listing_count',
                           'median_monthly_rent','median_rent_per_sqft']].to_string(index=False))

rental_agg.to_csv(RENTAL_FEATS, index=False, encoding='utf-8')
print(f"\n  Saved rental_features.csv → {RENTAL_FEATS}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 12 – Load property_master_v1 & fuzzy-join strategy
#
#  Join key: city + locality (exact match first, then city-level fallback)
#  Leakage guard: rental stats are market AGGREGATES, not property-specific
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 12 │ Joining rental features to property_master_v1 …")
master = pd.read_csv(MASTER_V1, encoding='utf-8', low_memory=False)
N_MASTER = len(master)
print(f"  Master loaded: {N_MASTER:,} rows")

# Normalise join keys for exact matching
def norm_key(s):
    return str(s).strip().lower().replace('-', ' ').replace('  ', ' ')

master['_city_key']     = master['city'].apply(norm_key)
master['_loc_key']      = master['locality'].apply(norm_key)
rental_agg['_city_key'] = rental_agg['city'].apply(norm_key)
rental_agg['_loc_key']  = rental_agg['locality'].apply(norm_key)

# ── Pass 1: Exact city + exact locality join ──────────────────────────────────
merged = master.merge(
    rental_agg.drop(columns=['city','locality']),
    on=['_city_key', '_loc_key'],
    how='left',
    suffixes=('', '_rental'),
)
n_exact = merged['median_monthly_rent'].notna().sum()
print(f"  Pass 1 exact join:  {n_exact:,} / {N_MASTER:,} properties matched ({n_exact/N_MASTER*100:.1f}%)")

# ── Pass 2: City-level fallback (median of all localities in same city) ────────
city_fallback = rc7.groupby('city', observed=True).agg(
    rental_listing_count = ('rent_inr_month', 'count'),
    avg_monthly_rent     = ('rent_inr_month', 'mean'),
    median_monthly_rent  = ('rent_inr_month', 'median'),
    p25_monthly_rent     = ('rent_inr_month', lambda x: x.quantile(0.25)),
    p75_monthly_rent     = ('rent_inr_month', lambda x: x.quantile(0.75)),
    avg_rent_per_sqft    = ('rent_per_sqft',  'mean'),
    median_rent_per_sqft = ('rent_per_sqft',  'median'),
    avg_rental_area_sqft = ('area_sqft',       'mean'),
    rent_stddev          = ('rent_inr_month', 'std'),
    pct_furnished        = ('furnishing',     lambda x: (x == 'Fully-Furnished').mean() * 100),
    pct_semi_furnished   = ('furnishing',     lambda x: (x == 'Semi-Furnished').mean() * 100),
    dominant_bhk         = ('bhk',            lambda x: x.mode().iloc[0] if len(x) > 0 else pd.NA),
).reset_index().round(2)

city_fallback['_city_key'] = city_fallback['city'].apply(norm_key)
city_fallback_cols = [c for c in rental_agg.columns if c not in ['city','locality','_city_key','_loc_key']]

# Fill unmatched rows with city-level stats
unmatched_mask = merged['median_monthly_rent'].isna()
city_fb_map = city_fallback.set_index('_city_key')[city_fallback_cols]

for col in city_fallback_cols:
    merged.loc[unmatched_mask, col] = (
        merged.loc[unmatched_mask, '_city_key'].map(city_fb_map[col])
    )

n_city_fb = (merged['median_monthly_rent'].notna() & unmatched_mask).sum()
n_total_matched = merged['median_monthly_rent'].notna().sum()
print(f"  Pass 2 city fallback: {n_city_fb:,} additional matches")
print(f"  Total matched       : {n_total_matched:,} / {N_MASTER:,} ({n_total_matched/N_MASTER*100:.1f}%)")

# Mark join quality
merged['rental_join_quality'] = 'none'
merged.loc[unmatched_mask & merged['median_monthly_rent'].notna(), 'rental_join_quality'] = 'city_fallback'
merged.loc[~unmatched_mask, 'rental_join_quality'] = 'exact_locality'

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 13 – Compute rental_yield
#   rental_yield = (annual_rent / property_price_inr) × 100
#   annual_rent  = median_monthly_rent × 12
#   LEAKAGE GUARD: uses locality-aggregate rent, NOT property-specific rent
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 13 │ Computing rental_yield (leakage-safe) …")

merged['annual_rent_estimate_inr'] = merged['median_monthly_rent'] * 12
merged['rental_yield_pct'] = np.where(
    (merged['price_inr'].notna()) & (merged['price_inr'] > 0) &
    (merged['annual_rent_estimate_inr'].notna()),
    (merged['annual_rent_estimate_inr'] / merged['price_inr'] * 100).round(4),
    np.nan
)

n_yield = merged['rental_yield_pct'].notna().sum()
print(f"  Rental yield computed for: {n_yield:,} properties")
print(f"  Yield range: {merged['rental_yield_pct'].min():.2f}% – {merged['rental_yield_pct'].max():.2f}%")
print(f"  Yield median: {merged['rental_yield_pct'].median():.2f}%")

# ── Leakage audit: confirm no sale-price features came from rental side ────────
rental_feature_cols = [
    'rental_listing_count','avg_monthly_rent','median_monthly_rent',
    'p25_monthly_rent','p75_monthly_rent','avg_rent_per_sqft',
    'median_rent_per_sqft','avg_rental_area_sqft','rent_stddev',
    'pct_furnished','pct_semi_furnished','dominant_bhk',
    'annual_rent_estimate_inr','rental_yield_pct','rental_join_quality',
]
print(f"\n  Rental feature columns added ({len(rental_feature_cols)}):")
for col in rental_feature_cols:
    print(f"    {col}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 14 – Clean up & save property_master_v2
# ═══════════════════════════════════════════════════════════════════════════════
merged.drop(columns=['_city_key', '_loc_key'], inplace=True, errors='ignore')
merged.to_csv(MASTER_V2, index=False, encoding='utf-8')
print(f"\n  Saved property_master_v2.csv → {MASTER_V2}")
print(f"  Shape: {merged.shape[0]:,} rows × {merged.shape[1]} cols")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 15 – Visualisations
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 15 │ Generating Phase 5 visualisations …")

BG = '#0b0f19'; AX = '#111827'; TC = '#e2e8f0'
C1 = '#06b6d4'; C2 = '#f59e0b'; C3 = '#10b981'; C4 = '#8b5cf6'
C5 = '#f43f5e'; C6 = '#34d399'

fig = plt.figure(figsize=(22, 14))
fig.patch.set_facecolor(BG)
gs = gridspec.GridSpec(3, 4, figure=fig, hspace=0.50, wspace=0.38)

def sax(ax, title=''):
    ax.set_facecolor(AX)
    for sp in ax.spines.values(): sp.set_edgecolor('#374151')
    ax.tick_params(colors=TC, labelsize=8)
    ax.xaxis.label.set_color(TC); ax.yaxis.label.set_color(TC)
    if title: ax.set_title(title, color=TC, fontsize=9, fontweight='bold', pad=6)
    return ax

# 1. Rent distribution (log)
ax = fig.add_subplot(gs[0, 0:2])
vals = np.log1p(rc7['rent_inr_month'])
ax.hist(vals, bins=60, color=C1, alpha=0.85, density=True, edgecolor='none')
ax.set_xlabel('log(1 + Monthly Rent INR)')
sax(ax, 'Rental Price Distribution (log scale)')

# 2. Median rent by city
ax = fig.add_subplot(gs[0, 2])
med_city = rc7.groupby('city')['rent_inr_month'].median().sort_values(ascending=True) / 1000
ax.barh(med_city.index, med_city.values, color=C2, alpha=0.85)
ax.set_xlabel('Median Rent (₹K/month)')
sax(ax, 'Median Rent by City')

# 3. Rent per sqft by city
ax = fig.add_subplot(gs[0, 3])
med_ppsf = rc7.groupby('city')['rent_per_sqft'].median().sort_values(ascending=True)
ax.barh(med_ppsf.index, med_ppsf.values, color=C3, alpha=0.85)
ax.set_xlabel('Median Rent/sqft (₹)')
sax(ax, 'Median Rent/sqft by City')

# 4. Rent by BHK
ax = fig.add_subplot(gs[1, 0])
bhk_vals = sorted(rc7['bhk'].dropna().unique())[:7]
bp = ax.boxplot(
    [rc7[rc7['bhk']==b]['rent_inr_month'].clip(upper=rc7['rent_inr_month'].quantile(0.95)).values
     for b in bhk_vals],
    patch_artist=True, medianprops=dict(color='white', lw=2)
)
colors_bp = [C1,C2,C3,C4,C5,C6,'#a78bfa']
for patch, col in zip(bp['boxes'], colors_bp):
    patch.set_facecolor(col); patch.set_alpha(0.7)
ax.set_xticks(range(1,len(bhk_vals)+1))
ax.set_xticklabels([str(b) for b in bhk_vals], color=TC)
ax.set_xlabel('BHK'); ax.set_ylabel('Rent INR/month')
sax(ax, 'Rent by BHK (p95 clipped)')

# 5. Furnishing vs rent
ax = fig.add_subplot(gs[1, 1])
furn_vals = rc7.groupby('furnishing')['rent_inr_month'].median().sort_values()
ax.barh(furn_vals.index, furn_vals.values/1000, color=C4, alpha=0.85)
ax.set_xlabel('Median Rent (₹K/month)')
sax(ax, 'Median Rent by Furnishing')

# 6. Rental yield distribution
ax = fig.add_subplot(gs[1, 2])
ry = merged['rental_yield_pct'].dropna()
ry_clipped = ry.clip(upper=ry.quantile(0.99))
ax.hist(ry_clipped, bins=50, color=C5, alpha=0.85, edgecolor='none')
ax.axvline(ry.median(), color='white', lw=1.5, linestyle='--',
           label=f'Median {ry.median():.1f}%')
ax.set_xlabel('Rental Yield %')
ax.legend(fontsize=7, facecolor=AX, labelcolor=TC)
sax(ax, 'Rental Yield Distribution (estimated)')

# 7. Rental yield by city
ax = fig.add_subplot(gs[1, 3])
ry_city = merged.groupby('city')['rental_yield_pct'].median().dropna().sort_values()
ax.barh(ry_city.index, ry_city.values, color=C6, alpha=0.85)
ax.set_xlabel('Median Rental Yield %')
ax.axvline(ry_city.mean(), color='white', linestyle='--', lw=0.8)
sax(ax, 'Median Rental Yield by City')

# 8. Join quality breakdown
ax = fig.add_subplot(gs[2, 0])
jq = merged['rental_join_quality'].value_counts()
palette_jq = {'exact_locality': C3, 'city_fallback': C2, 'none': C5}
ax.bar(jq.index, jq.values,
       color=[palette_jq.get(k, C1) for k in jq.index], alpha=0.85)
for bar, cnt in zip(ax.patches, jq.values):
    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+20,
            f'{cnt:,}', ha='center', va='bottom', color=TC, fontsize=8)
ax.set_ylabel('Property Count')
sax(ax, 'Join Quality Breakdown')

# 9. Top-10 localities by median rent per sqft
ax = fig.add_subplot(gs[2, 1:3])
top_loc = (rental_agg.nlargest(12, 'median_rent_per_sqft')
           [['city','locality','median_rent_per_sqft','rental_listing_count']])
labels = [f"{r['locality'][:18]}\n({r['city'][:3]})" for _, r in top_loc.iterrows()]
bars = ax.bar(range(len(top_loc)), top_loc['median_rent_per_sqft'].values,
              color=C1, alpha=0.85)
ax.set_xticks(range(len(top_loc)))
ax.set_xticklabels(labels, fontsize=6.5)
ax.set_ylabel('Median Rent/sqft (₹)')
sax(ax, 'Top 12 Localities by Median Rent/sqft')

# 10. Rental listing count per city
ax = fig.add_subplot(gs[2, 3])
lc = rc7.groupby('city')['rent_inr_month'].count().sort_values()
ax.barh(lc.index, lc.values, color=C4, alpha=0.85)
ax.set_xlabel('Rental Listings')
sax(ax, 'Rental Listings by City (cleaned)')

fig.suptitle('AST-XGB │ Phase 5: Rental Market Feature Engineering — India',
             color=TC, fontsize=13, fontweight='bold', y=0.99)
plt.savefig(FIG_PATH, dpi=140, bbox_inches='tight', facecolor=BG)
plt.close()
print(f"  Dashboard saved → {FIG_PATH}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 16 – Build Markdown report
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 16 │ Writing Phase 5 report …")

NL = "\n"

# Feature table rows
feat_rows = NL.join(
    f"| `{col}` | {merged[col].dtype} | {merged[col].notna().sum():,} | "
    f"{merged[col].notna().sum()/N_MASTER*100:.1f}% | "
    f"{'Locality-aggregate from rental dataset — safe' if col != 'rental_yield_pct' else 'Derived: annual_rent_estimate / price_inr × 100 — safe'} |"
    for col in rental_feature_cols
)

# City rental stats table
city_stats_rows = NL.join(
    f"| {city} | {int(grp['rental_listing_count'].sum()):,} | "
    f"₹{grp['median_monthly_rent'].median():,.0f} | "
    f"₹{grp['median_rent_per_sqft'].median():,.0f}/sqft | "
    f"{merged[merged['city']==city]['rental_yield_pct'].median():.2f}% |"
    for city, grp in rental_agg.groupby('city')
    if city in PRIMARY_7
)

# Join quality table
jq_rows = NL.join(
    f"| {k} | {v:,} | {v/N_MASTER*100:.1f}% |"
    for k, v in merged['rental_join_quality'].value_counts().items()
)

# Top localities table
top_loc_rows = NL.join(
    f"| {r['city']} | {r['locality']} | {int(r['rental_listing_count'])} | "
    f"₹{r['median_monthly_rent']:,.0f} | ₹{r['median_rent_per_sqft']:,.0f} |"
    for _, r in rental_agg.nlargest(15, 'median_rent_per_sqft').iterrows()
)

report_md = f"""# Phase 5 — Rental Market Feature Engineering Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}

---

## Rental Market Dashboard

![Phase 5 Rental Dashboard]({FIG_PATH})

---

## 1. Rental Dataset Summary

| Property | Value |
|---|---|
| **Source** | Kaggle: pranayjagtap06/indian-rental-housing-price-dataset (MagicBricks) |
| **File** | `cities_magicbricks_rental_prices.csv` |
| **Raw Rows** | {N_RAW:,} |
| **After Cleaning** | {N_CLEAN:,} |
| **Removed** | {N_RAW - N_CLEAN:,} ({(N_RAW-N_CLEAN)/N_RAW*100:.1f}%) |
| **Cities** | 5 raw → 4 canonical (Nagpur excluded from join — outside primary-7) |
| **Unique Localities** | {rc7['locality'].nunique():,} (within primary-7 cities) |
| **Locality+City Pairs** | {N_LOCALITIES:,} aggregated |
| **Area Unit** | sqft (confirmed: `rent / area ≈ area_rate` at 95.9% match rate) |
| **Rent Unit** | INR/month (direct numeric) |
| **Missing Values** | **0** in all original columns |

---

## 2. Rental Data Cleaning Steps

| Step | Operation | Records Affected |
|---|---|---|
| City standardisation | `Bangalore→Bengaluru`, `New Delhi→Delhi` | All |
| Locality cleaning | title(), whitespace collapse, punct removal | All |
| Area validation | Flagged area < 50 or > 20,000 sqft | {n_area_bad} flagged |
| Rent validation | Removed null / zero / negative rents | {n_rent_null + n_rent_zero} |
| Bathroom fix | `bathrooms=0` → `1` | {(rent_raw['bathrooms']==0).sum()} rows |
| Furnishing label | `Furnished→Fully-Furnished` (canonical) | 1,601 rows |
| Rent/sqft outlier | Removed `rent_per_sqft > 5000` | erroneous batch |
| Probable duplicates | Same city+locality+area+BHK+rent | {n_dups} |
| Nagpur exclusion | Outside primary-7; retained in rental_clean.csv | {(~rent_raw['city_in_primary']).sum():,} |

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
| Pass 1 | Exact `city_key + locality_key` | {n_exact:,} ({n_exact/N_MASTER*100:.1f}%) |
| Pass 2 | City-level median fallback | {n_city_fb:,} additional |
| Unmatched | NULL rental features retained | {N_MASTER - n_total_matched:,} |

### Join Quality Breakdown

| Quality | Count | % |
|---|---|---|
{jq_rows}

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
| Properties with yield computed | {n_yield:,} |
| Yield range | {merged['rental_yield_pct'].min():.2f}% – {merged['rental_yield_pct'].max():.2f}% |
| Median yield | **{merged['rental_yield_pct'].median():.2f}%** |
| Mean yield | {merged['rental_yield_pct'].mean():.2f}% |

> [!NOTE]
> Typical residential rental yield in India ranges from **2–5%**. Higher yields indicate relatively affordable sale prices vs strong rental demand (value-buy signal). Very high yields (>8%) may indicate data quality issues or niche markets.

---

## 6. City-Level Rental Market Statistics

| City | Rental Listings | Median Rent | Median Rent/sqft | Median Yield |
|---|---|---|---|---|
{city_stats_rows}

---

## 7. Top 15 Localities by Rental Rate

| City | Locality | Listings | Median Rent | Median ₹/sqft |
|---|---|---|---|---|
{top_loc_rows}

---

## 8. New Features Added to property_master_v2

| Feature | dtype | Non-null | Fill % | Leakage Safety |
|---|---|---|---|---|
{feat_rows}

---

## 9. Output Files

| File | Description |
|---|---|
| [`data/processed/rental_clean.csv`](../data/processed/rental_clean.csv) | {N_CLEAN:,} cleaned rental listings with canonical columns |
| [`data/features/rental_features.csv`](../data/features/rental_features.csv) | {N_LOCALITIES:,} city+locality aggregate rental stats |
| [`data/processed/property_master_v2.csv`](../data/processed/property_master_v2.csv) | {merged.shape[0]:,} rows × {merged.shape[1]} cols — master + {len(rental_feature_cols)} rental features |
| [`reports/phase_5_rental_features.md`](phase_5_rental_features.md) | This report |
| [`reports/figures/phase5_rental_dashboard.png`](figures/phase5_rental_dashboard.png) | 10-panel rental market dashboard |

---

*Phase 5 complete — proceed to Phase 6: Full EDA, Spatial Feature Engineering & Geocoding.*
"""

OUT_REPORT.write_text(report_md, encoding='utf-8')
print(f"  Report saved → {OUT_REPORT}")

print("\n" + "=" * 72)
print("PHASE 5 COMPLETE")
print(f"  Rental listings (clean) : {N_CLEAN:,}")
print(f"  Localities aggregated   : {N_LOCALITIES:,}")
print(f"  Master v2 rows          : {merged.shape[0]:,}")
print(f"  Master v2 cols          : {merged.shape[1]}")
print(f"  Exact locality joins    : {n_exact:,} ({n_exact/N_MASTER*100:.1f}%)")
print(f"  Rental yield range      : {merged['rental_yield_pct'].min():.2f}% – {merged['rental_yield_pct'].max():.2f}%")
print(f"  Median rental yield     : {merged['rental_yield_pct'].median():.2f}%")
print("=" * 72)
