import pandas as pd
import numpy as np

df = pd.read_csv('data/features/final_features_v4.csv')
df['ppsf'] = df['price_inr'] / df['builtup_area_sqft']

top_locs = df.groupby(['city', 'locality']).filter(lambda x: len(x) >= 15)
print("Localities with >= 15 listings:", top_locs[['city', 'locality']].drop_duplicates().shape[0])

sample_loc = df[(df['city'] == 'Bengaluru') & (df['locality'] == 'Whitefield')]
print("\nWhitefield Sample Stats (N =", len(sample_loc), "):")
print("Price INR - Mean:", sample_loc['price_inr'].mean(), "Median:", sample_loc['price_inr'].median())
print("PPSF - Mean:", sample_loc['ppsf'].mean(), "Median:", sample_loc['ppsf'].median())
print("BHK counts:\n", sample_loc['bhk'].value_counts())
print("Property types:\n", sample_loc['property_type'].value_counts())
if 'metro_stations_distance_km' in sample_loc:
    print("Avg Metro Distance (km):", sample_loc['metro_stations_distance_km'].mean())
if 'accessibility_score' in sample_loc:
    print("Avg Accessibility Score:", sample_loc['accessibility_score'].mean())
if 'rera_registered' in sample_loc:
    print("RERA Registered %:", (sample_loc['rera_registered'] == 1).mean() * 100)
