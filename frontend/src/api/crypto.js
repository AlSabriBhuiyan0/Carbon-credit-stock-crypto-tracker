import { http } from './http';

// Crypto API service
export const cryptoAPI = {
  // Get service status
  getStatus: async () => {
    const response = await http.get('/api/crypto/status');
    return response.data;
  },

  // Get real-time price for a crypto symbol
  getPrice: async (symbol) => {
    const response = await http.get(`/api/crypto/price/${symbol}`);
    return response.data.data; // Extract the actual data from the response
  },

  // Get Prophet forecast for a crypto symbol
  getProphetForecast: async (symbol, horizonDays = 7) => {
    const response = await http.get(`/api/crypto/forecast/prophet/${symbol}`, {
      params: { horizonDays }
    });
    return response.data.data; // Extract the actual data from the response
  },

  // Get ARIMA forecast for a crypto symbol
  getARIMAForecast: async (symbol, horizonDays = 7) => {
    const response = await http.get(`/api/crypto/forecast/arima/${symbol}`, {
      params: { horizonDays }
    });
    return response.data.data; // Extract the actual data from the response
  },

  // Get both Prophet and ARIMA forecasts
  getBothForecasts: async (symbol, horizonDays = 7) => {
    const response = await http.get(`/api/crypto/forecast/both/${symbol}`, {
      params: { horizonDays }
    });
    return response.data.data; // Extract the actual data from the response
  },

  // Get market sentiment for a crypto symbol
  getSentiment: async (symbol, days = 7) => {
    const response = await http.get(`/api/crypto/sentiment/${symbol}`, {
      params: { days }
    });
    return response.data.data; // Extract the actual data from the response
  },

  // Get portfolio performance for multiple crypto assets
  getPortfolioPerformance: async (symbols, horizonDays = 7) => {
    const response = await http.post('/api/crypto/portfolio', {
      symbols,
      horizonDays
    });
    return response.data.data; // Extract the actual data from the response
  },

  // Get historical data for a crypto symbol
  getHistoricalData: async (symbol, interval = '1d', limit = 500) => {
    const response = await http.get(`/api/crypto/historical/${symbol}`, {
      params: { interval, limit }
    });
    return response.data.data; // Extract the actual data from the response
  },

  // Start WebSocket connection for real-time updates
  startWebSocket: async (symbols) => {
    const response = await http.post('/api/crypto/websocket/start', { symbols });
    return response.data;
  },

  // Stop WebSocket connection
  stopWebSocket: async () => {
    const response = await http.post('/api/crypto/websocket/stop');
    return response.data;
  },

  // Clear forecast cache
  clearCache: async () => {
    const response = await http.post('/api/crypto/cache/clear');
    return response.data;
  }
};

// Default crypto symbols to track
export const DEFAULT_CRYPTO_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT', 
  'BNBUSDT',
  'ADAUSDT',
  'SOLUSDT',
  'DOTUSDT',
  'LINKUSDT',
  'MATICUSDT',
  'AVAXUSDT',
  'UNIUSDT'
];

// Popular crypto symbols for quick access
export const POPULAR_CRYPTO_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'ADAUSDT',
  'DOTUSDT'
];

// Crypto symbol display names
export const CRYPTO_DISPLAY_NAMES = {
  'BTCUSDT': 'Bitcoin',
  'ETHUSDT': 'Ethereum',
  'BNBUSDT': 'BNB',
  'ADAUSDT': 'Cardano',
  'SOLUSDT': 'Solana',
  'DOTUSDT': 'Polkadot',
  'LINKUSDT': 'Chainlink',
  'MATICUSDT': 'Polygon',
  'AVAXUSDT': 'Avalanche',
  'UNIUSDT': 'Uniswap'
};

// Get display name for a crypto symbol
export const getCryptoDisplayName = (symbol) => {
  return CRYPTO_DISPLAY_NAMES[symbol] || symbol;
};

// Format crypto price with appropriate decimals
export const formatCryptoPrice = (price) => {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  } else {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })}`;
  }
};

// Format percentage change
export const formatPercentageChange = (change) => {
  const isPositive = change >= 0;
  const formatted = Math.abs(change).toFixed(2);
  return `${isPositive ? '+' : '-'}${formatted}%`;
};

// Get sentiment color
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

// Get sentiment background color
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
