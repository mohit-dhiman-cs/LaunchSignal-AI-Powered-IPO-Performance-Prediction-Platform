import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))

from database import init_db
from routes.predict   import predict_bp
from routes.market    import market_bp
from routes.live_ipo  import live_ipo_bp
from routes.sentiment import sentiment_bp

# ── Allowed frontend origins ─────────────────────────────────────────
ALLOWED_ORIGINS = [
    "https://launchsignal-ai-powered-ipo-performance-prediction-platfor.pages.dev",
    "http://localhost:5173",   # local dev
    "http://localhost:3000",   # local dev fallback
]


def create_app():
    app = Flask(__name__)

    # ── Fix 1: Restrict CORS to known origins only ───────────────────
    CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})

    # ── Fix 2: Rate Limiting ─────────────────────────────────────────
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["200 per hour", "30 per minute"],
        storage_uri="memory://",
    )

    # Apply stricter limits to the expensive ML endpoint
    limiter.limit("20 per minute")(predict_bp)

    init_db()

    app.register_blueprint(predict_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(live_ipo_bp)
    app.register_blueprint(sentiment_bp)

    # ── Fix 4: Security Headers ──────────────────────────────────────
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options']        = 'DENY'
        response.headers['X-XSS-Protection']       = '1; mode=block'
        response.headers['Referrer-Policy']        = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy']     = 'geolocation=(), microphone=(), camera=()'
        response.headers['Cache-Control']          = 'no-store'
        return response

    # ── Custom rate limit error handler ─────────────────────────────
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            "error": "Too many requests. Please slow down.",
            "retry_after": str(e.description)
        }), 429

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({"status": "ok", "message": "IPO Predictor API running"})

    return app


# Expose app object for Gunicorn
app = create_app()

if __name__ == '__main__':
    print("\n[*] IPO Predictor Backend starting...")
    print("   -> http://localhost:5000\n")
    # ── Fix 3: debug=False in production ────────────────────────────
    app.run(host='0.0.0.0', port=5000, debug=False)
