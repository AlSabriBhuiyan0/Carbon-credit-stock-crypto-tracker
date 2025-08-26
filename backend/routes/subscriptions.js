const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');

const router = express.Router();

// Mock data for testing when database is not available
const mockPlans = [
  {
    id: 1,
    slug: 'starter',
    name: 'Starter',
    description: 'Perfect for individual investors getting started',
    price: 29.00,
    features: ['Basic forecasting models', 'Portfolio tracking (up to 10 assets)', 'Market sentiment analysis', 'Email notifications', 'Basic reports (CSV)', 'Community support'],
    max_users: 1,
    max_projects: 10,
    max_storage_mb: 1000,
    is_active: true
  },
  {
    id: 2,
    slug: 'professional',
    name: 'Professional',
    description: 'Advanced features for serious investors',
    price: 79.00,
    features: ['All Starter features', 'Advanced AI models (Prophet, ARIMA)', 'Real-time market alerts', 'Advanced analytics & insights', 'Custom reports (PDF & CSV)', 'Priority support', 'Portfolio optimization suggestions', 'Unlimited assets'],
    max_users: 3,
    max_projects: 50,
    max_storage_mb: 5000,
    is_popular: true,
    is_active: true
  },
  {
    id: 3,
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for institutions',
    price: 199.00,
    features: ['All Professional features', 'Custom model training', 'API access & webhooks', 'Dedicated account manager', 'White-label solutions', 'Advanced compliance tools', 'Multi-user management', 'Custom integrations'],
    max_users: 10,
    max_projects: 200,
    max_storage_mb: 20000,
    is_active: true
  }
];

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Get all active subscription plans
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: List of subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriptionPlan'
 */
router.get('/plans', asyncHandler(async (req, res) => {
  try {
    // Try to get plans from database first
    const plans = await SubscriptionPlan.getAllActive();
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.log('Database unavailable, using mock data:', error.message);
    // Fallback to mock data if database is not available
    res.json({
      success: true,
      data: mockPlans,
      note: 'Using mock data - database not available'
    });
  }
}));

/**
 * @swagger
 * /api/subscriptions/plans/{slug}:
 *   get:
 *     summary: Get subscription plan by slug
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan slug (e.g., 'starter', 'professional')
 *     responses:
 *       200:
 *         description: Subscription plan details
 *       404:
 *         description: Plan not found
 */
router.get('/plans/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  try {
    // Try to get plan from database first
    const plan = await SubscriptionPlan.getBySlug(slug);
    
    if (plan) {
      return res.json({
        success: true,
        data: plan
      });
    }
  } catch (error) {
    console.log('Database unavailable, using mock data:', error.message);
  }
  
  // Fallback to mock data if database is not available
  const mockPlan = mockPlans.find(p => p.slug === slug);
  
  if (!mockPlan) {
    return res.status(404).json({
      success: false,
      error: 'Plan not found'
    });
  }
  
  res.json({
    success: true,
    data: mockPlan,
    note: 'Using mock data - database not available'
  });
}));

/**
 * @swagger
 * /api/subscriptions/user/current:
 *   get:
 *     summary: Get user's current subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's current subscription
 *       401:
 *         description: Unauthorized
 */
router.get('/user/current', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const subscription = await UserSubscription.getCurrentSubscription(userId);
  
  res.json({
    success: true,
    data: subscription
  });
}));

/**
 * @swagger
 * /api/subscriptions/user/history:
 *   get:
 *     summary: Get user's subscription history
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's subscription history
 *       401:
 *         description: Unauthorized
 */
router.get('/user/history', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const history = await UserSubscription.getSubscriptionHistory(userId);
  
  res.json({
    success: true,
    data: history
  });
}));

/**
 * @swagger
 * /api/subscriptions/user/cancel:
 *   post:
 *     summary: Cancel user's current subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No active subscription found
 */
router.post('/user/cancel', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const hasActive = await UserSubscription.hasActiveSubscription(userId);
  
  if (!hasActive) {
    return res.status(404).json({
      success: false,
      error: 'No active subscription found'
    });
  }
  
  const cancelled = await UserSubscription.cancel(userId);
  
  res.json({
    success: true,
    message: 'Subscription cancelled successfully',
    data: cancelled
  });
}));

module.exports = router;
