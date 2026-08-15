import { z } from 'zod';

// Solana address validation (Base58, 32-44 chars)
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Z]{32,44}$/;

export const solanaAddressSchema = z
  .string()
  .regex(SOLANA_ADDRESS_REGEX, 'Invalid Solana address')
  .min(32, 'Address too short')
  .max(44, 'Address too long');

export const tokenSearchSchema = z.object({
  address: solanaAddressSchema,
  chain: z.enum(['solana']).default('solana'),
});

export const watchlistSchema = z.object({
  name: z.string().min(1).max(100),
  tokenId: z.string().cuid(),
});

export const alertSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'liquidity_change',
    'price_change',
    'volume_spike',
    'holder_change',
    'deployer_sell',
    'risk_change',
  ]),
  threshold: z.string(),
  condition: z.string().optional(),
});

export const tradeSchema = z.object({
  tokenId: z.string().cuid(),
  entryPrice: z.string(),
  exitPrice: z.string().optional(),
  positionSize: z.string(),
  reason: z.string().optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  opportunityScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export type TokenSearchInput = z.infer<typeof tokenSearchSchema>;
export type WatchlistInput = z.infer<typeof watchlistSchema>;
export type AlertInput = z.infer<typeof alertSchema>;
export type TradeInput = z.infer<typeof tradeSchema>;
