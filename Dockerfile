FROM mcr.microsoft.com/playwright:focal

WORKDIR /app

# Copy package.json if present to leverage cache
COPY package.json package-lock.json* ./

# Install dependencies if package.json exists
RUN if [ -f package.json ]; then npm ci --production || npm install --production; fi

# Copy app
COPY . /app

# Ensure storage and signals state are writable
VOLUME ["/app/storage", "/app/state"]

ENV NODE_ENV=production

CMD ["node", "qoutex_bot.js"]
