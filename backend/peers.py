import json
import os
from typing import Optional

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'peer_companies.json')

_peers_cache = None


def _load_peers():
    global _peers_cache
    if _peers_cache is None:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            _peers_cache = json.load(f)
    return _peers_cache


def get_peers(sector: str, company_name: Optional[str] = None, limit: int = 5) -> list:
    """Return top peer companies in the same sector, excluding the queried company."""
    peers = _load_peers()
    sector_peers = [p for p in peers if p['sector'].lower() == sector.lower()]
    if company_name:
        sector_peers = [p for p in sector_peers if p['name'].lower() != company_name.lower()]
    sector_peers.sort(key=lambda x: x.get('market_cap_cr', 0), reverse=True)
    return sector_peers[:limit]


def get_all_sectors() -> list:
    """Return sorted list of all unique sectors from peer data."""
    peers = _load_peers()
    return sorted(list(set(p['sector'] for p in peers)))
