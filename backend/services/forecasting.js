const StockPostgreSQL = require('../models/StockPostgreSQL');
const CarbonCreditPostgreSQL = require('../models/CarbonCreditPostgreSQL');
const { runProphet } = require('./prophetNodeService');
const { runARIMA } = require('./arimaNodeService');
const dataIngestionService = require('./dataIngestion');

class ForecastingService {
  constructor() {
    // No direct database pool needed - use models instead
  }

  async generateStockForecast(symbol, days = 30, model = 'simple', options = {}) {
    try {
      console.log(`Generating ${days}-day forecast for ${symbol} using ${model}`);
      
      // Get historical data - fetch more data for better predictions (7 days to 2 years)
      const requiredDays = Math.max(365, days * 3); // Get at least 3x the forecast period
      let historicalData = await this.getStockHistoricalData(symbol, requiredDays);
      
      // Only use real data - if insufficient data, throw error
      if (!historicalData || historicalData.length < 50) {
        throw new Error(`Insufficient real historical data for ${symbol}. Got ${historicalData?.length || 0} data points, need at least 50 for accurate predictions.`);
      }
      
      // Validate data quality
      const dataQuality = this.validateDataQuality(historicalData, symbol);
      console.log(`Data quality for ${symbol}: ${Math.round(dataQuality.dataQuality * 100)}% (${dataQuality.validPrices}/${dataQuality.totalPoints} valid prices)`);
      
      if (dataQuality.dataQuality < 0.7) {
        console.warn(`Warning: Low data quality for ${symbol} (${Math.round(dataQuality.dataQuality * 100)}%). Forecast accuracy may be reduced.`);
      }
      
      // Prophet path
      if (model === 'prophet') {
        console.log(`🔮 Attempting Prophet forecast for ${symbol} with ${historicalData.length} data points`);
        const series = historicalData.map(r => ({
          ds: new Date(r.timestamp).toISOString().slice(0,10),
          y: parseFloat(r.close || r.price || 0)
        })).filter(item => !isNaN(item.y) && item.y > 0);
        
        console.log(`🔮 Prophet: Valid data points: ${series.length}`);
        
        if (series.length < 50) {
          console.error(`Prophet: Not enough valid data for ${symbol}. Got ${series.length} rows, need 50+ for accurate predictions`);
          // Fall back to simple model
          return this.calculateStockForecast(historicalData, days);
        }
        
        try {
          console.log(`🔮 Calling Prophet service for ${symbol}...`);
          const result = await runProphet({
            series,
            horizonDays: options.horizonDays ?? days,
            params: options.params || {}
          });
          console.log(`🔮 Prophet service returned:`, result);
          return { symbol, model: 'prophet', ...result };
        } catch (error) {
          console.error(`Prophet forecast failed for ${symbol}:`, error.message);
          // Fall back to simple model
          return this.calculateStockForecast(historicalData, days);
        }
      }
      
      // ARIMA path - Statistical model needs pure numeric data
      if (model === 'arima') {
        console.log(`📊 Attempting ARIMA forecast for ${symbol} with ${historicalData.length} data points`);
        // Extract only the price values for ARIMA (statistical time series)
        const priceData = historicalData
          .map(r => parseFloat(r.close || r.price || 0))
          .filter(price => !isNaN(price) && price > 0);
        
        console.log(`📊 ARIMA: Valid price data points: ${priceData.length}`);
        
        if (priceData.length < 50) {
          console.error(`ARIMA: Not enough valid data for ${symbol}. Got ${priceData.length} rows, need 50+ for accurate predictions`);
          // Fall back to simple model
          return this.calculateStockForecast(historicalData, days);
        }
        
        try {
          console.log(`📊 Calling ARIMA service for ${symbol}...`);
          // Convert plain price array to expected format with ds and y keys
          const arimaSeries = priceData.map((price, index) => ({
            ds: index,
            y: price
          }));
          
          const result = await runARIMA({
            series: arimaSeries, // Send as series with ds and y keys
            horizonDays: options.horizonDays ?? days,
            params: options.params || {}
          });
          console.log(`📊 ARIMA service returned:`, result);
          return { symbol, model: 'arima', ...result };
        } catch (error) {
          console.error(`ARIMA forecast failed for ${symbol}:`, error.message);
          // Fall back to simple model
          return this.calculateStockForecast(historicalData, days);
        }
      }

      // Both Prophet and ARIMA path
      if (model === 'both') {
        console.log(`🔮📊 Attempting both Prophet and ARIMA forecasts for ${symbol} with ${historicalData.length} data points`);
        
        const results = {};
        
        // Try Prophet first
        try {
          console.log(`🔮 Attempting Prophet forecast for ${symbol}...`);
          const series = historicalData.map(r => ({
            ds: new Date(r.timestamp).toISOString().slice(0,10),
            y: parseFloat(r.close || r.price || 0)
          })).filter(item => !isNaN(item.y) && item.y > 0);
          
          if (series.length >= 50) {
            const prophetResult = await runProphet({
              series,
              horizonDays: options.horizonDays ?? days,
              params: options.params || {}
            });
            results.prophet = { symbol, model: 'prophet', ...prophetResult };
            console.log(`🔮 Prophet forecast successful for ${symbol}`);
          } else {
            console.warn(`Prophet: Not enough valid data for ${symbol}. Got ${series.length} rows, need 50+`);
          }
        } catch (error) {
          console.error(`Prophet forecast failed for ${symbol}:`, error.message);
        }
        
        // Try ARIMA
        try {
          console.log(`📊 Attempting ARIMA forecast for ${symbol}...`);
          const priceData = historicalData
            .map(r => parseFloat(r.close || r.price || 0))
            .filter(price => !isNaN(price) && price > 0);
          
          if (priceData.length >= 50) {
            const arimaSeries = priceData.map((price, index) => ({
              ds: index,
              y: price
            }));
            
            const arimaResult = await runARIMA({
              series: arimaSeries,
              horizonDays: options.horizonDays ?? days,
              params: options.params || {}
            });
            results.arima = { symbol, model: 'arima', ...arimaResult };
            console.log(`📊 ARIMA forecast successful for ${symbol}`);
          } else {
            console.warn(`ARIMA: Not enough valid data for ${symbol}. Got ${priceData.length} rows, need 50+`);
          }
        } catch (error) {
          console.error(`ARIMA forecast failed for ${symbol}:`, error.message);
        }
        
        // If both failed, fall back to simple model
        if (Object.keys(results).length === 0) {
          console.warn(`Both Prophet and ARIMA failed for ${symbol}, falling back to simple model`);
          const simpleForecast = this.calculateStockForecast(historicalData, days);
          results.simple = { symbol, model: 'simple', ...simpleForecast };
        }
        
        // Store forecasts in database
        for (const [modelType, forecast] of Object.entries(results)) {
          await this.storeStockForecast(symbol, forecast);
        }
        
        console.log(`Both forecasts generated for ${symbol}: ${days} days`);
        return results;
      }

      // Simple path
      const forecast = this.calculateStockForecast(historicalData, days);
      
      // Store forecast in database
      await this.storeStockForecast(symbol, forecast);
      
      console.log(`Stock forecast generated for ${symbol}: ${days} days`);
      return forecast;
      
    } catch (error) {
      console.error(`Stock forecasting failed for ${symbol}:`, error.message);
      throw error;
    }
  }

  async generateCarbonCreditForecast(projectType, days = 30) {
    try {
      console.log(`Generating ${days}-day forecast for ${projectType} carbon credits`);
      
      // Get historical carbon credit data - fetch more data for better predictions
      const requiredDays = Math.max(365, days * 3); // Get at least 3x the forecast period
      const historicalData = await this.getCarbonHistoricalData(projectType, requiredDays);
      
      if (!historicalData || historicalData.length === 0) {
        throw new Error(`Insufficient historical data for carbon credit forecasting. Got ${historicalData?.length || 0} data points, need at least 50 for accurate predictions.`);
      }
      
      // Generate forecast using trend analysis
      const forecast = this.calculateCarbonForecast(historicalData, days);
      
      // Store forecast in database
      await this.storeCarbonForecast(projectType, forecast);
      
      console.log(`Carbon credit forecast generated for ${projectType}: ${days} days`);
      return forecast;
      
    } catch (error) {
      console.error(`Carbon credit forecasting failed for ${projectType}:`, error.message);
      throw error;
    }
  }

  async getStockHistoricalData(symbol, days) {
    try {
      // Always use data ingestion service for real-time data
      console.log(`Fetching real-time data for ${symbol} from Yahoo Finance...`);
      
      // Enhanced range mapping for better data coverage
      let range, interval;
      if (days <= 7) {
        range = '1mo';
        interval = '1d';
      } else if (days <= 30) {
        range = '3mo';
        interval = '1d';
      } else if (days <= 90) {
        range = '6mo';
        interval = '1d';
      } else if (days <= 180) {
        range = '1y';
        interval = '1d';
      } else if (days <= 365) {
        range = '2y';
        interval = '1d';
      } else {
        range = '5y';
        interval = '1d';
      }
      
      console.log(`Fetching ${range} data with ${interval} interval for ${symbol}`);
      const ingestionData = await dataIngestionService.getYahooFinanceHistory(symbol, range, interval);
      
      if (ingestionData && ingestionData.length > 0) {
        console.log(`✅ Got ${ingestionData.length} real data points for ${symbol}`);
        
        // Validate and clean the data
        const validData = ingestionData
          .filter(row => row && row.close && row.price && row.timestamp)
          .map(row => ({
            price: parseFloat(row.price) || parseFloat(row.close),
            volume: parseFloat(row.volume) || 0,
            timestamp: new Date(row.timestamp),
            close: parseFloat(row.close) || parseFloat(row.price),
            symbol: symbol
          }))
          .filter(item => !isNaN(item.price) && !isNaN(item.close) && item.price > 0 && item.close > 0);
        
        if (validData.length === 0) {
          throw new Error(`No valid price data found for ${symbol}`);
        }
        
        console.log(`✅ Validated ${validData.length} data points for ${symbol}`);
        return validData;
      }
      
      throw new Error(`No real data available for ${symbol} from Yahoo Finance`);
      
    } catch (error) {
      console.error(`Error fetching stock historical data for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch real data for ${symbol}: ${error.message}`);
    }
  }

  async getCarbonHistoricalData(projectType, days) {
    try {
      // Use the CarbonCreditPostgreSQL model instead of direct database queries
      const historicalData = await CarbonCreditPostgreSQL.getCreditHistory(projectType, days);
      
      if (!historicalData || historicalData.length === 0) {
        throw new Error(`No real carbon credit data available for ${projectType}`);
      }
      
      // Validate and clean the data
      const validData = historicalData
        .filter(row => row && row.price && row.credits_issued)
        .map(row => ({
          price: parseFloat(row.price) || 0,
          credits_issued: parseFloat(row.credits_issued) || 0,
          timestamp: new Date(row.timestamp || Date.now()),
          type: row.type || projectType
        }))
        .filter(item => !isNaN(item.price) && !isNaN(item.credits_issued) && item.price > 0);
      
      if (validData.length === 0) {
        throw new Error(`No valid carbon credit data found for ${projectType}`);
      }
      
      console.log(`✅ Validated ${validData.length} carbon credit data points for ${projectType}`);
      return validData;
      
    } catch (error) {
      console.error(`Error fetching carbon historical data for ${projectType}:`, error.message);
      throw new Error(`Failed to fetch real carbon data for ${projectType}: ${error.message}`);
    }
  }

  calculateStockForecast(historicalData, days) {
    // Coerce numeric values and drop invalids
    const pricesRaw = historicalData.map(d => Number(d.price)).filter(v => Number.isFinite(v) && v > 0);
    const volumesRaw = historicalData.map(d => Number(d.volume || 0)).filter(v => Number.isFinite(v) && v >= 0);
    const prices = pricesRaw.length ? pricesRaw : [0];
    const volumes = volumesRaw.length ? volumesRaw : [0];
    
    if (prices.length < 10) {
      throw new Error('Insufficient price data for forecasting');
    }
    
    // Calculate moving averages with more data points for better accuracy
    const shortMA = this.calculateMovingAverage(prices, Math.min(20, Math.floor(prices.length * 0.1)));
    const longMA = this.calculateMovingAverage(prices, Math.min(60, Math.floor(prices.length * 0.3)));
    
    // Calculate trend using more sophisticated analysis
    const trend = this.calculateTrend(prices);
    
    // Calculate volatility with better statistical methods
    const volatility = this.calculateVolatility(prices);
    
    // Generate forecast using more sophisticated methods
    const forecast = [];
    let currentPrice = prices[prices.length - 1];
    
    // Use exponential smoothing and trend analysis
    const alpha = 0.3; // Smoothing factor
    let smoothedPrice = currentPrice;
    
    for (let i = 1; i <= days; i++) {
      // Apply trend with exponential smoothing
      const trendFactor = 1 + (trend * i / 100);
      const volatilityFactor = 1 + (Math.random() - 0.5) * Math.min(volatility, 0.15);
      
      // Use moving average crossover for trend confirmation
      const maTrend = shortMA > longMA ? 1.001 : 0.999;
      
      const predictedPrice = Number(currentPrice) * trendFactor * volatilityFactor * Math.pow(maTrend, i);
      
      // Apply exponential smoothing
      smoothedPrice = alpha * predictedPrice + (1 - alpha) * smoothedPrice;
      
      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        price: Math.max(0, smoothedPrice),
        confidence: Math.max(0.1, 1 - (i * 0.015)), // Slower confidence decay
        factors: {
          trend: trend,
          volatility: volatility,
          shortMA: shortMA,
          longMA: longMA,
          maTrend: maTrend,
          smoothingFactor: alpha
        }
      });
    }
    
    const pricesOnly = forecast.map(f => Number(f.price)).filter(v => Number.isFinite(v));
    const minPrice = pricesOnly.length ? Math.min(...pricesOnly) : Number(currentPrice) || 0;
    const maxPrice = pricesOnly.length ? Math.max(...pricesOnly) : Number(currentPrice) || 0;

    // Provide a uniform shape with 'model', 'next', and 'path'
    const path = forecast.map((f, idx) => ({
      ds: new Date(Date.now() + (idx + 1) * 24 * 60 * 60 * 1000).toISOString().slice(0,10),
      yhat: Number(f.price),
      yhat_lower: Math.max(0, Number(f.price) * (1 - Math.min(volatility, 0.2))),
      yhat_upper: Number(f.price) * (1 + Math.min(volatility, 0.2))
    }));

    const next = path[0] || null;

    return {
      symbol: historicalData[0]?.symbol || 'UNKNOWN',
      model: 'simple',
      horizonDays: days,
      next,
      path,
      forecast,
      summary: {
        trend: trend > 0 ? 'Bullish' : 'Bearish',
        confidence: forecast[0]?.confidence || 0,
        volatility: volatility,
        priceRange: { min: minPrice, max: maxPrice }
      }
    };
  }

  calculateCarbonForecast(historicalData, days) {
    const prices = historicalData.map(d => d.price);
    const volumes = historicalData.map(d => d.credits_issued);
    
    if (prices.length < 10) {
      throw new Error('Insufficient carbon credit data for forecasting');
    }
    
    // Calculate price trend with validation
    const priceTrend = this.calculateTrend(prices);
    
    // Calculate volume trend with validation
    const volumeTrend = this.calculateTrend(volumes);
    
    // Calculate price volatility with better statistical methods
    const priceVolatility = this.calculateVolatility(prices);
    
    // Generate forecast
    const forecast = [];
    let currentPrice = prices[prices.length - 1];
    let currentVolume = volumes[volumes.length - 1];
    
    for (let i = 1; i <= days; i++) {
      // Apply trends
      const priceFactor = 1 + (priceTrend * i / 100);
      const volumeFactor = 1 + (volumeTrend * i / 100);
      
      const predictedPrice = currentPrice * priceFactor;
      const predictedVolume = currentVolume * volumeFactor;
      
      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        price: Math.max(0, predictedPrice),
        volume: Math.max(0, predictedVolume),
        confidence: Math.max(0.1, 1 - (i * 0.03)),
        factors: {
          priceTrend: priceTrend,
          volumeTrend: volumeTrend,
          volatility: priceVolatility
        }
      });
    }
    
    return {
      projectType: historicalData[0]?.type || 'UNKNOWN',
      forecast: forecast,
      summary: {
        priceTrend: priceTrend > 0 ? 'Increasing' : 'Decreasing',
        volumeTrend: volumeTrend > 0 ? 'Growing' : 'Declining',
        confidence: forecast[0]?.confidence || 0,
        priceRange: {
          min: Math.min(...forecast.map(f => f.price)),
          max: Math.max(...forecast.map(f => f.price))
        }
      }
    };
  }

  calculateMovingAverage(data, period) {
    if (data.length < period) return data[data.length - 1] || 0;
    
    const recentData = data.slice(-period);
    return recentData.reduce((sum, val) => sum + val, 0) / period;
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;
    
    const x = Array.from({ length: data.length }, (_, i) => i);
    const y = data;
    
    const n = data.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope * 100; // Return as percentage
  }

  calculateVolatility(data) {
    if (data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1] !== 0) {
        returns.push((data[i] - data[i - 1]) / data[i - 1]);
      }
    }
    
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  // Validate data quality for better forecasting
  validateDataQuality(data, symbol) {
    if (!data || data.length === 0) {
      throw new Error(`No data available for ${symbol}`);
    }
    
    const validPrices = data.filter(d => d.price && d.price > 0 && !isNaN(d.price));
    const validVolumes = data.filter(d => d.volume && d.volume > 0 && !isNaN(d.volume));
    
    if (validPrices.length < data.length * 0.8) {
      console.warn(`Warning: ${symbol} has ${data.length - validPrices.length} invalid price entries`);
    }
    
    if (validVolumes.length < data.length * 0.8) {
      console.warn(`Warning: ${symbol} has ${data.length - validVolumes.length} invalid volume entries`);
    }
    
    return {
      totalPoints: data.length,
      validPrices: validPrices.length,
      validVolumes: validVolumes.length,
      dataQuality: Math.min(validPrices.length, validVolumes.length) / data.length
    };
  }

  async storeStockForecast(symbol, forecast) {
    try {
      // This will be implemented when we create the forecast models
      console.log(`Storing stock forecast for ${symbol}`);
      // TODO: Implement forecast storage
    } catch (error) {
      console.error(`Error storing stock forecast for ${symbol}:`, error.message);
    }
  }

  async storeCarbonForecast(projectType, forecast) {
    try {
      // This will be implemented when we create the forecast models
      console.log(`Storing carbon forecast for ${projectType}`);
      // TODO: Implement forecast storage
    } catch (error) {
      console.error(`Error storing carbon forecast for ${projectType}:`, error.message);
    }
  }

  async getRecentStockData() {
    try {
      // Use the StockPostgreSQL model instead of direct database queries
      const stocks = await StockPostgreSQL.getAllStocks();
      return stocks.slice(0, 100).map(s => ({
        symbol: s.symbol,
        price: s.current_price,
        change_percent: s.current_change,
        timestamp: s.last_updated
      }));
      
    } catch (error) {
      console.error('Error fetching recent stock data:', error.message);
      return [];
    }
  }

  async getRecentCarbonData() {
    try {
      // Use the CarbonCreditPostgreSQL model instead of direct database queries
      const projects = await CarbonCreditPostgreSQL.getAllProjects();
      return projects.slice(0, 100).map(p => ({
        project_type: p.type,
        price: p.current_price,
        timestamp: p.last_updated
      }));
      
    } catch (error) {
      console.error('Error fetching recent carbon data:', error.message);
      return [];
    }
  }

  // Market sentiment analysis (range-aware)
  async analyzeMarketSentiment(days = 7, model = 'simple') {
    try {
      console.log(`Analyzing market sentiment using real-time data for ${days} days...`);
      
      // Try to get data from database first, fallback to Yahoo Finance
      let seriesChanges = [];
      let totalVolume = 0;
      
      try {
        // Get stock data from database
        const StockPostgreSQL = require('../models/StockPostgreSQL');
        const stocks = await StockPostgreSQL.getAllStocks();
        
        if (stocks && stocks.length > 0) {
          // Calculate changes from current stock data
          for (const stock of stocks.slice(0, 10)) {
            if (stock.current_change && stock.current_volume) {
              const change = parseFloat(stock.current_change);
              const volume = parseInt(stock.current_volume);
              
              if (!isNaN(change) && !isNaN(volume)) {
                seriesChanges.push(change);
                totalVolume += volume;
              }
            }
          }
          
          console.log(`Using database data: ${seriesChanges.length} stocks with changes`);
        }
      } catch (dbError) {
        console.log('Database fallback failed, trying Yahoo Finance:', dbError.message);
      }
      
      // If no database data, try Yahoo Finance
      if (seriesChanges.length === 0) {
        try {
          const symbols = (dataIngestionService.DEFAULT_STOCK_SYMBOLS || []).slice(0, 10);
          const range = days <= 7 ? '1mo' : days <= 30 ? '3mo' : days <= 90 ? '6mo' : '1y';
          const interval = '1d';
          
          for (const sym of symbols) {
            try {
              const rows = await dataIngestionService.getYahooFinanceHistory(sym, range, interval);
              if (!rows || rows.length < 2) continue;
              const recent = rows.slice(-Math.min(days + 1, rows.length));
              for (let i = 1; i < recent.length; i++) {
                const prev = Number(recent[i - 1].close);
                const cur = Number(recent[i].close);
                if (!Number.isFinite(prev) || !Number.isFinite(cur) || prev === 0) continue;
                const pct = ((cur - prev) / prev) * 100;
                seriesChanges.push(pct);
              }
            } catch (e) {
              console.log(`Skipping ${sym} due to error:`, e.message);
            }
          }
          console.log(`Using Yahoo Finance data: ${seriesChanges.length} data points`);
        } catch (yahooError) {
          console.log('Yahoo Finance failed:', yahooError.message);
        }
      }
      
      // If still no data, generate mock sentiment
      if (seriesChanges.length === 0) {
        console.log('No real data available, generating mock sentiment');
        seriesChanges = Array.from({length: 10}, () => (Math.random() - 0.5) * 10); // -5% to +5%
        totalVolume = 1000000;
      }
      
      const changes = seriesChanges;
      const avgChange = changes.reduce((a, b) => a + b, 0) / Math.max(changes.length, 1);
      const vol = this.calculateVolatility(changes.map(c => c / 100));
      
      // Normalize volatility to reasonable range (0-1)
      const normalizedVol = Math.min(1, Math.max(0, vol));
      
      // Calculate score with better scaling
      const score = Math.max(0, Math.min(100, 50 + avgChange * 3 - normalizedVol * 30));
      
      // Add model-specific analysis
      let modelAnalysis = {};
      if (model === 'arima') {
        modelAnalysis = {
          trendStrength: Math.abs(avgChange) * 10,
          seasonality: vol * 50,
          stationarity: Math.max(0, 100 - vol * 100)
        };
      } else if (model === 'prophet') {
        modelAnalysis = {
          trendStrength: Math.abs(avgChange) * 12,
          seasonality: vol * 60,
          changepointSensitivity: Math.max(0, 100 - vol * 80)
        };
      } else {
        modelAnalysis = {
          trendStrength: Math.abs(avgChange) * 8,
          seasonality: vol * 40,
          momentum: avgChange * 5
        };
      }
      
      console.log(`Sentiment analysis complete: Score=${score}, Change=${avgChange.toFixed(2)}%, Volatility=${vol.toFixed(4)}`);
      
      return {
        overallScore: Math.round(score),
        stockMarket: { 
          score: Math.round(score), 
          confidence: Math.round(Math.max(0, Math.min(100, 100 - normalizedVol * 100))), 
          change: avgChange, 
          volume: totalVolume 
        },
        indicators: { 
          volatility: normalizedVol, 
          momentum: avgChange,
          ...modelAnalysis
        }
      };
    } catch (error) {
      console.error('Error analyzing market sentiment:', error);
      // Return fallback sentiment data
      return {
        overallScore: 50,
        stockMarket: { 
          score: 50, 
          confidence: 70, 
          change: 0, 
          volume: 1000000 
        },
        indicators: { 
          volatility: 0.02, 
          momentum: 0,
          trendStrength: 40,
          seasonality: 30
        }
      };
    }
  };

  calculateSentiment(data) {
    if (!data || data.length === 0) {
      return { level: 'Neutral', score: 0, confidence: 0 };
    }
    
    const positive = data.filter(d => d > 0).length;
    const negative = data.filter(d => d < 0).length;
    const total = data.length;
    
    const score = (positive - negative) / total;
    const confidence = Math.min(1, total / 100);
    
    let level = 'Neutral';
    if (score > 0.2) level = 'Bullish';
    else if (score < -0.2) level = 'Bearish';
    
    return { level, score, confidence };
  }

  combineSentiments(stockSentiment, carbonSentiment) {
    const combinedScore = (stockSentiment.score + carbonSentiment.score) / 2;
    const combinedConfidence = (stockSentiment.confidence + carbonSentiment.confidence) / 2;
    
    let level = 'Neutral';
    if (combinedScore > 0.2) level = 'Bullish';
    else if (combinedScore < -0.2) level = 'Bearish';
    
    return { level, score: combinedScore, confidence: combinedConfidence };
  }




}

module.exports = new ForecastingService();
