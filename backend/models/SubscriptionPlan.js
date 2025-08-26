const { executeQuery } = require('../services/database');

class SubscriptionPlan {
  /**
   * Create subscription_plans table if it doesn't exist
   */
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        billing_cycle VARCHAR(20) DEFAULT 'monthly',
        features JSONB DEFAULT '[]',
        max_users INTEGER DEFAULT 1,
        max_projects INTEGER DEFAULT 10,
        max_storage_mb INTEGER DEFAULT 1000,
        is_active BOOLEAN DEFAULT TRUE,
        is_popular BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
      CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);
    `;

    try {
      await executeQuery(createTableQuery);
      console.log('Subscription plans table created successfully');
    } catch (error) {
      console.error('Error creating subscription plans table:', error);
      throw error;
    }
  }

  /**
   * Get all active subscription plans
   */
  static async getAllActive() {
    const query = `
      SELECT * FROM subscription_plans 
      WHERE is_active = TRUE 
      ORDER BY price ASC
    `;
    
    try {
      const result = await executeQuery(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get subscription plan by slug
   */
  static async getBySlug(slug) {
    const query = `
      SELECT * FROM subscription_plans 
      WHERE slug = $1 AND is_active = TRUE
    `;
    
    try {
      const result = await executeQuery(query, [slug]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting subscription plan by slug:', error);
      throw error;
    }
  }

  /**
   * Get subscription plan by ID
   */
  static async getById(id) {
    const query = `
      SELECT * FROM subscription_plans 
      WHERE id = $1 AND is_active = TRUE
    `;
    
    try {
      const result = await executeQuery(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting subscription plan by ID:', error);
      throw error;
    }
  }

  /**
   * Seed default subscription plans
   */
  static async seedDefaultPlans() {
    const defaultPlans = [
      {
        slug: 'starter',
        name: 'Starter',
        description: 'Perfect for individual investors getting started',
        price: 29.00,
        features: ['Basic forecasting models', 'Portfolio tracking (up to 10 assets)', 'Market sentiment analysis', 'Email notifications', 'Basic reports (CSV)', 'Community support'],
        max_users: 1,
        max_projects: 10,
        max_storage_mb: 1000
      },
      {
        slug: 'professional',
        name: 'Professional',
        description: 'Advanced features for serious investors',
        price: 79.00,
        features: ['All Starter features', 'Advanced AI models (Prophet, ARIMA)', 'Real-time market alerts', 'Advanced analytics & insights', 'Custom reports (PDF & CSV)', 'Priority support', 'Portfolio optimization suggestions', 'Unlimited assets'],
        max_users: 3,
        max_projects: 50,
        max_storage_mb: 5000,
        is_popular: true
      },
      {
        slug: 'enterprise',
        name: 'Enterprise',
        description: 'Complete solution for institutions',
        price: 199.00,
        features: ['All Professional features', 'Custom model training', 'API access & webhooks', 'Dedicated account manager', 'White-label solutions', 'Advanced compliance tools', 'Multi-user management', 'Custom integrations'],
        max_users: 10,
        max_projects: 200,
        max_storage_mb: 20000
      }
    ];

    for (const plan of defaultPlans) {
      try {
        // Check if plan already exists before trying to create
        const existingPlan = await this.findBySlug(plan.slug);
        if (existingPlan) {
          console.log(`Plan ${plan.slug} already exists, skipping...`);
          continue;
        }
        
        await this.create(plan);
        console.log(`Successfully created plan: ${plan.slug}`);
      } catch (error) {
        if (error.code === '23505') { // Duplicate key constraint
          console.log(`Plan ${plan.slug} already exists (constraint violation), skipping...`);
        } else {
          console.error(`Error seeding plan ${plan.slug}:`, error);
        }
      }
    }
  }

  /**
   * Create a new subscription plan
   */
  static async create(planData) {
    const {
      slug,
      name,
      description,
      price,
      currency = 'USD',
      billing_cycle = 'monthly',
      features = [],
      max_users = 1,
      max_projects = 10,
      max_storage_mb = 1000,
      is_popular = false
    } = planData;

    const insertQuery = `
      INSERT INTO subscription_plans (
        slug, name, description, price, currency, billing_cycle,
        features, max_users, max_projects, max_storage_mb, is_popular
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      slug, name, description, price, currency, billing_cycle,
      JSON.stringify(features), max_users, max_projects, max_storage_mb, is_popular
    ];

    try {
      const result = await executeQuery(insertQuery, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        // Duplicate key constraint violation
        const duplicateError = new Error(`Subscription plan with slug '${slug}' already exists`);
        duplicateError.code = '23505';
        throw duplicateError;
      }
      console.error('Error creating subscription plan:', error);
      throw error;
    }
  }

  /**
   * Update an existing subscription plan
   */
  static async update(id, updateData) {
    const allowedFields = ['name', 'slug', 'description', 'price', 'currency', 'billing_cycle', 'features', 'max_users', 'max_projects', 'max_storage_mb', 'is_active', 'is_popular'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (key === 'features') {
          updates.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const updateQuery = `
      UPDATE subscription_plans 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await executeQuery(updateQuery, values);
      if (result.rows.length === 0) {
        throw new Error('Plan not found');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  /**
   * Delete a subscription plan
   */
  static async delete(id) {
    const deleteQuery = `
      DELETE FROM subscription_plans 
      WHERE id = $1 
      RETURNING *
    `;
    
    try {
      const result = await executeQuery(deleteQuery, [id]);
      if (result.rows.length === 0) {
        throw new Error('Plan not found');
      }
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      throw error;
    }
  }

  /**
   * Count subscription plans with optional filters
   */
  static async count(filters = {}) {
    let whereClause = '';
    const values = [];
    let paramCount = 1;

    if (filters.is_active !== undefined) {
      whereClause += ` WHERE is_active = $${paramCount}`;
      values.push(filters.is_active);
      paramCount++;
    }

    const countQuery = `
      SELECT COUNT(*) as count 
      FROM subscription_plans 
      ${whereClause}
    `;

    try {
      const result = await executeQuery(countQuery, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting subscription plans:', error);
      throw error;
    }
  }

  /**
   * Find a subscription plan by slug
   */
  static async findBySlug(slug) {
    const query = `
      SELECT * FROM subscription_plans 
      WHERE slug = $1
    `;
    
    try {
      const result = await executeQuery(query, [slug]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding subscription plan by slug:', error);
      return null;
    }
  }
}

module.exports = SubscriptionPlan;
