const WebSocket = require('ws');
const EventEmitter = require('events');

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

    return new Promise((resolve, reject) => {
      try {
        service.ws = new WebSocket(this.config.binance.url + 'btcusdt@trade');
        
        service.ws.on('open', () => {
          console.log('[BINANCE] WebSocket connected');
          service.connected = true;
          service.reconnectAttempts = 0;
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
          this.handleBinanceReconnect();
        });

        service.ws.on('error', (error) => {
          console.error('[BINANCE] WebSocket error:', error);
          service.connected = false;
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
    
    service.pingInterval = setInterval(() => {
      if (service.ws && service.ws.readyState === WebSocket.OPEN) {
        service.ws.ping();
      }
    }, this.config.binance.pingInterval);

    service.pongTimeout = setTimeout(() => {
      if (service.ws && service.ws.readyState === WebSocket.OPEN) {
        console.log('[BINANCE] Pong timeout, closing connection');
        service.ws.close();
      }
    }, this.config.binance.pongTimeout);
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
        // For now, simulate stock data since we don't have real WebSocket
        console.log('[STOCKS] Starting simulated stock service');
        service.connected = true;
        
        // Simulate real-time stock data
        service.simulationInterval = setInterval(() => {
          if (service.isActive && service.subscribedSymbols.length > 0) {
            service.subscribedSymbols.forEach(symbol => {
              const mockPrice = this.generateMockStockPrice(symbol);
              this.processStockData(symbol, mockPrice);
            });
          }
        }, 2000);
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateMockStockPrice(symbol) {
    const basePrices = {
      'AAPL': 175,
      'MSFT': 540,
      'TSLA': 376,
      'GOOGL': 2800,
      'AMZN': 3300
    };
    
    const basePrice = basePrices[symbol] || 100;
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    return basePrice * (1 + variation);
  }

  processStockData(symbol, price) {
    const timestamp = new Date();
    
    this.cache.stocks.set(symbol, {
      symbol,
      price,
      timestamp
    });

    this.emit('stockData', {
      symbol,
      price,
      timestamp
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
