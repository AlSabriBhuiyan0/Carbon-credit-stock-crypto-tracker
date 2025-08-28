const WebSocket = require('ws');
const EventEmitter = require('events');

// Fetch polyfill for older Node.js versions
const fetch = globalThis.fetch || require('node-fetch');

class UnifiedWebSocketService extends EventEmitter {
  constructor() {
    super();
    
    // Service states
    this.services = {
      binance: {
        ws: null,
        connected: false,
        subscribers: 0,
        subscribedSymbols: [],
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectDelay: 5000,
        isActive: false
      },
      stocks: {
        ws: null,
        connected: false,
        subscribers: 0,
        subscribedSymbols: [],
        reconnectAttempts: 0,
        maxReconnectAttempts: 3,
        reconnectDelay: 3000,
        isActive: false
      },
      carbon: {
        ws: null,
        connected: false,
        subscribers: 0,
        subscribedSymbols: [],
        reconnectAttempts: 0,
        maxReconnectAttempts: 3,
        reconnectDelay: 5000,
        isActive: false
      }
    };

    // Service URLs and configurations
    this.config = {
      binance: {
        url: 'wss://stream.binance.com:9443/ws/',
        pingInterval: 30000,
        pongTimeout: 10000
      },
      stocks: {
        url: 'wss://ws.finnhub.io?token=YOUR_FINNHUB_TOKEN', // Mock for now
        pingInterval: 30000,
        pongTimeout: 10000
      },
      carbon: {
        url: 'wss://api.unfccc.int/ws', // Mock for now
        pingInterval: 60000,
        pongTimeout: 15000
      }
    };

    // Data caches
    this.cache = {
      binance: new Map(),
      stocks: new Map(),
      carbon: new Map()
    };

    // Health monitoring
    this.healthCheckInterval = null;
    this.startHealthMonitoring();
  }

  // ===== SERVICE MANAGEMENT =====

  async startService(serviceName) {
    if (!this.services[serviceName]) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const service = this.services[serviceName];
    
    if (service.isActive) {
      console.log(`[${serviceName.toUpperCase()}] Service already active`);
      return { success: true, message: 'Service already active' };
    }

    try {
      console.log(`[${serviceName.toUpperCase()}] Starting service...`);
      
      switch (serviceName) {
        case 'binance':
          await this.startBinanceService();
          break;
        case 'stocks':
          await this.startStockService();
          break;
        case 'carbon':
          await this.startCarbonService();
          break;
        default:
          throw new Error(`Unsupported service: ${serviceName}`);
      }

      service.isActive = true;
      this.emit('serviceStarted', { service: serviceName, timestamp: new Date() });
      
      return { success: true, message: `${serviceName} service started successfully` };
    } catch (error) {
      console.error(`[${serviceName.toUpperCase()}] Failed to start service:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async stopService(serviceName) {
    if (!this.services[serviceName]) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const service = this.services[serviceName];
    
    if (!service.isActive) {
      console.log(`[${serviceName.toUpperCase()}] Service not active`);
      return { success: true, message: 'Service not active' };
    }

    try {
      console.log(`[${serviceName.toUpperCase()}] Stopping service...`);
      
      if (service.ws) {
        service.ws.close();
        service.ws = null;
      }

      // Clean up service-specific timers
      if (serviceName === 'binance') {
        if (service.pingInterval) {
          clearInterval(service.pingInterval);
          service.pingInterval = null;
        }
        if (service.pongTimeout) {
          clearTimeout(service.pongTimeout);
          service.pongTimeout = null;
        }
      } else if (serviceName === 'stocks') {
        if (service.dataInterval) {
          clearInterval(service.dataInterval);
          service.dataInterval = null;
        }
      } else if (serviceName === 'carbon') {
        if (service.simulationInterval) {
          clearInterval(service.simulationInterval);
          service.simulationInterval = null;
        }
      }
      
      service.connected = false;
      service.isActive = false;
      service.subscribers = 0;
      service.subscribedSymbols = [];
      service.reconnectAttempts = 0;
      
      this.emit('serviceStopped', { service: serviceName, timestamp: new Date() });
      
      return { success: true, message: `${serviceName} service stopped successfully` };
    } catch (error) {
      console.error(`[${serviceName.toUpperCase()}] Failed to stop service:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ===== BINANCE SERVICE =====

  async startBinanceService() {
    const service = this.services.binance;
    
    if (service.ws && service.ws.readyState === WebSocket.OPEN) {
      service.ws.close();
    }

    // Define all crypto symbols to track
    const cryptoSymbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 
      'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'UNIUSDT',
      'XRPUSDT', 'DOGEUSDT', 'LTCUSDT', 'BCHUSDT', 'ATOMUSDT',
      'NEARUSDT', 'FTMUSDT', 'ALGOUSDT', 'VETUSDT', 'ICPUSDT'
    ];

    return new Promise((resolve, reject) => {
      try {
        // Subscribe to all crypto symbols
        const streams = cryptoSymbols.map(symbol => symbol.toLowerCase() + '@trade').join('/');
        service.ws = new WebSocket(this.config.binance.url + streams);
        
        service.ws.on('open', () => {
          console.log('[BINANCE] WebSocket connected to', cryptoSymbols.length, 'crypto symbols');
          service.connected = true;
          service.reconnectAttempts = 0;
          service.subscribedSymbols = cryptoSymbols;
          
          // Initialize cache with default data for all symbols
          cryptoSymbols.forEach(symbol => {
            this.cache.binance.set(symbol, {
              symbol,
              price: 0,
              quantity: 0,
              timestamp: new Date()
            });
          });
          
          this.setupBinancePingPong();
          resolve();
        });

        service.ws.on('message', (data) => {
          try {
            const trade = JSON.parse(data);
            this.processBinanceData(trade);
          } catch (error) {
            console.error('[BINANCE] Failed to parse message:', error);
          }
        });

        service.ws.on('close', () => {
          console.log('[BINANCE] WebSocket closed');
          service.connected = false;
          // Clear ping/pong timers
          if (service.pingInterval) {
            clearInterval(service.pingInterval);
            service.pingInterval = null;
          }
          if (service.pongTimeout) {
            clearTimeout(service.pongTimeout);
            service.pongTimeout = null;
          }
          this.handleBinanceReconnect();
        });

        service.ws.on('error', (error) => {
          console.error('[BINANCE] WebSocket error:', error);
          service.connected = false;
        });

        // Handle pong responses
        service.ws.on('pong', () => {
          // Clear pong timeout when we receive pong
          if (service.pongTimeout) {
            clearTimeout(service.pongTimeout);
            service.pongTimeout = null;
          }
        });

        // Timeout for connection
        setTimeout(() => {
          if (!service.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  setupBinancePingPong() {
    const service = this.services.binance;
    
    // Clear any existing intervals
    if (service.pingInterval) {
      clearInterval(service.pingInterval);
    }
    if (service.pongTimeout) {
      clearTimeout(service.pongTimeout);
    }
    
    service.pingInterval = setInterval(() => {
      if (service.ws && service.ws.readyState === WebSocket.OPEN) {
        // Clear previous pong timeout
        if (service.pongTimeout) {
          clearTimeout(service.pongTimeout);
        }
        
        // Send ping
        service.ws.ping();
        
        // Set new pong timeout for this ping
        service.pongTimeout = setTimeout(() => {
          if (service.ws && service.ws.readyState === WebSocket.OPEN) {
            console.log('[BINANCE] Pong timeout, closing connection');
            service.ws.close();
          }
        }, this.config.binance.pongTimeout);
      }
    }, this.config.binance.pingInterval);
  }

  handleBinanceReconnect() {
    const service = this.services.binance;
    
    if (service.reconnectAttempts >= service.maxReconnectAttempts) {
      console.log('[BINANCE] Max reconnection attempts reached');
      return;
    }

    service.reconnectAttempts++;
    console.log(`[BINANCE] Attempting reconnection ${service.reconnectAttempts}/${service.maxReconnectAttempts}`);
    
    setTimeout(() => {
      if (service.isActive) {
        this.startBinanceService().catch(console.error);
      }
    }, service.reconnectDelay);
  }

  processBinanceData(trade) {
    if (trade.s && trade.p && trade.q) {
      const symbol = trade.s;
      const price = parseFloat(trade.p);
      const quantity = parseFloat(trade.q);
      const timestamp = new Date(trade.T);
      
      this.cache.binance.set(symbol, {
        price,
        quantity,
        timestamp,
        symbol
      });

      this.emit('binanceData', {
        symbol,
        price,
        quantity,
        timestamp
      });
    }
  }

  // ===== STOCK SERVICE =====

  async startStockService() {
    const service = this.services.stocks;
    
    if (service.ws && service.ws.readyState === WebSocket.OPEN) {
      service.ws.close();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('[STOCKS] Starting real stock data service');
        service.connected = true;
        service.isActive = true;
        service.startTime = Date.now();
        
        // Fetch real stock data periodically
        this.fetchRealStockData();
        service.dataInterval = setInterval(() => {
          if (service.isActive) {
            this.fetchRealStockData();
          }
        }, 30000); // Fetch every 30 seconds to respect API limits
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async fetchRealStockData() {
    const service = this.services.stocks;
    const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'JPM', 'JNJ'];
    
    console.log('[STOCKS] Fetching real stock data for symbols:', stockSymbols);
    
    try {
      // Use Yahoo Finance API (free, no API key required)
      const promises = stockSymbols.map(async (symbol) => {
        try {
          const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          const quote = data.chart.result[0];
          const meta = quote.meta;
          const currentPrice = meta.regularMarketPrice || meta.previousClose;
          const previousClose = meta.previousClose;
          const change = currentPrice - previousClose;
          const changePercent = (change / previousClose) * 100;
          
          console.log(`[STOCKS] ${symbol}: $${currentPrice.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}, ${changePercent.toFixed(2)}%)`);
          
          // Store in cache and process
          this.processStockData(symbol, {
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            volume: meta.regularMarketVolume || 0,
            previousClose: previousClose,
            timestamp: new Date()
          });
          
          return { symbol, price: currentPrice, success: true };
        } catch (error) {
          console.error(`[STOCKS] Error fetching ${symbol}:`, error.message);
          // Use fallback price if API fails
          const fallbackPrice = this.generateFallbackStockPrice(symbol);
          this.processStockData(symbol, fallbackPrice);
          return { symbol, price: fallbackPrice.price, success: false };
        }
      });
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      console.log(`[STOCKS] Successfully fetched ${successful}/${results.length} stock prices`);
      
    } catch (error) {
      console.error('[STOCKS] Error in fetchRealStockData:', error);
    }
  }

  generateFallbackStockPrice(symbol) {
    const basePrices = {
      'AAPL': 227.76,
      'MSFT': 415.22,
      'GOOGL': 206.09,
      'AMZN': 180.50,
      'TSLA': 250.00,
      'META': 450.00,
      'NVDA': 850.00,
      'NFLX': 650.00,
      'JPM': 180.00,
      'JNJ': 160.00
    };
    
    const basePrice = basePrices[symbol] || 100;
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const price = basePrice * (1 + variation);
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / price) * 100;
    
    return {
      price: price,
      change: change,
      changePercent: changePercent,
      volume: Math.floor(Math.random() * 10000000),
      previousClose: price - change,
      timestamp: new Date()
    };
  }

  processStockData(symbol, stockData) {
    // Handle both old format (just price) and new format (full data object)
    const data = typeof stockData === 'number' ? {
      price: stockData,
      change: 0,
      changePercent: 0,
      volume: 0,
      previousClose: stockData,
      timestamp: new Date()
    } : stockData;
    
    this.cache.stocks.set(symbol, {
      symbol,
      price: data.price,
      change: data.change || 0,
      changePercent: data.changePercent || 0,
      volume: data.volume || 0,
      previousClose: data.previousClose || data.price,
      timestamp: data.timestamp || new Date()
    });

    this.emit('stockData', {
      symbol,
      price: data.price,
      change: data.change || 0,
      changePercent: data.changePercent || 0,
      volume: data.volume || 0,
      previousClose: data.previousClose || data.price,
      timestamp: data.timestamp || new Date()
    });
  }

  // ===== CARBON SERVICE =====

  async startCarbonService() {
    const service = this.services.carbon;
    
    if (service.ws && service.ws.readyState === WebSocket.OPEN) {
      service.ws.close();
    }

    return new Promise((resolve, reject) => {
      try {
        // For now, simulate carbon credit data
        console.log('[CARBON] Starting simulated carbon service');
        service.connected = true;
        service.isActive = true;
        service.startTime = Date.now();
        
        // Simulate real-time carbon data
        service.simulationInterval = setInterval(() => {
          if (service.isActive && service.subscribedSymbols.length > 0) {
            service.subscribedSymbols.forEach(symbol => {
              const mockPrice = this.generateMockCarbonPrice(symbol);
              this.processCarbonData(symbol, mockPrice);
            });
          }
        }, 5000);
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateMockCarbonPrice(symbol) {
    const basePrices = {
      'EUA': 85,
      'CCA': 30,
      'RGGI': 15,
      'VER': 5
    };
    
    const basePrice = basePrices[symbol] || 50;
    const variation = (Math.random() - 0.5) * 0.01; // ±0.5% variation
    return basePrice * (1 + variation);
  }

  processCarbonData(symbol, price) {
    const timestamp = new Date();
    
    this.cache.carbon.set(symbol, {
      symbol,
      price,
      timestamp
    });

    this.emit('carbonData', {
      symbol,
      price,
      timestamp
    });
  }

  // ===== SUBSCRIPTION MANAGEMENT =====

  subscribe(serviceName, symbol) {
    if (!this.services[serviceName]) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const service = this.services[serviceName];
    
    if (!service.subscribedSymbols.includes(symbol)) {
      service.subscribedSymbols.push(symbol);
    }
    
    service.subscribers++;
    
    console.log(`[${serviceName.toUpperCase()}] Subscribed to ${symbol}. Total subscribers: ${service.subscribers}`);
    
    return { success: true, subscribers: service.subscribers };
  }

  unsubscribe(serviceName, symbol) {
    if (!this.services[serviceName]) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const service = this.services[serviceName];
    
    const index = service.subscribedSymbols.indexOf(symbol);
    if (index > -1) {
      service.subscribedSymbols.splice(index, 1);
    }
    
    if (service.subscribers > 0) {
      service.subscribers--;
    }
    
    console.log(`[${serviceName.toUpperCase()}] Unsubscribed from ${symbol}. Total subscribers: ${service.subscribers}`);
    
    return { success: true, subscribers: service.subscribers };
  }

  // ===== DATA RETRIEVAL =====

  getData(serviceName, symbol) {
    if (!this.services[serviceName]) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    return this.cache[serviceName].get(symbol) || null;
  }

  getAllData(serviceName) {
    if (!this.services[serviceName]) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    return Array.from(this.cache[serviceName].values());
  }

  // ===== HEALTH MONITORING =====

  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      this.checkServiceHealth();
    }, 30000); // Check every 30 seconds
  }

  checkServiceHealth() {
    Object.entries(this.services).forEach(([serviceName, service]) => {
      if (service.isActive && !service.connected) {
        console.warn(`[${serviceName.toUpperCase()}] Service marked as active but not connected`);
        
        // Attempt to restart if it's been disconnected for too long
        if (service.reconnectAttempts < service.maxReconnectAttempts) {
          console.log(`[${serviceName.toUpperCase()}] Attempting to restart disconnected service`);
          this.startService(serviceName).catch(console.error);
        }
      }
    });
  }

  // ===== SERVICE STATUS =====

  getServiceStatus(serviceName) {
    if (!this.services[serviceName]) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const service = this.services[serviceName];
    
    return {
      available: service.isActive,
      connected: service.connected,
      subscribers: service.subscribers,
      subscribedSymbols: [...service.subscribedSymbols],
      uptime: service.isActive ? Date.now() - (service.startTime || Date.now()) : 0,
      isHealthy: service.connected && service.isActive,
      timestamp: new Date()
    };
  }

  getAllServicesStatus() {
    const status = {};
    
    Object.keys(this.services).forEach(serviceName => {
      status[serviceName] = this.getServiceStatus(serviceName);
    });
    
    return status;
  }

  // ===== CLEANUP =====

  async stopAllServices() {
    console.log('[UNIFIED] Stopping all services...');
    
    const promises = Object.keys(this.services).map(serviceName => 
      this.stopService(serviceName)
    );
    
    await Promise.all(promises);
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    console.log('[UNIFIED] All services stopped');
  }

  cleanup() {
    this.stopAllServices();
    this.removeAllListeners();
  }
}

// Create singleton instance
const unifiedWebSocketService = new UnifiedWebSocketService();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[UNIFIED] Received SIGINT, shutting down gracefully...');
  await unifiedWebSocketService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[UNIFIED] Received SIGTERM, shutting down gracefully...');
  await unifiedWebSocketService.cleanup();
  process.exit(0);
});

module.exports = unifiedWebSocketService;
