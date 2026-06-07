import requests
import pandas as pd
import numpy as np
import io
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data.csv')

def fetch_and_merge():
    # 1. Load existing data and drop synthetic rows
    df_existing = pd.read_csv(DATA_PATH)
    initial_len = len(df_existing)
    df_real = df_existing[~df_existing['company'].str.contains('_synth_', na=False)].copy()
    print(f"Dropped {initial_len - len(df_real)} synthetic rows. Real base rows: {len(df_real)}")
    
    # 2. Download Kaggle/GitHub dataset
    url = "https://raw.githubusercontent.com/saqibsafdar11/Predicting-Listing-Gains-in-the-Indian-IPO-Market/main/Indian_IPO_Market_Data.csv"
    print("Downloading external dataset...")
    resp = requests.get(url)
    if resp.status_code != 200:
        print("Failed to download data.")
        return
        
    df_ext = pd.read_csv(io.StringIO(resp.text))
    print(f"Downloaded {len(df_ext)} new rows.")
    
    # Clean the external dataset
    # Some rows might have zero/missing Issue_Price or Subscription
    df_ext = df_ext.dropna(subset=['IPOName', 'Listing_Gains_Percent', 'Issue_Price'])
    df_ext = df_ext[df_ext['Issue_Price'] > 0]
    
    # 3. Map to our schema
    new_rows = []
    for _, row in df_ext.iterrows():
        try:
            gmp = (row['Listing_Gains_Percent'] / 100.0) * row['Issue_Price']
            new_row = {
                'company': str(row['IPOName']).strip(),
                'gmp': round(gmp, 2),
                'retail_sub': float(row['Subscription_RII']) if pd.notna(row['Subscription_RII']) else 1.0,
                'qib_sub': float(row['Subscription_QIB']) if pd.notna(row['Subscription_QIB']) else 1.0,
                'nii_sub': float(row['Subscription_HNI']) if pd.notna(row['Subscription_HNI']) else 1.0,
                'issue_size': float(row['Issue_Size']) if pd.notna(row['Issue_Size']) else 500.0,
                'sector': "Miscellaneous",
                'market_trend': 1.0,  # Neutral market trend for older data
                'listing_return': float(row['Listing_Gains_Percent'])
            }
            new_rows.append(new_row)
        except Exception as e:
            pass # skip malformed rows
            
    df_new = pd.DataFrame(new_rows)
    print(f"Successfully processed {len(df_new)} external rows.")
    
    # Avoid duplicates if some companies already exist
    existing_companies = set(df_real['company'].str.lower())
    df_new = df_new[~df_new['company'].str.lower().isin(existing_companies)]
    
    print(f"After deduplication, adding {len(df_new)} new rows.")
    
    # 4. Merge and save
    df_final = pd.concat([df_real, df_new], ignore_index=True)
    df_final.to_csv(DATA_PATH, index=False)
    print(f"Done! Final dataset saved to {DATA_PATH} with {len(df_final)} rows.")

if __name__ == '__main__':
    fetch_and_merge()
