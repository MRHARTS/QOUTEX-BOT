import axios from 'axios';
import { PROVIDER_URLS } from '@/lib/constants';
import { ProviderResponse, HolderData, VolumeData, WalletActivityData } from './types';

class BlockchainProvider {
  /**
   * Get top token holders from Solscan
   * Solscan public API allows reasonable/fair use without authentication
   */
  async getHolders(
    tokenAddress: string,
    limit: number = 20
  ): Promise<ProviderResponse<HolderData[]>> {
    try {
      const response = await axios.get(
        `${PROVIDER_URLS.SOLSCAN}/token/holders`,
        {
          params: {
            tokenAddress,
            offset: 0,
            limit,
            sortBy: 'percentage',
          },
          timeout: 10000,
        }
      );

      const data = response.data.data || response.data || [];
      const holders: HolderData[] = data.map(
        (holder: any, index: number) => ({
          rank: index + 1,
          walletAddress: holder.owner || holder.address,
          balance: holder.tokenAmount?.toString() || '0',
          percentage: parseFloat(holder.percentage || holder.percent || '0'),
          usdValue: holder.usdValue?.toString(),
          label: holder.label || 'Unknown',
        })
      );

      return {
        success: true,
        data: holders,
        source: 'solscan',
        timestamp: new Date(),
        confidence: 'high',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'PROVIDER_ERROR',
        source: 'solscan',
        timestamp: new Date(),
        confidence: 'low',
      };
    }
  }

  /**
   * Get recent transactions for a token
   */
  async getTransactions(
    tokenAddress: string,
    limit: number = 50
  ): Promise<ProviderResponse<WalletActivityData[]>> {
    try {
      const response = await axios.get(
        `${PROVIDER_URLS.SOLSCAN}/token/transfer`,
        {
          params: {
            tokenAddress,
            limit,
            offset: 0,
          },
          timeout: 10000,
        }
      );

      const data = response.data.data || response.data || [];
      const transactions: WalletActivityData[] = data.map((tx: any) => ({
        txHash: tx.txHash || tx.signature || 'unknown',
        type: tx.type === 'in' ? 'buy' : 'sell',
        amount: tx.tokenAmount?.toString() || '0',
        price: tx.price?.toString(),
        timestamp: new Date(tx.timestamp * 1000 || Date.now()),
        wallet: tx.fromAddress || tx.from || 'unknown',
      }));

      return {
        success: true,
        data: transactions,
        source: 'solscan',
        timestamp: new Date(),
        confidence: 'high',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'PROVIDER_ERROR',
        source: 'solscan',
        timestamp: new Date(),
        confidence: 'low',
      };
    }
  }

  /**
   * Get volume data from multiple sources
   */
  async getVolume(tokenAddress: string): Promise<ProviderResponse<VolumeData>> {
    try {
      const response = await axios.get(
        `${PROVIDER_URLS.SOLSCAN}/token/meta`,
        {
          params: { token: tokenAddress },
          timeout: 10000,
        }
      );

      const data = response.data.data || response.data;

      return {
        success: true,
        data: {
          volume1h: data.volume1h?.toString() || '0',
          volume4h: data.volume4h?.toString() || '0',
          volume24h: data.volume24h?.toString() || '0',
          buyVolume: data.buyVolume24h?.toString(),
          sellVolume: data.sellVolume24h?.toString(),
          buyToSellRatio:
            data.buyVolume24h && data.sellVolume24h
              ? data.buyVolume24h / data.sellVolume24h
              : undefined,
          trend:
            data.volume24h > data.volume4h
              ? 'accelerating'
              : data.volume24h < data.volume4h
              ? 'declining'
              : 'stable',
        },
        source: 'solscan',
        timestamp: new Date(),
        confidence: 'medium',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'PROVIDER_ERROR',
        source: 'solscan',
        timestamp: new Date(),
        confidence: 'low',
      };
    }
  }

  /**
   * Get deployer wallet from Solscan
   */
  async getDeployer(
    tokenAddress: string
  ): Promise<ProviderResponse<{ walletAddress: string; deployTime: Date }>> {
    try {
      const response = await axios.get(
        `${PROVIDER_URLS.SOLSCAN}/token/meta`,
        {
          params: { token: tokenAddress },
          timeout: 10000,
        }
      );

      const data = response.data.data || response.data;

      if (!data.owner) {
        return {
          success: false,
          reason: 'DATA_UNAVAILABLE',
          source: 'solscan',
          timestamp: new Date(),
          confidence: 'low',
          error: 'Deployer information not available',
        };
      }

      return {
        success: true,
        data: {
          walletAddress: data.owner,
          deployTime: new Date(data.deployTime * 1000 || Date.now()),
        },
        source: 'solscan',
        timestamp: new Date(),
        confidence: 'high',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'PROVIDER_ERROR',
        source: 'solscan',
        timestamp: new Date(),
        confidence: 'low',
      };
    }
  }
}

export const blockchainProvider = new BlockchainProvider();
