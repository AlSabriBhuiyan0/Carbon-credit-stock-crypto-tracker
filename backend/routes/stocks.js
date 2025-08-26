const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const unifiedWebSocketService = require('../services/unifiedWebSocketService');

/**
 * @swagger
 * /api/stocks/status:
 *   get:
 *     summary: Get stock WebSocket service status
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status information
 *       500:
 *         description: Internal server error
 */
router.get('/status', async (req, res) => {
  try {
    const status = unifiedWebSocketService.getServiceStatus('stocks');
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/stocks/price/{symbol}:
 *   get:
 *     summary: Get real-time stock price
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g., AAPL, MSFT)
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
    const price = unifiedWebSocketService.getData('stocks', symbol);
    
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
 * /api/stocks/historical/{symbol}:
 *   get:
 *     summary: Get historical data for stock
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g., AAPL, MSFT)
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           default: 1d
 *         description: Data interval (1d, 7d, 30d, 3m, 6m, 1y)
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
    
    // Generate mock historical data based on interval
    const data = generateMockHistoricalData(symbol, interval, parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/stocks/sentiment/{symbol}:
 *   get:
 *     summary: Get market sentiment for stock
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g., AAPL, MSFT)
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days for sentiment analysis
 *     responses:
 *       200:
 *         description: Market sentiment data
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/sentiment/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 7 } = req.query;
    
    const sentiment = generateMockSentiment(symbol, parseInt(days));
    res.json({ success: true, data: sentiment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/stocks/portfolio:
 *   post:
 *     summary: Get portfolio performance for multiple stocks
 *     tags: [Stocks]
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
 *                 description: Array of stock symbols
 *               horizonDays:
 *                 type: integer
 *                 default: 7
 *                 description: Forecast horizon in days
 *     responses:
 *       200:
 *         description: Portfolio performance data
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.post('/portfolio', async (req, res) => {
  try {
    const { symbols = [], horizonDays = 7 } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }
    
    const portfolioData = generateMockPortfolioData(symbols, horizonDays);
    res.json({ success: true, data: portfolioData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/stocks/websocket/start:
 *   post:
 *     summary: Start WebSocket connection for real-time updates
 *     tags: [Stocks]
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
 *                 description: Array of stock symbols to track
 *     responses:
 *       200:
 *         description: WebSocket started successfully
 *       500:
 *         description: Internal server error
 */
router.post('/websocket/start', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    // Start the stocks service in unified service
    await unifiedWebSocketService.startService('stocks');
    
    // Subscribe to symbols
    if (symbols && Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        unifiedWebSocketService.subscribe('stocks', symbol);
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Stock WebSocket started successfully via unified service',
      symbols: symbols || ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/stocks/websocket/stop:
 *   post:
 *     summary: Stop WebSocket connection
 *     tags: [Stocks]
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
    await unifiedWebSocketService.stopService('stocks');
    res.json({ 
      success: true, 
      message: 'Stock WebSocket stopped successfully via unified service'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/stocks/symbols:
 *   get:
 *     summary: Get all available stock symbols
 *     tags: [Stocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stock symbols
 *       500:
 *         description: Internal server error
 */
router.get('/symbols', async (req, res) => {
  try {
    const symbols = [
      { symbol: 'AAPL', name: 'Apple Inc.', category: 'Technology' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'Technology' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'Technology' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'Consumer Discretionary' },
      { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Consumer Discretionary' },
      { symbol: 'META', name: 'Meta Platforms Inc.', category: 'Technology' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'Technology' },
      { symbol: 'NFLX', name: 'Netflix Inc.', category: 'Communication Services' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', category: 'Financial Services' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'Healthcare' }
    ];
    
    res.json({ success: true, data: symbols });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for mock data
function getBasePrice(symbol) {
  const basePrices = {
    'AAPL': 175,
    'MSFT': 540,
    'TSLA': 376,
    'GOOGL': 2800,
    'AMZN': 3300,
    'META': 350,
    'NVDA': 800,
    'NFLX': 600,
    'JPM': 150,
    'JNJ': 160
  };
  return basePrices[symbol] || 100;
}

function generateMockHistoricalData(symbol, interval, limit) {
  const data = [];
  const basePrice = getBasePrice(symbol);
  const now = new Date();
  
  for (let i = limit - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const randomChange = (Math.random() - 0.5) * 10;
    const price = basePrice + randomChange;
    const open = price + (Math.random() - 0.5) * 2;
    const high = Math.max(open, price) + Math.random() * 1;
    const low = Math.min(open, price) - Math.random() * 1;
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    data.push({
      timestamp: date,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: volume
    });
  }
  
  return data;
}

function generateMockSentiment(symbol, days) {
  const sentiments = ['bullish', 'bearish', 'neutral'];
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
  const confidence = Math.random() * 0.4 + 0.6; // 60-100%
  
  return {
    symbol,
    sentiment,
    confidence: parseFloat(confidence.toFixed(2)),
    metrics: {
      momentum: (Math.random() - 0.5) * 2,
      volatility: Math.random() * 0.5,
      volume: Math.random() * 1000000000
    },
    timestamp: new Date()
  };
}

function generateMockPortfolioData(symbols, horizonDays) {
  const portfolio = {
    symbols: symbols,
    horizonDays: horizonDays,
    totalValue: 0,
    totalChange: 0,
    totalChangePercent: 0,
    positions: []
  };
  
  symbols.forEach(symbol => {
    const basePrice = getBasePrice(symbol);
    const shares = Math.floor(Math.random() * 100) + 10;
    const currentPrice = basePrice + (Math.random() - 0.5) * 10;
    const change = currentPrice - basePrice;
    const changePercent = (change / basePrice) * 100;
    const value = currentPrice * shares;
    
    portfolio.positions.push({
      symbol,
      shares,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      basePrice: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      value: parseFloat(value.toFixed(2))
    });
    
    portfolio.totalValue += value;
    portfolio.totalChange += change;
  });
  
  portfolio.totalChangePercent = (portfolio.totalChange / (portfolio.totalValue - portfolio.totalChange)) * 100;
  portfolio.totalValue = parseFloat(portfolio.totalValue.toFixed(2));
  portfolio.totalChange = parseFloat(portfolio.totalChange.toFixed(2));
  portfolio.totalChangePercent = parseFloat(portfolio.totalChangePercent.toFixed(2));
  
  return portfolio;
}

module.exports = router;
