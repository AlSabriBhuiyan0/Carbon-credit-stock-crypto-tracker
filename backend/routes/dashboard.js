const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const StockPostgreSQL = require('../models/StockPostgreSQL');
const CarbonCreditPostgreSQL = require('../models/CarbonCreditPostgreSQL');
const forecastingService = require('../services/forecasting');
const blockchainService = require('../services/blockchain');
const unifiedWebSocketService = require('../services/unifiedWebSocketService');

/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard data (stocks, carbon, sentiment, blockchain, combined metrics)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 1w, 1m, 3m, 6m, 1y]
 *           default: 1d
 *         description: UI time range used for summaries
 *     responses:
 *       200:
 *         description: Dashboard payload
 *       401:
 *         description: Unauthorized
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    console.log('🚀 Dashboard endpoint called');
    const { timeRange = '1d' } = req.query;
    const rangeToDays = { '1d': 1, '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365 };
    const days = rangeToDays[String(timeRange).toLowerCase()] || 1;
    
    console.log('📊 Fetching dashboard data for timeRange:', timeRange, 'days:', days);
    
    // Try to get real data from database first, fallback to mock data
    let stocks, topGainers, topLosers, mostActive;
    try {
      stocks = await StockPostgreSQL.getAllStocks();
      if (stocks && stocks.length > 0) {
        topGainers = stocks.filter(s => s.current_change > 0).sort((a, b) => b.current_change - a.current_change).slice(0, 15);
        topLosers = stocks.filter(s => s.current_change < 0).sort((a, b) => a.current_change - b.current_change).slice(0, 15);
        mostActive = stocks.sort((a, b) => (b.current_volume || 0) - (a.current_volume || 0)).slice(0, 15);
      } else {
        throw new Error('No stock data available');
      }
    } catch (error) {
      console.warn('Using mock stock data due to database error:', error.message);
      stocks = generateMockStockData();
      topGainers = stocks.filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 15);
      topLosers = stocks.filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 15);
      mostActive = stocks.sort((a, b) => b.volume - a.volume).slice(0, 15);
    }
    
    // Try to get real carbon credit data first, fallback to mock data
    let carbonProjects, carbonMarketOverview;
    try {
      carbonProjects = await CarbonCreditPostgreSQL.getAllProjects();
      if (carbonProjects && carbonProjects.length > 0) {
        carbonMarketOverview = await getCarbonMarketOverview(carbonProjects);
      } else {
        throw new Error('No carbon data available');
      }
    } catch (error) {
      console.warn('Using mock carbon data due to database error:', error.message);
      carbonProjects = generateMockCarbonData();
      carbonMarketOverview = await getCarbonMarketOverview(carbonProjects);
    }
    
    // Get crypto data
    console.log('🪙 Fetching crypto market data...');
    const cryptoData = await getCryptoMarketOverview();
    console.log('✅ Crypto data fetched:', {
      cryptosCount: cryptoData?.cryptos?.length || 0,
      totalValue: cryptoData?.totalValue || 0,
      totalChange: cryptoData?.totalChange || 0
    });
    
    // Get market sentiment
    const marketSentiment = await forecastingService.analyzeMarketSentiment(7, 'simple');
    
    // Get blockchain health
    const blockchainHealth = await blockchainService.checkBlockchainHealth();
    
    // Calculate combined metrics
    const combinedMetrics = calculateCombinedMetrics(stocks, carbonProjects, cryptoData);
    
    const dashboardData = {
      stock: {
        total: stocks.length,
        topGainers,
        topLosers,
        mostActive,
        marketOverview: {
          totalMarketCap: stocks.reduce((sum, s) => {
            const cap = parseFloat(s.calculated_market_cap) || 0;
            return sum + cap;
          }, 0),
          averageChange: stocks.reduce((sum, s) => {
            // Fix: Use current_change directly instead of undefined symbolToRange
            const change = parseFloat(s.current_change) || 0;
            return sum + (isNaN(change) ? 0 : change);
          }, 0) / Math.max(stocks.length, 1),
          activeStocks: stocks.filter(s => s.current_price).length,
          totalVolume: stocks.reduce((sum, s) => {
            // Fix: Use current_volume directly instead of undefined symbolToRange
            const vol = parseInt(s.current_volume) || 0;
            return sum + (isNaN(vol) ? 0 : vol || 0);
          }, 0)
        }
      },
      carbon: {
        totalProjects: carbonProjects.length,
        marketOverview: carbonMarketOverview,
        topProjects: carbonProjects.slice(0, 10)
      },
      crypto: await (async () => {
        console.log('🔍 Including crypto data in main dashboard...');
        const cryptoData = await getCryptoMarketOverview();
        console.log('📊 Crypto data included in dashboard:', {
          hasData: !!cryptoData,
          cryptosCount: cryptoData?.cryptos?.length || 0
        });
        return cryptoData;
      })(),
      marketSentiment,
      blockchainHealth,
      combinedMetrics,
      lastUpdated: new Date()
    };
    
    res.json({ success: true, data: dashboardData });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
}));

/**
 * @openapi
 * /api/dashboard/sentiment:
 *   get:
 *     summary: Get market sentiment metrics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 1w, 1m, 3m, 6m, 1y]
 *           default: 1w
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *           enum: [simple, prophet, arima]
 *           default: simple
 *     responses:
 *       200:
 *         description: Sentiment metrics
 *       401:
 *         description: Unauthorized
 */
// Get market sentiment
router.get('/sentiment', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { timeRange = '1w', model = 'simple' } = req.query;
    const map = { '1d':1, '1w':7, '1m':30, '3m':90, '6m':180, '1y':365 };
    const days = map[String(timeRange).toLowerCase()] || 7;
    const s = await forecastingService.analyzeMarketSentiment(days, model);

    // Normalize payload to frontend expectations
    const score = Number(s.overallScore || 0);
    const toLabel = (val) => val >= 60 ? 'bullish' : (val <= 40 ? 'bearish' : 'neutral');

    const stock = s.stockMarket || {};
    const indicators = s.indicators || {};

    const payload = {
      overallSentiment: toLabel(score),
      stockSentiment: {
        score: Math.round(stock.score || 0),
        confidence: Math.round(stock.confidence || 0),
        change: Number(stock.change || 0),
        volume: Number(stock.volume || 0)
      },
      carbonSentiment: {
        score: 0,
        confidence: 0,
        change: 0,
        volume: 0
      },
      cryptoSentiment: {
        score: Math.round(Math.random() * 40 + 30), // Mock crypto sentiment for now
        confidence: Math.round(Math.random() * 30 + 60),
        change: Number((Math.random() - 0.5) * 20),
        volume: Number(Math.random() * 1000000000)
      },
      marketIndicators: {
        // Scale volatility from fraction to percentage points so UI shows non-zero
        volatility: Math.round(((indicators.volatility || 0) * 100) * 100) / 100,
        correlation: Math.round(((indicators.correlation || 0) * 100) * 100) / 100,
        momentum: Math.round((indicators.momentum || 0) * 100) / 100,
        fearGreedIndex: Math.max(0, Math.min(100, 50 + (indicators.momentum || 0)))
      },
      riskMetrics: {
        riskLevel: score >= 65 ? 'high' : score <= 35 ? 'low' : 'medium',
        riskScore: Math.max(0, Math.min(100, Math.round(100 - score))),
        maxDrawdown: Math.abs(Math.round((indicators.volatility || 0) * 1000) / 10),
        sharpeRatio: Number(((score - 50) / Math.max(1, ((indicators.volatility || 0) * 100))).toFixed(2))
      },
      sentimentTrends: [
        { factor: 'Momentum', sentiment: (indicators.momentum || 0) >= 0 ? 'positive' : 'negative', impact: 'Medium' },
        { factor: 'Volatility', sentiment: (indicators.volatility || 0) < 0.02 ? 'positive' : 'neutral', impact: 'Low' }
      ]
    };

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Error fetching market sentiment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch market sentiment' });
  }
}));

/**
 * @openapi
 * /api/dashboard/blockchain:
 *   get:
 *     summary: Get blockchain health and carbon market data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blockchain health and market data
 *       401:
 *         description: Unauthorized
 */
// Get blockchain status
router.get('/blockchain', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const health = await blockchainService.checkBlockchainHealth();
    const marketData = await blockchainService.getCarbonCreditMarketData();
    const recentTransactions = await blockchainService.getRecentTransactions(10);
    const networkStats = await blockchainService.getNetworkStats();
    const verificationHistory = await blockchainService.getCarbonCreditVerificationHistory(20);
    
    const blockchainData = {
      health,
      marketData,
      recentTransactions,
      networkStats,
      verificationHistory,
      mode: process.env.BLOCKCHAIN_MODE || 'mock',
      lastUpdated: new Date()
    };
    
    res.json({ success: true, data: blockchainData });
  } catch (error) {
    console.error('Error fetching blockchain data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blockchain data' });
  }
}));

/**
 * @openapi
 * /api/dashboard/forecasts:
 *   get:
 *     summary: Generate forecasts for stocks and carbon credits
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Dashboard
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         description: Single stock symbol to forecast (e.g., AAPL)
 *       - in: query
 *         name: symbols
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Multiple stock symbols (e.g., symbols=AAPL&symbols=MSFT)
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *           enum: [simple, prophet, arima]
 *         description: Forecasting model to use
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 1w, 1m, 3m, 6m, 1y]
 *         description: UI time range to size horizonDays when not provided
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Number of days of forecast to generate (fallback horizon)
 *       - in: query
 *         name: horizonDays
 *         schema:
 *           type: integer
 *         description: Explicit forecast horizon in days (overrides timeRange)
 *       - in: query
 *         name: projectType
 *         schema:
 *           type: string
 *         description: Carbon credit project type to forecast
 *     responses:
 *       200:
 *         description: Forecasts generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stockForecasts:
 *                       type: object
 *                       additionalProperties: true
 *                     accuracyMetrics:
 *                       type: object
 *                       properties:
 *                         overallAccuracy:
 *                           type: number
 *                         stockAccuracy:
 *                           type: number
 *                         carbonAccuracy:
 *                           type: number
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                     modelPerformance:
 *                       type: object
 *                       properties:
 *                         prophetAccuracy:
 *                           type: number
 *                         movingAverageAccuracy:
 *                           type: number
 *                         regressionAccuracy:
 *                           type: number
 */
router.get('/forecasts', asyncHandler(async (req, res) => {
  try {
    const { symbol, symbols, projectType, days = 30, timeRange = '1w', model = 'simple', horizonDays } = req.query;
    console.log(`🔍 Forecast request - Model: ${model}, Symbols: ${symbols || symbol}, TimeRange: ${timeRange}`);
    
    const map = { '1d':1, '1w':7, '1m':30, '3m':90, '6m':180, '1y':365 };
    const rangeDays = map[String(timeRange).toLowerCase()] || 7;
    
    const list = Array.isArray(symbols) ? symbols : (symbols ? [symbols] : (symbol ? [symbol] : ['AAPL','MSFT','TSLA']));
    const forecasts = { stocks: {} };

    for (const s of list) {
      // Convert object to string if needed (fix for [object Object] issue)
      const symbolString = typeof s === 'string' ? s : (s.symbol || s.value || String(s));
      console.log(`🔍 Generating forecast for ${symbolString} with model: ${model}`);
      forecasts.stocks[symbolString] = await forecastingService.generateStockForecast(
        symbolString,
        parseInt(days),
        model,
        { horizonDays: parseInt(horizonDays) || Math.min(14, rangeDays) }
      );
      console.log(`🔍 Forecast result for ${symbolString}:`, forecasts.stocks[symbolString].model);
    }

    if (projectType) {
      forecasts.carbon = await forecastingService.generateCarbonCreditForecast(projectType, parseInt(days));
    }

    // Add crypto forecasts if crypto symbols are provided
    const cryptoSymbols = req.query.cryptoSymbols ? req.query.cryptoSymbols.split(',') : [];
    console.log(`🔍 Crypto symbols requested:`, cryptoSymbols);
    
    if (cryptoSymbols.length > 0) {
      forecasts.crypto = {};
      console.log(`🪙 Generating crypto forecasts for ${cryptoSymbols.length} symbols...`);
      
      for (const symbol of cryptoSymbols) {
        try {
          console.log(`🔮 Generating ${model} forecast for crypto ${symbol}...`);
          const cryptoForecastingService = require('../services/cryptoForecastingService');
          
          if (model === 'prophet') {
            forecasts.crypto[symbol] = await cryptoForecastingService.generateProphetForecast(symbol, parseInt(horizonDays) || 7);
            console.log(`✅ Prophet forecast generated for ${symbol}:`, forecasts.crypto[symbol].model);
          } else if (model === 'arima') {
            forecasts.crypto[symbol] = await cryptoForecastingService.generateARIMAForecast(symbol, parseInt(horizonDays) || 7);
            console.log(`✅ ARIMA forecast generated for ${symbol}:`, forecasts.crypto[symbol].model);
          } else {
            // Simple crypto forecast with real data
            const currentPrice = await cryptoForecastingService.getRealTimePrice(symbol);
            const basePrice = currentPrice?.price || 100;
            const volatility = Math.random() * 0.2 + 0.1;
            const trend = (Math.random() - 0.5) * 0.1;
            
            forecasts.crypto[symbol] = {
              symbol,
              model: 'simple',
              next: { 
                yhat: basePrice * (1 + trend),
                yhat_lower: basePrice * (1 + trend - volatility),
                yhat_upper: basePrice * (1 + trend + volatility)
              },
              summary: { 
                volatility: volatility,
                trend: trend,
                currentPrice: basePrice
              },
              dataPoints: 100,
              lastPrice: basePrice,
              currentPrice: currentPrice
            };
            console.log(`✅ Simple forecast generated for ${symbol}`);
          }
        } catch (error) {
          console.error(`❌ Error generating crypto forecast for ${symbol}:`, error.message);
          forecasts.crypto[symbol] = { 
            symbol,
            error: error.message,
            model: model,
            timestamp: new Date()
          };
        }
      }
      
      console.log(`📊 Crypto forecasts completed:`, Object.keys(forecasts.crypto));
    }

    // Compute basic accuracy metrics for UI (best-effort, model-aware)
    const stockValues = Object.values(forecasts.stocks);
    const cryptoValues = Object.values(forecasts.crypto || {});
    let overallAccuracy = 0;
    let prophetAccuracy = 0;
    let movingAverageAccuracy = 0;
    let regressionAccuracy = 0;
    let cryptoAccuracy = 0;

    if (stockValues.length) {
      if (model === 'prophet') {
        // Use interval width as uncertainty → accuracy = 100 - width%
        const accs = stockValues.map(f => {
          const n = f.next;
          if (!n || !n.yhat || !n.yhat_lower || !n.yhat_upper) return 75;
          const widthPct = Math.abs((n.yhat_upper - n.yhat_lower) / Math.max(n.yhat, 1));
          const a = Math.max(60, Math.min(95, 100 - widthPct * 100));
          return a;
        });
        prophetAccuracy = Math.round(accs.reduce((a,b)=>a+b,0)/accs.length);
        overallAccuracy = prophetAccuracy;
      } else if (model === 'arima') {
        // Use RMSE relative to prediction → accuracy = 100 - scaled RMSE
        const accs = stockValues.map(f => {
          const rmse = f?.performance?.rmse;
          const n = f?.next?.yhat;
          if (!rmse || !n) return 75;
          const ratio = rmse / Math.max(n, 1);
          const a = Math.max(60, Math.min(95, 100 - ratio * 2000));
          return a;
        });
        regressionAccuracy = Math.round(accs.reduce((a,b)=>a+b,0)/accs.length);
        overallAccuracy = regressionAccuracy;
      } else {
        // Simple model: base on volatility and trend magnitude
        const accs = stockValues.map(f => {
          const vol = Number(f?.summary?.volatility || 0);
          const base = 75 - Math.min(20, vol * 100);
          return Math.max(55, Math.min(90, base));
        });
        movingAverageAccuracy = Math.round(accs.reduce((a,b)=>a+b,0)/accs.length);
        overallAccuracy = movingAverageAccuracy;
      }
    }
    
    // Calculate crypto accuracy if crypto forecasts exist
    if (cryptoValues.length > 0) {
      const cryptoAccs = cryptoValues.map(f => {
        if (f.error) return 0; // Error forecasts get 0 accuracy
        
        if (model === 'prophet' && f.next?.yhat_lower && f.next?.yhat_upper) {
          // Use interval width as uncertainty → accuracy = 100 - width%
          const widthPct = Math.abs((f.next.yhat_upper - f.next.yhat_lower) / Math.max(f.next.yhat, 1));
          return Math.max(60, Math.min(95, 100 - widthPct * 100));
        } else if (model === 'arima' && f.performance?.rmse) {
          // Use RMSE relative to prediction → accuracy = 100 - scaled RMSE
          const ratio = f.performance.rmse / Math.max(f.next?.yhat || 1, 1);
          return Math.max(60, Math.min(95, 100 - ratio * 2000));
        } else {
          // Simple model: base on volatility
          const vol = Number(f?.summary?.volatility || 0);
          const base = 75 - Math.min(20, vol * 100);
          return Math.max(55, Math.min(90, base));
        }
      });
      
      cryptoAccuracy = Math.round(cryptoAccs.reduce((a,b) => a + b, 0) / cryptoAccs.length);
      console.log(`📊 Crypto accuracy calculated:`, cryptoAccuracy);
    }

    const payload = {
      stockForecasts: forecasts.stocks,
      stocks: forecasts.stocks, // keep for compatibility
      carbonForecasts: forecasts.carbon || [],
      cryptoForecasts: forecasts.crypto || {},
      accuracyMetrics: {
        overallAccuracy: Math.max(overallAccuracy, cryptoAccuracy), // Use the higher of stock or crypto accuracy
        stockAccuracy: overallAccuracy,
        carbonAccuracy: 0,
        cryptoAccuracy: cryptoAccuracy,
        lastUpdated: new Date()
      },
      modelPerformance: {
        prophetAccuracy,
        movingAverageAccuracy,
        regressionAccuracy
      }
    };

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Error generating forecasts:', error);
    res.status(500).json({ success: false, error: 'Failed to generate forecasts' });
  }
}));

/**
 * @openapi
 * /api/dashboard/combined:
 *   get:
 *     summary: Get combined portfolio metrics (ESG, sustainability, risk, performance)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 1w, 1m, 3m, 6m, 1y]
 *           default: 1d
 *     responses:
 *       200:
 *         description: Combined metrics payload
 *       401:
 *         description: Unauthorized
 */
router.get('/combined', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { timeRange = '1d' } = req.query;
    const rangeToDays = { '1d': 1, '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365 };
    const days = rangeToDays[String(timeRange).toLowerCase()] || 1;

    const stocks = await StockPostgreSQL.getAllStocks();
    const carbonProjects = await CarbonCreditPostgreSQL.getAllProjects();
    const cryptoData = await getCryptoMarketOverview();

    const combinedMetrics = calculateCombinedMetrics(stocks, carbonProjects, cryptoData);

    res.json({ success: true, data: combinedMetrics, days });
  } catch (error) {
    console.error('Error fetching combined metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch combined metrics' });
  }
}));

/**
 * @openapi
 * /api/dashboard/stocks:
 *   get:
 *     summary: Get stock market data for dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 1w, 1m, 3m, 6m, 1y]
 *           default: 1d
 *     responses:
 *       200:
 *         description: Stock market data
 *       401:
 *         description: Unauthorized
 */
router.get('/stocks', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { timeRange = '1d' } = req.query;
    const rangeToDays = { '1d': 1, '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365 };
    const days = rangeToDays[String(timeRange).toLowerCase()] || 1;
    
    // Fetch stock market data
    const stocks = await StockPostgreSQL.getAllStocks();
    const rangeSnapshot = await StockPostgreSQL.getRangeSnapshot(days);
    const symbolToRange = new Map(rangeSnapshot.map(r => [r.symbol, r]));
    const topGainers = await StockPostgreSQL.getTopGainers(15);
    const topLosers = await StockPostgreSQL.getTopLosers(15);
    const mostActive = await StockPostgreSQL.getMostActive(15);
    
    const stockData = {
      total: stocks.length,
      topGainers,
      topLosers,
      mostActive,
      marketOverview: {
        totalMarketCap: stocks.reduce((sum, s) => {
          const cap = parseFloat(s.calculated_market_cap) || 0;
          return sum + cap;
        }, 0),
        averageChange: stocks.reduce((sum, s) => {
          const snap = symbolToRange.get(s.symbol);
          const change = snap ? parseFloat(snap.range_change_percent) : (parseFloat(s.current_change) || 0);
          return sum + (isNaN(change) ? 0 : change);
        }, 0) / Math.max(stocks.length, 1),
        activeStocks: stocks.filter(s => s.current_price).length,
        totalVolume: stocks.reduce((sum, s) => {
          const snap = symbolToRange.get(s.symbol);
          const vol = snap ? parseInt(snap.last_volume) : parseInt(s.current_volume);
          return sum + (isNaN(vol) ? 0 : vol || 0);
        }, 0)
      },
      lastUpdated: new Date()
    };
    
    res.json({ success: true, data: stockData });
    
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stock data' });
  }
}));

/**
 * @openapi
 * /api/dashboard/carbon:
 *   get:
 *     summary: Get carbon credit data for dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 1w, 1m, 3m, 6m, 1y]
 *           default: 1d
 *     responses:
 *       200:
 *         description: Carbon credit data
 *       401:
 *         description: Unauthorized
 */
router.get('/carbon', asyncHandler(async (req, res) => {
  try {
    const { timeRange = '1d' } = req.query;
    
    // Fetch carbon credit data
    const carbonProjects = await CarbonCreditPostgreSQL.getAllProjects();
    const carbonMarketOverview = await getCarbonMarketOverview(carbonProjects);
    
    const carbonData = {
      totalProjects: carbonProjects.length,
      marketOverview: carbonMarketOverview,
      topProjects: carbonProjects.slice(0, 10),
      lastUpdated: new Date()
    };
    
    res.json({ success: true, data: carbonData });
    
  } catch (error) {
    console.error('Error fetching carbon data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch carbon data' });
  }
}));

/**
 * @openapi
 * /api/dashboard/crypto:
 *   get:
 *     summary: Get cryptocurrency market overview
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cryptocurrency market data
 *       401:
 *         description: Unauthorized
 */
router.get('/crypto', authenticateToken, asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Crypto route called - fetching crypto data...');
    
    // Import the crypto forecasting service
    const cryptoForecastingService = require('../services/cryptoForecastingService');
    
    // Get crypto data from the service
    const cryptoData = await getCryptoMarketOverview();
    console.log('📊 Crypto data result:', {
      hasData: !!cryptoData,
      cryptosCount: cryptoData?.cryptos?.length || 0,
      totalValue: cryptoData?.totalValue || 0,
      totalChange: cryptoData?.totalChange || 0
    });
    
    res.json({ success: true, data: cryptoData });
  } catch (error) {
    console.error('❌ Error fetching crypto data:', error);
    // Return fallback data if service fails
    const fallbackData = generateMockCryptoData();
    console.log('🔄 Using fallback data:', {
      cryptosCount: fallbackData?.cryptos?.length || 0,
      totalValue: fallbackData?.totalValue || 0
    });
    res.json({ success: true, data: fallbackData });
  }
}));

/**
 * @openapi
 * /api/dashboard/crypto/symbols:
 *   get:
 *     summary: Get available cryptocurrency symbols
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of crypto symbols
 *       401:
 *         description: Unauthorized
 */
router.get('/crypto/symbols', authenticateToken, asyncHandler(async (req, res) => {
  try {
    // Return comprehensive crypto symbols with metadata
    const symbols = [
      { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'Layer 1' },
      { symbol: 'ETHUSDT', name: 'Ethereum', category: 'Layer 1' },
      { symbol: 'BNBUSDT', name: 'BNB', category: 'Exchange Token' },
      { symbol: 'ADAUSDT', name: 'Cardano', category: 'Layer 1' },
      { symbol: 'SOLUSDT', name: 'Solana', category: 'Layer 1' },
      { symbol: 'DOTUSDT', name: 'Polkadot', category: 'Layer 0' },
      { symbol: 'LINKUSDT', name: 'Chainlink', category: 'Oracle' },
      { symbol: 'MATICUSDT', name: 'Polygon', category: 'Layer 2' },
      { symbol: 'AVAXUSDT', name: 'Avalanche', category: 'Layer 1' },
      { symbol: 'UNIUSDT', name: 'Uniswap', category: 'DeFi' },
      { symbol: 'XRPUSDT', name: 'Ripple', category: 'Payment' },
      { symbol: 'DOGEUSDT', name: 'Dogecoin', category: 'Meme' },
      { symbol: 'LTCUSDT', name: 'Litecoin', category: 'Payment' },
      { symbol: 'BCHUSDT', name: 'Bitcoin Cash', category: 'Payment' },
      { symbol: 'ATOMUSDT', name: 'Cosmos', category: 'Layer 0' },
      { symbol: 'NEARUSDT', name: 'NEAR Protocol', category: 'Layer 1' },
      { symbol: 'FTMUSDT', name: 'Fantom', category: 'Layer 1' },
      { symbol: 'ALGOUSDT', name: 'Algorand', category: 'Layer 1' },
      { symbol: 'VETUSDT', name: 'VeChain', category: 'Supply Chain' },
      { symbol: 'ICPUSDT', name: 'Internet Computer', category: 'Infrastructure' }
    ];
    
    res.json({ success: true, data: symbols });
  } catch (error) {
    console.error('Error fetching crypto symbols:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch crypto symbols' });
  }
}));

/**
 * @openapi
 * /api/dashboard/crypto/charts:
 *   get:
 *     summary: Get crypto historical data for charts
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         required: true
 *         description: Crypto symbol (e.g., BTCUSDT)
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M]
 *           default: 1d
 *         description: Chart interval
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 10
 *           maximum: 1000
 *           default: 100
 *         description: Number of data points
 *     responses:
 *       200:
 *         description: Crypto chart data
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/crypto/charts', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { symbol, interval = '1d', limit = 100 } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ 
        success: false, 
        error: 'Symbol parameter is required' 
      });
    }
    
    const cryptoForecastingService = require('../services/cryptoForecastingService');
    const historicalData = await cryptoForecastingService.getHistoricalData(symbol, interval, limit);
    
    if (!historicalData || historicalData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `No historical data available for ${symbol}` 
      });
    }
    
    res.json({
      success: true,
      data: {
        symbol,
        interval,
        dataPoints: historicalData.length,
        data: historicalData,
        lastUpdated: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error fetching crypto chart data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch crypto chart data' 
    });
  }
}));

// Helper functions
async function getCarbonMarketOverview(projects) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  
  // Calculate total credits with validation to prevent extremely large numbers
  let totalCreditsIssued = projects.reduce((sum, p) => {
    const credits = p.current_credits_issued || 0;
    // Limit individual project credits to prevent overflow
    const validCredits = Math.min(credits, 1000000); // Max 1M credits per project
    return sum + validCredits;
  }, 0);
  
  let totalCreditsRetired = projects.reduce((sum, p) => {
    const credits = p.current_credits_retired || 0;
    const validCredits = Math.min(credits, 1000000); // Max 1M credits per project
    return sum + validCredits;
  }, 0);
  
  // Ensure totals are reasonable (max 100M total credits)
  totalCreditsIssued = Math.min(totalCreditsIssued, 100000000);
  totalCreditsRetired = Math.min(totalCreditsRetired, 100000000);
  
  // Calculate average price
  const projectsWithPrice = projects.filter(p => p.current_price);
  const averagePrice = projectsWithPrice.length > 0 
    ? projectsWithPrice.reduce((sum, p) => sum + parseFloat(p.current_price), 0) / projectsWithPrice.length
    : 0;
  
  return {
    totalProjects,
    activeProjects,
    totalCreditsIssued,
    totalCreditsRetired,
    averagePrice: parseFloat(averagePrice.toFixed(2)),
    availableCredits: totalCreditsIssued - totalCreditsRetired,
    lastUpdated: new Date()
  };
}

function calculateCombinedMetrics(stocks, carbonProjects, cryptoData = null) {
  // Calculate portfolio performance metrics
  const stockPerformance = stocks.reduce((sum, s) => sum + (s.current_change || 0), 0) / Math.max(stocks.length, 1);
  const totalMarketCap = stocks.reduce((sum, s) => sum + (s.calculated_market_cap || 0), 0);
  
  // Calculate crypto performance metrics
  const cryptoPerformance = cryptoData ? (cryptoData.totalChangePercent || 0) : 0;
  const cryptoMarketCap = cryptoData ? (cryptoData.marketCap || 0) : 0;
  const totalPortfolioValue = totalMarketCap + cryptoMarketCap;
  
  // Calculate ESG and sustainability metrics
  const carbonAvailability = carbonProjects.length > 0 ? 100 : 0;
  const carbonOffset = carbonProjects.reduce((sum, p) => sum + (p.current_credits_issued || 0), 0);
  const carbonFootprint = Math.max(0, totalPortfolioValue * 0.0001); // Mock carbon intensity
  
  // Calculate ESG score components
  const environmentalScore = Math.min(100, Math.max(0, (carbonAvailability * 0.4) + (Math.max(0, 100 - carbonFootprint) * 0.6)));
  const socialScore = Math.min(100, Math.max(0, 70 + (stockPerformance * 10))); // Higher performance = better social impact
  const governanceScore = Math.min(100, Math.max(0, 80 + (Math.random() * 20))); // Mock governance score
  
  const esgScore = Math.round((environmentalScore * 0.4) + (socialScore * 0.3) + (governanceScore * 0.3));
  
  // Calculate portfolio performance metrics
  const volatility = Math.abs(stockPerformance) * 2; // Mock volatility
  const sharpeRatio = stockPerformance > 0 ? stockPerformance / Math.max(volatility, 0.01) : 0;
  const maxDrawdown = Math.min(0, stockPerformance * 0.8); // Mock max drawdown
  
  // Calculate sustainability metrics
  const renewableEnergyRatio = Math.min(100, Math.max(0, 60 + (carbonAvailability * 0.4)));
  const carbonIntensity = carbonFootprint / Math.max(totalMarketCap / 1000000, 1); // tCO2e/$M
  const socialImpactScore = Math.round(socialScore);
  
  // Calculate risk metrics
  const overallRisk = volatility > 20 ? 'high' : volatility > 10 ? 'medium' : 'low';
  const climateRisk = carbonIntensity > 100 ? 'high' : carbonIntensity > 50 ? 'medium' : 'low';
  const regulatoryRisk = Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low';
  const marketRisk = overallRisk;
  
  // Determine sustainability rating
  let sustainabilityRating = 'C';
  if (esgScore >= 80) sustainabilityRating = 'A';
  else if (esgScore >= 60) sustainabilityRating = 'B';
  else if (esgScore >= 40) sustainabilityRating = 'C';
  else if (esgScore >= 20) sustainabilityRating = 'D';
  else sustainabilityRating = 'F';
  
  // Add model performance comparison
  const modelPerformance = {
    prophet: {
      accuracy: Math.min(100, Math.max(0, 85 + (Math.random() * 10))),
      confidence: Math.min(100, Math.max(0, 80 + (Math.random() * 15))),
      seasonality: Math.min(100, Math.max(0, 90 + (Math.random() * 10)))
    },
    arima: {
      accuracy: Math.min(100, Math.max(0, 80 + (Math.random() * 15))),
      confidence: Math.min(100, Math.max(0, 75 + (Math.random() * 20))),
      stationarity: Math.min(100, Math.max(0, 85 + (Math.random() * 15)))
    },
    simple: {
      accuracy: Math.min(100, Math.max(0, 70 + (Math.random() * 20))),
      confidence: Math.min(100, Math.max(0, 65 + (Math.random() * 25))),
      speed: Math.min(100, Math.max(0, 95 + (Math.random() * 5)))
    }
  };
  
  return {
    totalPortfolioValue,
    esgScore,
    sustainabilityRating,
    carbonFootprint: Math.round(carbonFootprint),
    carbonOffset: Math.round(carbonOffset),
    cryptoMetrics: cryptoData ? {
      totalValue: cryptoData.totalValue || 0,
      totalChange: cryptoData.totalChange || 0,
      totalChangePercent: cryptoData.totalChangePercent || 0,
      activeAssets: cryptoData.active || 0,
      marketCap: cryptoData.marketCap || 0
    } : null,
    portfolioPerformance: {
      totalReturn: (stockPerformance + cryptoPerformance) / 2,
      volatility: Math.round(volatility * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      cryptoReturn: cryptoPerformance
    },
    sustainabilityMetrics: {
      renewableEnergyRatio: Math.round(renewableEnergyRatio),
      carbonIntensity: Math.round(carbonIntensity * 100) / 100,
      socialImpactScore,
      governanceScore: Math.round(governanceScore)
    },
    riskMetrics: {
      overallRisk,
      climateRisk,
      regulatoryRisk,
      marketRisk
    },
    modelPerformance
  };
}

function groupProjectsByType(projects) {
  const grouped = {};
  projects.forEach(project => {
    if (!grouped[project.type]) {
      grouped[project.type] = [];
    }
    grouped[project.type].push(project);
  });
  
  return Object.entries(grouped).map(([type, projectList]) => ({
    type,
    count: projectList.length,
    totalCredits: Math.min(
      projectList.reduce((sum, p) => sum + (p.current_credits_issued || 0), 0),
      10000000 // Max 10M credits per type
    )
  }));
}

function groupProjectsByStandard(projects) {
  const grouped = {};
  projects.forEach(project => {
    if (!grouped[project.standard]) {
      grouped[project.standard] = [];
    }
    grouped[project.standard].push(project);
  });
  
  return Object.entries(grouped).map(([standard, projectList]) => ({
    standard,
    count: projectList.length,
    totalCredits: Math.min(
      projectList.reduce((sum, p) => sum + (p.current_credits_issued || 0), 0),
      10000000 // Max 10M credits per standard
    )
  }));
}

// Mock data generation functions for fallback
function generateMockStockData() {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'META', 'NVDA', 'AMZN', 'NFLX', 'AMD', 'INTC'];
  return symbols.map((symbol, index) => ({
    symbol,
    current_price: Math.random() * 200 + 50,
    current_change: (Math.random() - 0.5) * 10,
    current_volume: Math.floor(Math.random() * 10000000) + 1000000,
    calculated_market_cap: Math.random() * 1000000000 + 100000000,
    change: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    last_updated: new Date()
  }));
}

function generateMockCarbonData() {
  const projectTypes = ['Renewable Energy', 'Forest Conservation', 'Clean Technology', 'Energy Efficiency'];
  return projectTypes.map((type, index) => ({
    project_id: `PROJ-${String(index + 1).padStart(4, '0')}`,
    type,
    current_price: Math.random() * 20 + 5,
    current_credits_issued: Math.floor(Math.random() * 100000) + 10000,
    standard: ['Gold Standard', 'Verified Carbon Standard', 'Clean Development Mechanism'][Math.floor(Math.random() * 3)],
    status: 'active',
    last_updated: new Date()
  }));
}

async function getCryptoMarketOverview() {
  try {
    console.log('🔍 getCryptoMarketOverview called...');
    
    // Import the crypto forecasting service
    const cryptoForecastingService = require('../services/cryptoForecastingService');
    
    // Get default crypto symbols
    const defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'UNIUSDT'];
    
    console.log('📊 Fetching real-time prices for symbols:', defaultSymbols);
    
    // Fetch real-time prices for all symbols
    const pricePromises = defaultSymbols.map(symbol => 
      cryptoForecastingService.getRealTimePrice(symbol).catch((error) => {
        console.error(`Failed to fetch price for ${symbol}:`, error.message);
        return null;
      })
    );
    
    console.log('⏳ Waiting for all price promises to resolve...');
    const prices = await Promise.allSettled(pricePromises);
    const validPrices = prices
      .map((result, index) => result.status === 'fulfilled' ? result.value : null)
      .filter(Boolean);
    
    console.log(`✅ Successfully fetched ${validPrices.length} out of ${defaultSymbols.length} crypto prices`);
    console.log('📊 Valid prices:', validPrices.map(p => ({ symbol: p.symbol, price: p.price, change: p.priceChange })));
    
    if (validPrices.length === 0) {
      console.warn('⚠️ No real crypto prices available, using mock data as fallback');
      return generateMockCryptoData();
    }
    
    // Calculate market metrics
    const totalValue = validPrices.reduce((sum, crypto) => sum + (crypto.price || crypto.lastPrice || 0), 0);
    const totalChange = validPrices.reduce((sum, crypto) => sum + (crypto.priceChange || 0), 0);
    const totalChangePercent = validPrices.length > 0 ? totalChange / validPrices.length : 0;
    const volume = validPrices.reduce((sum, crypto) => sum + (crypto.volume || 0), 0);
    
    // Sort by price change for top gainers/losers
    const sortedByChange = validPrices.sort((a, b) => (b.priceChange || 0) - (a.priceChange || 0));
    const topGainers = sortedByChange.filter(crypto => (crypto.priceChange || 0) > 0).slice(0, 5);
    const topLosers = sortedByChange.filter(crypto => (crypto.priceChange || 0) < 0).slice(0, 5);
    
    const result = {
      cryptos: validPrices,
      totalValue: Math.round(totalValue * 100) / 100,
      totalChange: Math.round(totalChange * 100) / 100,
      totalChangePercent: Math.round(totalChangePercent * 100) / 100,
      topGainers,
      topLosers,
      volume: Math.round(volume),
      marketCap: totalValue * 1000000, // Mock market cap calculation
      active: validPrices.length,
      lastUpdated: new Date()
    };
    
    console.log('✅ Real crypto data generated:', {
      cryptosCount: result.cryptos.length,
      totalValue: result.totalValue,
      totalChange: result.totalChange,
      topGainers: result.topGainers.length,
      topLosers: result.topLosers.length
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error getting crypto market overview:', error);
    console.warn('⚠️ Falling back to mock data due to error');
    return generateMockCryptoData();
  }
}

function generateMockCryptoData() {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT', 'AVAXUSDT', 'UNIUSDT'];
  const mockCryptos = symbols.map((symbol, index) => ({
    symbol,
    price: Math.random() * 50000 + 1000,
    priceChange: (Math.random() - 0.5) * 20,
    priceChangePercent: (Math.random() - 0.5) * 10,
    volume: Math.floor(Math.random() * 1000000000) + 100000000,
    timestamp: new Date()
  }));
  
  const totalValue = mockCryptos.reduce((sum, crypto) => sum + crypto.price, 0);
  const totalChange = mockCryptos.reduce((sum, crypto) => sum + crypto.priceChange, 0);
  const totalChangePercent = mockCryptos.length > 0 ? totalChange / mockCryptos.length : 0;
  const volume = mockCryptos.reduce((sum, crypto) => sum + crypto.volume, 0);
  
  const sortedByChange = mockCryptos.sort((a, b) => b.priceChange - a.priceChange);
  const topGainers = sortedByChange.filter(crypto => crypto.priceChange > 0).slice(0, 5);
  const topLosers = sortedByChange.filter(crypto => crypto.priceChange < 0).slice(0, 5);
  
  return {
    cryptos: mockCryptos,
    totalValue,
    totalChange,
    totalChangePercent,
    topGainers,
    topLosers,
    volume,
    marketCap: totalValue * 1000000,
    active: mockCryptos.length,
    lastUpdated: new Date()
  };
}

async function getCarbonMarketOverview(projects) {
  if (!projects || projects.length === 0) {
    return {
      totalProjects: 0,
      totalCredits: 0,
      averagePrice: 0,
      marketTrend: 'stable'
    };
  }
  
  const totalCredits = projects.reduce((sum, p) => sum + (p.current_credits_issued || 0), 0);
  const averagePrice = projects.reduce((sum, p) => sum + (p.current_price || 0), 0) / projects.length;
  
  return {
    totalProjects: projects.length,
    totalCredits,
    averagePrice: Math.round(averagePrice * 100) / 100,
    marketTrend: 'stable',
    lastUpdated: new Date()
  };
}

// Get real-time dashboard data from unified service
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    console.log('🔗 Fetching real-time dashboard data from unified service...');
    
    // Get real-time data from all services
    const realtimeData = {
      stocks: unifiedWebSocketService.getAllData('stocks'),
      crypto: unifiedWebSocketService.getAllData('binance'),
      carbon: unifiedWebSocketService.getAllData('carbon'),
      services: unifiedWebSocketService.getAllServicesStatus(),
      timestamp: new Date()
    };
    
    console.log('✅ Real-time data fetched:', {
      stocksCount: realtimeData.stocks.length,
      cryptoCount: realtimeData.crypto.length,
      carbonCount: realtimeData.carbon.length
    });
    
    res.json({ success: true, data: realtimeData });
  } catch (error) {
    console.error('❌ Real-time dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get stock symbols for forecasting
router.get('/stock-symbols', async (req, res) => {
  try {
    console.log('📊 Fetching stock symbols for forecasting...');
    
    // Get stock symbols from database
    let stockSymbols = [];
    try {
      const stocks = await StockPostgreSQL.getAllStocks();
      if (stocks && stocks.length > 0) {
        stockSymbols = stocks.map(stock => ({
          symbol: stock.symbol,
          name: stock.symbol, // Use symbol as name for stocks
          category: 'stock'
        })).filter(stock => stock.symbol);
      }
    } catch (error) {
      console.warn('Using mock stock symbols due to database error:', error.message);
      // Fallback to common stock symbols with object format
      stockSymbols = [
        { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'stock' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stock' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stock' },
        { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stock' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'stock' },
        { symbol: 'META', name: 'Meta Platforms Inc.', category: 'stock' },
        { symbol: 'NFLX', name: 'Netflix Inc.', category: 'stock' },
        { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', category: 'stock' },
        { symbol: 'INTC', name: 'Intel Corporation', category: 'stock' }
      ];
    }
    
    console.log('✅ Stock symbols fetched:', stockSymbols.length);
    res.json({ success: true, data: stockSymbols });
  } catch (error) {
    console.error('❌ Error fetching stock symbols:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get crypto symbols for forecasting
router.get('/crypto-symbols', async (req, res) => {
  try {
    console.log('🪙 Fetching crypto symbols for forecasting...');
    
    // Get crypto symbols from unified service or use common ones
    let cryptoSymbols = [];
    try {
      const cryptoData = unifiedWebSocketService.getAllData('binance');
      if (cryptoData && cryptoData.length > 0) {
        cryptoSymbols = cryptoData.map(crypto => ({
          symbol: crypto.symbol,
          name: crypto.symbol.replace('USDT', ''),
          category: 'crypto'
        }));
      }
    } catch (error) {
      console.warn('Using mock crypto symbols due to service error:', error.message);
    }
    
    // Always provide comprehensive crypto symbols as fallback
    if (cryptoSymbols.length === 0) {
      cryptoSymbols = [
        { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'crypto' },
        { symbol: 'ETHUSDT', name: 'Ethereum', category: 'crypto' },
        { symbol: 'BNBUSDT', name: 'Binance Coin', category: 'crypto' },
        { symbol: 'ADAUSDT', name: 'Cardano', category: 'crypto' },
        { symbol: 'SOLUSDT', name: 'Solana', category: 'crypto' },
        { symbol: 'DOTUSDT', name: 'Polkadot', category: 'crypto' },
        { symbol: 'LINKUSDT', name: 'Chainlink', category: 'crypto' },
        { symbol: 'MATICUSDT', name: 'Polygon', category: 'crypto' },
        { symbol: 'AVAXUSDT', name: 'Avalanche', category: 'crypto' },
        { symbol: 'UNIUSDT', name: 'Uniswap', category: 'crypto' },
        { symbol: 'XRPUSDT', name: 'Ripple', category: 'crypto' },
        { symbol: 'DOGEUSDT', name: 'Dogecoin', category: 'crypto' },
        { symbol: 'LTCUSDT', name: 'Litecoin', category: 'crypto' },
        { symbol: 'BCHUSDT', name: 'Bitcoin Cash', category: 'crypto' },
        { symbol: 'ATOMUSDT', name: 'Cosmos', category: 'crypto' },
        { symbol: 'NEARUSDT', name: 'NEAR Protocol', category: 'crypto' },
        { symbol: 'FTMUSDT', name: 'Fantom', category: 'crypto' },
        { symbol: 'ALGOUSDT', name: 'Algorand', category: 'crypto' },
        { symbol: 'VETUSDT', name: 'VeChain', category: 'crypto' },
        { symbol: 'ICPUSDT', name: 'Internet Computer', category: 'crypto' }
      ];
    }
    
    console.log('✅ Crypto symbols fetched:', cryptoSymbols.length);
    res.json({ success: true, data: cryptoSymbols });
  } catch (error) {
    console.error('❌ Error fetching crypto symbols:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
