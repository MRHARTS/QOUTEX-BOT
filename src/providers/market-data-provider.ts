import axios from 'axios';
import { PROVIDER_URLS } from '@/lib/constants';
import { ProviderResponse, PriceData, TokenInfoData } from './types';

class MarketDataProvider {
  private coingeckoBase = PROVIDER_URLS.COINGECKO;

  /**
   * Get Solana token price from CoinGecko
   * CoinGecko doesn't require authentication for free tier
   */
  async getPriceFromCoingecko(
    tokenAddress: string
  ): Promise<ProviderResponse<PriceData>> {
    try {
      // CoinGecko uses contract address lookup
      // For Solana: https://api.coingecko.com/api/v3/coins/solana/contract/{address}
      const response = await axios.get(
        `${this.coingeckoBase}/coins/solana/contract/${tokenAddress}`,
        { timeout: 10000 }
      );

      const data = response.data;
      const marketData = data.market_data;

      return {
        success: true,
        data: {
          price: marketData.current_price.usd.toString(),
          priceUsd: marketData.current_price.usd,
          marketCap: marketData.market_cap.usd?.toString(),
          fullyDilutedValuation: marketData.fully_diluted_valuation?.usd?.toString(),
          volume24h: marketData.total_volume.usd?.toString(),
          priceChange1h: marketData.price_change_percentage_1h_in_currency?.usd,
          priceChange24h: marketData.price_change_percentage_24h_in_currency?.usd,
          ath: marketData.ath.usd?.toString(),
          atl: marketData.atl.usd?.toString(),
        },
        source: 'coingecko',
        timestamp: new Date(),
        confidence: 'high',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'PROVIDER_ERROR',
        source: 'coingecko',
        timestamp: new Date(),
        confidence: 'low',
      };
    }
  }

  /**
   * Get token info from CoinGecko
   */
  async getTokenInfoFromCoingecko(
    tokenAddress: string
  ): Promise<ProviderResponse<TokenInfoData>> {
    try {
      const response = await axios.get(
        `${this.coingeckoBase}/coins/solana/contract/${tokenAddress}`,
        { timeout: 10000 }
      );

      const data = response.data;

      return {
        success: true,
        data: {
          name: data.name,
          symbol: data.symbol.toUpperCase(),
          decimals: data.detail_platforms?.solana?.decimal_place || 6,
          totalSupply: data.market_data?.total_supply?.toString() || 'unknown',
          circulatingSupply: data.market_data?.circulating_supply?.toString(),
          logoUrl: data.image?.large,
          website: data.links?.homepage?.[0],
          twitter: data.links?.twitter_screen_handle
            ? `https://twitter.com/${data.links.twitter_screen_handle}`
            : undefined,
          description: data.description?.en,
        },
        source: 'coingecko',
        timestamp: new Date(),
        confidence: 'high',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'PROVIDER_ERROR',
        source: 'coingecko',
        timestamp: new Date(),
        confidence: 'low',
      };
    }
  }

  /**
   * Get Solana token price from Solscan (alternative free source)
   */
  async getPriceFromSolscan(
    tokenAddress: string
  ): Promise<ProviderResponse<PriceData>> {
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
          price: data.price?.toString() || '0',
          priceUsd: parseFloat(data.price || '0'),
          marketCap: data.marketCap?.toString(),
          volume24h: data.volume24h?.toString(),
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
}

export const marketDataProvider = new MarketDataProvider();
