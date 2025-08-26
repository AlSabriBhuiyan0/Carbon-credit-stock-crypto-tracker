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
router.post('/mixed', (req, res) => {
  try {
    const { assets, horizon = 7 } = req.body;
    
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
    
    // Mock forecast data for now - in real implementation, this would call actual forecasting services
    const forecasts = {};
    
    if (categorized.stocks.length > 0) {
      forecasts.stocks = categorized.stocks.map(symbol => ({
        symbol,
        type: 'stock',
        forecast: {
          horizon: horizon,
          predictions: [
            { date: '2025-08-27', price: 150.25, confidence: 0.85 },
            { date: '2025-08-28', price: 151.50, confidence: 0.82 },
            { date: '2025-08-29', price: 152.75, confidence: 0.79 }
          ]
        }
      }));
    }
    
    if (categorized.crypto.length > 0) {
      forecasts.crypto = categorized.crypto.map(symbol => ({
        symbol,
        type: 'crypto',
        forecast: {
          horizon: horizon,
          predictions: [
            { date: '2025-08-27', price: 45000, confidence: 0.78 },
            { date: '2025-08-28', price: 45500, confidence: 0.75 },
            { date: '2025-08-29', price: 46000, confidence: 0.72 }
          ]
        }
      }));
    }
    
    res.json({
      success: true,
      assets: assets,
      categorized: categorized,
      forecasts: forecasts,
      horizon: horizon,
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
      '/api/forecast/validate'
    ]
  });
});

module.exports = router;
