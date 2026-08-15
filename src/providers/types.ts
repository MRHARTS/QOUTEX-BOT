export type DataSource = 'coingecko' | 'coinpaprika' | 'solscan' | 'solana-fm' | 'birdeye' | 'jupiter' | 'defi' | 'rugcheck';

export interface ProviderResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  reason?: 'INVALID_ADDRESS' | 'PROVIDER_ERROR' | 'DATA_UNAVAILABLE' | 'RATE_LIMIT';
  source: DataSource;
  timestamp: Date;
  confidence: 'low' | 'medium' | 'high';
}

export interface TokenInfoData {
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

export interface PriceData {
  price: string;
  priceUsd: number;
  marketCap?: string;
  fullyDilutedValuation?: string;
  volume24h?: string;
  priceChange1h?: number;
  priceChange24h?: number;
  ath?: string;
  atl?: string;
}

export interface LiquidityData {
  totalLiquidity: string;
  liquidityUsd: number;
  dexName: string;
  tokenReserve: string;
  nativeReserve: string;
  poolAddress: string;
  createdAt: Date;
}

export interface HolderData {
  rank: number;
  walletAddress: string;
  balance: string;
  percentage: number;
  usdValue?: string;
  label?: string;
}

export interface VolumeData {
  volume1h: string;
  volume4h: string;
  volume24h: string;
  buyVolume?: string;
  sellVolume?: string;
  buyToSellRatio?: number;
  trend: 'accelerating' | 'stable' | 'declining';
}

export interface WalletActivityData {
  txHash: string;
  type: 'buy' | 'sell';
  amount: string;
  price?: string;
  timestamp: Date;
  wallet: string;
}

export interface DeployerData {
  walletAddress: string;
  deployTime: Date;
  previousLaunches: number;
  successfulLaunches: number;
}

export interface SecurityData {
  mintAuthority: 'pass' | 'warn' | 'fail' | 'unknown';
  freezeAuthority: 'pass' | 'warn' | 'fail' | 'unknown';
  ownerPrivileges: 'pass' | 'warn' | 'fail' | 'unknown';
  tradingRestrictions: 'pass' | 'warn' | 'fail' | 'unknown';
  upgradeability: 'pass' | 'warn' | 'fail' | 'unknown';
  feeControls: 'pass' | 'warn' | 'fail' | 'unknown';
  hasHoneypot: boolean | null;
  rugRiskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  notes?: string;
}
