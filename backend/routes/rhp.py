from flask import Blueprint, jsonify
from services.rhp_parser import generate_mock_rhp_data
from database import get_connection
from datetime import datetime

rhp_bp = Blueprint('rhp', __name__)

@rhp_bp.route('/rhp/<company_name>', methods=['GET'])
def get_rhp_data(company_name: str):
    """
    GET /rhp/<company_name>
    Returns Red Herring Prospectus (RHP) financial details, promoter holding,
    risk factors, and objects of the issue.
    Caches results in SQLite to optimize performance.
    """
    if not company_name:
        return jsonify({'error': 'company_name is required'}), 400
        
    conn = get_connection()
    row = conn.execute(
        'SELECT * FROM rhp_data WHERE LOWER(company_name) = LOWER(?)',
        (company_name,)
    ).fetchone()
    conn.close()
    
    if row:
        row = dict(row)
        return jsonify({
            "company_name": company_name,
            "promoter_holding": row['promoter_holding'],
            "issue_size": row['issue_size'],
            "revenue": row['revenue'],
            "pat": row['pat'],
            "objects_of_issue": row['objects_of_issue'],
            "risk_factors": row['risk_factors'],
            "cached": True
        })
        
    # Generate fresh data
    try:
        data = generate_mock_rhp_data(company_name)
        
        # Save to SQLite cache
        conn = get_connection()
        conn.execute('''
            INSERT INTO rhp_data (
                company_name, promoter_holding, issue_size,
                revenue, pat, objects_of_issue, risk_factors, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(company_name) DO UPDATE SET
                promoter_holding=excluded.promoter_holding,
                issue_size=excluded.issue_size,
                revenue=excluded.revenue,
                pat=excluded.pat,
                objects_of_issue=excluded.objects_of_issue,
                risk_factors=excluded.risk_factors,
                updated_at=excluded.updated_at
        ''', (
            company_name, data['promoter_holding'], data['issue_size'],
            data['revenue'], data['pat'], data['objects_of_issue'],
            data['risk_factors'], data['updated_at']
        ))
        conn.commit()
        conn.close()
        
        data['cached'] = False
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f'Failed to parse RHP: {str(e)}'}), 500
