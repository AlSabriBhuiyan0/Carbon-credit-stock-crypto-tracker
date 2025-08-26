const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const unfcccService = require('../services/unfcccNodeService');

/**
 * @swagger
 * /api/unfccc/status:
 *   get:
 *     summary: Get UNFCCC service status
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status information
 *       500:
 *         description: Internal server error
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await unfcccService.getServiceStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/unfccc/parties:
 *   get:
 *     summary: Get available parties (countries)
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available parties
 *       500:
 *         description: Internal server error
 */
router.get('/parties', authenticateToken, async (req, res) => {
  try {
    const parties = await unfcccService.getAvailableParties();
    res.json(parties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/unfccc/gases:
 *   get:
 *     summary: Get available greenhouse gases
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available gases
 *       500:
 *         description: Internal server error
 */
router.get('/gases', authenticateToken, async (req, res) => {
  try {
    const gases = await unfcccService.getAvailableGases();
    res.json(gases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/unfccc/emissions/{partyCode}:
 *   get:
 *     summary: Get emissions data for a specific party
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyCode
 *         required: true
 *         schema:
 *           type: string
 *         description: ISO code of the party (e.g., USA, GBR, DEU)
 *       - in: query
 *         name: gases
 *         schema:
 *           type: string
 *         description: Comma-separated list of gases (e.g., CO2,CH4,N2O)
 *     responses:
 *       200:
 *         description: Emissions data for the party
 *       400:
 *         description: Invalid party code
 *       500:
 *         description: Internal server error
 */
router.get('/emissions/:partyCode', authenticateToken, async (req, res) => {
  try {
    const { partyCode } = req.params;
    const { gases } = req.query;
    
    if (!partyCode) {
      return res.status(400).json({ error: 'Party code is required' });
    }
    
    const gasList = gases ? gases.split(',') : null;
    const emissionsData = await unfcccService.getEmissionsData(partyCode, gasList);
    
    res.json(emissionsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/unfccc/annex-one:
 *   post:
 *     summary: Get data for Annex I parties (developed countries)
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partyCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of party codes
 *               gases:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of gases to query
 *     responses:
 *       200:
 *         description: Annex I parties data
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post('/annex-one', authenticateToken, async (req, res) => {
  try {
    const { partyCodes, gases } = req.body;
    
    if (!partyCodes || !Array.isArray(partyCodes)) {
      return res.status(400).json({ error: 'partyCodes array is required' });
    }
    
    const data = await unfcccService.getAnnexOneData(partyCodes, gases);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/unfccc/non-annex-one:
 *   post:
 *     summary: Get data for non-Annex I parties (developing countries)
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partyCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of party codes
 *               gases:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of gases to query
 *     responses:
 *       200:
 *         description: Non-Annex I parties data
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post('/non-annex-one', authenticateToken, async (req, res) => {
  try {
    const { partyCodes, gases } = req.body;
    
    if (!partyCodes || !Array.isArray(partyCodes)) {
      return res.status(400).json({ error: 'partyCodes array is required' });
    }
    
    const data = await unfcccService.getNonAnnexOneData(partyCodes, gases);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/unfccc/summary:
 *   post:
 *     summary: Get emissions summary for multiple parties
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partyCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of party codes
 *     responses:
 *       200:
 *         description: Emissions summary for multiple parties
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post('/summary', authenticateToken, async (req, res) => {
  try {
    const { partyCodes } = req.body;
    
    if (!partyCodes || !Array.isArray(partyCodes)) {
      return res.status(400).json({ error: 'partyCodes array is required' });
    }
    
    const summary = await unfcccService.getEmissionsSummary(partyCodes);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/unfccc/carbon-market:
 *   get:
 *     summary: Get carbon credit market data based on UNFCCC emissions
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carbon credit market data
 *       500:
 *         description: Internal server error
 */
router.get('/carbon-market', authenticateToken, async (req, res) => {
  try {
    const marketData = await unfcccService.getCarbonCreditMarketData();
    res.json(marketData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/unfccc/trends/{partyCode}:
 *   get:
 *     summary: Get historical emissions trends for carbon credit analysis
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyCode
 *         required: true
 *         schema:
 *           type: string
 *         description: ISO code of the party
 *       - in: query
 *         name: years
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of years to analyze
 *     responses:
 *       200:
 *         description: Historical emissions trends
 *       400:
 *         description: Invalid party code
 *       500:
 *         description: Internal server error
 */
router.get('/trends/:partyCode', authenticateToken, async (req, res) => {
  try {
    const { partyCode } = req.params;
    const { years = 10 } = req.query;
    
    if (!partyCode) {
      return res.status(400).json({ error: 'Party code is required' });
    }
    
    const trends = await unfcccService.getHistoricalEmissionsTrends(partyCode, parseInt(years));
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/unfccc/zenodo/{partyCode}:
 *   get:
 *     summary: Get data from Zenodo backup source
 *     tags: [UNFCCC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyCode
 *         required: true
 *         schema:
 *           type: string
 *         description: ISO code of the party
 *     responses:
 *       200:
 *         description: Zenodo data for the party
 *       400:
 *         description: Invalid party code
 *       500:
 *         description: Internal server error
 */
router.get('/zenodo/:partyCode', authenticateToken, async (req, res) => {
  try {
    const { partyCode } = req.params;
    
    if (!partyCode) {
      return res.status(400).json({ error: 'Party code is required' });
    }
    
    const zenodoData = await unfcccService.getZenodoData(partyCode);
    res.json(zenodoData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
