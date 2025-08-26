const axios = require('axios');
const WebSocket = require('ws');

class BinanceService {
  constructor() {
    this.baseUrl = 'https://api.binance.com/api/v3';
    this.wsUrl = 'wss://stream.binance.com:9443/ws';
    this.apiKey = process.env.BINANCE_API_KEY;
    this.secretKey = process.env.BINANCE_SECRET_KEY;
    
    // Default crypto pairs to track
    this.DEFAULT_PAIRS = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
      'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'UNIUSDT'
    ];
    
    this.websocket = null;
    this.priceCache = new Map();
    this.subscribers = new Set();
  }

  /**
   * Get real-time price for a crypto pair
   */
  async getRealTimePrice(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/price`, {
        params: { symbol: symbol.toUpperCase() }
      });
      
      const data = response.data;
      this.priceCache.set(symbol, {
        symbol: data.symbol,
        price: parseFloat(data.price),
        timestamp: new Date()
      });
      
      return this.priceCache.get(symbol);
    } catch (error) {
      console.error(`Binance API error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get 24hr ticker statistics
   */
  async get24hrStats(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/24hr`, {
        params: { symbol: symbol.toUpperCase() }
      });
      
      const data = response.data;
      return {
        symbol: data.symbol,
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        weightedAvgPrice: parseFloat(data.weightedAvgPrice),
        prevClosePrice: parseFloat(data.prevClosePrice),
        lastPrice: parseFloat(data.lastPrice),
        lastQty: parseFloat(data.lastQty),
        bidPrice: parseFloat(data.bidPrice),
        askPrice: parseFloat(data.askPrice),
        openPrice: parseFloat(data.openPrice),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
        openTime: new Date(data.openTime),
        closeTime: new Date(data.closeTime),
        count: parseInt(data.count)
      };
    } catch (error) {
      console.error(`Binance 24hr stats error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get historical kline/candlestick data
   */
  async getHistoricalData(symbol, interval = '1d', limit = 500) {
    try {
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: {
          symbol: symbol.toUpperCase(),
          interval: interval,
          limit: limit
        }
      });
      
      return response.data.map(kline => ({
        timestamp: new Date(kline[0]),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: new Date(kline[6]),
        quoteAssetVolume: parseFloat(kline[7]),
        numberOfTrades: parseInt(kline[8]),
        takerBuyBaseAssetVolume: parseFloat(kline[9]),
        takerBuyQuoteAssetVolume: parseFloat(kline[10])
      }));
    } catch (error) {
      console.error(`Binance historical data error for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Get order book for a symbol
   */
  async getOrderBook(symbol, limit = 100) {
    try {
      const response = await axios.get(`${this.baseUrl}/depth`, {
        params: {
          symbol: symbol.toUpperCase(),
          limit: limit
        }
      });
      
      return {
        symbol: symbol,
        lastUpdateId: response.data.lastUpdateId,
        bids: response.data.bids.map(bid => ({
          price: parseFloat(bid[0]),
          quantity: parseFloat(bid[1])
        })),
        asks: response.data.asks.map(ask => ({
          price: parseFloat(ask[0]),
          quantity: parseFloat(ask[1])
        }))
      };
    } catch (error) {
      console.error(`Binance order book error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Start WebSocket connection for real-time price updates
   */
  startWebSocket(symbols = this.DEFAULT_PAIRS) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.close();
    }

    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
    this.websocket = new WebSocket(`${this.wsUrl}/${streams}`);

    this.websocket.on('open', () => {
      console.log('🔌 Binance WebSocket connected');
    });

    this.websocket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.s) { // Symbol exists
          const priceData = {
            symbol: message.s,
            price: parseFloat(message.c), // Current price
            priceChange: parseFloat(message.P), // Price change percent
            volume: parseFloat(message.v), // 24hr volume
            high24h: parseFloat(message.h), // 24hr high
            low24h: parseFloat(message.l), // 24hr low
            timestamp: new Date()
          };
          
          this.priceCache.set(message.s, priceData);
          this.notifySubscribers(priceData);
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });

    this.websocket.on('error', (error) => {
      console.error('Binance WebSocket error:', error);
    });

    this.websocket.on('close', () => {
      if (!this.reconnectAttempts) this.reconnectAttempts = 0;
      
      if (this.reconnectAttempts < 5) {
        console.log(`Binance WebSocket disconnected, reconnecting in 5s... (attempt ${this.reconnectAttempts + 1}/5)`);
        this.reconnectAttempts++;
        setTimeout(() => this.startWebSocket(symbols), 5000);
      } else {
        console.log('Binance WebSocket max reconnection attempts reached, stopping reconnection');
        this.reconnectAttempts = 0;
      }
    });
  }

  /**
   * Subscribe to price updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of price updates
   */
  notifySubscribers(priceData) {
    this.subscribers.forEach(callback => {
      try {
        callback(priceData);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  /**
   * Get all cached prices
   */
  getAllPrices() {
    return Array.from(this.priceCache.values());
  }

  /**
   * Get specific symbol price
   */
  getPrice(symbol) {
    return this.priceCache.get(symbol.toUpperCase());
  }

  /**
   * Stop WebSocket connection
   */
  stopWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Get exchange info
   */
  async getExchangeInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/exchangeInfo`);
      return response.data;
    } catch (error) {
      console.error('Binance exchange info error:', error.message);
      return null;
    }
  }

  /**
   * Get server time
   */
  async getServerTime() {
    try {
      const response = await axios.get(`${this.baseUrl}/time`);
      return new Date(response.data.serverTime);
    } catch (error) {
      console.error('Binance server time error:', error.message);
      return null;
    }
  }

  /**
   * Check if service is available
   */
  async isAvailable() {
    try {
      const serverTime = await this.getServerTime();
      return serverTime !== null;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new BinanceService();
