const { Pool } = require('pg');
require('dotenv').config();

class ReportPostgreSQL {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  // Create reports table
  async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(100) NOT NULL,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        format VARCHAR(20) DEFAULT 'pdf',
        file_path VARCHAR(500),
        file_size BIGINT,
        parameters JSONB,
        generated_at TIMESTAMP,
        expires_at TIMESTAMP,
        download_count INTEGER DEFAULT 0,
        last_downloaded TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
      CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
      CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
    `;

    try {
      await this.pool.query(createTableQuery);
      console.log('✅ Reports table created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating reports table:', error.message);
      return false;
    }
  }

  // Create a new report
  async create(reportData) {
    const {
      user_id,
      title,
      description,
      type,
      category,
      status = 'draft',
      format = 'pdf',
      file_path = null,
      file_size = null,
      parameters = {},
      expires_at = null
    } = reportData;

    const insertQuery = `
      INSERT INTO reports (user_id, title, description, type, category, status, format, file_path, file_size, parameters, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    try {
      const result = await this.pool.query(insertQuery, [
        user_id, title, description, type, category, status, format, file_path, file_size, parameters, expires_at
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating report:', error.message);
      throw error;
    }
  }

  // Get report by ID
  async getById(reportId, userId = null) {
    let query = 'SELECT * FROM reports WHERE id = $1';
    const params = [reportId];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    try {
      const result = await this.pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting report by ID:', error.message);
      throw error;
    }
  }

  // Get reports for a specific user
  async getByUserId(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      type = null,
      category = null,
      status = null,
      format = null
    } = options;

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      whereClause += ` AND type = $${paramCount}`;
      params.push(type);
    }

    if (category) {
      paramCount++;
      whereClause += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (format) {
      paramCount++;
      whereClause += ` AND format = $${paramCount}`;
      params.push(format);
    }

    const query = `
      SELECT * FROM reports 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting reports by user ID:', error.message);
      throw error;
    }
  }

  // Get all reports (admin function)
  async getAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      type = null,
      category = null,
      status = null,
      userId = null
    } = options;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      whereClause += ` AND type = $${paramCount}`;
      params.push(type);
    }

    if (category) {
      paramCount++;
      whereClause += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (userId) {
      paramCount++;
      whereClause += ` AND user_id = $${paramCount}`;
      params.push(userId);
    }

    const query = `
      SELECT r.*, u.username, u.email, u.role 
      FROM reports r
      JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting all reports:', error.message);
      throw error;
    }
  }

  // Update report
  async update(reportId, updateData, userId = null) {
    const {
      title,
      description,
      type,
      category,
      status,
      format,
      file_path,
      file_size,
      parameters,
      expires_at
    } = updateData;

    let whereClause = 'WHERE id = $1';
    const params = [reportId];
    let paramCount = 1;

    if (userId) {
      whereClause += ' AND user_id = $2';
      params.push(userId);
      paramCount++;
    }

    const setClause = [];
    const updateParams = [];

    if (title !== undefined) {
      setClause.push(`title = $${paramCount + 1}`);
      updateParams.push(title);
      paramCount++;
    }

    if (description !== undefined) {
      setClause.push(`description = $${paramCount + 1}`);
      updateParams.push(description);
      paramCount++;
    }

    if (type !== undefined) {
      setClause.push(`type = $${paramCount + 1}`);
      updateParams.push(type);
      paramCount++;
    }

    if (category !== undefined) {
      setClause.push(`category = $${paramCount + 1}`);
      updateParams.push(category);
      paramCount++;
    }

    if (status !== undefined) {
      setClause.push(`status = $${paramCount + 1}`);
      updateParams.push(status);
      paramCount++;
    }

    if (format !== undefined) {
      setClause.push(`format = $${paramCount + 1}`);
      updateParams.push(format);
      paramCount++;
    }

    if (file_path !== undefined) {
      setClause.push(`file_path = $${paramCount + 1}`);
      updateParams.push(file_path);
      paramCount++;
    }

    if (file_size !== undefined) {
      setClause.push(`file_size = $${paramCount + 1}`);
      updateParams.push(file_size);
      paramCount++;
    }

    if (parameters !== undefined) {
      setClause.push(`parameters = $${paramCount + 1}`);
      updateParams.push(parameters);
      paramCount++;
    }

    if (expires_at !== undefined) {
      setClause.push(`expires_at = $${paramCount + 1}`);
      updateParams.push(expires_at);
      paramCount++;
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE reports 
      SET ${setClause.join(', ')}
      ${whereClause}
      RETURNING *
    `;

    const allParams = [...updateParams, ...params];

    try {
      const result = await this.pool.query(query, allParams);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating report:', error.message);
      throw error;
    }
  }

  // Delete report
  async delete(reportId, userId = null) {
    let query = 'DELETE FROM reports WHERE id = $1';
    const params = [reportId];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    query += ' RETURNING *';

    try {
      const result = await this.pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting report:', error.message);
      throw error;
    }
  }

  // Increment download count
  async incrementDownloadCount(reportId) {
    const query = `
      UPDATE reports 
      SET download_count = download_count + 1, last_downloaded = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, [reportId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error incrementing download count:', error.message);
      throw error;
    }
  }

  // Get report statistics
  async getStats(userId = null) {
    let whereClause = '';
    const params = [];

    if (userId) {
      whereClause = 'WHERE user_id = $1';
      params.push(userId);
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN format = 'pdf' THEN 1 END) as pdf_count,
        COUNT(CASE WHEN format = 'excel' THEN 1 END) as excel_count,
        COUNT(CASE WHEN format = 'csv' THEN 1 END) as csv_count,
        SUM(download_count) as total_downloads,
        AVG(download_count) as avg_downloads
      FROM reports 
      ${whereClause}
    `;

    try {
      const result = await this.pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting report stats:', error.message);
      throw error;
    }
  }

  // Get popular report types
  async getPopularTypes(limit = 10) {
    const query = `
      SELECT type, COUNT(*) as count, AVG(download_count) as avg_downloads
      FROM reports 
      GROUP BY type 
      ORDER BY count DESC 
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting popular report types:', error.message);
      throw error;
    }
  }

  // Search reports
  async search(searchTerm, options = {}) {
    const {
      limit = 50,
      offset = 0,
      userId = null,
      type = null,
      category = null
    } = options;

    let whereClause = 'WHERE (r.title ILIKE $1 OR r.description ILIKE $1)';
    const params = [`%${searchTerm}%`];
    let paramCount = 1;

    if (userId) {
      paramCount++;
      whereClause += ` AND r.user_id = $${paramCount}`;
      params.push(userId);
    }

    if (type) {
      paramCount++;
      whereClause += ` AND r.type = $${paramCount}`;
      params.push(type);
    }

    if (category) {
      paramCount++;
      whereClause += ` AND r.category = $${paramCount}`;
      params.push(category);
    }

    const query = `
      SELECT r.*, u.username, u.email, u.role 
      FROM reports r
      JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    params.push(limit, offset);

    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error searching reports:', error.message);
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

module.exports = ReportPostgreSQL;
