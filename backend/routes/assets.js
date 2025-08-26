const express = require('express');
const router = express.Router();
const AssetTypeService = require('../services/assetTypeService');

/**
 * @swagger
 * /api/assets/{symbol}/type:
 *   get:
 *     summary: Get asset type for a symbol
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset symbol (e.g., AAPL, BTC)
 *     responses:
 *       200:
 *         description: Asset type information
 *       400:
 *         description: Invalid symbol
 */
router.get('/:symbol/type', (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ 
        success: false, 
        error: 'Symbol parameter is required' 
      });
    }

    const assetType = AssetTypeService.getAssetType(symbol);
    
    res.json({ 
      success: true, 
      symbol: symbol.toUpperCase(),
      type: assetType,
      isValid: AssetTypeService.isValidSymbol(symbol)
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
 * /api/assets/validate-mixed:
 *   post:
 *     summary: Validate mixed asset selection
 *     tags: [Assets]
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
 *               maxAssets:
 *                 type: number
 *                 default: 3
 *                 description: Maximum number of assets allowed
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: Validation failed
 */
router.post('/validate-mixed', (req, res) => {
  try {
    const { assets, maxAssets = 3 } = req.body;
    
    const validation = AssetTypeService.validateMixedSelection(assets, maxAssets);
    
    if (validation.isValid) {
      res.json({
        success: true,
        isValid: true,
        ...validation
      });
    } else {
      res.status(400).json({
        success: false,
        isValid: false,
        error: validation.error
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      isValid: false,
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/assets/categorize:
 *   post:
 *     summary: Categorize assets by type
 *     tags: [Assets]
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
 *         description: Categorized assets
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

    const categorized = AssetTypeService.categorizeAssets(assets);
    
    res.json({
      success: true,
      assets: assets,
      categorized: categorized,
      count: assets.length
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
 * /api/assets/symbols:
 *   get:
 *     summary: Get available symbols by type
 *     tags: [Assets]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [stock, crypto, all]
 *           default: all
 *         description: Type of symbols to return
 *     responses:
 *       200:
 *         description: Available symbols
 */
router.get('/symbols', (req, res) => {
  try {
    const { type = 'all' } = req.query;
    const symbols = AssetTypeService.getAvailableSymbols(type);
    
    res.json({
      success: true,
      type: type,
      symbols: symbols,
      count: symbols.length
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
 * /api/assets/health:
 *   get:
 *     summary: Asset service health check
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: Service status
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Asset Type Detection Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    availableTypes: ['stock', 'crypto'],
    totalStockSymbols: AssetTypeService.stockSymbols.length,
    totalCryptoSymbols: AssetTypeService.cryptoSymbols.length
  });
});

module.exports = router;
