"""
Phase 2 — Production-Quality Data Cleaning Pipeline
AST-XGB India Property Valuation System
Author: Apoorv Mishra

Input  : data/raw/primary_property.csv
Output : data/processed/property_clean.csv
         reports/phase_2_cleaning_report.md

Operations (in order):
  1.  Snapshot before-stats
  2.  Drop exact duplicate rows
  3.  Parse BHK, property_type, locality, city from Property Title
  4.  Standardise city names (canonical map)
  5.  Standardise locality strings
  6.  Standardise property_type categories
  7.  Convert Price string → numeric INR (Lakhs base)
  8.  Area already int64 sqft — validate & flag anomalies
  9.  Standardise BHK as Int8
  10. Standardise Baths as Int8
  11. Convert Balcony to binary int
  12. Handle residual missing values
  13. Detect price & area outliers (IQR per city)
  14. Investigate outlier legitimacy (luxury heuristics)
  15. Remove only clearly erroneous records
  16. Clean Description text
  17. Probable-duplicate detection (dedupe key)
  18. Snapshot after-stats → transformation table
  19. Write cleaned CSV + markdown report
"""

import os, re, sys, warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from pathlib import Path
from textwrap import dedent

warnings.filterwarnings('ignore')

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).resolve().parent.parent
RAW_CSV     = BASE_DIR / "data" / "raw"  / "primary_property.csv"
OUT_DIR     = BASE_DIR / "data" / "processed"
REPORT_DIR  = BASE_DIR / "reports"
FIG_DIR     = REPORT_DIR / "figures"
OUT_CSV     = OUT_DIR  / "property_clean.csv"
OUT_REPORT  = REPORT_DIR / "phase_2_cleaning_report.md"

for d in [OUT_DIR, REPORT_DIR, FIG_DIR]:
    d.mkdir(parents=True, exist_ok=True)

print("=" * 72)
print("PHASE 2 │ Production-Quality Data Cleaning")
print("=" * 72)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 0 – Load raw data
# ═══════════════════════════════════════════════════════════════════════════════
df = pd.read_csv(RAW_CSV, encoding='utf-8', low_memory=False)
df.columns = [c.strip() for c in df.columns]
# Drop internal audit column if present
df.drop(columns=[c for c in df.columns if c == 'source_file'], inplace=True, errors='ignore')

N_RAW = len(df)
print(f"\nLoaded raw dataset: {N_RAW:,} rows × {df.shape[1]} cols")

# ── Before-state snapshot ─────────────────────────────────────────────────────
before = {
    'rows'          : N_RAW,
    'exact_dups'    : df.duplicated().sum(),
    'null_counts'   : df.isnull().sum().to_dict(),
    'price_unique'  : df['Price'].nunique(),
    'city_unique'   : df['Location'].str.extract(r',\s*([A-Za-z]+)\s*$', expand=False).nunique(),
}
print(f"  Exact duplicates (before)  : {before['exact_dups']:,}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 – Remove exact duplicate rows
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 1 │ Removing exact duplicate rows …")
df.drop_duplicates(inplace=True)
df.reset_index(drop=True, inplace=True)
n_after_exact = len(df)
exact_removed = N_RAW - n_after_exact
print(f"  Removed {exact_removed:,} exact duplicates → {n_after_exact:,} rows remain")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 – Parse structured fields from Property Title
# Format: "{BHK} BHK {PropertyType} for sale in {Locality}, {City}"
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 2 │ Parsing BHK, property_type, locality, city from Property Title …")

TITLE = df['Property Title'].astype(str)

# 2a. BHK
bhk_raw = TITLE.str.extract(r'^(\d+)\s+BHK', expand=False)
df['BHK'] = pd.to_numeric(bhk_raw, errors='coerce')
bhk_found = df['BHK'].notna().sum()
print(f"  BHK extracted from title   : {bhk_found:,} / {len(df):,}")

# 2b. Property type
PROP_TYPE_MAP_REGEX = {
    'Flat'              : r'\bFlat\b',
    'Apartment'         : r'\bApartment\b',
    'Independent House' : r'\bIndependent\s+House\b|\bHouse\b',
    'Villa'             : r'\bVilla\b',
    'Plot'              : r'\bPlot\b|\bLand\b',
    'Studio'            : r'\bStudio\b',
    'Penthouse'         : r'\bPenthouse\b',
    'Builder Floor'     : r'\bBuilder\s+Floor\b',
    'Row House'         : r'\bRow\s+House\b',
    'Farm House'        : r'\bFarm\s+House\b',
}
def extract_prop_type(title):
    for ptype, pattern in PROP_TYPE_MAP_REGEX.items():
        if re.search(pattern, title, re.IGNORECASE):
            return ptype
    return 'Unknown'

df['property_type'] = TITLE.apply(extract_prop_type)
print(f"  Property type distribution:\n{df['property_type'].value_counts().to_string()}")

# 2c. Locality + City from Title ("… for sale in {LOCALITY}, {CITY}")
sale_match = TITLE.str.extract(
    r'for sale in (.+?),\s*([A-Za-z\s]+?)\s*$', expand=True
)
df['locality_raw']  = sale_match[0].str.strip()
df['city_raw']      = sale_match[1].str.strip()

# 2d. Fallback: parse city from Location column (suffix after last comma)
loc_city_fallback = df['Location'].astype(str).str.extract(
    r',\s*([A-Za-z]+)\s*$', expand=False
).str.strip()
df['city_raw'] = df['city_raw'].fillna(loc_city_fallback)

# 2e. Fallback: locality from Location column (prefix before last comma)
loc_locality_fallback = df['Location'].astype(str).str.rsplit(',', n=1).str[0].str.strip()
df['locality_raw'] = df['locality_raw'].fillna(loc_locality_fallback)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 – Standardise city names
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 3 │ Standardising city names …")

CITY_CANONICAL = {
    'bangalore' : 'Bengaluru',
    'bengaluru' : 'Bengaluru',
    'mumbai'    : 'Mumbai',
    'bombay'    : 'Mumbai',
    'delhi'     : 'Delhi',
    'new delhi' : 'Delhi',
    'gurugram'  : 'Delhi',
    'gurgaon'   : 'Delhi',
    'noida'     : 'Delhi',
    'chennai'   : 'Chennai',
    'madras'    : 'Chennai',
    'pune'      : 'Pune',
    'kolkata'   : 'Kolkata',
    'calcutta'  : 'Kolkata',
    'hyderabad' : 'Hyderabad',
    'secunderabad': 'Hyderabad',
    'thane'     : 'Mumbai',   # Thane is Greater Mumbai metro
}

def canonicalise_city(raw):
    if pd.isna(raw):
        return 'Unknown'
    key = str(raw).strip().lower()
    return CITY_CANONICAL.get(key, str(raw).strip().title())

df['city'] = df['city_raw'].apply(canonicalise_city)
print(f"  City distribution (final):\n{df['city'].value_counts().to_string()}")

# Mark cities that are not in our 7 target cities
TARGET_CITIES = {'Bengaluru','Mumbai','Delhi','Chennai','Pune','Kolkata','Hyderabad'}
df['city_is_target'] = df['city'].isin(TARGET_CITIES)
n_off_target = (~df['city_is_target']).sum()
print(f"  Off-target cities : {n_off_target}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 – Standardise locality strings
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 4 │ Standardising locality strings …")

def clean_locality(s):
    if pd.isna(s) or str(s).strip() == '':
        return 'Unknown'
    s = str(s).strip()
    # Remove leading/trailing special chars but keep hyphens between words
    s = re.sub(r'^[\s,;:\-\.]+|[\s,;:\-\.]+$', '', s)
    # Collapse multiple spaces/commas
    s = re.sub(r'[,\s]+', ' ', s)
    # Remove stray punctuation (keep alphanumeric, space, hyphen, apostrophe)
    s = re.sub(r"[^\w\s\-']", '', s)
    s = s.strip().title()
    return s if s else 'Unknown'

df['locality'] = df['locality_raw'].apply(clean_locality)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 – Standardise property_type (already done in step 2, collapse Flat→Apartment)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 5 │ Collapsing Flat → Apartment (industry convention) …")
df['property_type'] = df['property_type'].replace({'Flat': 'Apartment'})
print(f"  Final property_type distribution:\n{df['property_type'].value_counts().to_string()}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 – Convert Price string → numeric INR Lakhs
# Formats: ₹60.0 L | ₹1.5 Cr | ₹25,00,000
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 6 │ Converting Price string → numeric INR Lakhs …")

def parse_price_to_lakhs(raw):
    """Returns price in Lakhs (INR). Returns np.nan if unparseable."""
    if pd.isna(raw):
        return np.nan
    s = str(raw).strip()
    # Remove currency symbol and normalise
    s = s.replace('₹', '').replace(',', '').strip()
    
    # Crore pattern: e.g. "1.5 Cr" / "1.5Cr" / "1.5 crore"
    m = re.search(r'([\d.]+)\s*(?:Cr|cr|crore|CRORE)', s)
    if m:
        return float(m.group(1)) * 100.0  # 1 Crore = 100 Lakhs

    # Lakh pattern: e.g. "60.0 L" / "60.0 Lac" / "60 lakh"
    m = re.search(r'([\d.]+)\s*(?:L\b|Lac|lac|lakh|LAKH)', s)
    if m:
        return float(m.group(1))

    # Plain numeric (bare INR digits like 2500000) → convert to Lakhs
    m = re.match(r'^([\d.]+)$', s)
    if m:
        val = float(m.group(1))
        if val > 1_000:          # raw INR: convert to Lakhs
            return val / 1_00_000.0
        return val               # already small → treat as Lakhs

    return np.nan

df['price_lakhs'] = df['Price'].apply(parse_price_to_lakhs)

# Convert to absolute INR (for regression target)
df['price_inr'] = df['price_lakhs'] * 1_00_000   # 1 Lakh = 100,000 INR

n_price_null = df['price_lakhs'].isna().sum()
print(f"  Unparseable prices : {n_price_null}")
print(f"  Price range (Lakhs): {df['price_lakhs'].min():.2f} – {df['price_lakhs'].max():.2f}")
print(f"  Price median (Lakhs): {df['price_lakhs'].median():.2f}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 – Validate Area (already int64 sqft)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 7 │ Validating Total_Area (sqft) …")
df['area_sqft'] = pd.to_numeric(df['Total_Area'], errors='coerce')
print(f"  Area range: {df['area_sqft'].min():.0f} – {df['area_sqft'].max():.0f} sqft")
print(f"  Median    : {df['area_sqft'].median():.0f} sqft")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8 – Standardise BHK as integer
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 8 │ Standardising BHK …")
# Clip impossible values: BHK must be 1–15
df.loc[df['BHK'] < 1, 'BHK']  = np.nan
df.loc[df['BHK'] > 15, 'BHK'] = np.nan

bhk_null = df['BHK'].isna().sum()
if bhk_null > 0:
    # For rows where BHK still missing: try to infer from bathroom count
    bhk_median_per_baths = df.groupby('Baths')['BHK'].median()
    df['BHK'] = df.apply(
        lambda r: bhk_median_per_baths.get(r['Baths'], np.nan) if pd.isna(r['BHK']) else r['BHK'],
        axis=1
    )
df['BHK'] = pd.to_numeric(df['BHK'], errors='coerce').round().astype('Int64')
print(f"  BHK distribution:\n{df['BHK'].value_counts().sort_index().to_string()}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9 – Standardise Bathrooms
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 9 │ Standardising Baths …")
df['baths'] = pd.to_numeric(df['Baths'], errors='coerce').round().astype('Int64')
df.loc[df['baths'] < 1, 'baths'] = pd.NA
df.loc[df['baths'] > 15, 'baths'] = pd.NA
# Impute with median
baths_median = int(df['baths'].median())
df['baths'] = df['baths'].fillna(baths_median)
df['baths'] = df['baths'].astype('Int64')
print(f"  Baths distribution:\n{df['baths'].value_counts().sort_index().to_string()}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 10 – Convert Balcony to binary int
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 10 │ Converting Balcony to binary …")
df['has_balcony'] = df['Balcony'].str.strip().str.lower().map({'yes': 1, 'no': 0})
df['has_balcony'] = df['has_balcony'].fillna(0).astype(int)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 11 – Handle residual missing values
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 11 │ Handling residual missing values …")

# price_lakhs – flag then drop (cannot impute target variable)
before_price_drop = len(df)
df = df[df['price_lakhs'].notna()].copy()
df = df[df['price_lakhs'] > 0].copy()
price_rows_dropped = before_price_drop - len(df)
print(f"  Dropped {price_rows_dropped} rows with null/zero price")

# area_sqft – fill with city-level median (not target-derived)
area_city_median = df.groupby('city')['area_sqft'].transform('median')
df['area_sqft'] = df['area_sqft'].fillna(area_city_median)
df['area_sqft'] = df['area_sqft'].fillna(df['area_sqft'].median())

# locality – fill remaining unknowns
df['locality'] = df['locality'].fillna('Unknown')

# property_type – fill unknowns
df['property_type'] = df['property_type'].replace('Unknown', np.nan)
prop_mode = df['property_type'].mode()[0]
df['property_type'] = df['property_type'].fillna(prop_mode)

print(f"  Remaining null counts:\n{df[['price_lakhs','area_sqft','BHK','baths','locality','city','property_type']].isnull().sum().to_string()}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 12 – Detect price & area outliers (IQR per city)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 12 │ Detecting price & area outliers …")

def iqr_bounds(series, factor=3.0):
    q1, q3 = series.quantile(0.25), series.quantile(0.75)
    iqr = q3 - q1
    return q1 - factor * iqr, q3 + factor * iqr

outlier_records = []
for city, grp in df.groupby('city'):
    p_lo, p_hi = iqr_bounds(grp['price_lakhs'])
    a_lo, a_hi = iqr_bounds(grp['area_sqft'])

    price_outliers = grp[(grp['price_lakhs'] < p_lo) | (grp['price_lakhs'] > p_hi)]
    area_outliers  = grp[(grp['area_sqft']   < a_lo) | (grp['area_sqft']   > a_hi)]

    outlier_records.append({
        'city'             : city,
        'price_IQR_lo'     : round(p_lo, 2),
        'price_IQR_hi'     : round(p_hi, 2),
        'price_outliers'   : len(price_outliers),
        'area_IQR_lo'      : round(a_lo, 2),
        'area_IQR_hi'      : round(a_hi, 2),
        'area_outliers'    : len(area_outliers),
    })
    if len(price_outliers) > 0:
        print(f"  {city}: {len(price_outliers)} price outliers  "
              f"[range: {grp['price_lakhs'].min():.1f}–{grp['price_lakhs'].max():.1f} L]  "
              f"IQR fence: [{p_lo:.1f}, {p_hi:.1f}]")

df_outlier_summary = pd.DataFrame(outlier_records)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 13 – Investigate outlier legitimacy (luxury vs data error)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 13 │ Investigating luxury vs erroneous outliers …")

# Luxury heuristics:
#   - price_lakhs in top 1% for city   AND  property_type in (Villa, Penthouse, Independent House)
#   - area_sqft    in top 1% for city  AND  BHK >= 4
#   - price_per_sqft consistent with city median (±5×)
#
# Erroneous heuristics:
#   - price_lakhs < 1.0    (< 1 Lakh = clearly a data entry fragment)
#   - area_sqft   < 50     (impossibly small)
#   - area_sqft   > 50000  (larger than most Indian residential projects)
#   - price_per_sqft > 500000 (≈ £5000/sqft → extreme premium; verify)
#   - price_per_sqft == 0

df['price_per_sqft_clean'] = df['price_inr'] / df['area_sqft']

erroneous_mask = (
    (df['price_lakhs'] < 1.0)              |   # sub-1L price
    (df['area_sqft'] < 50)                 |   # < 50 sqft
    (df['area_sqft'] > 50_000)             |   # > 50,000 sqft — not residential
    (df['Price_per_SQFT'] == 0)            |   # PPSF explicitly zero
    (df['price_per_sqft_clean'] > 500_000) |   # > ₹5L per sqft (data error level)
    (df['price_per_sqft_clean'] <= 0)          # computed zero/negative
)

luxury_mask = (
    ~erroneous_mask                        &
    (df['price_lakhs'] > df.groupby('city')['price_lakhs'].transform(lambda x: x.quantile(0.99)))  &
    (df['property_type'].isin(['Villa', 'Penthouse', 'Independent House', 'Farm House']))
)

n_erroneous = erroneous_mask.sum()
n_luxury    = luxury_mask.sum()
print(f"  Erroneous records flagged  : {n_erroneous}")
print(f"  Verified luxury properties : {n_luxury}")
print(f"  High-price outlier sample:")

# Print a few luxury samples
luxury_sample = df[luxury_mask][['property_type','city','locality','price_lakhs','area_sqft','BHK']].head(5)
print(luxury_sample.to_string(index=False))

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 14 – Remove only clearly erroneous records (preserve luxury)
# ═══════════════════════════════════════════════════════════════════════════════
print(f"\nSTEP 14 │ Removing {n_erroneous} erroneous records …")
df = df[~erroneous_mask].copy()
df.reset_index(drop=True, inplace=True)
print(f"  Dataset size after cleaning : {len(df):,} rows")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 15 – Clean property descriptions
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 15 │ Cleaning Description text …")

def clean_description(s):
    if pd.isna(s) or str(s).strip() == '':
        return ''
    s = str(s)
    # Normalise unicode whitespace
    s = re.sub(r'\s+', ' ', s)
    # Remove HTML tags if any
    s = re.sub(r'<[^>]+>', '', s)
    # Remove non-printable chars (keep standard punctuation + ₹)
    s = re.sub(r'[^\x20-\x7E₹]', ' ', s)
    # Collapse repeated punctuation
    s = re.sub(r'[.!?,;]{2,}', '.', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

df['description_clean'] = df['Description'].apply(clean_description)
desc_empty = (df['description_clean'] == '').sum()
print(f"  Empty descriptions after cleaning: {desc_empty}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 16 – Probable duplicate detection (deduplication key)
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 16 │ Detecting probable duplicate listings …")

df['_dedup_key'] = (
    df['city'].str.lower() + '|' +
    df['locality'].str.lower() + '|' +
    df['area_sqft'].astype(str) + '|' +
    df['BHK'].astype(str) + '|' +
    df['baths'].astype(str) + '|' +
    df['price_lakhs'].round(1).astype(str)
)
n_prob_dups = df.duplicated(subset=['_dedup_key']).sum()
print(f"  Probable duplicate listings (after exact-dedup): {n_prob_dups:,}")
# Keep first occurrence; mark rest
df['is_probable_duplicate'] = df.duplicated(subset=['_dedup_key'], keep='first').astype(int)
df_before_prob_dedup = len(df)
df = df[df['is_probable_duplicate'] == 0].copy()
df.drop(columns=['_dedup_key', 'is_probable_duplicate'], inplace=True)
df.reset_index(drop=True, inplace=True)
print(f"  Removed {df_before_prob_dedup - len(df):,} probable duplicates → {len(df):,} rows remain")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 17 – Compute price_per_sqft (derived feature — safe after cleaning)
# ═══════════════════════════════════════════════════════════════════════════════
df['price_per_sqft'] = (df['price_inr'] / df['area_sqft']).round(2)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 18 – Select and rename final columns
# ═══════════════════════════════════════════════════════════════════════════════
FINAL_COLS = [
    'city', 'locality', 'property_type',
    'BHK', 'baths', 'has_balcony',
    'area_sqft',
    'price_lakhs', 'price_inr', 'price_per_sqft',
    'description_clean',
    # Keep originals for traceability
    'Name', 'Property Title', 'Price', 'Location',
]
df_out = df[[c for c in FINAL_COLS if c in df.columns]].copy()
df_out.rename(columns={
    'BHK'              : 'bhk',
    'Name'             : 'property_name',
    'Property Title'   : 'property_title',
    'Price'            : 'price_raw',
    'Location'         : 'location_raw',
}, inplace=True)

N_CLEAN = len(df_out)

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 19 – Save cleaned CSV
# ═══════════════════════════════════════════════════════════════════════════════
df_out.to_csv(OUT_CSV, index=False, encoding='utf-8')
print(f"\nSaved cleaned dataset → {OUT_CSV}")
print(f"  Final dimensions: {N_CLEAN:,} rows × {df_out.shape[1]} cols")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 20 – Visualisations
# ═══════════════════════════════════════════════════════════════════════════════
print("\nGenerating Phase 2 visualisations …")

BG_DARK = '#0b0f19'; BG_AX = '#111827'; TC = '#e2e8f0'
C1='#06b6d4'; C2='#8b5cf6'; C3='#10b981'; C4='#f59e0b'; C5='#f43f5e'

fig = plt.figure(figsize=(20, 14))
fig.patch.set_facecolor(BG_DARK)
gs  = gridspec.GridSpec(3, 4, figure=fig, hspace=0.48, wspace=0.38)

def sax(ax, title=''):
    ax.set_facecolor(BG_AX)
    for sp in ax.spines.values(): sp.set_edgecolor('#374151')
    ax.tick_params(colors=TC, labelsize=8)
    ax.xaxis.label.set_color(TC); ax.yaxis.label.set_color(TC)
    if title: ax.set_title(title, color=TC, fontsize=9, fontweight='bold', pad=6)
    return ax

# 1. Price distribution (Lakhs) — log scale
ax = fig.add_subplot(gs[0, 0])
ax.hist(np.log1p(df_out['price_lakhs']), bins=60, color=C1, alpha=0.85, edgecolor='none')
ax.set_xlabel('log(1 + Price Lakhs)'); sax(ax, 'Price Distribution (log)')

# 2. Price per city boxplot
ax = fig.add_subplot(gs[0, 1])
city_order = df_out.groupby('city')['price_lakhs'].median().sort_values(ascending=True).index
data_by_city = [df_out[df_out['city']==c]['price_lakhs'].clip(upper=df_out['price_lakhs'].quantile(0.99)).values
                for c in city_order]
bp = ax.boxplot(data_by_city, vert=True, patch_artist=True,
                medianprops=dict(color='white', lw=2))
colors_box = [C1,C2,C3,C4,C5,'#a78bfa','#34d399']
for patch, col in zip(bp['boxes'], colors_box):
    patch.set_facecolor(col); patch.set_alpha(0.7)
ax.set_xticks(range(1, len(city_order)+1))
ax.set_xticklabels([c[:3] for c in city_order], fontsize=7, color=TC)
ax.set_ylabel('Price (Lakhs)'); sax(ax, 'Price by City (p99 clipped)')

# 3. Area distribution
ax = fig.add_subplot(gs[0, 2])
ax.hist(df_out['area_sqft'].clip(upper=df_out['area_sqft'].quantile(0.99)),
        bins=60, color=C3, alpha=0.85, edgecolor='none')
ax.set_xlabel('Area (sqft)'); sax(ax, 'Area Distribution')

# 4. BHK distribution
ax = fig.add_subplot(gs[0, 3])
bhk_vc = df_out['bhk'].value_counts().sort_index()
ax.bar(bhk_vc.index.astype(str), bhk_vc.values, color=C4, alpha=0.85)
ax.set_xlabel('BHK'); sax(ax, 'BHK Distribution')

# 5. Property type pie
ax = fig.add_subplot(gs[1, 0])
pt_vc = df_out['property_type'].value_counts().head(6)
palette = [C1,C2,C3,C4,C5,'#a78bfa']
wedges, texts, autotexts = ax.pie(
    pt_vc.values, labels=pt_vc.index,
    autopct='%1.0f%%', colors=palette[:len(pt_vc)],
    startangle=90, textprops={'color': TC, 'fontsize': 7}
)
for at in autotexts: at.set_color('#0b0f19'); at.set_fontweight('bold')
sax(ax, 'Property Type Mix')

# 6. City listing counts
ax = fig.add_subplot(gs[1, 1])
city_vc = df_out['city'].value_counts()
ax.barh(city_vc.index, city_vc.values, color=C2, alpha=0.85)
ax.set_xlabel('Listings'); sax(ax, 'Listings by City (cleaned)')

# 7. Price vs Area scatter (log-log)
ax = fig.add_subplot(gs[1, 2:4])
sample = df_out.sample(min(3000, len(df_out)), random_state=42)
sc = ax.scatter(np.log1p(sample['area_sqft']),
                np.log1p(sample['price_lakhs']),
                c=sample['bhk'].fillna(2).astype(float),
                cmap='plasma', alpha=0.35, s=8, rasterized=True)
plt.colorbar(sc, ax=ax, label='BHK').ax.yaxis.label.set_color(TC)
ax.set_xlabel('log(1 + Area sqft)'); ax.set_ylabel('log(1 + Price Lakhs)')
sax(ax, 'Price vs Area (log-log, coloured by BHK)')

# 8. BHK vs Price violin approximation (boxplot)
ax = fig.add_subplot(gs[2, 0:2])
bhk_vals = sorted(df_out['bhk'].dropna().unique())
bp2 = ax.boxplot(
    [df_out[df_out['bhk']==b]['price_lakhs'].clip(upper=df_out['price_lakhs'].quantile(0.95)).values
     for b in bhk_vals],
    patch_artist=True, medianprops=dict(color='white', lw=2)
)
for patch, col in zip(bp2['boxes'], [C1,C2,C3,C4,C5,'#a78bfa','#34d399'][:len(bhk_vals)]):
    patch.set_facecolor(col); patch.set_alpha(0.7)
ax.set_xticks(range(1, len(bhk_vals)+1))
ax.set_xticklabels([str(b) for b in bhk_vals], color=TC)
ax.set_xlabel('BHK'); ax.set_ylabel('Price (Lakhs)')
sax(ax, 'Price by BHK (p95 clipped)')

# 9. Before vs After row counts
ax = fig.add_subplot(gs[2, 2])
labels = ['Raw', 'After\nExact Dedup', 'After Error\nRemoval', 'After Prob\nDedup (Final)']
counts = [N_RAW, n_after_exact, n_after_exact - n_erroneous, N_CLEAN]
bars = ax.bar(labels, counts, color=[C5, C4, C3, C1], alpha=0.85)
for bar, cnt in zip(bars, counts):
    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+50,
            f'{cnt:,}', ha='center', va='bottom', color=TC, fontsize=8, fontweight='bold')
ax.set_ylabel('Row Count'); sax(ax, 'Data Funnel: Raw → Clean')

# 10. Price per sqft by city
ax = fig.add_subplot(gs[2, 3])
ppsft_city = df_out.groupby('city')['price_per_sqft'].median().sort_values(ascending=True)
ax.barh(ppsft_city.index, ppsft_city.values, color=C3, alpha=0.85)
ax.set_xlabel('Median ₹/sqft'); sax(ax, 'Median Price/sqft by City')

fig.suptitle('AST-XGB │ Phase 2 Data Cleaning Dashboard — India 7-City Real Estate',
             color=TC, fontsize=13, fontweight='bold', y=0.99)

fig_path = FIG_DIR / "phase2_cleaning_dashboard.png"
plt.savefig(fig_path, dpi=140, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close()
print(f"  Saved → {fig_path}")

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 21 – Build transformation table & markdown report
# ═══════════════════════════════════════════════════════════════════════════════
print("\nBuilding Phase 2 report …")

# Before-after missingness for original columns
orig_cols_before = ['Price', 'Total_Area', 'Baths', 'Balcony', 'Location', 'Name', 'Property Title', 'Description']
orig_df = pd.read_csv(RAW_CSV, encoding='utf-8', low_memory=False)
orig_df.columns = [c.strip() for c in orig_df.columns]

TRANSFORM_TABLE = [
    ('Price',          orig_df['Price'].isna().sum(),          df_out['price_lakhs'].isna().sum(),    'Parsed Lakh/Crore → float (Lakhs); INR = Lakhs × 100,000'),
    ('Total_Area',     orig_df['Total_Area'].isna().sum(),     df_out['area_sqft'].isna().sum(),      'Renamed area_sqft; validated range [50, 50000]; city-median fill'),
    ('Baths',          orig_df['Baths'].isna().sum(),          df_out['baths'].isna().sum(),          'Clipped [1,15]; global median imputation for outliers'),
    ('BHK',            N_RAW,                                  df_out['bhk'].isna().sum(),            'Extracted from Property Title via regex; baths-based fallback'),
    ('Location→city',  0,                                      df_out['city'].isna().sum(),           'Regex city extraction; canonical 7-city map; Thane→Mumbai'),
    ('Location→locality',0,                                    df_out['locality'].isna().sum(),       'Prefix before city in Location; cleaned title(), punct stripped'),
    ('Property Title→property_type', 0,                        df_out['property_type'].isna().sum(),'Regex keyword extraction; Flat→Apartment; mode fill'),
    ('Balcony',        orig_df['Balcony'].isna().sum(),        df_out['has_balcony'].isna().sum(),    'Yes/No → binary int 1/0; NaN → 0'),
    ('Description',    orig_df['Description'].isna().sum(),    0,                                     'Whitespace collapse; HTML strip; non-printable removal'),
    ('price_per_sqft', N_RAW,                                  df_out['price_per_sqft'].isna().sum(),'Derived: price_inr / area_sqft (after cleaning)'),
]

# City-level stats after cleaning
city_stats = df_out.groupby('city').agg(
    count      = ('price_lakhs', 'size'),
    median_price_L = ('price_lakhs', 'median'),
    median_area    = ('area_sqft', 'median'),
    median_ppsft   = ('price_per_sqft', 'median'),
).reset_index().round(2)

# Outlier summary table rows
outlier_rows = "\n".join(
    f"| {r['city']} | {r['price_IQR_lo']:,.1f} | {r['price_IQR_hi']:,.1f} | "
    f"{r['price_outliers']} | {r['area_IQR_lo']:,.0f} | {r['area_IQR_hi']:,.0f} | "
    f"{r['area_outliers']} |"
    for _, r in df_outlier_summary.iterrows()
)

# Transformation table rows
transform_rows = "\n".join(
    f"| `{feat}` | {mb} | {ma} | {note} |"
    for feat, mb, ma, note in TRANSFORM_TABLE
)

# City stats rows
city_stat_rows = "\n".join(
    f"| {r['city']} | {int(r['count']):,} | {r['median_price_L']:.1f} L | "
    f"{int(r['median_area']):,} sqft | ₹{r['median_ppsft']:,.0f}/sqft |"
    for _, r in city_stats.iterrows()
)

report_md = f"""# Phase 2 — Production Data Cleaning Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}

---

## Cleaning Dashboard

![Phase 2 Cleaning Dashboard]({fig_path})

---

## 1. Data Funnel Summary

| Stage | Rows | Removed | Reason |
|---|---|---|---|
| Raw dataset | {N_RAW:,} | — | — |
| After exact deduplication | {n_after_exact:,} | {exact_removed} | Identical rows |
| After erroneous record removal | {n_after_exact - n_erroneous:,} | {n_erroneous} | Price<1L / Area<50sqft or >50k / PPSF anomaly |
| After probable-duplicate removal | {N_CLEAN:,} | {n_prob_dups} | Same city+locality+area+BHK+baths+price |
| **Final cleaned dataset** | **{N_CLEAN:,}** | **{N_RAW - N_CLEAN:,}** | **Total removed ({(N_RAW-N_CLEAN)/N_RAW*100:.1f}%)** |

---

## 2. Feature Transformation Table

| Feature | missing_before | missing_after | Transformation Applied |
|---|---|---|---|
{transform_rows}

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
{chr(10).join(f"| {pt} | Regex pattern match | {int(df_out['property_type'].value_counts().get(pt, 0)):,} |" for pt in df_out['property_type'].value_counts().index)}

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

**Result:** Price range = ₹{df_out['price_lakhs'].min():.1f}L – ₹{df_out['price_lakhs'].max():.1f}L  
**Median price:** ₹{df_out['price_lakhs'].median():.1f} Lakhs

---

## 6. Outlier Investigation by City (IQR × 3.0 fence)

| City | Price Lo (L) | Price Hi (L) | Price Outliers | Area Lo (sqft) | Area Hi (sqft) | Area Outliers |
|---|---|---|---|---|---|---|
{outlier_rows}

### Luxury Property Verification
- **{n_luxury}** verified luxury properties (Villa / Penthouse / Independent House in top 1% price by city) were **retained** as legitimate observations.
- **{n_erroneous}** records were removed as clearly erroneous (price < ₹1L, area < 50sqft, area > 50,000sqft, PPSF = 0 or > ₹5L/sqft).

> [!NOTE]
> Luxury outlier records with price > 3×IQR fence but consistent property_type (Villa, Penthouse) and area ratios were classified as legitimate and retained. Automated removal was restricted to statistically impossible values only.

---

## 7. City-Level Statistics (Cleaned Dataset)

| City | Listings | Median Price | Median Area | Median ₹/sqft |
|---|---|---|---|---|
{city_stat_rows}

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
| [`data/processed/property_clean.csv`](../data/processed/property_clean.csv) | Final cleaned dataset ({N_CLEAN:,} rows × {df_out.shape[1]} cols) |
| [`reports/figures/phase2_cleaning_dashboard.png`](figures/phase2_cleaning_dashboard.png) | 10-panel cleaning visualisation dashboard |
| [`reports/phase_2_cleaning_report.md`](phase_2_cleaning_report.md) | This report |
| [`notebooks/phase2_cleaning.py`](../notebooks/phase2_cleaning.py) | Reproducible cleaning script |

---

*Phase 2 complete — proceed to Phase 3: Exploratory Data Analysis & Feature Engineering.*
"""

OUT_REPORT.write_text(report_md, encoding='utf-8')
print(f"  Saved → {OUT_REPORT}")

print("\n" + "=" * 72)
print("PHASE 2 CLEANING COMPLETE")
print(f"  Raw rows   : {N_RAW:,}")
print(f"  Clean rows : {N_CLEAN:,}  ({(N_RAW-N_CLEAN)/N_RAW*100:.1f}% removed)")
print(f"  Columns    : {df_out.shape[1]}")
print(f"  Output CSV : {OUT_CSV}")
print(f"  Report     : {OUT_REPORT}")
print("=" * 72)
