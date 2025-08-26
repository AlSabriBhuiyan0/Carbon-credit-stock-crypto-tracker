const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const NotificationPostgreSQL = require('../models/NotificationPostgreSQL');
const asyncHandler = require('../utils/asyncHandler');
const Joi = require('joi'); // Added missing import for Joi

// Initialize notification model
const notificationModel = new NotificationPostgreSQL();

// Joi validation schemas
const notificationSchemas = {
  create: Joi.object({
    title: Joi.string().required().max(255),
    message: Joi.string().required(),
    type: Joi.string().valid('info', 'success', 'warning', 'error', 'alert').default('info'),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    action_required: Joi.boolean().default(false),
    action_url: Joi.string().uri().allow(null, ''),
    expires_at: Joi.date().allow(null, '')
  }),
  
  update: Joi.object({
    title: Joi.string().max(255),
    message: Joi.string(),
    type: Joi.string().valid('info', 'success', 'warning', 'error', 'alert'),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent'),
    action_required: Joi.boolean(),
    action_url: Joi.string().uri().allow(null, ''),
    expires_at: Joi.date().allow(null, '')
  }),
  
  systemNotification: Joi.object({
    title: Joi.string().required().max(255),
    message: Joi.string().required(),
    type: Joi.string().valid('info', 'success', 'warning', 'error', 'alert').default('info'),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    action_required: Joi.boolean().default(false),
    action_url: Joi.string().uri().allow(null, ''),
    expires_at: Joi.date().allow(null, ''),
    user_roles: Joi.array().items(Joi.string()).optional()
  })
};

// Get all notifications for the authenticated user
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, unread_only, type, priority } = req.query;
  
  const options = {
    limit: parseInt(limit),
    offset: parseInt(offset),
    unreadOnly: unread_only === 'true',
    type: type || null,
    priority: priority || null
  };

  try {
    const notifications = await notificationModel.getByUserId(req.user.id, options);
    const stats = await notificationModel.getStats(req.user.id);
    
    res.json({
      success: true,
      data: {
        notifications,
        stats,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: stats.total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
}));

// Get unread notification count
router.get('/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const count = await notificationModel.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
      message: error.message
    });
  }
}));

// Get notification by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const notification = await notificationModel.getById(parseInt(id), req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification',
      message: error.message
    });
  }
}));

// Create a new notification (for admin users or system)
router.post('/', authenticateToken, requireRole(['admin']), validateRequest(notificationSchemas.create), asyncHandler(async (req, res) => {
  const { user_id, ...notificationData } = req.body;
  
  try {
    const notification = await notificationModel.create({
      user_id: user_id || req.user.id,
      ...notificationData
    });
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      message: error.message
    });
  }
}));

// Create system-wide notification (admin only)
router.post('/system', authenticateToken, requireRole(['admin']), validateRequest(notificationSchemas.systemNotification), asyncHandler(async (req, res) => {
  const { user_roles, ...notificationData } = req.body;
  
  try {
    let notifications;
    
    if (user_roles && user_roles.length > 0) {
      // Create notifications for specific user roles
      const usersQuery = 'SELECT id FROM users WHERE account_status = \'active\' AND role = ANY($1)';
      const usersResult = await notificationModel.pool.query(usersQuery, [user_roles]);
      
      notifications = [];
      for (const user of usersResult.rows) {
        const notification = await notificationModel.create({
          user_id: user.id,
          ...notificationData
        });
        notifications.push(notification);
      }
    } else {
      // Create notifications for all active users
      notifications = await notificationModel.createSystemNotification(notificationData);
    }
    
    res.status(201).json({
      success: true,
      message: `System notification created for ${notifications.length} users`,
      data: {
        notifications_created: notifications.length,
        sample_notification: notifications[0]
      }
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create system notification',
      message: error.message
    });
  }
}));

// Update notification
router.put('/:id', authenticateToken, validateRequest(notificationSchemas.update), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const notification = await notificationModel.update(parseInt(id), req.body, req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or access denied'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification',
      message: error.message
    });
  }
}));

// Mark notification as read
router.patch('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const notification = await notificationModel.markAsRead(parseInt(id), req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or access denied'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
}));

// Mark all notifications as read for the user
router.patch('/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const notifications = await notificationModel.markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      message: `Marked ${notifications.length} notifications as read`,
      data: { notifications_updated: notifications.length }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
      message: error.message
    });
  }
}));

// Delete notification
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const notification = await notificationModel.delete(parseInt(id), req.user.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or access denied'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: error.message
    });
  }
}));

// Get notification statistics (admin only)
router.get('/stats/overview', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  try {
    const stats = await notificationModel.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics',
      message: error.message
    });
  }
}));

// Clean up expired notifications (admin only)
router.delete('/cleanup/expired', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  try {
    const deletedNotifications = await notificationModel.deleteExpired();
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedNotifications.length} expired notifications`,
      data: { notifications_deleted: deletedNotifications.length }
    });
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up expired notifications',
      message: error.message
    });
  }
}));

module.exports = router;
