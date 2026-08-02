#!/bin/bash
# Simple helper to run the bot locally
set -e
if [ ! -f .env ]; then
  echo ".env not found. Copy .env.example -> .env and edit it first." >&2
  exit 1
fi

# install deps if node_modules missing
if [ ! -d node_modules ]; then
  npm install
  npx playwright install chromium
fi

# run
node qoutex_bot.js
