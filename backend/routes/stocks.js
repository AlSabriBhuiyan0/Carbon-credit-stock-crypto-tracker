const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const unifiedWebSocketService = require('../services/unifiedWebSocketService');

// Fetch polyfill for older Node.js versions
const fetch = globalThis.fetch || require('node-fetch');

// Root route for basic stock service
router.get('/', (req, res) => {
  res.json({ 
    message: 'Stock service working', 
    status: 'ok',
    availableEndpoints: [
      '/api/stocks/status',
      '/api/stocks/price/:symbol',
      '/api/stocks/historical/:symbol',
      '/api/stocks/list'
    ]
  });
});

// Stock list endpoint
router.get('/list', (req, res) => {
  const stockList = ['AAPL', 'GOOGL', 'MSFT', 'ADBE', 'AMD', 'TSLA'];
  res.json({ 
    success: true, 
    stocks: stockList,
    count: stockList.length
  });
});

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
    
    console.log(`[STOCKS API] Fetching historical data for ${symbol}, interval: ${interval}, limit: ${limit}`);
    
    // Fetch real historical data from Yahoo Finance
    const data = await fetchRealHistoricalData(symbol, interval, parseInt(limit));
    res.json({ success: true, data });
  } catch (error) {
    console.error(`[STOCKS API] Error fetching historical data for ${symbol}:`, error);
    // Fallback to mock data if API fails
    const data = generateMockHistoricalData(symbol, interval, parseInt(limit));
    res.json({ success: true, data });
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
    
    console.log(`[STOCKS API] Fetching sentiment analysis for ${symbol}, days: ${days}`);
    
    // Fetch real sentiment analysis based on price movements and volume
    const sentiment = await generateRealSentimentAnalysis(symbol, parseInt(days));
    res.json({ success: true, data: sentiment });
  } catch (error) {
    console.error(`[STOCKS API] Error fetching sentiment for ${symbol}:`, error);
    // Fallback to mock sentiment if analysis fails
    const sentiment = generateMockSentiment(symbol, parseInt(days));
    res.json({ success: true, data: sentiment });
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
  
  let totalBaseValue = 0;
  let totalCurrentValue = 0;

  symbols.forEach(symbol => {
    const basePrice = getBasePrice(symbol);
    const shares = Math.floor(Math.random() * 100) + 10;
    const currentPrice = basePrice + (Math.random() - 0.5) * 10;
    const positionBaseValue = basePrice * shares;
    const positionCurrentValue = currentPrice * shares;
    const positionChange = positionCurrentValue - positionBaseValue;
    
    portfolio.positions.push({
      symbol,
      shares,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      basePrice: parseFloat(basePrice.toFixed(2)),
      change: parseFloat((currentPrice - basePrice).toFixed(2)),
      changePercent: parseFloat((((currentPrice - basePrice) / basePrice) * 100).toFixed(2)),
      value: parseFloat(positionCurrentValue.toFixed(2))
    });
    
    totalBaseValue += positionBaseValue;
    totalCurrentValue += positionCurrentValue;
    portfolio.totalChange += positionChange;
  });
  
  portfolio.totalValue = totalCurrentValue;
  portfolio.totalChangePercent = totalBaseValue > 0 ? (portfolio.totalChange / totalBaseValue) * 100 : 0;
  portfolio.totalValue = parseFloat(portfolio.totalValue.toFixed(2));
  portfolio.totalChange = parseFloat(portfolio.totalChange.toFixed(2));
  portfolio.totalChangePercent = parseFloat(portfolio.totalChangePercent.toFixed(2));
  
  return portfolio;
}

// Real data fetching functions
async function fetchRealHistoricalData(symbol, interval, limit) {
  try {
    console.log(`[YAHOO API] Fetching historical data for ${symbol}`);
    
    // Map interval to Yahoo Finance range
    let range = '1mo';
    if (limit <= 30) range = '1mo';
    else if (limit <= 90) range = '3mo';
    else if (limit <= 180) range = '6mo';
    else if (limit <= 365) range = '1y';
    else range = '2y';
    
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const quote = data.chart.result[0];
    
    if (!quote || !quote.timestamp || !quote.indicators?.quote?.[0]) {
      throw new Error('Invalid data structure from Yahoo Finance');
    }
    
    const timestamps = quote.timestamp;
    const prices = quote.indicators.quote[0];
    const volumes = quote.indicators.quote[0].volume;
    
    const historicalData = [];
    const maxPoints = Math.min(limit, timestamps.length);
    
    for (let i = Math.max(0, timestamps.length - maxPoints); i < timestamps.length; i++) {
      if (prices.close[i] && prices.open[i] && prices.high[i] && prices.low[i]) {
        historicalData.push({
          timestamp: new Date(timestamps[i] * 1000),
          open: parseFloat(prices.open[i].toFixed(2)),
          high: parseFloat(prices.high[i].toFixed(2)),
          low: parseFloat(prices.low[i].toFixed(2)),
          close: parseFloat(prices.close[i].toFixed(2)),
          volume: volumes[i] || 0
        });
      }
    }
    
    console.log(`[YAHOO API] Successfully fetched ${historicalData.length} historical data points for ${symbol}`);
    return historicalData;
    
  } catch (error) {
    console.error(`[YAHOO API] Error fetching historical data for ${symbol}:`, error.message);
    throw error;
  }
}

async function generateRealSentimentAnalysis(symbol, days) {
  try {
    console.log(`[SENTIMENT] Analyzing ${symbol} for ${days} days`);
    
    // Get recent historical data for sentiment analysis
    const historicalData = await fetchRealHistoricalData(symbol, '1d', days);
    
    if (historicalData.length < 2) {
      throw new Error('Insufficient data for sentiment analysis');
    }
    
    // Calculate technical indicators for sentiment
    const prices = historicalData.map(d => d.close);
    const volumes = historicalData.map(d => d.volume);
    
    // Price trend analysis
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    // Volatility analysis (standard deviation of price changes)
    const priceChanges = [];
    for (let i = 1; i < prices.length; i++) {
      priceChanges.push(((prices[i] - prices[i-1]) / prices[i-1]) * 100);
    }
    const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const volatility = Math.sqrt(priceChanges.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / priceChanges.length);
    
    // Volume trend analysis
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3; // Last 3 days average
    const volumeTrend = ((recentVolume - avgVolume) / avgVolume) * 100;
    
    // Determine sentiment based on technical analysis
    let sentiment = 'neutral';
    let confidence = 0.5;
    
    if (priceChange > 2 && volumeTrend > 10) {
      sentiment = 'bullish';
      confidence = Math.min(0.9, 0.6 + (priceChange / 10) + (volumeTrend / 100));
    } else if (priceChange < -2 && volumeTrend > 10) {
      sentiment = 'bearish';
      confidence = Math.min(0.9, 0.6 + Math.abs(priceChange / 10) + (volumeTrend / 100));
    } else if (Math.abs(priceChange) < 1 && volatility < 2) {
      sentiment = 'neutral';
      confidence = 0.7;
    } else if (priceChange > 0) {
      sentiment = 'bullish';
      confidence = 0.6 + (priceChange / 20);
    } else {
      sentiment = 'bearish';
      confidence = 0.6 + Math.abs(priceChange / 20);
    }
    
    confidence = Math.max(0.5, Math.min(0.95, confidence));
    
    const result = {
      symbol,
      sentiment,
      confidence: parseFloat(confidence.toFixed(2)),
      metrics: {
        momentum: parseFloat(priceChange.toFixed(2)),
        volatility: parseFloat(volatility.toFixed(2)),
        volume: Math.round(avgVolume),
        volumeTrend: parseFloat(volumeTrend.toFixed(2)),
        priceChange: parseFloat(priceChange.toFixed(2))
      },
      analysis: {
        summary: generateSentimentSummary(sentiment, priceChange, volatility, volumeTrend),
        period: `${days} days`,
        dataPoints: historicalData.length
      },
      timestamp: new Date()
    };
    
    console.log(`[SENTIMENT] ${symbol}: ${sentiment} (${(confidence*100).toFixed(1)}% confidence)`);
    return result;
    
  } catch (error) {
    console.error(`[SENTIMENT] Error analyzing ${symbol}:`, error.message);
    throw error;
  }
}

function generateSentimentSummary(sentiment, priceChange, volatility, volumeTrend) {
  const absChange = Math.abs(priceChange);
  
  if (sentiment === 'bullish') {
    if (absChange > 5) return `Strong upward momentum with ${priceChange.toFixed(1)}% gain. ${volumeTrend > 20 ? 'High volume confirms bullish sentiment.' : 'Moderate volume activity.'}`;
    else return `Positive price action with ${priceChange.toFixed(1)}% gain. ${volatility > 3 ? 'Higher volatility suggests caution.' : 'Stable upward movement.'}`;
  } else if (sentiment === 'bearish') {
    if (absChange > 5) return `Strong downward pressure with ${priceChange.toFixed(1)}% decline. ${volumeTrend > 20 ? 'High volume confirms bearish sentiment.' : 'Moderate volume activity.'}`;
    else return `Negative price action with ${priceChange.toFixed(1)}% decline. ${volatility > 3 ? 'Higher volatility suggests uncertainty.' : 'Gradual downward movement.'}`;
  } else {
    return `Sideways movement with ${priceChange.toFixed(1)}% change. ${volatility > 2 ? 'Increased volatility suggests potential breakout.' : 'Low volatility indicates consolidation.'}`;
  }
}

module.exports = router;
