const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { addStockToPortfolio, addCarbonToPortfolio } = require('../middleware/validation');
const UserPortfolio = require('../models/UserPortfolio');
const StockPostgreSQL = require('../models/StockPostgreSQL');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @swagger
 * /api/portfolios:
 *   get:
 *     summary: Get user's portfolio summary
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio summary retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const portfolio = await UserPortfolio.getPortfolioSummary(req.user.id);
  res.json({ portfolio });
}));

/**
 * @swagger
 * /api/portfolios/stocks:
 *   get:
 *     summary: Get user's stock holdings
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock holdings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/stocks', authenticateToken, asyncHandler(async (req, res) => {
  const stocks = await UserPortfolio.getUserStocks(req.user.id);
  res.json({ stocks });
}));

/**
 * @swagger
 * /api/portfolios/carbon:
 *   get:
 *     summary: Get user's carbon credit holdings
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carbon credit holdings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/carbon', authenticateToken, asyncHandler(async (req, res) => {
  const carbonCredits = await UserPortfolio.getUserCarbonCredits(req.user.id);
  res.json({ carbonCredits });
}));

/**
 * @swagger
 * /api/portfolios/stocks:
 *   post:
 *     summary: Add stock to user portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stockSymbol
 *               - quantity
 *               - purchasePrice
 *               - purchaseDate
 *             properties:
 *               stockSymbol:
 *                 type: string
 *                 description: Stock symbol (e.g., AAPL)
 *               quantity:
 *                 type: number
 *                 description: Number of shares
 *               purchasePrice:
 *                 type: number
 *                 description: Price per share
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 description: Date of purchase
 *     responses:
 *       201:
 *         description: Stock added to portfolio successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/stocks', authenticateToken, validateRequest(addStockToPortfolio), asyncHandler(async (req, res) => {
  const { stockSymbol, quantity, purchasePrice, purchaseDate } = req.body;
  
  // Verify stock exists in our system
  const stock = await StockPostgreSQL.findBySymbol(stockSymbol);
  if (!stock) {
    return res.status(400).json({ 
      error: 'Stock not found', 
      message: `Stock with symbol '${stockSymbol}' is not available in our system` 
    });
  }

  // Add stock to user portfolio
  const portfolioStock = await UserPortfolio.addStock(req.user.id, {
    stockSymbol,
    quantity,
    purchasePrice,
    purchaseDate
  });

  res.status(201).json({ 
    message: 'Stock added to portfolio successfully',
    stock: portfolioStock
  });
}));

/**
 * @swagger
 * /api/portfolios/carbon:
 *   post:
 *     summary: Add carbon credit to user portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creditId
 *               - projectName
 *               - quantity
 *               - purchasePrice
 *               - purchaseDate
 *             properties:
 *               creditId:
 *                 type: string
 *                 description: Unique carbon credit identifier
 *               projectName:
 *                 type: string
 *                 description: Name of the carbon project
 *               quantity:
 *                 type: number
 *                 description: Number of carbon credits
 *               purchasePrice:
 *                 type: number
 *                 description: Price per credit
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 description: Date of purchase
 *               projectType:
 *                 type: string
 *                 description: Type of carbon project
 *               region:
 *                 type: string
 *                 description: Geographic region of the project
 *     responses:
 *       201:
 *         description: Carbon credit added to portfolio successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/carbon', authenticateToken, validateRequest(addCarbonToPortfolio), asyncHandler(async (req, res) => {
  const { creditId, projectName, quantity, purchasePrice, purchaseDate, projectType, region } = req.body;
  
  // Add carbon credit to user portfolio
  const portfolioCredit = await UserPortfolio.addCarbonCredit(req.user.id, {
    creditId,
    projectName,
    quantity,
    purchasePrice,
    purchaseDate,
    projectType,
    region
  });

  res.status(201).json({ 
    message: 'Carbon credit added to portfolio successfully',
    carbonCredit: portfolioCredit
  });
}));

/**
 * @swagger
 * /api/portfolios/stocks/{symbol}:
 *   put:
 *     summary: Update stock quantity in portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *               - purchasePrice
 *               - purchaseDate
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: New quantity of shares
 *               purchasePrice:
 *                 type: number
 *                 description: New purchase price per share
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 description: New purchase date
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stock not found in portfolio
 */
router.put('/stocks/:symbol', authenticateToken, asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { quantity, purchasePrice, purchaseDate } = req.body;
  
  // Validate required fields
  if (!quantity || !purchasePrice || !purchaseDate) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      message: 'quantity, purchasePrice, and purchaseDate are required' 
    });
  }

  // Update stock in portfolio
  const updatedStock = await UserPortfolio.updateStockQuantity(
    req.user.id, 
    symbol, 
    quantity, 
    purchasePrice, 
    purchaseDate
  );

  if (!updatedStock) {
    return res.status(404).json({ 
      error: 'Stock not found', 
      message: `Stock '${symbol}' not found in your portfolio` 
    });
  }

  res.json({ 
    message: 'Stock updated successfully',
    stock: updatedStock
  });
}));

/**
 * @swagger
 * /api/portfolios/stocks/{symbol}:
 *   delete:
 *     summary: Remove stock from portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol
 *     responses:
 *       200:
 *         description: Stock removed from portfolio successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Stock not found in portfolio
 */
router.delete('/stocks/:symbol', authenticateToken, asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  
  // Remove stock from portfolio
  const removedStock = await UserPortfolio.removeStock(req.user.id, symbol);

  if (!removedStock) {
    return res.status(404).json({ 
      error: 'Stock not found', 
      message: `Stock '${symbol}' not found in your portfolio` 
    });
  }

  res.json({ 
    message: 'Stock removed from portfolio successfully',
    stock: removedStock
  });
}));

/**
 * @swagger
 * /api/portfolios/carbon/{creditId}:
 *   delete:
 *     summary: Remove carbon credit from portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: creditId
 *         required: true
 *         schema:
 *           type: string
 *         description: Carbon credit identifier
 *     responses:
 *       200:
 *         description: Carbon credit removed from portfolio successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Carbon credit not found in portfolio
 */
router.delete('/carbon/:creditId', authenticateToken, asyncHandler(async (req, res) => {
  const { creditId } = req.params;
  
  // Remove carbon credit from portfolio
  const removedCredit = await UserPortfolio.removeCarbonCredit(req.user.id, creditId);

  if (!removedCredit) {
    return res.status(404).json({ 
      error: 'Carbon credit not found', 
      message: `Carbon credit '${creditId}' not found in your portfolio` 
    });
  }

  res.json({ 
    message: 'Carbon credit removed from portfolio successfully',
    carbonCredit: removedCredit
  });
}));

/**
 * @swagger
 * /api/portfolios/available-stocks:
 *   get:
 *     summary: Get available stocks for purchase
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available stocks retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/available-stocks', authenticateToken, asyncHandler(async (req, res) => {
  const stocks = await StockPostgreSQL.getAllStocks();
  res.json({ stocks });
}));

module.exports = router;
