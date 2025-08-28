import { http } from './http';

export const dashboardApi = {
  // Get comprehensive dashboard data
  getDashboardData: async (timeRange = '1d') => {
    try {
      const response = await http.get(`/api/dashboard?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Get stock market data
  getStockData: async () => {
    try {
      const response = await http.get('/api/dashboard/stocks');
      return response.data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  },

  // Get carbon credit data
  getCarbonData: async () => {
    try {
      const response = await http.get('/api/dashboard/carbon');
      return response.data;
    } catch (error) {
      console.error('Error fetching carbon data:', error);
      throw error;
    }
  },

  // Get crypto market data
  getCryptoData: async () => {
    try {
      const response = await http.get('/api/dashboard/crypto');
      return response.data;
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      // Return fallback data if API fails
      return {
        cryptos: [],
        totalValue: 0,
        totalChange: 0,
        totalChangePercent: 0,
        topGainers: [],
        topLosers: [],
        volume: 0,
        marketCap: 0,
        active: 0
      };
    }
  },

  /**
   * Get crypto chart data for a specific symbol
   */
  async getCryptoChartData(symbol, interval = '1d', limit = 100) {
    try {
      const response = await http.get(`/api/dashboard/crypto/charts?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching crypto chart data:', error);
      throw error;
    }
  },

  // Get crypto symbols
  getCryptoSymbols: async () => {
    try {
      const response = await http.get('/api/dashboard/crypto-symbols');
      return response.data;
    } catch (error) {
      console.error('Error fetching crypto symbols:', error);
      throw error;
    }
  },

  // Get stock symbols for forecasting
  getStockSymbols: async () => {
    try {
      const response = await http.get('/api/dashboard/stock-symbols');
      return response.data;
    } catch (error) {
      console.error('Error fetching stock symbols:', error);
      throw error;
    }
  },

  // Get market sentiment
  getMarketSentiment: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await http.get(`/api/dashboard/sentiment?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market sentiment:', error);
      throw error;
    }
  },

  // Get blockchain status
  getBlockchainStatus: async () => {
    try {
      const response = await http.get('/api/dashboard/blockchain');
      return response.data;
    } catch (error) {
      console.error('Error fetching blockchain status:', error);
      throw error;
    }
  },

  // Get forecasting data using the new unified forecast system
  getForecasts: async (params = {}) => {
    try {
      // Use the new unified forecast endpoint for mixed assets
      if (params.symbols && params.symbols.length > 0) {
        const response = await http.post('/api/forecast/mixed', {
          assets: params.symbols,
          horizon: params.timeRange === '1d' ? 1 : params.timeRange === '1w' ? 7 : params.timeRange === '1m' ? 30 : params.timeRange === '3m' ? 90 : 7,
          useRealData: true
        });
        return response.data;
      }
      
      // Fallback to old endpoint for backward compatibility
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v == null) return;
        if (Array.isArray(v)) {
          // append repeated params for arrays
          v.forEach(val => query.append(k, val));
        } else {
          query.append(k, v);
        }
      });
      const response = await http.get(`/api/dashboard/forecasts?${query.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      throw error;
    }
  },



  // Get individual stock data
  getStockBySymbol: async (symbol) => {
    try {
      const response = await http.get(`/api/stocks/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stock:', error);
      throw error;
    }
  },

  // Get stock price history
  getStockHistory: async (symbol, days = 30) => {
    try {
      const response = await http.get(`/api/stocks/${symbol}/history?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stock history:', error);
      throw error;
    }
  },

  // Get carbon project details
  getCarbonProject: async (projectId) => {
    try {
      const response = await http.get(`/api/carbon/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching carbon project:', error);
      throw error;
    }
  },

  // Get carbon projects by type
  getCarbonProjectsByType: async (type) => {
    try {
      const response = await http.get(`/api/carbon/type/${type}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching carbon projects by type:', error);
      throw error;
    }
  },

  // Search stocks
  searchStocks: async (query) => {
    try {
      const response = await http.get(`/api/stocks/search/${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching stocks:', error);
      throw error;
    }
  },

  // Search carbon projects
  searchCarbonProjects: async (query) => {
    try {
      const response = await http.get(`/api/carbon/search/${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching carbon projects:', error);
      throw error;
    }
  },

  // Get combined metrics
  getCombinedMetrics: async (timeRange = '1d') => {
    try {
      const response = await http.get(`/api/dashboard/combined?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching combined metrics:', error);
      throw error;
    }
  }
};
