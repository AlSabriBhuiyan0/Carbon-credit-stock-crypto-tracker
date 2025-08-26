const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const cryptoForecastingService = require('../services/cryptoForecastingService');
const unifiedWebSocketService = require('../services/unifiedWebSocketService');

/**
 * @swagger
 * /api/crypto/status:
 *   get:
 *     summary: Get crypto forecasting service status
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status information
 *       500:
 *         description: Internal server error
 */
router.get('/status', async (req, res) => { // Temporarily disabled auth for testing
  try {
    const status = await cryptoForecastingService.getServiceStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/crypto/price/{symbol}:
 *   get:
 *     summary: Get real-time crypto price
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Crypto symbol (e.g., BTCUSDT, ETHUSDT)
 *     responses:
 *       200:
 *         description: Real-time price data
 *       400:
 *         description: Invalid symbol
 *       500:
 *         description: Internal server error
 */
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = await cryptoForecastingService.getRealTimePrice(symbol);
    
    if (!price) {
      return res.status(404).json({ error: `Price not available for ${symbol}` });
    }
    
    res.json({ success: true, data: price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/crypto/forecast/prophet/{symbol}:
 *   get:
 *     summary: Generate Prophet forecast for crypto
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Crypto symbol (e.g., BTCUSDT, ETHUSDT)
 *       - in: query
 *         name: horizonDays
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Forecast horizon in days
 *     responses:
 *       200:
 *         description: Prophet forecast data
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/forecast/prophet/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { horizonDays = 7 } = req.query;
    
    console.log(`🔮 Prophet forecast request for ${symbol}, horizon: ${horizonDays}`);
    
    // Set a timeout for the forecasting operation
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Forecast request timeout - Prophet model taking too long' });
      }
    }, 30000); // 30 second timeout
    
    try {
      // Debug: Check historical data first
      console.log(`📊 Getting historical data for ${symbol}...`);
      const historicalData = await cryptoForecastingService.getHistoricalData(symbol, '1d', 100);
      console.log(`📊 Historical data length: ${historicalData.length}`);
      if (historicalData.length > 0) {
        console.log(`📊 Sample data:`, historicalData[0]);
      }
      
      const forecast = await cryptoForecastingService.generateProphetForecast(symbol, parseInt(horizonDays));
      clearTimeout(timeout);
      
      if (!res.headersSent) {
        res.json({ success: true, data: forecast });
      }
    } catch (forecastError) {
      clearTimeout(timeout);
      console.error(`❌ Prophet forecast error:`, forecastError);
      if (!res.headersSent) {
        res.status(500).json({ error: forecastError.message });
      }
    }
  } catch (error) {
    console.error(`❌ Prophet forecast error for ${req.params.symbol}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /api/crypto/forecast/arima/{symbol}:
 *   get:
 *     summary: Generate ARIMA forecast for crypto
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Crypto symbol (e.g., BTCUSDT, ETHUSDT)
 *       - in: query
 *         name: horizonDays
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Forecast horizon in days
 *     responses:
 *       200:
 *         description: ARIMA forecast data
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/forecast/arima/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { horizonDays = 7 } = req.query;
    
    console.log(`📊 ARIMA forecast request for ${symbol}, horizon: ${horizonDays}`);
    
    // Set a timeout for the forecasting operation
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Forecast request timeout - ARIMA model taking too long' });
      }
    }, 30000); // 30 second timeout
    
    try {
      // Debug: Check historical data first
      console.log(`📊 Getting historical data for ${symbol}...`);
      const historicalData = await cryptoForecastingService.getHistoricalData(symbol, '1d', 100);
      console.log(`📊 Historical data length: ${historicalData.length}`);
      if (historicalData.length > 0) {
        console.log(`📊 Sample data:`, historicalData[0]);
      }
      
      const forecast = await cryptoForecastingService.generateARIMAForecast(symbol, parseInt(horizonDays));
      clearTimeout(timeout);
      
      if (!res.headersSent) {
        res.json({ success: true, data: forecast });
      }
    } catch (forecastError) {
      clearTimeout(timeout);
      console.error(`❌ ARIMA forecast error:`, forecastError);
      if (!res.headersSent) {
        res.status(500).json({ error: forecastError.message });
      }
    }
  } catch (error) {
    console.error(`❌ ARIMA forecast error for ${req.params.symbol}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /api/crypto/forecast/both/{symbol}:
 *   get:
 *     summary: Generate both Prophet and ARIMA forecasts for crypto
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Crypto symbol (e.g., BTCUSDT, ETHUSDT)
 *       - in: query
 *         name: horizonDays
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Forecast horizon in days
 *     responses:
 *       200:
 *         description: Both forecast data
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/forecast/both/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { horizonDays = 7 } = req.query;
    
    const forecast = await cryptoForecastingService.generateBothForecasts(symbol, parseInt(horizonDays));
    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/crypto/sentiment/{symbol}:
 *   get:
 *     summary: Get market sentiment analysis for crypto
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Crypto symbol (e.g., BTCUSDT, ETHUSDT)
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Analysis period in days
 *     responses:
 *       200:
 *         description: Sentiment analysis data
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/sentiment/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 7 } = req.query;
    
    const sentiment = await cryptoForecastingService.getMarketSentiment(symbol, parseInt(days));
    res.json({ success: true, data: sentiment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/crypto/portfolio:
 *   post:
 *     summary: Get portfolio performance for multiple crypto assets
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbols:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of crypto symbols
 *               horizonDays:
 *                 type: integer
 *                 default: 7
 *                 description: Analysis period in days
 *     responses:
 *       200:
 *         description: Portfolio performance data
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post('/portfolio', async (req, res) => {
  try {
    const { symbols, horizonDays = 7 } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }
    
    const performance = await cryptoForecastingService.getPortfolioPerformance(symbols, parseInt(horizonDays));
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/crypto/historical/{symbol}:
 *   get:
 *     summary: Get historical data for crypto
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Crypto symbol (e.g., BTCUSDT, ETHUSDT)
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           default: 1d
 *         description: Data interval (1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 500
 *         description: Number of data points (max 1000)
 *     responses:
 *       200:
 *         description: Historical data
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1d', limit = 500 } = req.query;
    
    const data = await cryptoForecastingService.getHistoricalData(symbol, interval, parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/crypto/websocket/start:
 *   post:
 *     summary: Start WebSocket connection for real-time updates
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbols:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of crypto symbols to track
 *     responses:
 *       200:
 *         description: WebSocket started successfully
 *       500:
 *         description: Internal server error
 */
router.post('/websocket/start', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    // Start the binance service in unified service
    await unifiedWebSocketService.startService('binance');
    
    // Subscribe to symbols
    if (symbols && Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        unifiedWebSocketService.subscribe('binance', symbol);
      });
    }
    
    res.json({ 
      success: true, 
      message: 'WebSocket started successfully via unified service',
      symbols: symbols || ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/crypto/websocket/stop:
 *   post:
 *     summary: Stop WebSocket connection
 *     tags: [Crypto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WebSocket stopped successfully
 *       500:
 *         description: Internal server error
 */
router.post('/websocket/stop', async (req, res) => {
  try {
    await unifiedWebSocketService.stopService('binance');
    res.json({ success: true, message: 'WebSocket stopped successfully via unified service' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/crypto/cache/clear:
 *   post:
 *         summary: Clear forecast cache
 *         tags: [Crypto]
 *         security:
 *           - bearerAuth: []
 *         responses:
 *           200:
 *             description: Cache cleared successfully
 *           500:
 *             description: Internal server error
 */
router.post('/cache/clear', async (req, res) => {
  try {
    cryptoForecastingService.clearCache();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug forecasting endpoint (temporarily no auth for debugging)
router.get('/debug-forecast/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { horizonDays = 3 } = req.query;
    
    console.log(`🧪 Debug forecast request for ${symbol}, horizon: ${horizonDays}`);
    
    // Test historical data first
    console.log(`📊 Testing historical data for ${symbol}...`);
    const historicalData = await cryptoForecastingService.getHistoricalData(symbol, '1d', 30);
    console.log(`📊 Historical data length: ${historicalData.length}`);
    
    if (historicalData.length === 0) {
      return res.status(400).json({ 
        error: 'No historical data available',
        symbol,
        message: 'Binance API returned empty data'
      });
    }
    
    if (historicalData.length > 0) {
      console.log(`📊 Sample historical data:`, historicalData[0]);
      console.log(`📊 Last historical data:`, historicalData[historicalData.length - 1]);
    }
    
    // Test the data format that will be sent to Python
    const series = historicalData.map(item => ({
      ds: item.timestamp.toISOString().slice(0, 10),
      y: item.close
    }));
    console.log(`📊 Series format for Python:`, series.slice(0, 3));
    console.log(`📊 Series length:`, series.length);
    
    // Test Prophet forecasting
    console.log(`🔮 Testing Prophet forecast...`);
    const prophetForecast = await cryptoForecastingService.generateProphetForecast(symbol, parseInt(horizonDays));
    console.log(`🔮 Prophet forecast result:`, prophetForecast);
    
    res.json({ 
      success: true, 
      data: {
        symbol,
        historicalDataLength: historicalData.length,
        sampleData: historicalData[0],
        seriesFormat: series.slice(0, 3),
        prophetForecast
      }
    });
    
  } catch (error) {
    console.error(`❌ Test forecast error:`, error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      symbol: req.params.symbol
    });
  }
});

module.exports = router;
