import axios from 'axios';
import { PROVIDER_URLS } from '@/lib/constants';
import { ProviderResponse, LiquidityData } from './types';

class LiquidityProvider {
  /**
   * Get liquidity data from Jupiter
   * Jupiter API is free and doesn't require authentication
   */
  async getLiquidityFromJupiter(
    tokenAddress: string
  ): Promise<ProviderResponse<LiquidityData>> {
    try {
      // Jupiter quote endpoint provides liquidity/routing info
      const response = await axios.get(
        `${PROVIDER_URLS.JUPITER}/quote`,
        {
          params: {
            inputMint: 'So11111111111111111111111111111111111111112', // SOL
            outputMint: tokenAddress,
            amount: 1000000000, // 1 SOL
            slippageBps: 50,
          },
          timeout: 10000,
        }
      );

      const data = response.data;

      // Jupiter doesn't directly return liquidity, but we can infer from routes
      // Route existence indicates liquidity availability
      if (!data.routePlan || data.routePlan.length === 0) {
        return {
          success: false,
          reason: 'DATA_UNAVAILABLE',
          source: 'jupiter',
          timestamp: new Date(),
          confidence: 'low',
          error: 'No liquidity data available',
        };
      }

      return {
        success: true,
        data: {
          totalLiquidity: 'data_unavailable',
          liquidityUsd: 0,
          dexName: 'Solana DEX',
          tokenReserve: 'data_unavailable',
          nativeReserve: 'data_unavailable',
          poolAddress: 'data_unavailable',
          createdAt: new Date(),
        },
        source: 'jupiter',
        timestamp: new Date(),
        confidence: 'low',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'PROVIDER_ERROR',
        source: 'jupiter',
        timestamp: new Date(),
        confidence: 'low',
      };
    }
  }

  /**
   * Get liquidity data from Birdeye
   * Birdeye free API provides liquidity analytics
   */
  async getLiquidityFromBirdeye(
    tokenAddress: string
  ): Promise<ProviderResponse<LiquidityData>> {
    try {
      const response = await axios.get(
        `https://public-api.birdeye.so/public/token/${tokenAddress}`,
        { timeout: 10000 }
      );

      const data = response.data.data;

      if (!data || !data.liquidity) {
        return {
          success: false,
          reason: 'DATA_UNAVAILABLE',
          source: 'birdeye',
          timestamp: new Date(),
          confidence: 'low',
          error: 'Liquidity data not available',
        };
      }

      return {
        success: true,
        data: {
          totalLiquidity: data.liquidity?.toString() || '0',
          liquidityUsd: parseFloat(data.liquidity || '0'),
          dexName: 'Multiple DEXs',
          tokenReserve: 'data_unavailable',
          nativeReserve: 'data_unavailable',
          poolAddress: 'data_unavailable',
          createdAt: new Date(data.createTime * 1000 || Date.now()),
        },
        source: 'birdeye',
        timestamp: new Date(),
        confidence: 'medium',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'PROVIDER_ERROR',
        source: 'birdeye',
        timestamp: new Date(),
        confidence: 'low',
      };
    }
  }
}

export const liquidityProvider = new LiquidityProvider();
