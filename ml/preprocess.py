import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler

SECTOR_CATEGORIES = [
    'Fintech', 'Food Tech', 'E-commerce', 'Auto Tech', 'Food', 'Pharma',
    'Manufacturing', 'Chemicals', 'Infrastructure', 'IT', 'Finance',
    'Healthcare', 'Banking', 'Defence', 'Gaming', 'Agri', 'Metals',
    'Consumer', 'Consumer Durables', 'FMCG', 'Energy', 'Logistics',
    'Telecom', 'Insurance', 'Real Estate', 'REIT', 'Retail',
    'Travel Tech', 'Analytics', 'Building Materials', 'Staffing',
    'Internet', 'Gas', 'Media', 'Electricals', 'IT Security', 'Cement', 'Paper'
]

def get_label_encoder():
    le = LabelEncoder()
    le.fit(SECTOR_CATEGORIES)
    return le

def preprocess(df, scaler=None, le=None, fit=False):
    df = df.copy()
    
    # Drop non-feature columns if present
    for col in ['company']:
        if col in df.columns:
            df = df.drop(columns=[col])
    
    # Handle sector encoding
    if le is None:
        le = get_label_encoder()
    
    # Replace unseen sectors with 'Finance' (default)
    df['sector'] = df['sector'].apply(
        lambda x: x if x in SECTOR_CATEGORIES else 'Finance'
    )
    df['sector_enc'] = le.transform(df['sector'])
    df = df.drop(columns=['sector'])
    
    # Feature engineering
    df['total_sub'] = df['retail_sub'] + df['qib_sub'] + df['nii_sub']
    df['gmp_to_size_ratio'] = df['gmp'] / (df['issue_size'] + 1)
    df['sub_weighted'] = (df['retail_sub'] * 0.35 + df['qib_sub'] * 0.5 + df['nii_sub'] * 0.15)
    
    feature_cols = [
        'gmp', 'retail_sub', 'qib_sub', 'nii_sub',
        'issue_size', 'market_trend', 'sector_enc',
        'total_sub', 'gmp_to_size_ratio', 'sub_weighted'
    ]
    
    X = df[feature_cols]
    
    if fit:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        return X_scaled, scaler, le, feature_cols
    else:
        X_scaled = scaler.transform(X)
        return X_scaled, feature_cols
