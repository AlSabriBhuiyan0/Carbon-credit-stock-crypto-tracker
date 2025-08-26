const { Pool } = require('pg');

class CarbonCreditPostgreSQL {
  static pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  static async createTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS carbon_projects (
          id SERIAL PRIMARY KEY,
          project_id VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(100) NOT NULL,
          location VARCHAR(100),
          country VARCHAR(100),
          standard VARCHAR(100) NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          description TEXT,
          start_date DATE,
          end_date DATE,
          total_credits BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS carbon_credits (
          id SERIAL PRIMARY KEY,
          project_id VARCHAR(50) REFERENCES carbon_projects(project_id),
          price DECIMAL(10,4) NOT NULL,
          credits_issued BIGINT,
          credits_retired BIGINT,
          verification_date DATE,
          source VARCHAR(100),
          blockchain_hash VARCHAR(255),
          status VARCHAR(50) DEFAULT 'active',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS carbon_transactions (
          id SERIAL PRIMARY KEY,
          transaction_hash VARCHAR(255) UNIQUE,
          project_id VARCHAR(50) REFERENCES carbon_projects(project_id),
          from_address VARCHAR(255),
          to_address VARCHAR(255),
          amount BIGINT NOT NULL,
          price DECIMAL(10,4),
          transaction_type VARCHAR(50),
          status VARCHAR(50) DEFAULT 'pending',
          blockchain_network VARCHAR(50) DEFAULT 'Algorand',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_carbon_projects_project_id ON carbon_projects(project_id);
        CREATE INDEX IF NOT EXISTS idx_carbon_projects_type ON carbon_projects(type);
        CREATE INDEX IF NOT EXISTS idx_carbon_projects_standard ON carbon_projects(standard);
        CREATE INDEX IF NOT EXISTS idx_carbon_credits_project_id ON carbon_credits(project_id);
        CREATE INDEX IF NOT EXISTS idx_carbon_credits_timestamp ON carbon_credits(timestamp);
        CREATE INDEX IF NOT EXISTS idx_carbon_transactions_hash ON carbon_transactions(transaction_hash);
        CREATE INDEX IF NOT EXISTS idx_carbon_transactions_project_id ON carbon_transactions(project_id);
      `;

      await this.pool.query(query);
      console.log('Carbon credits tables created successfully');
    } catch (error) {
      console.error('Error creating carbon credits tables:', error);
      throw error;
    }
  }

  static async createProject(projectData) {
    try {
      const query = `
        INSERT INTO carbon_projects (
          project_id, name, type, location, country, standard, 
          description, start_date, end_date, total_credits
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        projectData.projectId,
        projectData.name,
        projectData.type,
        projectData.location,
        projectData.country,
        projectData.standard,
        projectData.description || null,
        projectData.startDate || null,
        projectData.endDate || null,
        projectData.totalCredits || null
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating carbon project:', error);
      throw error;
    }
  }

  static async addCreditData(creditData) {
    try {
      const query = `
        INSERT INTO carbon_credits (
          project_id, price, credits_issued, credits_retired, 
          verification_date, source, blockchain_hash
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        creditData.projectId,
        creditData.price,
        creditData.creditsIssued || null,
        creditData.creditsRetired || null,
        creditData.verificationDate || null,
        creditData.source,
        creditData.blockchainHash || null
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding carbon credit data:', error);
      throw error;
    }
  }

  static async addTransaction(transactionData) {
    try {
      const query = `
        INSERT INTO carbon_transactions (
          transaction_hash, project_id, from_address, to_address, 
          amount, price, transaction_type, blockchain_network
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        transactionData.transactionHash,
        transactionData.projectId,
        transactionData.fromAddress || null,
        transactionData.toAddress || null,
        transactionData.amount,
        transactionData.price || null,
        transactionData.transactionType,
        transactionData.blockchainNetwork || 'Algorand'
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding carbon transaction:', error);
      throw error;
    }
  }

  static async findProjectById(projectId) {
    try {
      const query = `
        SELECT 
          cp.*,
          COALESCE(cc.credits_issued, 0) as current_credits_issued,
          COALESCE(cc.credits_retired, 0) as current_credits_retired,
          COALESCE(cc.price, 0) as current_price
        FROM carbon_projects cp
        LEFT JOIN (
          SELECT 
            project_id,
            credits_issued,
            credits_retired,
            price,
            ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY timestamp DESC) as rn
          FROM carbon_credits
        ) cc ON cp.project_id = cc.project_id AND cc.rn = 1
        WHERE cp.project_id = $1
      `;
      
      const result = await this.pool.query(query, [projectId]);
      
      if (!result.rows[0]) return null;
      
      const row = result.rows[0];
      
      // Convert bigint values to regular numbers to prevent precision issues
      return {
        ...row,
        current_credits_issued: parseInt(row.current_credits_issued) || 0,
        current_credits_retired: parseInt(row.current_credits_retired) || 0,
        current_price: parseFloat(row.current_price) || 0,
        total_credits: parseInt(row.total_credits) || 0
      };
    } catch (error) {
      console.error('Error finding carbon project by ID:', error);
      throw error;
    }
  }

  static async getAllProjects() {
    try {
      const query = `
        SELECT 
          cp.*,
          COALESCE(cc.credits_issued, 0) as current_credits_issued,
          COALESCE(cc.credits_retired, 0) as current_credits_retired,
          COALESCE(cc.price, 0) as current_price
        FROM carbon_projects cp
        LEFT JOIN (
          SELECT 
            project_id,
            credits_issued,
            credits_retired,
            price,
            ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY timestamp DESC) as rn
          FROM carbon_credits
        ) cc ON cp.project_id = cc.project_id AND cc.rn = 1
        ORDER BY cp.created_at DESC
      `;
      
      const result = await this.pool.query(query);
      
      // Convert bigint values to regular numbers to prevent precision issues
      return result.rows.map(row => ({
        ...row,
        current_credits_issued: parseInt(row.current_credits_issued) || 0,
        current_credits_retired: parseInt(row.current_credits_retired) || 0,
        current_price: parseFloat(row.current_price) || 0,
        total_credits: parseInt(row.total_credits) || 0
      }));
    } catch (error) {
      console.error('Error fetching all carbon projects:', error);
      throw error;
    }
  }

  static async getProjectsByType(type) {
    try {
      const query = `
        SELECT 
          cp.*,
          COALESCE(cc.credits_issued, 0) as current_credits_issued,
          COALESCE(cc.credits_retired, 0) as current_credits_retired,
          COALESCE(cc.price, 0) as current_price
        FROM carbon_projects cp
        LEFT JOIN (
          SELECT 
            project_id,
            credits_issued,
            credits_retired,
            price,
            ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY timestamp DESC) as rn
          FROM carbon_credits
        ) cc ON cp.project_id = cc.project_id AND cc.rn = 1
        WHERE cp.type = $1
        ORDER BY cp.created_at DESC
      `;
      
      const result = await this.pool.query(query, [type]);
      
      // Convert bigint values to regular numbers to prevent precision issues
      return result.rows.map(row => ({
        ...row,
        current_credits_issued: parseInt(row.current_credits_issued) || 0,
        current_credits_retired: parseInt(row.current_credits_retired) || 0,
        current_price: parseFloat(row.current_price) || 0,
        total_credits: parseInt(row.total_credits) || 0
      }));
    } catch (error) {
      console.error('Error fetching projects by type:', error);
      throw error;
    }
  }

  static async getProjectsByStandard(standard) {
    try {
      const query = `
        SELECT p.*, 
               c.price as current_price,
               c.credits_issued as current_credits_issued,
               c.credits_retired as current_credits_retired
        FROM carbon_projects p
        LEFT JOIN LATERAL (
          SELECT * FROM carbon_credits 
          WHERE project_id = p.project_id 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) c ON true
        WHERE p.standard = $1
        ORDER BY p.created_at DESC
      `;
      
      const result = await this.pool.query(query, [standard]);
      return result.rows;
    } catch (error) {
      console.error('Error getting projects by standard:', error);
      throw error;
    }
  }

  static async getCreditHistory(projectId, days = 30) {
    try {
      const query = `
        SELECT * FROM carbon_credits 
        WHERE project_id = $1 
        AND timestamp >= NOW() - INTERVAL '${days} days'
        ORDER BY timestamp ASC
      `;
      
      const result = await this.pool.query(query, [projectId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting credit history:', error);
      throw error;
    }
  }

  static async getTransactionHistory(projectId, limit = 100) {
    try {
      const query = `
        SELECT * FROM carbon_transactions 
        WHERE project_id = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `;
      
      const result = await this.pool.query(query, [projectId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  static async getMarketData() {
    try {
      const query = `
        SELECT 
          p.type,
          p.standard,
          c.price,
          c.credits_issued,
          c.credits_retired,
          c.timestamp
        FROM carbon_projects p
        JOIN carbon_credits c ON p.project_id = c.project_id
        WHERE c.timestamp >= NOW() - INTERVAL '1 day'
        ORDER BY c.timestamp DESC
      `;
      
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting market data:', error);
      throw error;
    }
  }

  static async updateProject(projectId, updateData) {
    try {
      const query = `
        UPDATE carbon_projects 
        SET name = COALESCE($2, name),
            type = COALESCE($3, type),
            location = COALESCE($4, location),
            country = COALESCE($5, country),
            standard = COALESCE($6, standard),
            status = COALESCE($7, status),
            description = COALESCE($8, description),
            start_date = COALESCE($9, start_date),
            end_date = COALESCE($10, end_date),
            total_credits = COALESCE($11, total_credits),
            updated_at = CURRENT_TIMESTAMP
        WHERE project_id = $1
        RETURNING *
      `;
      
      const values = [
        projectId,
        updateData.name,
        updateData.type,
        updateData.location,
        updateData.country,
        updateData.standard,
        updateData.status,
        updateData.description,
        updateData.startDate,
        updateData.endDate,
        updateData.totalCredits
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating carbon project:', error);
      throw error;
    }
  }

  static async deleteProject(projectId) {
    try {
      // Delete related records first due to foreign key constraints
      await this.pool.query('DELETE FROM carbon_transactions WHERE project_id = $1', [projectId]);
      await this.pool.query('DELETE FROM carbon_credits WHERE project_id = $1', [projectId]);
      
      const query = 'DELETE FROM carbon_projects WHERE project_id = $1 RETURNING *';
      const result = await this.pool.query(query, [projectId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting carbon project:', error);
      throw error;
    }
  }

  static async getProjectStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
          COUNT(DISTINCT type) as project_types,
          COUNT(DISTINCT standard) as standards_count,
          COUNT(DISTINCT country) as countries_count
        FROM carbon_projects
      `;
      
      const result = await this.pool.query(query);
      return result.rows[0] || {};
    } catch (error) {
      console.error('Error getting project stats:', error);
      throw error;
    }
  }
}

module.exports = CarbonCreditPostgreSQL;
