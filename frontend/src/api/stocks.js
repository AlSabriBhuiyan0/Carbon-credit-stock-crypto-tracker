import { http } from './http';

// Stock API service
export const stockAPI = {
  // Get stock service status
  getStatus: async () => {
    const response = await http.get('/api/stocks/status');
    return response.data;
  },

  // Get real-time price for a stock symbol
  getPrice: async (symbol) => {
    const response = await http.get(`/api/stocks/price/${symbol}`);
    return response.data.data;
  },

  // Get historical data for a stock symbol
  getHistoricalData: async (symbol, interval = '1d', limit = 500) => {
    const response = await http.get(`/api/stocks/historical/${symbol}`, {
      params: { interval, limit }
    });
    return response.data.data;
  },

  // Get market sentiment for a stock symbol
  getSentiment: async (symbol, days = 7) => {
    const response = await http.get(`/api/stocks/sentiment/${symbol}`, {
      params: { days }
    });
    return response.data.data;
  },

  // Get portfolio performance for multiple stock assets
  getPortfolioPerformance: async (symbols, horizonDays = 7) => {
    const response = await http.post('/api/stocks/portfolio', {
      symbols,
      horizonDays
    });
    return response.data.data;
  },

  // Start WebSocket connection for real-time updates
  startWebSocket: async (symbols) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await http.post('/api/stocks/websocket/start', { symbols }, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('WebSocket start request timed out');
      }
      throw error;
    }
  },

  // Stop WebSocket connection
  stopWebSocket: async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await http.post('/api/stocks/websocket/stop', {}, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('WebSocket stop request timed out');
      }
      throw error;
    }
  },

  // Get all stock symbols
  getSymbols: async () => {
    const response = await http.get('/api/stocks/symbols');
    return response.data.data;
  }
};

// Default stock symbols to track
export const DEFAULT_STOCK_SYMBOLS = [
  'AAPL',
  'MSFT', 
  'GOOGL',
  'AMZN',
  'TSLA',
  'META',
  'NVDA',
  'NFLX',
  'JPM',
  'JNJ'
];

// Popular stock symbols for quick access
export const POPULAR_STOCK_SYMBOLS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'TSLA'
];

// Helper functions
export const getStockDisplayName = (symbol) => {
  const names = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.',
    'JPM': 'JPMorgan Chase & Co.',
    'JNJ': 'Johnson & Johnson'
  };
  return names[symbol] || symbol;
};

export const formatStockPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) return '0.00';
  return price.toFixed(2);
};

export const formatPercentageChange = (change) => {
  if (typeof change !== 'number' || isNaN(change)) return '0.00%';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

export const getSentimentColor = (sentiment) => {
  switch (sentiment?.toLowerCase()) {
    case 'bullish':
      return 'text-green-600';
    case 'bearish':
      return 'text-red-600';
    case 'neutral':
    default:
      return 'text-gray-600';
  }
};

export const getSentimentBgColor = (sentiment) => {
  switch (sentiment?.toLowerCase()) {
    case 'bullish':
      return 'bg-green-100';
    case 'bearish':
      return 'bg-red-100';
    case 'neutral':
    default:
      return 'bg-gray-100';
  }
};
