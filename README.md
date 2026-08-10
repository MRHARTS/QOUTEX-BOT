# QOUTEX-BOT

This repository is the MVP signal-generator for public testing.

Features:
- 1-minute-first data connectors (Binance via ccxt, stocks/forex via yfinance public endpoints)
- Explainable SMA + RSI signal generator
- Streamlit dashboard to select symbol/timeframe, run analysis, and view signals
- Docker + docker-compose for local run

Quick start (local, public-data-only):

1. Clone the repo
   git clone https://github.com/MRHARTS/QOUTEX-BOT.git
2. Build & run with Docker Compose (recommended):
   docker-compose up --build

Or run directly with Python (requires python 3.10+):

1. python -m venv .venv
2. source .venv/bin/activate  # or .venv\Scripts\activate on Windows
3. pip install -r requirements.txt
4. streamlit run src/app/streamlit_app.py

License: MIT
