const express = require('express');
const router = express.Router();
const AssetTypeService = require('../services/assetTypeService');

/**
 * @swagger
 * /api/forecast/categorize:
 *   post:
 *     summary: Categorize assets for forecasting
 *     tags: [Forecast]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of asset symbols
 *     responses:
 *       200:
 *         description: Categorized assets for forecasting
 *       400:
 *         description: Invalid request
 */
router.post('/categorize', (req, res) => {
  try {
    const { assets } = req.body;
    
    if (!Array.isArray(assets)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Assets must be an array' 
      });
    }

    if (assets.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No assets provided' 
      });
    }

    if (assets.length > 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 3 assets allowed' 
      });
    }

    const categorized = AssetTypeService.categorizeAssets(assets);
    
    res.json({
      success: true,
      assets: assets,
      stocks: categorized.stocks,
      crypto: categorized.crypto,
      unknown: categorized.unknown,
      count: assets.length,
      types: assets.map(asset => ({ 
        symbol: asset, 
        type: AssetTypeService.getAssetType(asset) 
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/forecast/mixed:
 *   post:
 *     summary: Generate mixed asset forecasts
 *     tags: [Forecast]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of asset symbols (max 3)
 *               horizon:
 *                 type: number
 *                 default: 7
 *                 description: Forecast horizon in days
 *     responses:
 *       200:
 *         description: Mixed asset forecasts
 *       400:
 *         description: Invalid request
 */
router.post('/mixed', async (req, res) => {
  try {
    const { assets, horizon = 7, userId, useRealData = false } = req.body;
    
    if (!Array.isArray(assets)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Assets must be an array' 
      });
    }

    if (assets.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No assets provided' 
      });
    }

    if (assets.length > 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 3 assets allowed' 
      });
    }

    const categorized = AssetTypeService.categorizeAssets(assets);
    
    // Generate forecasts with real data if requested
    const forecasts = {};
    
    if (categorized.stocks.length > 0) {
      forecasts.stocks = await Promise.all(categorized.stocks.map(async (symbol) => {
        let currentPrice = 150; // Default fallback
        
        if (useRealData) {
          try {
            // Try to get real-time stock data
            const stockData = await getRealStockData(symbol);
            currentPrice = stockData.price || currentPrice;
          } catch (error) {
            console.log(`⚠️  Could not fetch real stock data for ${symbol}, using fallback`);
          }
        }
        
        return {
          symbol,
          type: 'stock',
          currentPrice,
          forecast: {
            horizon: horizon,
            predictions: generateForecastPredictions(horizon, 'stock', symbol, currentPrice)
          }
        };
      }));
    }
    
    if (categorized.crypto.length > 0) {
      forecasts.crypto = await Promise.all(categorized.crypto.map(async (symbol) => {
        let currentPrice = 45000; // Default fallback
        
        if (useRealData) {
          try {
            // Try to get real-time crypto data
            const cryptoData = await getRealCryptoData(symbol);
            currentPrice = cryptoData.price || currentPrice;
          } catch (error) {
            console.log(`⚠️  Could not fetch real crypto data for ${symbol}, using fallback`);
          }
        }
        
        return {
          symbol,
          type: 'crypto',
          currentPrice,
          forecast: {
            horizon: horizon,
            predictions: generateForecastPredictions(horizon, 'crypto', symbol, currentPrice)
          }
        };
      }));
    }
    
    // Store forecast in user history if userId provided
    if (userId) {
      try {
        // In production, this would save to database
        console.log(`📊 Storing forecast for user ${userId}: ${assets.join(', ')} (${horizon} days)`);
      } catch (error) {
        console.log(`⚠️  Could not store forecast history: ${error.message}`);
      }
    }
    
    res.json({
      success: true,
      assets: assets,
      categorized: categorized,
      forecasts: forecasts,
      horizon: horizon,
      userId: userId || null,
      useRealData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/forecast/validate:
 *   post:
 *     summary: Validate forecast request
 *     tags: [Forecast]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxAssets:
 *                 type: number
 *                 default: 3
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: Validation failed
 */
router.post('/validate', (req, res) => {
  try {
    const { assets, maxAssets = 3 } = req.body;
    
    const validation = AssetTypeService.validateMixedSelection(assets, maxAssets);
    
    if (validation.isValid) {
      res.json({
        success: true,
        ...validation
      });
    } else {
      res.status(400).json({
        success: false,
        error: validation.error
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/forecast/health:
 *   get:
 *     summary: Forecast service health check
 *     tags: [Forecast]
 *     responses:
 *       200:
 *         description: Service status
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Forecast Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/forecast/categorize',
      '/api/forecast/mixed',
      '/api/forecast/validate',
      '/api/forecast/download'
    ]
  });
});

/**
 * @swagger
 * /api/forecast/download:
 *   post:
 *     summary: Download forecast report
 *     tags: [Forecast]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of asset symbols
 *               horizon:
 *                 type: number
 *                 description: Forecast horizon in days
 *               format:
 *                 type: string
 *                 enum: [pdf, csv, excel]
 *                 default: pdf
 *                 description: Download format
 *     responses:
 *       200:
 *         description: Forecast report file
 *       400:
 *         description: Invalid request
 */
router.post('/download', (req, res) => {
  try {
    const { assets, horizon, format = 'pdf' } = req.body;
    
    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Assets array is required' 
      });
    }
    
    if (!horizon || horizon < 1 || horizon > 365) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid horizon (1-365 days) is required' 
      });
    }
    
    // Generate forecast data for the report
    const categorized = AssetTypeService.categorizeAssets(assets);
    const forecasts = {};
    
    if (categorized.stocks.length > 0) {
      forecasts.stocks = categorized.stocks.map(symbol => ({
        symbol,
        type: 'stock',
        forecast: {
          horizon: horizon,
          predictions: generateForecastPredictions(horizon, 'stock', symbol)
        }
      }));
    }
    
    if (categorized.crypto.length > 0) {
      forecasts.crypto = categorized.crypto.map(symbol => ({
        symbol,
        type: 'crypto',
        forecast: {
          horizon: horizon,
          predictions: generateForecastPredictions(horizon, 'crypto', symbol)
        }
      }));
    }
    
    // Generate report based on format
    let reportData, contentType, filename;
    
    switch (format.toLowerCase()) {
      case 'csv':
        reportData = generateCSVReport(assets, horizon, forecasts);
        contentType = 'text/csv';
        filename = `forecast_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'excel':
        reportData = generateExcelReport(assets, horizon, forecasts);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `forecast_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
        
      case 'pdf':
      default:
        reportData = generatePDFReport(assets, horizon, forecasts);
        contentType = 'application/pdf';
        filename = `forecast_report_${new Date().toISOString().split('T')[0]}.pdf`;
        break;
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(reportData));
    
    res.send(reportData);
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Generate forecast predictions based on horizon
 * @param {number} horizon - Number of days to forecast
 * @param {string} type - Asset type ('stock' or 'crypto')
 * @param {string} symbol - Asset symbol
 * @param {number} currentPrice - Current price to base forecast on
 * @returns {Array} Array of prediction objects
 */
function generateForecastPredictions(horizon, type, symbol, currentPrice = null) {
  const predictions = [];
  const baseDate = new Date();
  
  // Use provided current price or fall back to base prices
  let basePrice = currentPrice;
  if (!basePrice) {
    const basePrices = {
      stock: {
        'AAPL': 150, 'GOOGL': 2800, 'MSFT': 540, 'ADBE': 580, 'AMD': 120, 'TSLA': 376, 'NVDA': 800, 'NFLX': 600
      },
      crypto: {
        'BTC': 45000, 'ETH': 3000, 'BNB': 300, 'ADA': 0.5, 'SOL': 100, 'DOT': 7, 'LINK': 20, 'MATIC': 0.8, 'AVAX': 25, 'UNI': 10
      }
    };
    basePrice = basePrices[type]?.[symbol] || (type === 'stock' ? 100 : 1000);
  }
  
  for (let i = 0; i < horizon; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    // Generate realistic price progression with some randomness
    const dailyChange = (Math.random() - 0.5) * 0.02; // ±1% daily change
    const price = basePrice * Math.pow(1 + dailyChange, i);
    
    // Confidence decreases over time
    const confidence = Math.max(0.5, 0.9 - (i * 0.02));
    
    predictions.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      price: parseFloat(price.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(2))
    });
  }
  
  return predictions;
}

/**
 * Get real-time stock data
 * @param {string} symbol - Stock symbol
 * @returns {Object} Stock data with price
 */
async function getRealStockData(symbol) {
  try {
    // In production, this would call a real stock API
    // For now, simulate real data with some randomness
    const basePrices = {
      'AAPL': 150, 'GOOGL': 2800, 'MSFT': 540, 'ADBE': 580, 'AMD': 120, 'TSLA': 376, 'NVDA': 800, 'NFLX': 600
    };
    
    const basePrice = basePrices[symbol] || 100;
    const priceVariation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
    const currentPrice = basePrice * (1 + priceVariation);
    
    return {
      symbol,
      price: parseFloat(currentPrice.toFixed(2)),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to fetch stock data for ${symbol}: ${error.message}`);
  }
}

/**
 * Get real-time crypto data
 * @param {string} symbol - Crypto symbol
 * @returns {Object} Crypto data with price
 */
async function getRealCryptoData(symbol) {
  try {
    // In production, this would call a real crypto API
    // For now, simulate real data with some randomness
    const basePrices = {
      'BTC': 45000, 'ETH': 3000, 'BNB': 300, 'ADA': 0.5, 'SOL': 100, 'DOT': 7, 'LINK': 20, 'MATIC': 0.8, 'AVAX': 25, 'UNI': 10
    };
    
    const basePrice = basePrices[symbol] || 1000;
    const priceVariation = (Math.random() - 0.5) * 0.08; // ±4% variation (crypto is more volatile)
    const currentPrice = basePrice * (1 + priceVariation);
    
    return {
      symbol,
      price: parseFloat(currentPrice.toFixed(2)),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to fetch crypto data for ${symbol}: ${error.message}`);
  }
}

/**
 * Generate CSV report
 */
function generateCSVReport(assets, horizon, forecasts) {
  let csv = 'Asset Type,Symbol,Date,Predicted Price,Confidence\n';
  
  if (forecasts.stocks) {
    forecasts.stocks.forEach(stock => {
      stock.forecast.predictions.forEach(prediction => {
        csv += `Stock,${stock.symbol},${prediction.date},${prediction.price},${prediction.confidence}\n`;
      });
    });
  }
  
  if (forecasts.crypto) {
    forecasts.crypto.forEach(crypto => {
      crypto.forecast.predictions.forEach(prediction => {
        csv += `Crypto,${crypto.symbol},${prediction.date},${prediction.price},${prediction.confidence}\n`;
      });
    });
  }
  
  return csv;
}

/**
 * Generate Excel report (simplified - returns CSV for now)
 */
function generateExcelReport(assets, horizon, forecasts) {
  // For now, return CSV format. In production, you'd use a library like 'exceljs'
  return generateCSVReport(assets, horizon, forecasts);
}

/**
 * Generate PDF report (simplified - returns text for now)
 */
function generatePDFReport(assets, horizon, forecasts) {
  let report = `FORECAST REPORT\n`;
  report += `Generated: ${new Date().toLocaleDateString()}\n`;
  report += `Horizon: ${horizon} days\n`;
  report += `Assets: ${assets.join(', ')}\n\n`;
  
  if (forecasts.stocks) {
    report += `STOCK FORECASTS:\n`;
    forecasts.stocks.forEach(stock => {
      report += `\n${stock.symbol}:\n`;
      stock.forecast.predictions.forEach(prediction => {
        report += `  ${prediction.date}: $${prediction.price} (${(prediction.confidence * 100).toFixed(0)}% confidence)\n`;
      });
    });
  }
  
  if (forecasts.crypto) {
    report += `\nCRYPTO FORECASTS:\n`;
    forecasts.crypto.forEach(crypto => {
      report += `\n${crypto.symbol}:\n`;
      crypto.forecast.predictions.forEach(prediction => {
        report += `  ${prediction.date}: $${prediction.price} (${(prediction.confidence * 100).toFixed(0)}% confidence)\n`;
      });
    });
  }
  
  return report;
}

module.exports = router;
