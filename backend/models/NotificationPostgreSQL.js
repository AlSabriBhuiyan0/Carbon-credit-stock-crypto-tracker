const { Pool } = require('pg');
require('dotenv').config();

class NotificationPostgreSQL {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  // Create notifications table
  async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        read_status BOOLEAN DEFAULT FALSE,
        action_required BOOLEAN DEFAULT FALSE,
        action_url VARCHAR(500),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read_status);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `;

    try {
      await this.pool.query(createTableQuery);
      console.log('✅ Notifications table created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating notifications table:', error.message);
      return false;
    }
  }

  // Create a new notification
  async create(notificationData) {
    const {
      user_id,
      title,
      message,
      type = 'info',
      priority = 'normal',
      action_required = false,
      action_url = null,
      expires_at = null
    } = notificationData;

    const insertQuery = `
      INSERT INTO notifications (user_id, title, message, type, priority, action_required, action_url, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    try {
      const result = await this.pool.query(insertQuery, [
        user_id, title, message, type, priority, action_required, action_url, expires_at
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error.message);
      throw error;
    }
  }

  // Get notifications for a specific user
  async getByUserId(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      type = null,
      priority = null
    } = options;

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    let paramCount = 1;

    if (unreadOnly) {
      paramCount++;
      whereClause += ` AND read_status = FALSE`;
    }

    if (type) {
      paramCount++;
      whereClause += ` AND type = $${paramCount}`;
      params.push(type);
    }

    if (priority) {
      paramCount++;
      whereClause += ` AND priority = $${paramCount}`;
      params.push(priority);
    }

    const query = `
      SELECT * FROM notifications 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting notifications:', error.message);
      throw error;
    }
  }

  // Get unread notification count for a user
  async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND read_status = FALSE
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error.message);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications 
      SET read_status = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [notificationId, userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET read_status = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error marking all notifications as read:', error.message);
      throw error;
    }
  }

  // Delete a notification
  async delete(notificationId, userId) {
    const query = `
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [notificationId, userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting notification:', error.message);
      throw error;
    }
  }

  // Delete expired notifications
  async deleteExpired() {
    const query = `
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error deleting expired notifications:', error.message);
      throw error;
    }
  }

  // Get notification statistics for a user
  async getStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read_status = FALSE THEN 1 END) as unread,
        COUNT(CASE WHEN type = 'alert' THEN 1 END) as alerts,
        COUNT(CASE WHEN type = 'info' THEN 1 END) as info,
        COUNT(CASE WHEN type = 'success' THEN 1 END) as success,
        COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN action_required = TRUE THEN 1 END) as action_required
      FROM notifications 
      WHERE user_id = $1
    `;

    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting notification stats:', error.message);
      throw error;
    }
  }

  // Create system-wide notification
  async createSystemNotification(notificationData) {
    const {
      title,
      message,
      type = 'info',
      priority = 'normal',
      action_required = false,
      action_url = null,
      expires_at = null
    } = notificationData;

    // Get all active users
    const usersQuery = 'SELECT id FROM users WHERE account_status = \'active\'';
    
    try {
      const usersResult = await this.pool.query(usersQuery);
      const notifications = [];

      for (const user of usersResult.rows) {
        const notification = await this.create({
          user_id: user.id,
          title,
          message,
          type,
          priority,
          action_required,
          action_url,
          expires_at
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating system notification:', error.message);
      throw error;
    }
  }

  // Close database connection
  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = NotificationPostgreSQL;
