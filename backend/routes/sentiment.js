const express = require('express');
const router = express.Router();
const forecastingService = require('../services/forecasting');

/**
 * @swagger
 * /api/sentiment:
 *   get:
 *     summary: Get market sentiment analysis
 *     tags: [Sentiment]
 *     responses:
 *       200:
 *         description: Market sentiment data
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    // Get sentiment data from the forecasting service
    const sentimentData = await forecastingService.analyzeMarketSentiment();
    
    res.json({
      overallSentiment: sentimentData.overallSentiment,
      overallScore: sentimentData.overallScore,
      stockSentiment: sentimentData.stockSentiment,
      carbonSentiment: sentimentData.carbonSentiment,
      cryptoSentiment: sentimentData.cryptoSentiment,
      marketIndicators: sentimentData.marketIndicators,
      riskMetrics: sentimentData.riskMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sentiment endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
