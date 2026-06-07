import pandas as pd
import numpy as np
import os
import random

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data.csv')

def augment_data():
    df = pd.read_csv(DATA_PATH)
    current_len = len(df)
    target_len = 500
    
    if current_len >= target_len:
        print(f"Dataset already has {current_len} rows. No augmentation needed.")
        return

    needed = target_len - current_len
    print(f"Augmenting dataset from {current_len} to {target_len} rows (adding {needed} rows)...")
    
    synthetic_rows = []
    for i in range(needed):
        # Randomly sample an existing row to base our synthetic row on
        base_idx = random.randint(0, current_len - 1)
        base_row = df.iloc[base_idx].copy()
        
        # Modify the company name
        base_row['company'] = f"{base_row['company']}_synth_{i+1}"
        
        # Add slight noise to numeric columns
        for col in ['gmp', 'retail_sub', 'qib_sub', 'nii_sub', 'issue_size', 'market_trend', 'listing_return']:
            val = base_row[col]
            if pd.notna(val):
                # Add random noise between -5% and +5% of the original value
                noise_factor = random.uniform(0.95, 1.05)
                new_val = val * noise_factor
                
                # Round to appropriate decimals depending on the column
                if col in ['retail_sub', 'qib_sub', 'nii_sub', 'market_trend', 'listing_return']:
                    base_row[col] = round(new_val, 2)
                else:
                    base_row[col] = int(round(new_val))
                    
        synthetic_rows.append(base_row)
        
    df_synth = pd.DataFrame(synthetic_rows)
    df_combined = pd.concat([df, df_synth], ignore_index=True)
    
    df_combined.to_csv(DATA_PATH, index=False)
    print(f"Successfully generated {needed} synthetic rows.")
    print(f"New dataset size: {len(df_combined)} rows.")

if __name__ == '__main__':
    augment_data()
