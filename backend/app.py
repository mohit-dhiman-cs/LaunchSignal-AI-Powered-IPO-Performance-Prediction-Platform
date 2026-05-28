import os
import sys
from datetime import timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))

from database import init_db
from routes.predict      import predict_bp
from routes.market       import market_bp
from routes.live_ipo     import live_ipo_bp
from routes.sentiment    import sentiment_bp
from routes.history      import history_bp
from routes.gmp          import gmp_bp
from routes.peers_route  import peers_bp
from routes.risk         import risk_bp
from routes.auth           import auth_bp
from routes.backtest       import backtest_bp
from routes.valuation      import valuation_bp
from routes.news_sentiment import news_bp
from routes.watchlist      import watchlist_bp
from routes.portfolio      import portfolio_bp
from routes.broker         import broker_bp
from routes.community      import community_bp
from routes.live_subscription import live_sub_bp
from routes.social_buzz import social_buzz_bp
from routes.rhp import rhp_bp

# ── Allowed frontend origins ─────────────────────────────────────────
ALLOWED_ORIGINS = [
    "https://launchsignal-ai-powered-ipo-performance-prediction-platfor.pages.dev",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
]


def create_app():
    app = Flask(__name__)

    # ── JWT Config ───────────────────────────────────────────────────
    app.config['JWT_SECRET_KEY']            = os.environ.get('JWT_SECRET_KEY', 'launchsignal-dev-secret-2026-xyz!')
    app.config['JWT_ACCESS_TOKEN_EXPIRES']  = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['JWT_TOKEN_LOCATION']        = ['headers']
    jwt = JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({'error': 'Token has expired', 'code': 'token_expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token', 'code': 'invalid_token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization required', 'code': 'missing_token'}), 401

    # ── CORS ─────────────────────────────────────────────────────────
    # supports_credentials + explicit methods so OPTIONS preflight
    # works for ALL blueprint routes (/watchlist, /portfolio, /community/*)
    CORS(
        app,
        resources={r"/*": {"origins": ALLOWED_ORIGINS}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        max_age=86400,
    )

    # ── Rate Limiting ─────────────────────────────────────────────────
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["300 per hour", "60 per minute"],
        storage_uri="memory://",
    )
    limiter.limit("20 per minute")(predict_bp)
    limiter.limit("10 per minute")(auth_bp)

    # ── Init DB ───────────────────────────────────────────────────────
    init_db()

    # ── Start Background Scrapers ─────────────────────────────────────
    try:
        from services.scheduler import start_background_jobs
        start_background_jobs()
    except Exception as e:
        print(f"[*] Failed to start background scheduler: {e}")

    # ── Register all blueprints ──────────────────────────────────────
    app.register_blueprint(predict_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(live_ipo_bp)
    app.register_blueprint(sentiment_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(gmp_bp)
    app.register_blueprint(peers_bp)
    app.register_blueprint(risk_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(backtest_bp)
    app.register_blueprint(valuation_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(watchlist_bp)
    app.register_blueprint(portfolio_bp)
    app.register_blueprint(broker_bp)
    app.register_blueprint(community_bp)
    app.register_blueprint(live_sub_bp)
    app.register_blueprint(social_buzz_bp)
    app.register_blueprint(rhp_bp)

    # ── Security Headers (skip OPTIONS so CORS preflight isn't blocked)
    @app.after_request
    def add_security_headers(response):
        if request.method == 'OPTIONS':
            return response          # let CORS handle it cleanly
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options']        = 'DENY'
        response.headers['X-XSS-Protection']       = '1; mode=block'
        response.headers['Referrer-Policy']        = 'strict-origin-when-cross-origin'
        return response

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Too many requests. Please slow down."}), 429

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({"status": "ok", "blueprints": 16})

    return app


app = create_app()

if __name__ == '__main__':
    print("\n[*] IPO Predictor Backend starting...")
    print("   -> http://localhost:5000\n")
    app.run(host='0.0.0.0', port=5000, debug=False)
