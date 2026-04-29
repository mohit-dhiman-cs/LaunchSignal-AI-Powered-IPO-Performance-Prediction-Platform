import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml'))

from database import init_db
from routes.predict   import predict_bp
from routes.market    import market_bp
from routes.live_ipo  import live_ipo_bp
from routes.sentiment import sentiment_bp


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    init_db()

    app.register_blueprint(predict_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(live_ipo_bp)
    app.register_blueprint(sentiment_bp)

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({"status": "ok", "message": "IPO Predictor API running"})

    return app

# Expose app object for Gunicorn
app = create_app()

if __name__ == '__main__':
    print("\n[*] IPO Predictor Backend starting...")
    print("   -> http://localhost:5000\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
