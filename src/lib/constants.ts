// Chain configuration
export const CHAINS = {
  SOLANA: {
    id: 'solana',
    name: 'Solana',
    displayName: 'Solana',
    isSupported: true,
  },
  ETHEREUM: {
    id: 'ethereum',
    name: 'Ethereum',
    displayName: 'Ethereum',
    isSupported: false, // Coming soon
  },
  BASE: {
    id: 'base',
    name: 'Base',
    displayName: 'Base',
    isSupported: false, // Coming soon
  },
  BSC: {
    id: 'bsc',
    name: 'BNB Chain',
    displayName: 'BNB Chain',
    isSupported: false, // Coming soon
  },
} as const;

// Risk thresholds
export const RISK_THRESHOLDS = {
  CONTRACT_RISK_HIGH: 70,
  LIQUIDITY_RISK_HIGH: 60,
  HOLDER_RISK_HIGH: 65, // Top 10 holders > 65%
  DEPLOYER_RISK_HIGH: 70,
  VOLUME_RISK_HIGH: 75,
  MARKET_RISK_HIGH: 70,
  MANIPULATION_RISK_HIGH: 75,
} as const;

// Scoring ranges
export const SCORE_RANGES = {
  CRITICAL: { min: 0, max: 25, color: '#ff0000' },
  HIGH: { min: 25, max: 50, color: '#ff6b6b' },
  MEDIUM: { min: 50, max: 75, color: '#ffff00' },
  LOW: { min: 75, max: 100, color: '#00ff00' },
} as const;

// Opportunity classifications
export const OPPORTUNITY_CLASSIFICATIONS = {
  AVOID: { range: [0, 25], label: 'AVOID', color: '#ff0000' },
  WATCH: { range: [25, 50], label: 'WATCH', color: '#ffff00' },
  SPECULATIVE: { range: [50, 75], label: 'SPECULATIVE', color: '#ff6b6b' },
  QUALITY_SETUP: { range: [75, 100], label: 'HIGH-QUALITY SETUP', color: '#00ff00' },
} as const;

// API rate limiting
export const RATE_LIMITS = {
  TOKEN_SEARCH: 100, // per hour
  SCANNER: 50, // per hour
  WATCHLIST: 1000, // per hour
} as const;

// Data provider URLs (free tiers)
export const PROVIDER_URLS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  SOLSCAN: 'https://public-api.solscan.io',
  SOLANA_FM: 'https://api-v2.solana.fm',
  BIRDEYE: 'https://public-api.birdeye.so',
  JUPITER: 'https://quote-api.jup.ag',
} as const;

// Cache durations (seconds)
export const CACHE_DURATIONS = {
  TOKEN_DATA: 300, // 5 minutes
  MARKET_DATA: 60, // 1 minute
  HOLDER_DATA: 1800, // 30 minutes
  LIQUIDITY_DATA: 300, // 5 minutes
  SECURITY_DATA: 86400, // 24 hours
  DEPLOYER_DATA: 86400, // 24 hours
} as const;
