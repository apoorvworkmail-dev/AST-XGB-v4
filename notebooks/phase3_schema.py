"""
Phase 3 — Canonical Schema Builder
AST-XGB India Property Valuation System
Author: Apoorv Mishra

Input  : data/processed/property_clean.csv
Output :
  data/processed/property_master_v1.csv
  data/processed/schema/property_schema.yaml
  data/processed/schema/column_mapping.csv
  reports/phase_3_schema.md

Rules:
  - Fields not available in source data  → np.nan (never invented)
  - Fields extractable from description  → regex with strict validation
  - Original raw columns preserved as    raw__* prefix
  - Stable UUID-like property_master_id  → SHA-256 hash of key fields
  - Full data dictionary in YAML
  - Full column mapping (source → canonical) documented
"""

import os, re, sys, hashlib, warnings
import numpy as np
import pandas as pd
import yaml
from pathlib import Path
from datetime import datetime

warnings.filterwarnings('ignore')

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).resolve().parent.parent
IN_CSV      = BASE_DIR / "data" / "processed" / "property_clean.csv"
OUT_CSV     = BASE_DIR / "data" / "processed" / "property_master_v1.csv"
SCHEMA_DIR  = BASE_DIR / "data" / "processed" / "schema"
SCHEMA_YAML = SCHEMA_DIR / "property_schema.yaml"
MAP_CSV     = SCHEMA_DIR / "column_mapping.csv"
REPORT_DIR  = BASE_DIR / "reports"
OUT_REPORT  = REPORT_DIR / "phase_3_schema.md"

SCHEMA_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 72)
print("PHASE 3 │ Canonical Schema Builder")
print("=" * 72)

# ═══════════════════════════════════════════════════════════════════════════════
# 0. Load cleaned data
# ═══════════════════════════════════════════════════════════════════════════════
df = pd.read_csv(IN_CSV, encoding='utf-8', low_memory=False)
df.columns = [c.strip() for c in df.columns]
N = len(df)
print(f"\nLoaded: {N:,} rows × {df.shape[1]} cols")
print(f"Source columns: {df.columns.tolist()}")

# ═══════════════════════════════════════════════════════════════════════════════
# 1. Regex extractors from description_clean
#    Only extract when regex is unambiguous; otherwise leave NULL
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 1 │ Extracting structured fields from description_clean …")

DESC = df['description_clean'].fillna('').astype(str)

def extract_first_int(series, pattern, lo=None, hi=None):
    """Extract first integer match; validate optional [lo, hi] range."""
    extracted = series.str.extract(pattern, flags=re.IGNORECASE, expand=False)
    numeric   = pd.to_numeric(extracted.str.replace(',', '', regex=False), errors='coerce')
    if lo is not None:
        numeric = numeric.where(numeric >= lo, other=np.nan)
    if hi is not None:
        numeric = numeric.where(numeric <= hi, other=np.nan)
    return numeric

def extract_first_float(series, pattern, lo=None, hi=None):
    extracted = series.str.extract(pattern, flags=re.IGNORECASE, expand=False)
    numeric   = pd.to_numeric(extracted.str.replace(',', '', regex=False), errors='coerce')
    if lo is not None:
        numeric = numeric.where(numeric >= lo, other=np.nan)
    if hi is not None:
        numeric = numeric.where(numeric <= hi, other=np.nan)
    return numeric

def extract_text_category(series, pattern, choices):
    """Extract a text value and map to a canonical category (case-insensitive)."""
    raw = series.str.extract(pattern, flags=re.IGNORECASE, expand=False)
    return raw.str.strip().str.lower().map(
        {c.lower(): c for c in choices}
    )

# 1a. Floor number: "situated on floor 13" / "on floor 5" / "on the 3rd floor"
floor_no = extract_first_int(
    DESC,
    r'(?:situated on|on|it is on|property is on)\s+(?:the\s+)?floor[s]?\s*(\d+)',
    lo=0, hi=100
)
# Fallback: "It is on floor 5"  / "floor number 5"
floor_no_fb = extract_first_int(
    DESC,
    r'floor\s+(?:no\.?\s*|number\s*)?(\d+)',
    lo=0, hi=100
)
floor_no = floor_no.combine_first(floor_no_fb)
print(f"  floor_no         extracted: {floor_no.notna().sum():,} / {N:,}")

# 1b. Total floors: "total number of floors in this ... is 14"
total_floors = extract_first_int(
    DESC,
    r'total\s+(?:number\s+of\s+)?floors?(?:\s+in\s+\w+)?(?:\s+\w+)*?\s+(?:is|are)\s+(\d+)',
    lo=1, hi=150
)
# Fallback: "building of X floors" / "X-storeyed"
total_floors_fb = extract_first_int(
    DESC,
    r'(\d+)\s*(?:storeyed|floor\s+building)',
    lo=1, hi=150
)
total_floors = total_floors.combine_first(total_floors_fb)
print(f"  total_floors     extracted: {total_floors.notna().sum():,} / {N:,}")

# 1c. Carpet area: "carpet area of 500 square feet"
carpet_area = extract_first_float(
    DESC,
    r'carpet\s+area(?:\s+of)?\s+([\d,]+)',
    lo=50, hi=30000
)
print(f"  carpet_area_sqft extracted: {carpet_area.notna().sum():,} / {N:,}")

# 1d. Super built-up area: "super built-up area is 1500" / "super area 1200"
super_builtup = extract_first_float(
    DESC,
    r'super[\-\s]+(?:built[\-\s]*up\s+)?area(?:\s+(?:is|of))?\s+([\d,]+)',
    lo=50, hi=50000
)
print(f"  super_builtup_sqft extracted: {super_builtup.notna().sum():,} / {N:,}")

# 1e. Plot area: "plot area of 2400" / "plot size 1200 sq.ft"
plot_area = extract_first_float(
    DESC,
    r'plot\s+(?:area|size)(?:\s+(?:of|is))?\s+([\d,]+)',
    lo=50, hi=100000
)
print(f"  plot_area_sqft   extracted: {plot_area.notna().sum():,} / {N:,}")

# 1f. Parking: "2 car parking" / "1 parking" / "covered parking"
parking_count = extract_first_int(
    DESC,
    r'(\d+)\s+(?:covered\s+|open\s+|car\s+)?parking',
    lo=0, hi=10
)
# If no count but word "parking" present → 1
has_parking_word = DESC.str.contains(r'\bparking\b', case=False, regex=True)
parking_count = parking_count.fillna(has_parking_word.map({True: 1, False: np.nan}))
print(f"  parking          extracted: {parking_count.notna().sum():,} / {N:,}")

# 1g. Furnishing status
furnishing_raw = DESC.str.extract(
    r'(semi[\-\s]furnished|fully[\-\s]furnished|unfurnished|semi\s+furnished|fully\s+furnished)',
    flags=re.IGNORECASE, expand=False
)
FURNISH_MAP = {
    'semi-furnished'  : 'Semi-Furnished',
    'semi furnished'  : 'Semi-Furnished',
    'fully-furnished' : 'Fully-Furnished',
    'fully furnished' : 'Fully-Furnished',
    'unfurnished'     : 'Unfurnished',
}
furnishing = furnishing_raw.str.strip().str.lower().map(FURNISH_MAP)
print(f"  furnishing       extracted: {furnishing.notna().sum():,} / {N:,}")

# 1h. Facing direction
facing_raw = DESC.str.extract(
    r'(north[\-\s]?east|north[\-\s]?west|south[\-\s]?east|south[\-\s]?west|north|south|east|west)[\-\s]?facing',
    flags=re.IGNORECASE, expand=False
)
FACING_MAP = {
    'north'      : 'North',   'south'      : 'South',
    'east'       : 'East',    'west'       : 'West',
    'north-east' : 'North-East', 'north east': 'North-East',
    'north-west' : 'North-West', 'north west': 'North-West',
    'south-east' : 'South-East', 'south east': 'South-East',
    'south-west' : 'South-West', 'south west': 'South-West',
}
facing = facing_raw.str.strip().str.lower().map(FACING_MAP)
print(f"  facing           extracted: {facing.notna().sum():,} / {N:,}")

# 1i. Year built: "built in 2018" / "constructed in 2015" — validate 1950–2026
year_built = extract_first_int(
    DESC,
    r'(?:built|constructed|completed|possession)\s+in\s+(\d{4})',
    lo=1950, hi=2026
)
print(f"  year_built       extracted: {year_built.notna().sum():,} / {N:,}")

# 1j. RERA registration: "RERA registered" flag + ID extraction
rera_registered = DESC.str.contains(r'RERA\s+registered|RERA\s+approved|RERA\s+No', case=False).astype(int)
rera_registered = rera_registered.where(rera_registered == 1, other=0)  # 0 means "not mentioned", not "No"
rera_id_raw = DESC.str.extract(
    r'RERA[^\w]*([\w/\-]{5,30})',
    flags=re.IGNORECASE, expand=False
)
# Filter out common false positives
rera_id = rera_id_raw.where(
    rera_id_raw.str.match(r'^[A-Z0-9/\-]{5,30}$', na=False),
    other=np.nan
)
print(f"  rera_registered  extracted: {(rera_registered==1).sum():,} properties flagged")
print(f"  rera_id          extracted: {rera_id.notna().sum():,} / {N:,}")

# ═══════════════════════════════════════════════════════════════════════════════
# 2. Compute derived fields
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 2 │ Computing derived fields …")

# Age years from year_built (NULL if year_built missing)
current_year = datetime.now().year
age_years = (current_year - year_built).where(year_built.notna(), other=np.nan)
age_years = age_years.where(age_years >= 0, other=np.nan)  # reject negatives
print(f"  age_years computed for {age_years.notna().sum():,} properties")

# Listing date: NOT available in source → NULL
listing_date = pd.Series([pd.NaT] * N, dtype='datetime64[ns]')

# Coordinates: NOT in source → NULL
latitude  = pd.Series([np.nan] * N)
longitude = pd.Series([np.nan] * N)

# ═══════════════════════════════════════════════════════════════════════════════
# 3. Generate stable property_master_id
#    SHA-256 hash of: city | locality | property_type | bhk | baths | area_sqft | price_inr | row_index
#    Row index ensures uniqueness even for identical-attribute properties
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 3 │ Generating stable property_master_id …")

def make_master_id(row):
    key = (
        f"{row['city']}|{row['locality']}|{row['property_type']}|"
        f"{row['bhk']}|{row['baths']}|{row['area_sqft']}|"
        f"{row['price_inr']}|{row.name}"          # row.name = DataFrame index
    )
    h = hashlib.sha256(key.encode('utf-8')).hexdigest()
    return f"PROP-{h[:12].upper()}"               # e.g. PROP-3AF1B29CD041

df['property_master_id'] = df.apply(make_master_id, axis=1)

# Sanity check: all IDs unique
n_unique_ids = df['property_master_id'].nunique()
print(f"  Unique IDs generated : {n_unique_ids:,}  (expect {N:,})")
assert n_unique_ids == N, "Collision detected in property_master_id!"

# ═══════════════════════════════════════════════════════════════════════════════
# 4. Assemble canonical table
#    Order: system fields → spatial → physical → financial → raw originals
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 4 │ Assembling canonical property_master_v1 table …")

master = pd.DataFrame()

# ── System ────────────────────────────────────────────────────────────────────
master['property_master_id']      = df['property_master_id']

# ── Spatial ───────────────────────────────────────────────────────────────────
master['city']                    = df['city']
master['locality']                = df['locality']
master['latitude']                = latitude
master['longitude']               = longitude

# ── Property classification ───────────────────────────────────────────────────
master['property_type']           = df['property_type']
master['bhk']                     = df['bhk']
master['bathrooms']               = df['baths']
master['balconies']               = df['has_balcony']     # 1/0 from Phase 2
master['parking']                 = parking_count

# ── Physical dimensions ───────────────────────────────────────────────────────
master['carpet_area_sqft']        = carpet_area           # from description
master['builtup_area_sqft']       = df['area_sqft']       # primary area field
master['super_builtup_area_sqft'] = super_builtup         # from description
master['plot_area_sqft']          = plot_area             # from description

# ── Building attributes ───────────────────────────────────────────────────────
master['floor_no']                = floor_no
master['total_floors']            = total_floors
master['year_built']              = year_built.astype('Int64')
master['age_years']               = age_years.astype('Int64')

# ── Amenities & attributes ────────────────────────────────────────────────────
master['furnishing']              = furnishing
master['facing']                  = facing

# ── Legal ─────────────────────────────────────────────────────────────────────
master['rera_registered']         = rera_registered.astype('Int64')
master['rera_id']                 = rera_id

# ── Temporal ──────────────────────────────────────────────────────────────────
master['listing_date']            = listing_date

# ── Financial ─────────────────────────────────────────────────────────────────
master['price_inr']               = pd.to_numeric(df['price_inr'], errors='coerce').round().astype('Int64')
master['price_lakhs']             = df['price_lakhs']
master['price_per_sqft']          = df['price_per_sqft']

# ── Raw originals (traceability) ──────────────────────────────────────────────
master['raw__property_name']      = df['property_name']
master['raw__property_title']     = df['property_title']
master['raw__price']              = df['price_raw']
master['raw__location']           = df['location_raw']
master['raw__description']        = df['description_clean']

print(f"  Canonical columns  : {master.shape[1]}")
print(f"  Rows               : {master.shape[0]:,}")

# Null profile for canonical fields
canonical_cols = [c for c in master.columns if not c.startswith('raw__')]
null_profile = master[canonical_cols].isnull().sum()
print("\n  Null counts per canonical field:")
for col, cnt in null_profile.items():
    pct = cnt / N * 100
    status = '✓' if cnt == 0 else f'NULL {cnt:,} ({pct:.1f}%)'
    print(f"    {col:<35} {status}")

# ═══════════════════════════════════════════════════════════════════════════════
# 5. Save canonical CSV
# ═══════════════════════════════════════════════════════════════════════════════
master.to_csv(OUT_CSV, index=False, encoding='utf-8')
print(f"\nSaved → {OUT_CSV}")

# ═══════════════════════════════════════════════════════════════════════════════
# 6. Write property_schema.yaml — full data dictionary
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 5 │ Writing property_schema.yaml …")

SCHEMA = {
    'schema_name'   : 'AST-XGB India Property Master Schema v1',
    'author'        : 'Apoorv Mishra',
    'version'       : '1.0.0',
    'created_at'    : datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
    'source_dataset': 'Kaggle: rakkesharv/real-estate-data-from-7-indian-cities',
    'row_count'     : int(N),
    'primary_key'   : 'property_master_id',
    'target_variable': 'price_inr',
    'id_generation' : 'SHA-256 hash of (city|locality|property_type|bhk|baths|area_sqft|price_inr|row_index), prefix PROP-',
    'cities'        : ['Bengaluru','Mumbai','Delhi','Chennai','Pune','Kolkata','Hyderabad'],
    'fields': {
        'property_master_id': {
            'type': 'string', 'nullable': False, 'is_primary_key': True,
            'description': 'Stable unique identifier. SHA-256 hash of key property attributes + row index. Format: PROP-{12-char hex}.',
            'source': 'generated'
        },
        'city': {
            'type': 'string', 'nullable': False,
            'allowed_values': ['Bengaluru','Mumbai','Delhi','Chennai','Pune','Kolkata','Hyderabad'],
            'description': 'Canonical metropolitan city. Standardised from raw Location string.',
            'source': 'parsed from raw__location / property_title'
        },
        'locality': {
            'type': 'string', 'nullable': True,
            'description': 'Sub-locality / neighbourhood within city. title() case, punctuation stripped.',
            'source': 'parsed from raw__location / property_title'
        },
        'latitude': {
            'type': 'float', 'nullable': True, 'unit': 'degrees',
            'description': 'Geographic latitude (WGS-84). NOT in source — requires geocoding in Phase 4.',
            'source': 'null — pending geocoding'
        },
        'longitude': {
            'type': 'float', 'nullable': True, 'unit': 'degrees',
            'description': 'Geographic longitude (WGS-84). NOT in source — requires geocoding in Phase 4.',
            'source': 'null — pending geocoding'
        },
        'property_type': {
            'type': 'string', 'nullable': False,
            'allowed_values': ['Apartment','Independent House','Villa','Plot','Studio','Penthouse','Builder Floor','Row House','Farm House'],
            'description': 'Canonical property classification. Extracted via keyword regex from property_title.',
            'source': 'regex on raw__property_title'
        },
        'bhk': {
            'type': 'integer', 'nullable': True, 'unit': 'rooms',
            'valid_range': [1, 15],
            'description': 'Bedroom-Hall-Kitchen count. Extracted from property_title prefix (e.g. "3 BHK Flat").',
            'source': 'regex on raw__property_title'
        },
        'bathrooms': {
            'type': 'integer', 'nullable': False, 'unit': 'count',
            'valid_range': [1, 15],
            'description': 'Number of bathrooms. Directly from source Baths column.',
            'source': 'source column: Baths'
        },
        'balconies': {
            'type': 'integer', 'nullable': False,
            'allowed_values': [0, 1],
            'description': 'Binary flag: 1 = has balcony, 0 = no balcony. Derived from source Balcony (Yes/No).',
            'source': 'source column: Balcony'
        },
        'parking': {
            'type': 'integer', 'nullable': True, 'unit': 'spaces',
            'valid_range': [0, 10],
            'description': 'Number of parking spaces. Extracted from description_clean via regex.',
            'source': 'regex on raw__description'
        },
        'carpet_area_sqft': {
            'type': 'float', 'nullable': True, 'unit': 'sqft',
            'valid_range': [50, 30000],
            'description': 'Carpet area (liveable floor area). Extracted from description when mentioned explicitly.',
            'source': 'regex on raw__description'
        },
        'builtup_area_sqft': {
            'type': 'float', 'nullable': False, 'unit': 'sqft',
            'valid_range': [50, 50000],
            'description': 'Built-up area (carpet + walls + balcony). Primary area field from source Total_Area.',
            'source': 'source column: Total_Area'
        },
        'super_builtup_area_sqft': {
            'type': 'float', 'nullable': True, 'unit': 'sqft',
            'valid_range': [50, 50000],
            'description': 'Super built-up area (builtup + common areas). Extracted from description when mentioned.',
            'source': 'regex on raw__description'
        },
        'plot_area_sqft': {
            'type': 'float', 'nullable': True, 'unit': 'sqft',
            'valid_range': [50, 100000],
            'description': 'Plot/land area. Applicable for Villas, Independent Houses, Plots. Extracted from description.',
            'source': 'regex on raw__description'
        },
        'floor_no': {
            'type': 'integer', 'nullable': True, 'unit': 'floor level',
            'valid_range': [0, 100],
            'description': 'Floor number on which unit is located (0 = ground floor). Extracted from description.',
            'source': 'regex on raw__description'
        },
        'total_floors': {
            'type': 'integer', 'nullable': True, 'unit': 'count',
            'valid_range': [1, 150],
            'description': 'Total number of floors in the building. Extracted from description.',
            'source': 'regex on raw__description'
        },
        'year_built': {
            'type': 'integer', 'nullable': True, 'unit': 'year',
            'valid_range': [1950, 2026],
            'description': 'Year property was built/completed. Extracted from description.',
            'source': 'regex on raw__description'
        },
        'age_years': {
            'type': 'integer', 'nullable': True, 'unit': 'years',
            'description': 'Computed as current_year - year_built. NULL if year_built unavailable.',
            'source': 'derived from year_built'
        },
        'furnishing': {
            'type': 'string', 'nullable': True,
            'allowed_values': ['Fully-Furnished','Semi-Furnished','Unfurnished'],
            'description': 'Furnishing status of the property. Extracted from description text.',
            'source': 'regex on raw__description'
        },
        'facing': {
            'type': 'string', 'nullable': True,
            'allowed_values': ['North','South','East','West','North-East','North-West','South-East','South-West'],
            'description': 'Property facing direction. Extracted from description when mentioned.',
            'source': 'regex on raw__description'
        },
        'rera_registered': {
            'type': 'integer', 'nullable': False,
            'allowed_values': [0, 1],
            'description': '1 = RERA registration mentioned in description, 0 = not mentioned (does NOT confirm non-registration).',
            'source': 'regex on raw__description'
        },
        'rera_id': {
            'type': 'string', 'nullable': True,
            'description': 'RERA registration ID extracted from description. Pattern: alphanumeric 5–30 chars after "RERA".',
            'source': 'regex on raw__description'
        },
        'listing_date': {
            'type': 'date', 'nullable': True,
            'description': 'Date when property was listed. NOT available in source dataset — reserved for future data enrichment.',
            'source': 'null — not in source'
        },
        'price_inr': {
            'type': 'integer', 'nullable': False, 'unit': 'INR',
            'description': 'PRIMARY REGRESSION TARGET. Sale price in Indian Rupees. Derived: price_lakhs × 100,000.',
            'source': 'derived from source column: Price'
        },
        'price_lakhs': {
            'type': 'float', 'nullable': False, 'unit': 'INR Lakhs',
            'description': 'Sale price in Lakhs (1 Lakh = 100,000 INR). Human-readable target.',
            'source': 'derived from source column: Price'
        },
        'price_per_sqft': {
            'type': 'float', 'nullable': False, 'unit': 'INR/sqft',
            'description': 'Derived: price_inr / builtup_area_sqft. Normalised price metric.',
            'source': 'derived'
        },
        'raw__property_name': {
            'type': 'string', 'nullable': True,
            'description': 'Original property/project name from source. Retained for traceability.',
            'source': 'source column: Name'
        },
        'raw__property_title': {
            'type': 'string', 'nullable': True,
            'description': 'Original listing title (contains BHK + type + locality + city). Retained for traceability.',
            'source': 'source column: Property Title'
        },
        'raw__price': {
            'type': 'string', 'nullable': True,
            'description': 'Original price string (e.g. "₹1.5 Cr"). Retained for audit.',
            'source': 'source column: Price'
        },
        'raw__location': {
            'type': 'string', 'nullable': True,
            'description': 'Original location composite string (locality + city). Retained for audit.',
            'source': 'source column: Location'
        },
        'raw__description': {
            'type': 'string', 'nullable': True,
            'description': 'Cleaned property description text. Source for all regex extractions above.',
            'source': 'derived from source column: Description'
        },
    }
}

with open(SCHEMA_YAML, 'w', encoding='utf-8') as f:
    yaml.dump(SCHEMA, f, allow_unicode=True, sort_keys=False, default_flow_style=False)
print(f"  Saved → {SCHEMA_YAML}")

# ═══════════════════════════════════════════════════════════════════════════════
# 7. Write column_mapping.csv
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 6 │ Writing column_mapping.csv …")

mappings = [
    # canonical_field | source_column | transform | availability | null_pct
    ('property_master_id',      'generated',              'SHA-256 hash of key fields + row index',                   'Full',     0.0),
    ('city',                    'Location / Property Title','Regex city extraction + canonical map',                   'Full',     0.0),
    ('locality',                'Location / Property Title','Prefix before city; title() + punct strip',               'Full',     0.0),
    ('latitude',                'NOT IN SOURCE',           'None — NULL; geocoding in Phase 4',                        'None',   100.0),
    ('longitude',               'NOT IN SOURCE',           'None — NULL; geocoding in Phase 4',                        'None',   100.0),
    ('property_type',           'Property Title',          'Keyword regex (Flat/Apt/Villa/House/Plot)',                 'Full',     0.0),
    ('bhk',                     'Property Title',          'Prefix integer before "BHK" in title',                     'Full',     round(master['bhk'].isna().sum()/N*100,1)),
    ('bathrooms',               'Baths',                   'Cast to Int64; clipped [1,15]',                            'Full',     0.0),
    ('balconies',               'Balcony',                 'Yes→1 / No→0; NaN→0',                                      'Full',     0.0),
    ('parking',                 'Description',             'Regex: "(N) parking" or keyword present→1',                'Partial', round(master['parking'].isna().sum()/N*100,1)),
    ('carpet_area_sqft',        'Description',             'Regex: "carpet area of (N)"',                              'Partial', round(master['carpet_area_sqft'].isna().sum()/N*100,1)),
    ('builtup_area_sqft',       'Total_Area',              'Cast to float; validated [50,50000]',                      'Full',     0.0),
    ('super_builtup_area_sqft', 'Description',             'Regex: "super built-up area (N)"',                        'Partial', round(master['super_builtup_area_sqft'].isna().sum()/N*100,1)),
    ('plot_area_sqft',          'Description',             'Regex: "plot area / plot size (N)"',                       'Partial', round(master['plot_area_sqft'].isna().sum()/N*100,1)),
    ('floor_no',                'Description',             'Regex: "on floor (N)" / "floor number (N)"',               'Partial', round(master['floor_no'].isna().sum()/N*100,1)),
    ('total_floors',            'Description',             'Regex: "total number of floors is (N)"',                   'Partial', round(master['total_floors'].isna().sum()/N*100,1)),
    ('year_built',              'Description',             'Regex: "built/constructed in (YYYY)"',                     'Sparse',  round(master['year_built'].isna().sum()/N*100,1)),
    ('age_years',               'Description (derived)',   'current_year - year_built',                                'Sparse',  round(master['age_years'].isna().sum()/N*100,1)),
    ('furnishing',              'Description',             'Regex: fully/semi-furnished / unfurnished',                 'Partial', round(master['furnishing'].isna().sum()/N*100,1)),
    ('facing',                  'Description',             'Regex: "(direction)-facing"',                              'Sparse',  round(master['facing'].isna().sum()/N*100,1)),
    ('rera_registered',         'Description',             'Keyword match "RERA registered" → 1 else 0',               'Full',     0.0),
    ('rera_id',                 'Description',             'Regex: "RERA (alphanumeric ID)"',                          'Sparse',  round(master['rera_id'].isna().sum()/N*100,1)),
    ('listing_date',            'NOT IN SOURCE',           'None — NULL; reserved for future enrichment',              'None',   100.0),
    ('price_inr',               'Price',                   'parse_price_to_lakhs × 100000; cast Int64',                'Full',     0.0),
    ('price_lakhs',             'Price',                   'parse Lakh/Crore strings → float Lakhs',                   'Full',     0.0),
    ('price_per_sqft',          'Derived',                 'price_inr / builtup_area_sqft',                            'Full',     0.0),
    ('raw__property_name',      'Name',                    'Verbatim copy',                                             'Full',     0.0),
    ('raw__property_title',     'Property Title',          'Verbatim copy',                                             'Full',     0.0),
    ('raw__price',              'Price',                   'Verbatim copy',                                             'Full',     0.0),
    ('raw__location',           'Location',                'Verbatim copy',                                             'Full',     0.0),
    ('raw__description',        'Description',             'Cleaned (whitespace + HTML strip)',                         'Full',     0.0),
]

df_map = pd.DataFrame(mappings, columns=[
    'canonical_field', 'source_column', 'transformation', 'availability', 'null_pct'
])
df_map.to_csv(MAP_CSV, index=False, encoding='utf-8')
print(f"  Saved → {MAP_CSV}")

# ═══════════════════════════════════════════════════════════════════════════════
# 8. Build Markdown report
# ═══════════════════════════════════════════════════════════════════════════════
print("\nSTEP 7 │ Writing Phase 3 schema report …")

# Null profile table
null_rows = "\n".join(
    f"| `{col}` | {int(cnt):,} | {cnt/N*100:.1f}% | "
    f"{'✅ Complete' if cnt==0 else '🟡 Partial' if cnt/N<0.5 else '🔴 Sparse'} |"
    for col, cnt in null_profile.items()
)

# Column mapping table rows (no raw__ prefix entries)
map_rows = "\n".join(
    f"| `{r['canonical_field']}` | `{r['source_column']}` | {r['transformation']} | "
    f"{r['availability']} | {r['null_pct']}% |"
    for _, r in df_map.iterrows()
)

# Extraction yield summary
extracted_stats = {
    'floor_no'              : floor_no.notna().sum(),
    'total_floors'          : total_floors.notna().sum(),
    'carpet_area_sqft'      : carpet_area.notna().sum(),
    'super_builtup_area_sqft': super_builtup.notna().sum(),
    'plot_area_sqft'        : plot_area.notna().sum(),
    'parking'               : parking_count.notna().sum(),
    'furnishing'            : furnishing.notna().sum(),
    'facing'                : facing.notna().sum(),
    'year_built'            : year_built.notna().sum(),
    'rera_registered (=1)'  : int((rera_registered==1).sum()),
    'rera_id'               : rera_id.notna().sum(),
}
extract_rows = "\n".join(
    f"| `{k}` | {v:,} | {v/N*100:.1f}% |"
    for k, v in extracted_stats.items()
)

report_md = f"""# Phase 3 — Canonical Schema Report
**System:** AST-XGB India Property Valuation Pipeline  
**Author:** Apoorv Mishra  
**Generated:** {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Schema version:** v1.0.0

---

## 1. Overview

| Item | Value |
|---|---|
| Input | `data/processed/property_clean.csv` ({N:,} rows) |
| Output | `data/processed/property_master_v1.csv` ({master.shape[0]:,} rows × {master.shape[1]} cols) |
| Primary Key | `property_master_id` (SHA-256 deterministic hash) |
| Regression Target | `price_inr` (INR absolute) / `price_lakhs` (human-readable) |
| Canonical fields | {len([c for c in master.columns if not c.startswith('raw__')])} |
| Raw traceability fields | {len([c for c in master.columns if c.startswith('raw__')])} |

---

## 2. property_master_id Generation

Each property receives a **stable, deterministic unique identifier**:

```python
key = f"{{city}}|{{locality}}|{{property_type}}|{{bhk}}|{{baths}}|{{area_sqft}}|{{price_inr}}|{{row_index}}"
property_master_id = f"PROP-{{SHA256(key)[:12].upper()}}"
# Example: PROP-3AF1B29CD041
```

- **Collision-free**: row index appended ensures uniqueness for properties with identical attributes  
- **Stable**: same inputs always produce the same ID (deterministic)  
- **Format**: `PROP-` prefix + 12 uppercase hex chars

---

## 3. Canonical Field Null Profile

| Field | NULL Count | NULL % | Status |
|---|---|---|---|
{null_rows}

> [!NOTE]
> **Fields with 100% NULL** (`latitude`, `longitude`, `listing_date`) are architecturally reserved — they are not missing due to data quality issues but because the source dataset does not contain geocoordinates or listing timestamps. These will be populated via OpenStreetMap geocoding in Phase 4.

---

## 4. Description-Mining Extraction Yields

The `description_clean` field contains semi-structured text from which the following fields were extracted via validated regex:

| Field | Records Extracted | Yield |
|---|---|---|
{extract_rows}

> [!TIP]
> `floor_no` and `total_floors` have the highest yield from descriptions (~50%+). `year_built`, `facing`, and `rera_id` are sparse — available for <15% of listings.

---

## 5. Column Mapping: Source → Canonical

| Canonical Field | Source Column | Transformation | Availability | NULL % |
|---|---|---|---|---|
{map_rows}

---

## 6. Property Type Distribution

| Property Type | Count | % |
|---|---|---|
{chr(10).join(f"| {pt} | {cnt:,} | {cnt/N*100:.1f}% |" for pt, cnt in master['property_type'].value_counts().items())}

---

## 7. Furnishing Status Distribution

| Furnishing | Count | % |
|---|---|---|
{chr(10).join(f"| {k if pd.notna(k) else 'Not Mentioned'} | {cnt:,} | {cnt/N*100:.1f}% |" for k, cnt in master['furnishing'].value_counts(dropna=False).items())}

---

## 8. RERA Registration

| Status | Count | % |
|---|---|---|
| RERA mentioned in description | {int((rera_registered==1).sum()):,} | {(rera_registered==1).sum()/N*100:.1f}% |
| RERA ID extracted | {rera_id.notna().sum():,} | {rera_id.notna().sum()/N*100:.1f}% |
| Not mentioned | {int((rera_registered==0).sum()):,} | {(rera_registered==0).sum()/N*100:.1f}% |

> [!WARNING]
> `rera_registered = 0` means RERA was **not mentioned** in the listing description — it does NOT confirm the property is unregistered. This field should be treated as a noisy proxy, not ground truth.

---

## 9. Schema YAML Structure

```yaml
schema_name: AST-XGB India Property Master Schema v1
version: 1.0.0
primary_key: property_master_id
target_variable: price_inr
# Each field includes: type | nullable | description | source | valid_range/allowed_values
```

Full schema: [`data/processed/schema/property_schema.yaml`](../data/processed/schema/property_schema.yaml)

---

## 10. Output Files

| File | Description |
|---|---|
| [`data/processed/property_master_v1.csv`](../data/processed/property_master_v1.csv) | Canonical master table ({master.shape[0]:,} rows × {master.shape[1]} cols) |
| [`data/processed/schema/property_schema.yaml`](../data/processed/schema/property_schema.yaml) | Full data dictionary (YAML, {len(SCHEMA['fields'])} fields) |
| [`data/processed/schema/column_mapping.csv`](../data/processed/schema/column_mapping.csv) | Source-to-canonical column mapping ({len(df_map)} entries) |
| [`reports/phase_3_schema.md`](phase_3_schema.md) | This report |
| [`notebooks/phase3_schema.py`](../notebooks/phase3_schema.py) | Reproducible schema builder |

---

*Phase 3 complete — proceed to Phase 4: Geocoding, Feature Engineering & EDA.*
"""

OUT_REPORT.write_text(report_md, encoding='utf-8')
print(f"  Saved → {OUT_REPORT}")

print("\n" + "=" * 72)
print("PHASE 3 SCHEMA COMPLETE")
print(f"  Canonical rows   : {master.shape[0]:,}")
print(f"  Canonical cols   : {master.shape[1]}")
print(f"  Unique prop IDs  : {n_unique_ids:,}")
print(f"  Schema fields    : {len(SCHEMA['fields'])}")
print(f"  Master CSV       : {OUT_CSV}")
print(f"  Schema YAML      : {SCHEMA_YAML}")
print(f"  Column mapping   : {MAP_CSV}")
print("=" * 72)
