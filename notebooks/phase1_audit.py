"""
Phase 1 – Primary Dataset Acquisition & Deep Audit
AST-XGB India Property Valuation System
Author: Apoorv Mishra

Downloads the "Housing Real Estate Data from 7 Indian Cities" dataset via kagglehub,
copies it to data/raw/primary_property.csv, and produces a comprehensive audit report
at reports/phase_1_primary_dataset_audit.md.

NO model training. NO blind imputation.
"""

import os
import sys
import shutil
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')          # non-interactive backend for Windows
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from pathlib import Path

warnings.filterwarnings('ignore')

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent
RAW_DIR    = BASE_DIR / "data" / "raw"
REPORT_DIR = BASE_DIR / "reports"
FIG_DIR    = REPORT_DIR / "figures"

for d in [RAW_DIR, REPORT_DIR, FIG_DIR]:
    d.mkdir(parents=True, exist_ok=True)

PRIMARY_CSV = RAW_DIR / "primary_property.csv"

# ── STEP 1 – Download via kagglehub ──────────────────────────────────────────
print("=" * 72)
print("STEP 1 │ Downloading dataset via kagglehub …")
print("=" * 72)

import kagglehub
dl_path = kagglehub.dataset_download("rakkesharv/real-estate-data-from-7-indian-cities")
print(f"  Kaggle cache path : {dl_path}")

# Locate all CSVs in the download directory
dl_path = Path(dl_path)
csv_files = sorted(dl_path.rglob("*.csv"))
print(f"  CSV files found   : {len(csv_files)}")
for f in csv_files:
    print(f"    • {f.name}  ({f.stat().st_size / 1024:.1f} KB)")

if not csv_files:
    raise FileNotFoundError("No CSV files found in kagglehub download path. "
                            "Check your Kaggle credentials / network.")

# ── STEP 2 – Load & Merge ────────────────────────────────────────────────────
print("\nSTEP 2 │ Loading and merging CSVs …")

frames = []
for f in csv_files:
    try:
        df_tmp = pd.read_csv(f, encoding='utf-8', low_memory=False)
    except UnicodeDecodeError:
        df_tmp = pd.read_csv(f, encoding='latin-1', low_memory=False)
    df_tmp['source_file'] = f.name
    frames.append(df_tmp)
    print(f"  Loaded {f.name}: {df_tmp.shape[0]:,} rows × {df_tmp.shape[1]} cols")

df = pd.concat(frames, ignore_index=True)
print(f"\n  Combined dataset  : {df.shape[0]:,} rows × {df.shape[1]} cols")

# Save primary copy
df.to_csv(PRIMARY_CSV, index=False)
print(f"  Saved → {PRIMARY_CSV}")

# ── STEP 3 – Column normalisation (strip whitespace from names) ───────────────
df.columns = [c.strip() for c in df.columns]
COLS = df.columns.tolist()

print(f"\nSTEP 3 │ Columns ({len(COLS)}):")
for c in COLS:
    print(f"    • {c}")

# ── STEP 4 – Basic dimension report ──────────────────────────────────────────
print("\nSTEP 4 │ Dimensions & dtypes")
print(df.dtypes.to_string())

# ── STEP 5 – Missing-value census ────────────────────────────────────────────
miss_abs  = df.isnull().sum()
miss_pct  = (miss_abs / len(df) * 100).round(2)
miss_df   = pd.DataFrame({'Missing_Count': miss_abs, 'Missing_Pct': miss_pct})
miss_df   = miss_df[miss_df['Missing_Count'] > 0].sort_values('Missing_Pct', ascending=False)

print("\nSTEP 5 │ Missing-value census")
print(miss_df.to_string() if not miss_df.empty else "  → No missing values detected.")

# ── STEP 6 – Duplicate detection ─────────────────────────────────────────────
n_full_dups = df.duplicated().sum()
# Near-duplicate: same Name + Location + Price + Total Area
dup_subset_cols = [c for c in ['Name', 'Location', 'Price', 'Total Area'] if c in COLS]
n_subset_dups   = df.duplicated(subset=dup_subset_cols).sum() if dup_subset_cols else 0

print(f"\nSTEP 6 │ Duplicates")
print(f"  Full row duplicates         : {n_full_dups:,}")
print(f"  Near-duplicates (name+loc+price+area): {n_subset_dups:,}")

# ── STEP 7 – Categorical cardinality ─────────────────────────────────────────
cat_cols = df.select_dtypes(include=['object']).columns.tolist()
print(f"\nSTEP 7 │ Categorical unique counts")
cat_cardinality = {}
for c in cat_cols:
    u = df[c].nunique()
    cat_cardinality[c] = u
    print(f"  {c:<30} {u:>6} unique values")

# ── STEP 8 – Target variable identification ───────────────────────────────────
PRICE_COL   = next((c for c in COLS if 'price' in c.lower() and 'per' not in c.lower()), None)
PPSF_COL    = next((c for c in COLS if 'per' in c.lower() and 'sqft' in c.lower()), None)
AREA_COL    = next((c for c in COLS if 'area' in c.lower() or 'sqft' in c.lower()), None)
BATHS_COL   = next((c for c in COLS if 'bath' in c.lower()), None)
BALCONY_COL = next((c for c in COLS if 'balcony' in c.lower()), None)
LOC_COL     = next((c for c in COLS if 'location' in c.lower()), None)
NAME_COL    = next((c for c in COLS if c.lower() == 'name'), None)
TITLE_COL   = next((c for c in COLS if 'title' in c.lower()), None)
DESC_COL    = next((c for c in COLS if 'desc' in c.lower()), None)
BHK_COL     = next((c for c in COLS if 'bhk' in c.lower() or 'bedroom' in c.lower()), None)

print(f"\nSTEP 8 │ Identified feature roles")
print(f"  Target (price)       : {PRICE_COL}")
print(f"  Price per SQFT       : {PPSF_COL}")
print(f"  Area / SQFT          : {AREA_COL}")
print(f"  Bathrooms            : {BATHS_COL}")
print(f"  BHK / Bedrooms       : {BHK_COL}")
print(f"  Location             : {LOC_COL}")
print(f"  Name                 : {NAME_COL}")
print(f"  Title                : {TITLE_COL}")
print(f"  Description (text)   : {DESC_COL}")
print(f"  Balcony              : {BALCONY_COL}")

# ── STEP 9 – Inconsistent unit detection in Price & Area ──────────────────────
print(f"\nSTEP 9 │ Inconsistent unit / format detection")

def detect_price_units(series: pd.Series):
    """Return counts of Lakh vs Crore vs plain-numeric vs text patterns."""
    s = series.astype(str).str.lower()
    lakh_mask   = s.str.contains(r'lac|lakh|l\b', regex=True)
    crore_mask  = s.str.contains(r'cr|crore', regex=True)
    plain_mask  = series.apply(lambda x: _is_numeric(x))
    text_only   = (~lakh_mask) & (~crore_mask) & (~plain_mask)
    return {
        'Lakh pattern'  : int(lakh_mask.sum()),
        'Crore pattern' : int(crore_mask.sum()),
        'Plain numeric' : int(plain_mask.sum()),
        'Text/other'    : int(text_only.sum()),
    }

def _is_numeric(val):
    try:
        float(str(val).replace(',', '').strip())
        return True
    except ValueError:
        return False

if PRICE_COL:
    price_units = detect_price_units(df[PRICE_COL])
    print(f"  Price column '{PRICE_COL}' unit patterns:")
    for k, v in price_units.items():
        print(f"    {k:<22}: {v:,}")

if AREA_COL:
    area_s = df[AREA_COL].astype(str).str.lower()
    sq_mask  = area_s.str.contains(r'sq\.?\s*ft|sqft', regex=True)
    sq_m_mask= area_s.str.contains(r'sq\.?\s*m', regex=True)
    yard_mask= area_s.str.contains(r'yard', regex=True)
    print(f"  Area column '{AREA_COL}' unit patterns:")
    print(f"    SQFT pattern       : {sq_mask.sum():,}")
    print(f"    SQM pattern        : {sq_m_mask.sum():,}")
    print(f"    Yard pattern       : {yard_mask.sum():,}")

# ── STEP 10 – Impossible value detection ──────────────────────────────────────
print(f"\nSTEP 10 │ Impossible value detection")

impossible_flags = {}

# Helper: coerce to float
def to_float_series(series: pd.Series) -> pd.Series:
    return pd.to_numeric(
        series.astype(str)
              .str.replace(',', '', regex=False)
              .str.extract(r'([\d.]+)', expand=False),
        errors='coerce'
    )

if PRICE_COL:
    price_num = to_float_series(df[PRICE_COL])
    neg_price = (price_num < 0).sum()
    zero_price = (price_num == 0).sum()
    impossible_flags['Negative price']  = int(neg_price)
    impossible_flags['Zero price']      = int(zero_price)
    print(f"  Negative price         : {neg_price:,}")
    print(f"  Zero price             : {zero_price:,}")
    print(f"  Price range            : {price_num.min():.2f} – {price_num.max():.2f}  (median {price_num.median():.2f})")

if AREA_COL:
    area_num = to_float_series(df[AREA_COL])
    zero_area = (area_num == 0).sum()
    neg_area  = (area_num < 0).sum()
    # Anything below 50 sqft or above 500,000 sqft is suspicious
    tiny_area = ((area_num > 0) & (area_num < 50)).sum()
    huge_area = (area_num > 500_000).sum()
    impossible_flags['Zero area']       = int(zero_area)
    impossible_flags['Negative area']   = int(neg_area)
    impossible_flags['Area < 50 sqft']  = int(tiny_area)
    impossible_flags['Area > 500k sqft']= int(huge_area)
    print(f"  Zero area              : {zero_area:,}")
    print(f"  Negative area          : {neg_area:,}")
    print(f"  Suspicious tiny area (<50 sqft) : {tiny_area:,}")
    print(f"  Suspicious huge area (>500k sqft): {huge_area:,}")
    print(f"  Area range             : {area_num.min():.1f} – {area_num.max():.1f}  (median {area_num.median():.1f})")

if BATHS_COL:
    baths_num = to_float_series(df[BATHS_COL])
    neg_baths   = (baths_num < 0).sum()
    zero_baths  = (baths_num == 0).sum()
    huge_baths  = (baths_num > 20).sum()
    impossible_flags['Negative baths']  = int(neg_baths)
    impossible_flags['Zero baths']      = int(zero_baths)
    impossible_flags['Baths > 20']      = int(huge_baths)
    print(f"  Negative baths         : {neg_baths:,}")
    print(f"  Zero baths             : {zero_baths:,}")
    print(f"  Impossible baths (>20) : {huge_baths:,}")
    print(f"  Bath value counts (top 10):")
    print(df[BATHS_COL].value_counts().head(10).to_string())

if BHK_COL:
    bhk_num = to_float_series(df[BHK_COL])
    zero_bhk  = (bhk_num == 0).sum()
    huge_bhk  = (bhk_num > 15).sum()
    neg_bhk   = (bhk_num < 0).sum()
    impossible_flags['Zero BHK']        = int(zero_bhk)
    impossible_flags['BHK > 15']        = int(huge_bhk)
    impossible_flags['Negative BHK']    = int(neg_bhk)
    print(f"  Zero BHK               : {zero_bhk:,}")
    print(f"  Impossible BHK (>15)   : {huge_bhk:,}")
    print(f"  BHK value counts:")
    print(df[BHK_COL].value_counts().head(15).to_string())

# City extraction from Location
if LOC_COL:
    known_cities = ['chennai', 'mumbai', 'bengaluru', 'bangalore', 'delhi', 
                    'pune', 'kolkata', 'hyderabad']
    loc_lower = df[LOC_COL].astype(str).str.lower()
    
    city_found = loc_lower.apply(
        lambda x: next((c for c in known_cities if c in x), 'unknown')
    )
    city_counts = city_found.value_counts()
    print(f"\n  City distribution extracted from '{LOC_COL}':")
    print(city_counts.to_string())
    
    unknown_city = (city_found == 'unknown').sum()
    impossible_flags['Unknown city in Location'] = int(unknown_city)

# ── STEP 11 – Numeric summary statistics ──────────────────────────────────────
print(f"\nSTEP 11 │ Numeric summary statistics")
num_df = df.select_dtypes(include=[np.number])
if num_df.empty:
    # Try coercing price & area
    for col, series_fn in [(PRICE_COL, lambda: to_float_series(df[PRICE_COL])),
                           (AREA_COL,  lambda: to_float_series(df[AREA_COL])),
                           (BATHS_COL, lambda: to_float_series(df[BATHS_COL]))]:
        if col:
            df[col + '_num'] = series_fn()

print(df.describe(include='all').T[['count','mean','std','min','50%','max']].to_string())

# ── STEP 12 – Visualisations ──────────────────────────────────────────────────
print(f"\nSTEP 12 │ Generating audit visualisations …")

def safe_num(col):
    if col and col in df.columns:
        return to_float_series(df[col]).dropna()
    return pd.Series(dtype=float)

price_vals = safe_num(PRICE_COL)
area_vals  = safe_num(AREA_COL)
baths_vals = safe_num(BATHS_COL)

fig = plt.figure(figsize=(18, 14))
fig.patch.set_facecolor('#0b0f19')
gs  = gridspec.GridSpec(3, 3, figure=fig, hspace=0.45, wspace=0.38)

TITLE_CLR  = '#e2e8f0'
ACCENT     = '#06b6d4'
ACCENT2    = '#8b5cf6'
ACCENT3    = '#10b981'
ACCENT4    = '#f59e0b'
BG_AX      = '#111827'

def styled_ax(ax, title=''):
    ax.set_facecolor(BG_AX)
    for spine in ax.spines.values():
        spine.set_edgecolor('#374151')
    ax.tick_params(colors=TITLE_CLR, labelsize=8)
    ax.xaxis.label.set_color(TITLE_CLR)
    ax.yaxis.label.set_color(TITLE_CLR)
    if title:
        ax.set_title(title, color=TITLE_CLR, fontsize=10, fontweight='bold', pad=8)
    return ax

# 1. Price distribution
ax1 = fig.add_subplot(gs[0, 0])
if not price_vals.empty:
    clipped = price_vals.clip(lower=price_vals.quantile(0.01), upper=price_vals.quantile(0.99))
    ax1.hist(clipped, bins=60, color=ACCENT, alpha=0.85, edgecolor='none')
    ax1.set_xlabel('Price (raw numeric)')
styled_ax(ax1, 'Price Distribution')

# 2. Log price distribution
ax2 = fig.add_subplot(gs[0, 1])
if not price_vals.empty:
    log_p = np.log1p(price_vals[price_vals > 0])
    ax2.hist(log_p, bins=60, color=ACCENT2, alpha=0.85, edgecolor='none')
    ax2.set_xlabel('log(1 + Price)')
styled_ax(ax2, 'Log-Price Distribution')

# 3. Area distribution
ax3 = fig.add_subplot(gs[0, 2])
if not area_vals.empty:
    clipped_a = area_vals.clip(upper=area_vals.quantile(0.99))
    ax3.hist(clipped_a[clipped_a > 0], bins=60, color=ACCENT3, alpha=0.85, edgecolor='none')
    ax3.set_xlabel('Total Area (raw numeric)')
styled_ax(ax3, 'Area Distribution')

# 4. Baths value counts
ax4 = fig.add_subplot(gs[1, 0])
if not baths_vals.empty:
    vc = baths_vals.value_counts().sort_index().head(15)
    ax4.bar(vc.index.astype(str), vc.values, color=ACCENT4, alpha=0.85)
    ax4.set_xlabel('Baths')
styled_ax(ax4, 'Bathroom Counts')

# 5. Missing-value heatmap bar
ax5 = fig.add_subplot(gs[1, 1])
if not miss_df.empty:
    colors = ['#ef4444' if p > 30 else '#f59e0b' if p > 10 else ACCENT for p in miss_df['Missing_Pct']]
    ax5.barh(miss_df.index, miss_df['Missing_Pct'], color=colors, alpha=0.9)
    ax5.set_xlabel('Missing %')
    ax5.axvline(30, color='#ef4444', linestyle='--', lw=0.8, alpha=0.7)
    ax5.axvline(10, color=ACCENT4, linestyle='--', lw=0.8, alpha=0.7)
else:
    ax5.text(0.5, 0.5, 'No Missing Values', ha='center', va='center',
             color=ACCENT3, fontsize=12, transform=ax5.transAxes)
styled_ax(ax5, 'Missing Value Severity by Column')

# 6. City distribution pie
ax6 = fig.add_subplot(gs[1, 2])
if LOC_COL:
    city_counts_plot = city_counts[city_counts.index != 'unknown'].head(8)
    if not city_counts_plot.empty:
        palette = [ACCENT, ACCENT2, ACCENT3, ACCENT4, '#f43f5e', '#3b82f6', '#a78bfa', '#34d399']
        wedges, texts, autotexts = ax6.pie(
            city_counts_plot.values,
            labels=city_counts_plot.index,
            autopct='%1.0f%%',
            colors=palette[:len(city_counts_plot)],
            startangle=90,
            textprops={'color': TITLE_CLR, 'fontsize': 8}
        )
        for at in autotexts:
            at.set_color('#0b0f19')
            at.set_fontweight('bold')
styled_ax(ax6, 'Listings by City')

# 7. Price vs Area scatter
ax7 = fig.add_subplot(gs[2, 0:2])
if not price_vals.empty and not area_vals.empty:
    common_idx = price_vals.index.intersection(area_vals.index)
    p_plot = price_vals.loc[common_idx]
    a_plot = area_vals.loc[common_idx]
    # Filter to 1st–99th percentile for visual clarity
    p_lo, p_hi = p_plot.quantile(0.01), p_plot.quantile(0.99)
    a_lo, a_hi = a_plot.quantile(0.01), a_plot.quantile(0.99)
    mask = (p_plot.between(p_lo, p_hi)) & (a_plot.between(a_lo, a_hi))
    ax7.scatter(a_plot[mask], p_plot[mask], alpha=0.25, s=5, color=ACCENT, rasterized=True)
    ax7.set_xlabel('Area (sqft, numeric)')
    ax7.set_ylabel('Price (numeric)')
styled_ax(ax7, 'Price vs Area (1st–99th percentile)')

# 8. Impossible values bar chart
ax8 = fig.add_subplot(gs[2, 2])
impos_items = {k: v for k, v in impossible_flags.items() if v > 0}
if impos_items:
    ax8.barh(list(impos_items.keys()), list(impos_items.values()), color='#ef4444', alpha=0.85)
    ax8.set_xlabel('Count')
else:
    ax8.text(0.5, 0.5, 'No Impossible Values\nDetected', ha='center', va='center',
             color=ACCENT3, fontsize=11, transform=ax8.transAxes)
styled_ax(ax8, 'Impossible / Anomalous Values')

fig.suptitle('AST-XGB │ Phase 1 Dataset Audit — Housing Real Estate: 7 Indian Cities',
             color=TITLE_CLR, fontsize=14, fontweight='bold', y=0.98)

fig_path = FIG_DIR / "phase1_audit_dashboard.png"
plt.savefig(fig_path, dpi=140, bbox_inches='tight', facecolor=fig.get_facecolor())
plt.close()
print(f"  Saved audit dashboard → {fig_path}")

# ── STEP 13 – Compile Markdown Audit Report ───────────────────────────────────
print(f"\nSTEP 13 │ Writing Phase 1 audit report …")

# ── Pre-build all table string fragments (no expressions inside f-string) ────
NL = "\n"

_dtype_rows = NL.join(f"| `{c}` | `{str(df[c].dtype)}` |" for c in COLS)

_city_rows = NL.join(
    f"| {city.title()} | {count:,} |" for city, count in city_counts.items()
) if LOC_COL else "| N/A | — |"

_price_unit_rows = NL.join(
    f"| {k} | {v:,} |" for k, v in price_units.items()
) if PRICE_COL else "| N/A | — |"

_source_files_block = NL.join(
    f"- `{f.name}` ({f.stat().st_size/1024:.1f} KB)" for f in csv_files
)

_dup_warning = (
    f"**{n_subset_dups:,} near-duplicate listings** detected. These must be "
    f"deduplicated before model training to prevent data leakage."
    if n_subset_dups > 0
    else "No near-duplicate listings detected."
)

_p2_dedup_row = f"| 🔴 P0 | **Deduplicate** — remove {n_subset_dups:,} near-duplicate listings | All columns |"

_action_items_rows = NL.join([
    f"| 🔴 P0 | **Unit harmonisation** — parse Lakh/Crore/plain numeric → INR base | `{PRICE_COL}`, `{PPSF_COL}` |",
    f"| 🔴 P0 | **Area unit standardisation** — enforce uniform SQFT | `{AREA_COL}` |",
    _p2_dedup_row,
    f"| 🟡 P1 | **City extraction** — parse city name from free-text location string | `{LOC_COL}` |",
    f"| 🟡 P1 | **Locality normalisation** — cluster sub-locality spelling variants | `{LOC_COL}` |",
    f"| 🟡 P1 | **BHK extraction** — extract integer BHK from name/title if missing | `{NAME_COL}`, `{TITLE_COL}` |",
    f"| 🟡 P1 | **Missingness investigation** — audit missing patterns before imputation strategy | See Section 4 |",
    f"| 🟢 P2 | **Textual feature preparation** — tokenise Description for NLP embeddings | `{DESC_COL}` |",
    f"| 🟢 P2 | **Spatial geocoding** — geocode locality strings → lat/lon for spatial engine | `{LOC_COL}` |",
])

_num_summary = df.describe(include='all').T[['count','mean','std','min','50%','max']].to_string()

def fmt_flag(v): return f"⚠️ **{v:,}**" if v > 0 else f"✅ 0"

miss_table_rows = ""
if not miss_df.empty:
    for col, row in miss_df.iterrows():
        sev = "🔴 Critical" if row['Missing_Pct'] > 30 else "🟡 Moderate" if row['Missing_Pct'] > 10 else "🟢 Low"
        miss_table_rows += f"| `{col}` | {int(row['Missing_Count']):,} | {row['Missing_Pct']:.2f}% | {sev} |\n"
else:
    miss_table_rows = "| — | 0 | 0.00% | ✅ None |\n"

impos_table_rows = "\n".join(
    f"| {k} | {fmt_flag(v)} |" for k, v in impossible_flags.items()
)

cat_table_rows = "\n".join(
    f"| `{c}` | {u:,} |" for c, u in cat_cardinality.items()
)

source_files_list = "\n".join(f"- `{f.name}` ({f.stat().st_size/1024:.1f} KB)" for f in csv_files)

report_md = f"""# Phase 1 — Primary Dataset Audit Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Dataset:** Housing Real Estate Data from 7 Indian Cities (Kaggle: rakkesharv)

---

## 1. Dataset Acquisition

| Item | Detail |
|---|---|
| Source | [Kaggle – rakkesharv/real-estate-data-from-7-indian-cities](https://www.kaggle.com/datasets/rakkesharv/real-estate-data-from-7-indian-cities) |
| Download Method | `kagglehub.dataset_download()` |
| Saved To | `data/raw/primary_property.csv` |
| License | CC0: Public Domain |

**Source files loaded:**
{_source_files_block}

---

## 2. Dataset Dimensions

| Metric | Value |
|---|---|
| **Total Rows** | {df.shape[0]:,} |
| **Total Columns** | {df.shape[1]:,} |

### Column Names & Data Types

| Column | dtype |
|---|---|
{_dtype_rows}

---

## 3. Target Variable Identification

| Role | Column | Notes |
|---|---|---|
| **Primary Target** | `{PRICE_COL}` | Property sale price — raw string with Lakh/Crore mixed units |
| **Derived Target** | `{PPSF_COL}` | Price per sqft — secondary regression target |
| Area | `{AREA_COL}` | Total built-up area in sqft (mixed units) |
| Bathrooms | `{BATHS_COL}` | Physical structural attribute |
| BHK / Bedrooms | `{BHK_COL}` | Apartment/unit size classification |
| Location | `{LOC_COL}` | City + locality string — requires parsing |
| Property Name | `{NAME_COL}` | Listing name — textual |
| Property Title | `{TITLE_COL}` | Ad title — textual |
| Description | `{DESC_COL}` | Free-text paragraph — NLP candidate |
| Balcony | `{BALCONY_COL}` | Binary structural flag |

### Feature Category Map

| Category | Columns |
|---|---|
| **Price / Target** | `{PRICE_COL}`, `{PPSF_COL}` |
| **Area / Size** | `{AREA_COL}` |
| **Structural** | `{BATHS_COL}`, `{BALCONY_COL}`, `{BHK_COL}` |
| **Spatial / Location** | `{LOC_COL}` |
| **Textual / NLP** | `{NAME_COL}`, `{TITLE_COL}`, `{DESC_COL}` |

---

## 4. Missing Value Analysis

> [!NOTE]
> Missing values are documented below — **no imputation performed at this stage**.

| Column | Missing Count | Missing % | Severity |
|---|---|---|---|
{miss_table_rows}

---

## 5. Duplicate Detection

| Check | Count |
|---|---|
| Full row exact duplicates | **{n_full_dups:,}** |
| Near-duplicates (Name + Location + Price + Area) | **{n_subset_dups:,}** |

> [!WARNING]
> {_dup_warning}

---

## 6. Categorical Column Cardinality

| Column | Unique Values |
|---|---|
{cat_table_rows}

---

## 7. Inconsistent Units in Price & Area

### Price Column (`{PRICE_COL}`)

Raw price values contain mixed formats requiring harmonisation before any numeric analysis:

| Format Pattern | Count |
|---|---|
{_price_unit_rows}

> [!CAUTION]
> **Action Required:** The `{PRICE_COL}` column contains mixed Lakh/Crore string suffixes alongside plain numerics. A unit-normalisation pipeline converting all prices to a single base unit (e.g. Indian Rupees) must be implemented in Phase 2 before any exploratory analysis or modelling.

### Area Column (`{AREA_COL}`)

| Format Pattern | Count |
|---|---|
| SQFT pattern | {sq_mask.sum():,} |
| SQM pattern | {sq_m_mask.sum():,} |
| Yard pattern | {yard_mask.sum():,} |

---

## 8. Impossible & Anomalous Value Detection

| Anomaly | Count |
|---|---|
{impos_table_rows}

> [!WARNING]
> All flagged anomalies must be **investigated and manually reviewed** before imputation or model training. Do NOT blindly remove or fill these records.

---

## 9. City Distribution (extracted from `{LOC_COL}`)

| City | Listings |
|---|---|
{_city_rows}

---

## 10. Numeric Summary Statistics

```
{_num_summary}
```

---

## 11. Audit Visualisation Dashboard

![Phase 1 Audit Dashboard]({fig_path})

---

## 12. Priority Action Items for Phase 2

| Priority | Action Required | Impacted Column(s) |
|---|---|---|
{_action_items_rows}

---

## 13. Files Saved

| File | Description |
|---|---|
| [`data/raw/primary_property.csv`](../data/raw/primary_property.csv) | Combined raw dataset (unmodified) |
| [`reports/figures/phase1_audit_dashboard.png`](figures/phase1_audit_dashboard.png) | 8-panel visual audit dashboard |
| [`reports/phase_1_primary_dataset_audit.md`](phase_1_primary_dataset_audit.md) | This audit report |

---

*Phase 1 audit complete. Proceed to Phase 2: Data Cleaning & Unit Harmonisation.*
"""

report_path = REPORT_DIR / "phase_1_primary_dataset_audit.md"
report_path.write_text(report_md, encoding='utf-8')
print(f"  Saved → {report_path}")

print("\n" + "=" * 72)
print("PHASE 1 AUDIT COMPLETE")
print(f"  Rows : {df.shape[0]:,}")
print(f"  Cols : {df.shape[1]:,}")
print(f"  Primary CSV  : {PRIMARY_CSV}")
print(f"  Audit report : {report_path}")
print(f"  Dashboard    : {fig_path}")
print("=" * 72)
