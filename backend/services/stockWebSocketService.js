const WebSocket = require('ws');

class StockWebSocketService {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.heartbeatInterval = null;
    this.subscribedSymbols = new Set();
    this.maxRuntime = 30 * 60 * 1000; // 30 minutes max runtime
    this.startTime = null;
  }

  /**
   * Start WebSocket connection for real-time stock data
   */
  startWebSocket(symbols = []) {
    try {
      console.log('📡 Starting stock WebSocket service...');
      
      // Add default symbols if none provided
      if (symbols.length === 0) {
        symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'JPM', 'JNJ'];
      }

      // Store subscribed symbols
      this.subscribedSymbols = new Set(symbols);
      
      // Create WebSocket connection to a stock data provider
      // For demo purposes, we'll simulate real-time data
      this.simulateRealTimeData();
      
      this.isConnected = true;
      console.log('✅ Stock WebSocket service started successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Error starting stock WebSocket:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Stop WebSocket connection
   */
  stopWebSocket() {
    try {
      console.log('🛑 Stopping stock WebSocket service...');
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      this.isConnected = false;
      this.subscribedSymbols.clear();
      this.startTime = null; // Reset start time
      console.log('✅ Stock WebSocket service stopped successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Error stopping stock WebSocket:', error);
      return false;
    }
  }

  /**
   * Subscribe to stock symbol updates
   */
  subscribe(symbol) {
    this.subscribedSymbols.add(symbol);
    console.log(`📊 Subscribed to ${symbol} updates`);
  }

  /**
   * Unsubscribe from stock symbol updates
   */
  unsubscribe(symbol) {
    this.subscribedSymbols.delete(symbol);
    console.log(`📊 Unsubscribed from ${symbol} updates`);
  }

  /**
   * Add subscriber for real-time updates
   */
  addSubscriber(subscriber) {
    this.subscribers.add(subscriber);
    console.log('👥 Added stock WebSocket subscriber');
  }

  /**
   * Remove subscriber
   */
  removeSubscriber(subscriber) {
    this.subscribers.delete(subscriber);
    console.log('👥 Removed stock WebSocket subscriber');
  }

  /**
   * Broadcast update to all subscribers
   */
  broadcastUpdate(update) {
    this.subscribers.forEach(subscriber => {
      try {
        if (subscriber && typeof subscriber === 'function') {
          subscriber(update);
        }
      } catch (error) {
        console.error('Error broadcasting to subscriber:', error);
      }
    });
  }

  /**
   * Simulate real-time stock data updates
   * In a real implementation, this would connect to a stock data provider's WebSocket
   */
  simulateRealTimeData() {
    console.log('🎭 Starting simulated real-time stock data...');
    this.startTime = Date.now();
    
    // Simulate price updates every 5 seconds
    this.heartbeatInterval = setInterval(() => {
      if (!this.isConnected) return;
      
      // Check if we've exceeded max runtime
      if (this.startTime && (Date.now() - this.startTime) > this.maxRuntime) {
        console.log('⏰ Max runtime exceeded, stopping WebSocket service');
        this.stopWebSocket();
        return;
      }
      
      try {
        const updates = Array.from(this.subscribedSymbols).map(symbol => {
          const basePrice = this.getBasePrice(symbol);
          const change = (Math.random() - 0.5) * 2; // Random change between -1 and +1
          const newPrice = basePrice + change;
          const changePercent = (change / basePrice) * 100;
          
          return {
            symbol,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume: Math.floor(Math.random() * 10000000) + 1000000,
            timestamp: new Date(),
            type: 'price_update'
          };
        });
        
        // Broadcast updates to all subscribers
        updates.forEach(update => {
          this.broadcastUpdate(update);
        });
        
        console.log(`📊 Simulated updates for ${updates.length} stocks`);
      } catch (error) {
        console.error('❌ Error in simulated stock data:', error);
        // Stop the interval if there's an error to prevent hanging
        this.stopWebSocket();
      }
    }, 5000);
  }

  /**
   * Get base price for a stock symbol
   */
  getBasePrice(symbol) {
    const basePrices = {
      'AAPL': 175.0,
      'MSFT': 338.0,
      'GOOGL': 140.0,
      'AMZN': 130.0,
      'TSLA': 250.0,
      'META': 300.0,
      'NVDA': 800.0,
      'NFLX': 500.0,
      'JPM': 142.0,
      'JNJ': 167.0
    };
    
    return basePrices[symbol] || 100.0;
  }

  /**
   * Get connection status
   */
  getStatus() {
    const uptime = this.startTime ? Date.now() - this.startTime : 0;
    const isHealthy = uptime < this.maxRuntime;
    
    return {
      connected: this.isConnected,
      subscribers: this.subscribers.size,
      subscribedSymbols: Array.from(this.subscribedSymbols),
      uptime: uptime,
      isHealthy: isHealthy,
      timestamp: new Date()
    };
  }

  /**
   * Get cached price for a symbol
   */
  getCachedPrice(symbol) {
    // In a real implementation, this would return the last cached price
    // For now, return the base price
    return {
      symbol,
      price: this.getBasePrice(symbol),
      timestamp: new Date()
    };
  }

  /**
   * Health check and auto-restart if needed
   */
  healthCheck() {
    if (this.startTime && (Date.now() - this.startTime) > this.maxRuntime) {
      console.log('🔍 Health check failed: max runtime exceeded, restarting service');
      this.stopWebSocket();
      setTimeout(() => {
        this.startWebSocket(Array.from(this.subscribedSymbols));
      }, 1000);
      return false;
    }
    return true;
  }
}

module.exports = new StockWebSocketService();
