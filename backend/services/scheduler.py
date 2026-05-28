import threading
import time
from services.gmp_scraper import scrape_live_gmp
from database import save_gmp_history, get_connection

def start_background_jobs():
    """Starts all periodic background scrapers and update workers."""
    t = threading.Thread(target=_gmp_update_loop, daemon=True, name="GMPUpdateLoop")
    t.start()
    print("[Scheduler] Started live GMP scraper background thread.")

def _gmp_update_loop():
    """Runs live GMP scraping every 30 minutes and saves points into gmp_history."""
    while True:
        try:
            print("[Scheduler] Running live GMP background scrape...")
            live_data = scrape_live_gmp()
            
            if live_data:
                print(f"[Scheduler] Scraped {len(live_data)} live GMP records.")
                # Update database for active companies
                for comp_key, info in live_data.items():
                    name = info['company_name']
                    gmp = info['gmp']
                    price = info['issue_price']
                    save_gmp_history(name, gmp, price)
            else:
                print("[Scheduler] No live GMP data fetched. Using cached/seeded fallbacks.")
        except Exception as e:
            print(f"[Scheduler] Error in GMP update loop: {e}")
            
        # Sleep for 30 minutes (1800 seconds)
        time.sleep(1800)
