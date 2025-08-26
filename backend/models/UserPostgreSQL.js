const { executeQuery } = require('../services/database');
const bcrypt = require('bcryptjs');

class UserPostgreSQL {
  /**
   * Create users table if it doesn't exist
   */
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'public' CHECK (role IN ('investor', 'company', 'regulator', 'ngo', 'public', 'admin')),
        company_id VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending', 'deactivated')),
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        preferences JSONB DEFAULT '{}',
        permissions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      
      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
      CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `;

    try {
      await executeQuery(createTableQuery);
      console.log('Users table created successfully');
    } catch (error) {
      console.error('Error creating users table:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      role = 'public',
      company_id,
      phone,
      address,
      city,
      state,
      country,
      postal_code
    } = userData;

    // Hash the password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, role,
        company_id, phone, address, city, state, country, postal_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, username, email, first_name, last_name, role, company_id, 
                account_status, created_at
    `;

    const values = [
      username, email, password_hash, first_name || null, last_name || null, role,
      company_id || null, phone || null, address || null, city || null, state || null, country || null, postal_code || null
    ];

    try {
      console.log('🔧 UserPostgreSQL.create - About to execute query with values:', values);
      const result = await executeQuery(insertQuery, values);
      console.log('🔧 UserPostgreSQL.create - executeQuery result:', result);
      console.log('🔧 UserPostgreSQL.create - result.rows:', result.rows);
      console.log('🔧 UserPostgreSQL.create - result.rows[0]:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, username, email, password_hash, first_name, last_name, role,
             company_id, phone, account_status, email_verified, phone_verified,
             two_factor_enabled, last_login, login_attempts, locked_until,
             preferences, permissions, created_at, updated_at
      FROM users 
      WHERE email = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await executeQuery(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const query = `
      SELECT id, username, email, password_hash, first_name, last_name, role,
             company_id, phone, account_status, email_verified, phone_verified,
             two_factor_enabled, last_login, login_attempts, locked_until,
             preferences, permissions, created_at, updated_at
      FROM users 
      WHERE username = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await executeQuery(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = `
      SELECT id, username, email, password_hash, first_name, last_name, role,
             company_id, phone, account_status, email_verified, phone_verified,
             two_factor_enabled, last_login, login_attempts, locked_until,
             preferences, permissions, created_at, updated_at
      FROM users 
      WHERE id = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await executeQuery(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(id, updateData) {
    const allowedFields = [
      'first_name', 'last_name', 'phone', 'address', 'city', 'state',
      'country', 'postal_code', 'preferences', 'permissions'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING id, username, email, first_name, last_name, role, company_id,
                account_status, updated_at
    `;

    try {
      const result = await executeQuery(updateQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update password
   */
  static async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, username, email, updated_at
    `;

    try {
      const result = await executeQuery(updateQuery, [password_hash, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Update last login
   */
  static async updateLastLogin(id) {
    const updateQuery = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, login_attempts = 0, locked_until = NULL
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, username, last_login
    `;

    try {
      const result = await executeQuery(updateQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Increment login attempts
   */
  static async incrementLoginAttempts(id) {
    const updateQuery = `
      UPDATE users 
      SET login_attempts = login_attempts + 1,
          locked_until = CASE 
            WHEN login_attempts + 1 >= 5 THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
            ELSE locked_until
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, username, login_attempts, locked_until
    `;

    try {
      const result = await executeQuery(updateQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error incrementing login attempts:', error);
      throw error;
    }
  }

  /**
   * Soft delete user
   */
  static async delete(id) {
    const deleteQuery = `
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, username, deleted_at
    `;

    try {
      const result = await executeQuery(deleteQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * List all users (with pagination)
   */
  static async findAll(limit = 50, offset = 0, filters = {}) {
    let whereClause = 'WHERE deleted_at IS NULL';
    const values = [];
    let paramCount = 1;

    if (filters.role) {
      whereClause += ` AND role = $${paramCount}`;
      values.push(filters.role);
      paramCount++;
    }

    if (filters.account_status) {
      whereClause += ` AND account_status = $${paramCount}`;
      values.push(filters.account_status);
      paramCount++;
    }

    if (filters.company_id) {
      whereClause += ` AND company_id = $${paramCount}`;
      values.push(filters.company_id);
      paramCount++;
    }

    const query = `
      SELECT id, username, email, first_name, last_name, role, company_id,
             phone, account_status, email_verified, phone_verified,
             two_factor_enabled, last_login, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);

    try {
      const result = await executeQuery(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  /**
   * Count total users
   */
  static async count(filters = {}) {
    let whereClause = 'WHERE deleted_at IS NULL';
    const values = [];
    let paramCount = 1;

    if (filters.role) {
      whereClause += ` AND role = $${paramCount}`;
      values.push(filters.role);
      paramCount++;
    }

    if (filters.account_status) {
      whereClause += ` AND account_status = $${paramCount}`;
      values.push(filters.account_status);
      paramCount++;
    }

    const query = `SELECT COUNT(*) as total FROM users ${whereClause}`;

    try {
      const result = await executeQuery(query, values);
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }

  /**
   * Verify password
   */
  static async verifyPassword(password, password_hash) {
    return await bcrypt.compare(password, password_hash);
  }
}

module.exports = UserPostgreSQL;
