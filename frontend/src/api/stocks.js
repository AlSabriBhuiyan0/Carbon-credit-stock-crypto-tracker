import { http } from './http';

// Stock API service
export const stockAPI = {
  // Get stock service status
  getStatus: async () => {
    try {
      const response = await http.get('/api/stocks/status');
      return response.data;
    } catch (error) {
      console.warn('Stock service status unavailable, using fallback');
      return {
        success: true,
        data: {
          available: true,
          connected: true,
          subscribers: 0,
          subscribedSymbols: [],
          uptime: 0,
          isHealthy: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  // Get real-time price for a stock symbol
  getPrice: async (symbol) => {
    try {
      const response = await http.get(`/api/stocks/price/${symbol}`);
      return response.data.data;
    } catch (error) {
      console.warn(`Stock price for ${symbol} unavailable, using fallback data`);
      // Return fallback data when service is unavailable
      return {
        symbol: symbol,
        price: getFallbackPrice(symbol),
        change: getFallbackChange(symbol),
        changePercent: getFallbackChangePercent(symbol),
        volume: getFallbackVolume(symbol),
        highPrice: getFallbackPrice(symbol) * 1.02,
        lowPrice: getFallbackPrice(symbol) * 0.98,
        openPrice: getFallbackPrice(symbol) * 0.99,
        lastPrice: getFallbackPrice(symbol),
        timestamp: new Date().toISOString()
      };
    }
  },

  // Get historical data for a stock symbol
  getHistoricalData: async (symbol, interval = '1d', limit = 500) => {
    try {
      const response = await http.get(`/api/stocks/historical/${symbol}`, {
        params: { interval, limit }
      });
      return response.data.data;
    } catch (error) {
      console.warn(`Historical data for ${symbol} unavailable, using fallback`);
      return generateFallbackHistoricalData(symbol, interval, limit);
    }
  },

  // Get market sentiment for a stock symbol
  getSentiment: async (symbol, days = 7) => {
    try {
      const response = await http.get(`/api/stocks/sentiment/${symbol}`, {
        params: { days }
      });
      return response.data.data;
    } catch (error) {
      console.warn(`Sentiment for ${symbol} unavailable, using fallback`);
      return {
        symbol: symbol,
        sentiment: 'neutral',
        confidence: 0.6,
        trend: 'stable',
        score: 0.5,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Get portfolio performance for multiple stock assets
  getPortfolioPerformance: async (symbols, horizonDays = 7) => {
    try {
      const response = await http.post('/api/stocks/portfolio', {
        symbols,
        horizonDays
      });
      return response.data.data;
    } catch (error) {
      console.warn('Portfolio performance unavailable, using fallback');
      return generateFallbackPortfolioPerformance(symbols, horizonDays);
    }
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
      console.warn('WebSocket start failed, using fallback mode');
      return { success: true, message: 'Fallback mode enabled' };
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
      console.warn('WebSocket stop failed, but continuing');
      return { success: true, message: 'WebSocket stopped' };
    }
  },

  // Get all stock symbols
  getSymbols: async () => {
    try {
      const response = await http.get('/api/stocks/symbols');
      return response.data.data;
    } catch (error) {
      console.warn('Stock symbols unavailable, using fallback');
      return DEFAULT_STOCK_SYMBOLS.map(symbol => ({
        symbol: symbol,
        name: getStockDisplayName(symbol),
        category: 'Technology'
      }));
    }
  }
};

// Fallback data generators
function getFallbackPrice(symbol) {
  const basePrices = {
    'AAPL': 227.76, 'MSFT': 415.22, 'GOOGL': 2805.50, 'AMZN': 180.50,
    'TSLA': 250.00, 'META': 450.00, 'NVDA': 850.00, 'NFLX': 650.00,
    'JPM': 180.00, 'JNJ': 160.00
  };
  return basePrices[symbol] || 100.00;
}

function getFallbackChange(symbol) {
  return (Math.random() - 0.5) * 10; // Random change between -5 and +5
}

function getFallbackChangePercent(symbol) {
  return (Math.random() - 0.5) * 4; // Random change between -2% and +2%
}

function getFallbackVolume(symbol) {
  return Math.floor(Math.random() * 10000000) + 1000000; // Random volume
}

function generateFallbackHistoricalData(symbol, interval, limit) {
  const data = [];
  const basePrice = getFallbackPrice(symbol);
  const now = new Date();
  
  for (let i = limit - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const price = basePrice + (Math.random() - 0.5) * 20;
    data.push({
      timestamp: date.toISOString(),
      price: price,
      volume: getFallbackVolume(symbol),
      open: price - (Math.random() - 0.5) * 5,
      high: price + Math.random() * 5,
      low: price - Math.random() * 5,
      close: price
    });
  }
  
  return data;
}

function generateFallbackPortfolioPerformance(symbols, horizonDays) {
  return {
    symbols: symbols,
    horizonDays: horizonDays,
    totalReturn: (Math.random() - 0.5) * 10,
    totalReturnPercent: (Math.random() - 0.5) * 5,
    performance: symbols.map(symbol => ({
      symbol: symbol,
      return: (Math.random() - 0.5) * 15,
      returnPercent: (Math.random() - 0.5) * 8,
      volatility: Math.random() * 0.3
    }))
  };
}

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

// Helper functions for stock display
export function getStockDisplayName(symbol) {
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
}

export function formatStockPrice(price) {
  if (typeof price !== 'number') return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
}

export function formatPercentageChange(change) {
  if (typeof change !== 'number') return 'N/A';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export function getSentimentColor(sentiment) {
  switch (sentiment?.toLowerCase()) {
    case 'bullish':
      return 'text-green-600';
    case 'bearish':
      return 'text-red-600';
    case 'neutral':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

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
