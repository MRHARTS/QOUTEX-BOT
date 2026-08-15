import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getToken(chain: string, address: string) {
    try {
      const response = await this.client.get(`/token/${chain}/${address}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTokenMarket(chain: string, address: string) {
    try {
      const response = await this.client.get(`/token/${chain}/${address}/market`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTokenLiquidity(chain: string, address: string) {
    try {
      const response = await this.client.get(`/token/${chain}/${address}/liquidity`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTokenHolders(chain: string, address: string, limit = 20) {
    try {
      const response = await this.client.get(
        `/token/${chain}/${address}/holders?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTokenSecurity(chain: string, address: string) {
    try {
      const response = await this.client.get(`/token/${chain}/${address}/security`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTokenDeployer(chain: string, address: string) {
    try {
      const response = await this.client.get(`/token/${chain}/${address}/deployer`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchToken(address: string, chain: string = 'solana') {
    try {
      const response = await this.client.get(
        `/token/${chain}/search?address=${address}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWatchlist() {
    try {
      const response = await this.client.get('/watchlist');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addToWatchlist(tokenId: string, name: string) {
    try {
      const response = await this.client.post('/watchlist', { tokenId, name });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeFromWatchlist(watchlistItemId: string) {
    try {
      const response = await this.client.delete(`/watchlist/${watchlistItemId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message: string; reason?: string }>;  
      const message = axiosError.response?.data?.message || axiosError.message;
      const reason = axiosError.response?.data?.reason;
      return new Error(`${message}${reason ? ` (${reason})` : ''}`);
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }
}

export const apiClient = new APIClient();
