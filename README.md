<div align="center">
  <img src="https://img.icons8.com/color/96/000000/launched-rocket.png" alt="LaunchSignal Logo" width="80" />
  
  # LaunchSignal
  **AI-Powered IPO Performance Prediction Platform**
  
  <p align="center">
    A full-stack machine learning application that predicts Initial Public Offering (IPO) listing returns using real-time Grey Market Premium (GMP), subscription data, and market trends.
  </p>

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
  [![Scikit-Learn](https://img.shields.io/badge/scikit_learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
  [![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

  <h3>🚀 <a href="https://launchsignal-ai-powered-ipo-performance-prediction-platfor.pages.dev/">Try the Live Demo Here</a></h3>
</div>

---

## 🌟 Overview
LaunchSignal is a sophisticated analytical tool designed to bridge the gap between traditional financial analysis and modern machine learning. By aggregating data from unlisted markets, institutional subscription patterns, and broader market sentiment, the platform provides retail investors with institutional-grade insights into expected IPO performance.

Unlike "black-box" models, LaunchSignal prioritizes **Explainable AI**, showing users exactly how different market factors influence the final prediction.

## 🔥 Key Features

*   **🤖 ML Prediction Engine**: Powered by a finely-tuned Gradient Boosting Regressor achieving an $R^2$ score of **0.937** on historical Indian IPO data.
*   **🕸️ Real-Time Data Scraping**: Automatically scrapes live Grey Market Premium (GMP) and subscription metrics directly from unlisted market sources (e.g., IPOWatch).
*   **📈 Live Market Context**: Integrates with Yahoo Finance APIs to adjust predictions dynamically based on the live % change of the Nifty 50 index.
*   **🧠 AI Explainability**: Features perturbation-based feature impact analysis, visually explaining which factors boosted or penalized the prediction.
*   **🎛️ Interactive What-If Simulator**: Users can adjust GMP and subscription sliders to see how the model's prediction changes in real-time.
*   **📰 NLP News Sentiment**: Scrapes Google News RSS feeds and performs NLP sentiment analysis to gauge market hype.
*   **💎 Proprietary Scoring Model**: Synthesizes market conditions into a custom 0-100 IPO Score Card for quick risk assessment.
*   **🎨 Premium UI/UX**: Built with React and Recharts, featuring a modern dark-glassmorphism aesthetic, cinematic animations, and smart autocomplete.

## 🏗️ System Architecture

The project follows a decoupled, three-tier architecture:

1.  **Frontend (Client Tier)**: React.js application providing a highly interactive, responsive user interface. Handles state management and complex data visualizations.
2.  **Backend API (Middleware Tier)**: Flask RESTful API that coordinates data flows, executes the live web scrapers, queries financial APIs, and logs interactions to an SQLite database.
3.  **Machine Learning (Intelligence Tier)**: Serialized Scikit-Learn pipeline containing the trained Gradient Boosting model, data scalers, and label encoders.

## ⚙️ Tech Stack

**Frontend**
*   React.js (Vite)
*   Recharts (Data Visualization)
*   Axios (HTTP Client)
*   Vanilla CSS (Custom Design System)

**Backend & ML**
*   Python 3.14+
*   Flask & Flask-CORS
*   Scikit-Learn (Model Training & Inference)
*   Pandas & NumPy (Data Manipulation)
*   BeautifulSoup4 (Web Scraping)
*   yfinance (Live Market Data)
*   TextBlob (NLP Sentiment Analysis)

## 🚀 Getting Started

Follow these instructions to run the project on your local machine.

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)

### 1. Start the Backend Server
Open a terminal and navigate to the backend directory:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*The backend will run on `http://localhost:5000`*

### 2. Start the Frontend Application
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`*

## 🔮 Future Roadmap
*   **JWT Authentication**: Allow users to save their predictions and track their portfolio performance over time.
*   **Automated Retraining**: Implement a pipeline to automatically append new IPO data post-listing and retrain the model periodically.
*   **Enhanced NLP**: Upgrade from TextBlob to a FinBERT-based transformer model for deeper financial text comprehension.

## 👨‍💻 Developed By
Created as a pre-final year academic project to demonstrate the practical application of Machine Learning, Full-Stack Web Development, and Real-Time Data Engineering.
