# Architecture Overview

## System Design

### Frontend Architecture

```
src/
├── app/                    # Next.js 14 app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/Dashboard
│   ├── token/             # Token analysis pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   ├── token/            # Token-specific components
│   ├── charts/           # Chart components
│   └── layout/           # Layout components
├── lib/                  # Utilities & helpers
│   ├── api.ts           # API client
│   ├── validators.ts    # Input validation
│   └── utils.ts         # Helper functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── styles/              # CSS modules
```

### Backend Architecture

#### API Routes
```
api/
├── token/
│   ├── [chain]/
│   │   ├── [address]/
│   │   │   ├── route.ts           # GET token overview
│   │   │   ├── market/            # GET market data
│   │   │   ├── liquidity/         # GET liquidity
│   │   │   ├── holders/           # GET top holders
│   │   │   ├── security/          # GET security data
│   │   │   └── deployer/          # GET deployer info
│   │   └── search/                # GET token search
├── scanner/                       # Token scanner
├── watchlist/                     # Watchlist CRUD
├── alerts/                        # Alerts CRUD
└── trades/                        # Trade journal CRUD
```

#### Data Flow
```
Client Request
    ↓
API Route Handler
    ↓
Input Validation (Zod)
    ↓
Data Provider Selection
    ↓
External API Call (with caching)
    ↓
Database Storage (Prisma)
    ↓
Response Formatting
    ↓
Client Response
```

### Data Provider Pattern

Each provider implements a standardized interface:

```typescript
interface DataProvider {
  getToken(address: string): Promise<TokenData>;
  getPrice(address: string): Promise<PriceData>;
  getLiquidity(address: string): Promise<LiquidityData>;
  getHolders(address: string): Promise<HolderData[]>;
  getTransactions(address: string): Promise<TransactionData[]>;
  getVolume(address: string): Promise<VolumeData>;
}
```

Providers include:
- **MarketDataProvider:** CoinGecko, Coinpaprika
- **BlockchainProvider:** Solscan, SolanaFM
- **LiquidityProvider:** Jupiter, Birdeye
- **SecurityProvider:** De.Fi, Rugcheck API
- **WalletAnalyticsProvider:** Solscan, Helius

### Database Schema (Prisma)

Key tables:
- `User` - Application users
- `Token` - Token metadata
- `Chain` - Blockchain configuration
- `LiquidityPool` - Pool data
- `Holder` - Token holder data
- `Wallet` - Wallet tracking
- `WalletTransaction` - Transaction history
- `WalletRelationship` - Detected wallet clusters
- `Deployer` - Creator wallet analysis
- `TokenLaunch` - Launch history
- `MarketSnapshot` - Time-series market data
- `SecurityScan` - Contract security checks
- `RiskScore` - Risk calculations
- `MomentumScore` - Momentum metrics
- `Watchlist` - User watchlists
- `Alert` - User alerts
- `TradeJournal` - User trades

## Scoring Engines

### Risk Scoring

Categories:
- Contract Risk (0-100)
- Liquidity Risk (0-100)
- Holder Risk (0-100)
- Deployer Risk (0-100)
- Volume Risk (0-100)
- Market Risk (0-100)

**Final Risk Score:** Weighted average of categories

### Opportunity Scoring

Factors:
- Security Score (0-100)
- Market Quality (0-100)
- Momentum (0-100)
- Narrative Strength (0-100)

**Final Opportunity:** Composite score

## Caching Strategy

- **Market Data:** 5-minute cache
- **Holder Data:** 30-minute cache
- **Chart Data:** 1-minute cache
- **Contract Security:** 24-hour cache
- **Deployer Info:** 24-hour cache

## Error Handling

All data endpoints return standardized responses:

```typescript
type APIResponse<T> = 
  | { success: true; data: T; }
  | { success: false; error: string; reason: "INVALID_ADDRESS" | "PROVIDER_ERROR" | "DATA_UNAVAILABLE" }
```

## Security Considerations

1. **No Private Keys:** Application never stores or requests private keys
2. **API Key Protection:** All API keys server-side only
3. **Input Validation:** All inputs validated with Zod
4. **Rate Limiting:** Implement rate limits on public endpoints
5. **CORS:** Configured for frontend domain only
6. **SQL Injection:** Protected via Prisma
7. **XSS:** React/Next.js built-in protections

## Performance Optimization

1. **Database Indexing:** Indexed on frequently queried fields
2. **Caching:** Redis for API responses
3. **Pagination:** Large datasets paginated
4. **Compression:** Gzip enabled
5. **Code Splitting:** Dynamic imports where needed
6. **Image Optimization:** Next.js Image component

## Deployment Architecture

```
┌─────────────────────────────────┐
│     Vercel (Frontend + API)     │
│  - Next.js app                  │
│  - API routes                   │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
  ┌────────┐  ┌──────────────┐
  │ Prisma │  │ External APIs│
  │   ORM  │  │ (CoinGecko,  │
  └────┬───┘  │  Solscan,    │
       │      │  Jupiter, etc)│
       ↓      └──────────────┘
  ┌──────────────┐
  │ PostgreSQL   │
  │ (Cloud)      │
  └──────────────┘
```
