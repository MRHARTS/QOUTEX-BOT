// Chain types
export type ChainType = 'solana' | 'ethereum' | 'base' | 'bsc';

export interface Chain {
  id: string;
  name: string;
  displayName: string;
  isSupported: boolean;
}

// Token types
export interface Token {
  id: string;
  address: string;
  chainId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  circulatingSupply?: string;
  logoUrl?: string;
  website?: string;
  twitter?: string;
  description?: string;
}

// Market data
export interface MarketData {
  price: string;
  marketCap: string;
  fullyDilutedValuation?: string;
  volume24h: string;
  priceChange1h?: number;
  priceChange24h?: number;
  ath?: string;
  atl?: string;
  source: string;
  confidence: 'low' | 'medium' | 'high';
  timestamp: Date;
}

// Liquidity
export interface Liquidity {
  totalLiquidity: string;
  dexName: string;
  tokenReserve: string;
  nativeReserve: string;
  poolAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

// Holder
export interface Holder {
  rank: number;
  walletAddress: string;
  balance: string;
  percentage: number;
  usdValue?: string;
  walletType: 'lp' | 'burn' | 'exchange' | 'deployer' | 'unknown';
  label?: string;
}

// Risk Score
export interface RiskScore {
  contractRisk: number;
  liquidityRisk: number;
  holderRisk: number;
  deployerRisk: number;
  walletRisk: number;
  volumeRisk: number;
  marketRisk: number;
  manipulationRisk: number;
  overallRisk: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasoning?: string;
}

// Momentum
export interface Momentum {
  priceAcceleration: number;
  volumeAcceleration: number;
  holderGrowth: number;
  buyerGrowth: number;
  liquidityGrowth: number;
  txGrowth: number;
  overallMomentum: number;
  status: 'accelerating' | 'stable' | 'declining';
  primaryDrivers?: string[];
}

// Security
export interface SecurityScan {
  mintAuthority: 'pass' | 'warn' | 'fail';
  freezeAuthority: 'pass' | 'warn' | 'fail';
  ownerPrivileges: 'pass' | 'warn' | 'fail';
  tradingRestrictions: 'pass' | 'warn' | 'fail';
  upgradeability: 'pass' | 'warn' | 'fail';
  feeControls: 'pass' | 'warn' | 'fail';
  hasHoneypot: boolean;
  rugRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  scannerUsed: string;
}

// Deployer
export interface Deployer {
  walletAddress: string;
  previousLaunches: number;
  successfulLaunches: number;
  abandonedLaunches: number;
  highRiskOutcomes: number;
  reputation: 'unknown' | 'positive' | 'mixed' | 'negative';
  confidence: 'low' | 'medium' | 'high';
}

// Wallet
export interface Wallet {
  address: string;
  label?: string;
  balance?: string;
  winRate?: number;
  averageReturn?: number;
  numberOfTrades: number;
  realizedPnL?: string;
}

// Volume
export interface Volume {
  volume5m?: string;
  volume15m?: string;
  volume1h: string;
  volume4h: string;
  volume24h: string;
  buyVolume?: string;
  sellVolume?: string;
  buyToSellRatio?: number;
  trend: 'accelerating' | 'stable' | 'declining';
}

// Trade
export interface Trade {
  tokenAddress: string;
  chainId: string;
  entryPrice: string;
  exitPrice?: string;
  positionSize: string;
  entryTime: Date;
  exitTime?: Date;
  reason?: string;
  result?: 'win' | 'loss' | 'breakeven' | 'open';
  profitLoss?: string;
  profitLossPercent?: number;
}

// API Response
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  reason?: string;
  timestamp: Date;
}

// Chart Data
export interface ChartDataPoint {
  timestamp: Date;
  price: number;
  volume: number;
  marketCap: number;
}
