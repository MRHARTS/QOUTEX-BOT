# QOUTEX-BOT

This repository contains a Node.js Playwright-based signal generator for Quotex. It intercepts WebSocket frames in the browser session, extracts candles, and runs a simple SMA crossover + ATR filter strategy to produce BUY/SELL signals.

Quickstart
1. Copy `.env.example` to `.env` and edit as needed.
2. Install dependencies:
   npm install
   npx playwright install chromium
3. Run locally (interactive login first):
   DEBUG_WS=true HEADLESS=false node qoutex_bot.js

Docker
Build and run with docker-compose:
  docker-compose build
  docker-compose up -d

Backtesting
Provide a CSV of historical candles with header `time,open,high,low,close,volume` and run:
  node backtest.js path/to/candles.csv

Notes
- The bot saves login session state in storageState.json after the first interactive login.
- Signals are persisted to `signals_state.json` to avoid duplicate alerts across restarts.
- This project generates signals only; it does not place trades.
