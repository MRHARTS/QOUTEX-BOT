# 🎯 Meme Coin Hunter AI

A research and risk-analysis dashboard for newly launched and trending cryptocurrency meme tokens on Solana.

## 📋 Features (Phase 1)

- ✅ Token search by contract address
- ✅ Market data visualization (CoinGecko, Solscan)
- ✅ Liquidity analysis
- ✅ Holder distribution tracking
- ✅ Price charts (1m - 24h timeframes)
- ✅ Volume analysis
- ✅ Deployer wallet tracking
- ✅ Contract security checks
- ✅ Risk scoring engine
- ✅ Watchlist management
- ✅ Trade journal

## 🏗️ Architecture

### Stack
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** PostgreSQL + Prisma ORM
- **Data Sources:** Free APIs (CoinGecko, Solscan, Birdeye, Jupiter)

### Data Providers
```
DataProvider
├── MarketDataProvider (CoinGecko, Coinpaprika)
├── BlockchainProvider (Solscan, SolanaFM)
├── LiquidityProvider (Jupiter, Birdeye)
├── SecurityProvider (De.Fi, Rugcheck)
└── WalletAnalyticsProvider (Solscan, SolanaFM)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/MRHARTS/meme-coin-hunter-ai.git
cd meme-coin-hunter-ai

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Setup Prisma
npm run prisma:generate
npm run prisma:migrate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Roadmap

### Phase 1 (Current)
- [x] Project setup & database schema
- [x] Authentication (public access)
- [x] Token search UI
- [x] Market data integration
- [ ] Dashboard & data display
- [ ] Price charts

### Phase 2
- Liquidity analysis
- Holder analysis
- Real-time volume tracking

### Phase 3
- Contract security scanning
- Deployer analysis
- Wallet clustering

### Phase 4
- Risk engine
- Opportunity scoring
- Momentum analysis

### Phase 5
- Advanced scanner
- Watchlist system
- Alerts

### Phase 6
- Trade journal
- Backtesting engine

### Phase 7
- AI report generation (without LLM)
- Advanced wallet analysis
- Social sentiment integration

## ⚠️ Disclaimer

**Meme coins are highly speculative and can lose most or all of their value.** This application provides research and analytical information, not guaranteed financial returns or personalized financial advice.

## 📄 Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Security](./docs/SECURITY.md)
- [Data Providers](./docs/PROVIDERS.md)

## 📝 License

MIT License - see LICENSE file

## 👨‍💻 Development

```bash
# Run tests
npm test

# Lint
npm run lint

# Build for production
npm run build
npm start

# Prisma Studio (database viewer)
npm run prisma:studio
```
