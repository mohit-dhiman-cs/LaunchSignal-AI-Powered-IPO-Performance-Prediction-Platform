import random
from database import get_connection
from datetime import datetime

def generate_mock_rhp_data(company_name: str):
    """
    Generates extremely realistic, professional Red Herring Prospectus (RHP)
    financials, promoter stake, objects of issue, and key risk factors.
    """
    # Dynamic values based on company name to keep them consistent yet unique
    random.seed(hash(company_name))
    
    # Financial metrics
    issue_size = round(random.uniform(500, 4500), 2)  # in Rs Crores
    revenue_growth = round(random.uniform(12.5, 45.0), 2)  # in %
    pat_crores = round(issue_size * random.uniform(0.08, 0.18), 2)  # Profit After Tax
    debt_equity = round(random.uniform(0.1, 1.8), 2)
    
    promoter_holding_pre = round(random.uniform(65.0, 95.0), 2)
    promoter_holding_post = round(promoter_holding_pre - random.uniform(15.0, 25.0), 2)
    
    objects_list = [
        "Funding capital expenditure requirements for setting up new manufacturing facilities.",
        "Repayment or pre-payment, in full or in part, of certain borrowings availed by our Company.",
        "Funding incremental working capital requirements of our Company.",
        "General corporate purposes, strategic initiatives, and brand building.",
        "Investment in joint ventures and expanding international sales footprint."
    ]
    
    risk_factors = [
        "Any drop in demand or production capacity constraints could materially affect our revenues.",
        "Failure to adapt to rapidly changing technological advancements and industry regulations.",
        "Significant portion of revenue is concentrated in a limited number of clients and key sectors.",
        "Foreign exchange fluctuations could expose us to significant pricing risks and profit margins."
    ]
    
    return {
        "company_name": company_name,
        "promoter_holding": promoter_holding_pre,
        "promoter_holding_post": promoter_holding_post,
        "issue_size": issue_size,
        "revenue": round(pat_crores * random.uniform(5, 12), 2),
        "pat": pat_crores,
        "objects_of_issue": "\n".join(random.sample(objects_list, 3)),
        "risk_factors": "\n".join(random.sample(risk_factors, 3)),
        "debt_equity_ratio": debt_equity,
        "revenue_growth_pct": revenue_growth,
        "updated_at": datetime.now().isoformat()
    }
