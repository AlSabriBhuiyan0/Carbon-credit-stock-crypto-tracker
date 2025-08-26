const binanceService = require('./binanceService');
const { runProphet } = require('./prophetNodeService');
const { runARIMA } = require('./arimaNodeService');

class CryptoForecastingService {
  constructor() {
    this.binanceService = binanceService;
    this.forecastCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get real-time crypto price with 24hr stats
   */
  async getRealTimePrice(symbol) {
    try {
      console.log(`🔍 Fetching real-time price for ${symbol}...`);
      
      // Try to get from WebSocket cache first
      let price = this.binanceService.getPrice(symbol);
      console.log(`📡 WebSocket cache result for ${symbol}:`, price ? 'Found' : 'Not found');
      
      if (!price) {
        // Fallback to REST API
        console.log(`🌐 Fetching from REST API for ${symbol}...`);
        price = await this.binanceService.getRealTimePrice(symbol);
        console.log(`📊 REST API result for ${symbol}:`, price ? 'Success' : 'Failed');
      }
      
      // Get 24hr stats for price change information
      console.log(`📈 Fetching 24hr stats for ${symbol}...`);
      const stats = await this.binanceService.get24hrStats(symbol);
      console.log(`📊 24hr stats result for ${symbol}:`, stats ? 'Success' : 'Failed');
      
      if (price && stats) {
        const result = {
          ...price,
          priceChange: stats.priceChange,
          priceChangePercent: stats.priceChangePercent,
          volume: stats.volume,
          highPrice: stats.highPrice,
          lowPrice: stats.lowPrice,
          openPrice: stats.openPrice,
          lastPrice: stats.lastPrice
        };
        console.log(`✅ Combined result for ${symbol}:`, result);
        return result;
      }
      
      console.log(`⚠️ Partial data for ${symbol}:`, { price, stats });
      return price;
    } catch (error) {
      console.error(`❌ Error getting real-time price for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get historical data for forecasting
   */
  async getHistoricalData(symbol, interval = '1d', limit = 500) {
    try {
      // Map frontend timeframes to Binance intervals
      const binanceInterval = this.mapTimeframeToBinanceInterval(interval);
      // Use the provided limit parameter instead of calculating it
      console.log(`🕒 Mapping timeframe ${interval} to Binance interval ${binanceInterval} with limit ${limit}`);
      
      const data = await this.binanceService.getHistoricalData(symbol, binanceInterval, limit);
      
      // Transform to forecasting format
      return data.map(item => ({
        timestamp: new Date(item.timestamp), // Convert timestamp to Date object
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume),
        price: parseFloat(item.close) // Use close price for forecasting
      }));
    } catch (error) {
      console.error(`Error getting historical data for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Map frontend timeframes to Binance API intervals
   */
  mapTimeframeToBinanceInterval(timeframe) {
    const mapping = {
      '1d': '1d',    // 1 day
      '7d': '1d',    // 7 days (use 1d interval, limit will determine data points)
      '30d': '1d',   // 30 days (use 1d interval, limit will determine data points)
      '3m': '1d',    // 3 months (use 1d interval, limit will determine data points)
      '6m': '1d',    // 6 months (use 1d interval, limit will determine data points)
      '1y': '1d'     // 1 year (use 1d interval, limit will determine data points)
    };
    
    return mapping[timeframe] || '1d';
  }

  /**
   * Calculate appropriate limit for timeframe
   */
  calculateLimitForTimeframe(timeframe) {
    const limits = {
      '1d': 24,      // 24 hours of hourly data
      '7d': 7,       // 7 days of daily data
      '30d': 30,     // 30 days of daily data
      '3m': 90,      // 90 days of daily data
      '6m': 180,     // 180 days of daily data
      '1y': 365      // 365 days of daily data
    };
    
    return limits[timeframe] || 30;
  }

  /**
   * Generate crypto forecast using Prophet model
   */
  async generateProphetForecast(symbol, horizonDays = 7) {
    try {
      console.log(`🔮 Generating Prophet forecast for ${symbol}...`);
      
      // Get historical data - request more to ensure we have enough
      const historicalData = await this.getHistoricalData(symbol, '1d', 100); // 100 days of data
      
      if (historicalData.length < 30) {
        throw new Error(`Insufficient data for ${symbol}. Need at least 30 data points, got ${historicalData.length}`);
      }
      
      // Transform data for Prophet
      const series = historicalData.map(item => ({
        ds: item.timestamp.toISOString().slice(0, 10),
        y: item.close
      }));
      
      // Generate forecast
      const forecast = await runProphet({
        series,
        horizonDays
      });
      
      // Cache the result
      this.forecastCache.set(`${symbol}_prophet`, {
        forecast,
        timestamp: Date.now()
      });
      
      return {
        symbol,
        model: 'prophet',
        ...forecast,
        dataPoints: historicalData.length,
        lastPrice: historicalData[historicalData.length - 1]?.close,
        currentPrice: await this.getRealTimePrice(symbol)
      };
      
    } catch (error) {
      console.error(`Prophet forecast failed for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate crypto forecast using ARIMA model
   */
  async generateARIMAForecast(symbol, horizonDays = 7) {
    try {
      console.log(`📊 Generating ARIMA forecast for ${symbol}...`);
      
      // Get historical data - request more to ensure we have enough
      const historicalData = await this.getHistoricalData(symbol, '1d', 100); // 100 days of data
      
      if (historicalData.length < 30) {
        throw new Error(`Insufficient data for ${symbol}. Need at least 30 data points, got ${historicalData.length}`);
      }
      
      // Transform data for ARIMA
      const series = historicalData.map((item, index) => ({
        ds: index,
        y: item.close
      }));
      
      // Generate forecast
      const forecast = await runARIMA({
        series,
        horizonDays,
        params: {}
      });
      
      // Cache the result
      this.forecastCache.set(`${symbol}_arima`, {
        forecast,
        timestamp: Date.now()
      });
      
      return {
        symbol,
        model: 'arima',
        ...forecast,
        dataPoints: historicalData.length,
        lastPrice: historicalData[historicalData.length - 1]?.close,
        currentPrice: await this.getRealTimePrice(symbol)
      };
      
    } catch (error) {
      console.error(`ARIMA forecast failed for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate both Prophet and ARIMA forecasts
   */
  async generateBothForecasts(symbol, horizonDays = 7) {
    try {
      console.log(`🔮📊 Generating both forecasts for ${symbol}...`);
      
      const [prophetResult, arimaResult] = await Promise.allSettled([
        this.generateProphetForecast(symbol, horizonDays),
        this.generateARIMAForecast(symbol, horizonDays)
      ]);
      
      const results = {};
      
      if (prophetResult.status === 'fulfilled') {
        results.prophet = prophetResult.value;
      }
      
      if (arimaResult.status === 'fulfilled') {
        results.arima = arimaResult.value;
      }
      
      if (Object.keys(results).length === 0) {
        throw new Error(`Both forecasting models failed for ${symbol}`);
      }
      
      return {
        symbol,
        horizonDays,
        forecasts: results,
        timestamp: new Date(),
        dataPoints: results.prophet?.dataPoints || results.arima?.dataPoints
      };
      
    } catch (error) {
      console.error(`Both forecasts failed for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get market sentiment analysis
   */
  async getMarketSentiment(symbol, days = 7) {
    try {
      const historicalData = await this.getHistoricalData(symbol, '1d', days);
      
      if (historicalData.length < days) {
        throw new Error(`Insufficient data for sentiment analysis`);
      }
      
      const prices = historicalData.map(item => item.close);
      const volumes = historicalData.map(item => item.volume);
      
      // Calculate price momentum
      const priceChange = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
      
      // Calculate volatility
      const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
      const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length) * 100;
      
      // Calculate volume trend
      const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
      const recentVolume = volumes.slice(-3).reduce((sum, vol) => sum + vol, 0) / 3;
      const volumeTrend = ((recentVolume - avgVolume) / avgVolume) * 100;
      
      // Determine sentiment
      let sentiment = 'neutral';
      let confidence = 0.5;
      
      if (priceChange > 5 && volumeTrend > 10) {
        sentiment = 'bullish';
        confidence = Math.min(0.9, 0.5 + (priceChange / 100) + (volumeTrend / 100));
      } else if (priceChange < -5 && volumeTrend > 10) {
        sentiment = 'bearish';
        confidence = Math.min(0.9, 0.5 + Math.abs(priceChange / 100) + (volumeTrend / 100));
      }
      
      return {
        symbol,
        sentiment,
        confidence: Math.round(confidence * 100) / 100,
        metrics: {
          priceChange: Math.round(priceChange * 100) / 100,
          volatility: Math.round(volatility * 100) / 100,
          volumeTrend: Math.round(volumeTrend * 100) / 100
        },
        period: days,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`Sentiment analysis failed for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get portfolio performance for multiple crypto assets
   */
  async getPortfolioPerformance(symbols, horizonDays = 7) {
    try {
      const results = {};
      
      for (const symbol of symbols) {
        try {
          const [price, sentiment] = await Promise.allSettled([
            this.getRealTimePrice(symbol),
            this.getMarketSentiment(symbol, horizonDays)
          ]);
          
          results[symbol] = {
            currentPrice: price.status === 'fulfilled' ? price.value : null,
            sentiment: sentiment.status === 'fulfilled' ? sentiment.value : null,
            error: price.status === 'rejected' ? price.reason?.message : null
          };
        } catch (error) {
          results[symbol] = { error: error.message };
        }
      }
      
      return {
        symbols: Object.keys(results),
        results,
        timestamp: new Date(),
        totalAssets: symbols.length,
        successfulQueries: Object.values(results).filter(r => !r.error).length
      };
      
    } catch (error) {
      console.error('Portfolio performance analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Get cached forecast if still valid
   */
  getCachedForecast(symbol, model) {
    const key = `${symbol}_${model}`;
    const cached = this.forecastCache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.forecast;
    }
    
    return null;
  }

  /**
   * Clear forecast cache
   */
  clearCache() {
    this.forecastCache.clear();
  }

  /**
   * Get service status
   */
  async getServiceStatus() {
    try {
      const binanceStatus = await this.binanceService.isAvailable();
      const serverTime = await this.binanceService.getServerTime();
      
      return {
        available: binanceStatus,
        binanceConnected: binanceStatus,
        serverTime: serverTime,
        websocketActive: !!this.binanceService.websocket,
        cachedForecasts: this.forecastCache.size,
        defaultPairs: this.binanceService.DEFAULT_PAIRS
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = new CryptoForecastingService();
