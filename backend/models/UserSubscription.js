const { executeQuery } = require('../services/database');

class UserSubscription {
  /**
   * Create user_subscriptions table if it doesn't exist
   */
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        auto_renew BOOLEAN DEFAULT TRUE,
        payment_method VARCHAR(50),
        last_payment_date TIMESTAMP,
        next_payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, plan_id)
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
    `;

    try {
      await executeQuery(createTableQuery);
      console.log('User subscriptions table created successfully');
    } catch (error) {
      console.error('Error creating user subscriptions table:', error);
      throw error;
    }
  }

  /**
   * Create a new user subscription
   */
  static async create(subscriptionData) {
    const {
      user_id,
      plan_id,
      status = 'active',
      auto_renew = true,
      payment_method = null
    } = subscriptionData;

    const insertQuery = `
      INSERT INTO user_subscriptions (
        user_id, plan_id, status, auto_renew, payment_method
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [user_id, plan_id, status, auto_renew, payment_method];

    try {
      const result = await executeQuery(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's current active subscription
   */
  static async getCurrentSubscription(userId) {
    const query = `
      SELECT us.*, sp.*
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1
    `;

    try {
      const result = await executeQuery(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting current subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's subscription history
   */
  static async getSubscriptionHistory(userId) {
    const query = `
      SELECT us.*, sp.name as plan_name, sp.slug as plan_slug
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1
      ORDER BY us.created_at DESC
    `;

    try {
      const result = await executeQuery(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting subscription history:', error);
      throw error;
    }
  }

  /**
   * Update subscription status
   */
  static async updateStatus(subscriptionId, status) {
    const query = `
      UPDATE user_subscriptions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await executeQuery(query, [status, subscriptionId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }

  /**
   * Cancel user subscription
   */
  static async cancel(userId) {
    const query = `
      UPDATE user_subscriptions 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND status = 'active'
      RETURNING *
    `;

    try {
      const result = await executeQuery(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM user_subscriptions 
      WHERE user_id = $1 AND status = 'active'
    `;

    try {
      const result = await executeQuery(query, [userId]);
      return result.rows[0].count > 0;
    } catch (error) {
      console.error('Error checking active subscription:', error);
      throw error;
    }
  }

  /**
   * Find subscriptions by plan ID
   */
  static async findByPlanId(planId) {
    const query = `
      SELECT us.*, u.username, u.email
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      WHERE us.plan_id = $1
      ORDER BY us.created_at DESC
    `;
    
    try {
      const result = await executeQuery(query, [planId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding subscriptions by plan ID:', error);
      throw error;
    }
  }

  /**
   * Count subscriptions with optional filters
   */
  static async count(filters = {}) {
    let whereClause = '';
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      whereClause += ` WHERE status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    const countQuery = `
      SELECT COUNT(*) as count 
      FROM user_subscriptions 
      ${whereClause}
    `;

    try {
      const result = await executeQuery(countQuery, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting user subscriptions:', error);
      throw error;
    }
  }
}

module.exports = UserSubscription;
