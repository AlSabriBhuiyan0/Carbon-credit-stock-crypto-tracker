const { executeQuery } = require('../services/database');

class UserPortfolio {
  /**
   * Initialize the user portfolio tables
   */
  static async initializeTables() {
    try {
      // User stock holdings table
      const createUserStocksTable = `
        CREATE TABLE IF NOT EXISTS user_stocks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          stock_symbol VARCHAR(10) NOT NULL,
          quantity DECIMAL(15,4) NOT NULL CHECK (quantity > 0),
          purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price > 0),
          purchase_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, stock_symbol)
        );
      `;

      // User carbon credit holdings table
      const createUserCarbonTable = `
        CREATE TABLE IF NOT EXISTS user_carbon_credits (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          credit_id VARCHAR(50) NOT NULL,
          project_name VARCHAR(255) NOT NULL,
          quantity DECIMAL(15,4) NOT NULL CHECK (quantity > 0),
          purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price > 0),
          purchase_date DATE NOT NULL,
          project_type VARCHAR(100),
          region VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, credit_id)
        );
      `;

      // Create indexes for better performance
      const createIndexes = `
        CREATE INDEX IF NOT EXISTS idx_user_stocks_user_id ON user_stocks(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_stocks_symbol ON user_stocks(stock_symbol);
        CREATE INDEX IF NOT EXISTS idx_user_carbon_user_id ON user_carbon_credits(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_carbon_credit_id ON user_carbon_credits(credit_id);
      `;

      await executeQuery(createUserStocksTable);
      await executeQuery(createUserCarbonTable);
      await executeQuery(createIndexes);

      console.log('User portfolio tables created successfully');
    } catch (error) {
      console.error('Error creating user portfolio tables:', error);
      throw error;
    }
  }

  /**
   * Add stock to user portfolio
   */
  static async addStock(userId, stockData) {
    const { stockSymbol, quantity, purchasePrice, purchaseDate } = stockData;
    
    const query = `
      INSERT INTO user_stocks (user_id, stock_symbol, quantity, purchase_price, purchase_date)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, stock_symbol) 
      DO UPDATE SET 
        quantity = user_stocks.quantity + EXCLUDED.quantity,
        purchase_price = (user_stocks.quantity * user_stocks.purchase_price + EXCLUDED.quantity * EXCLUDED.purchase_price) / (user_stocks.quantity + EXCLUDED.quantity),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await executeQuery(query, [userId, stockSymbol, quantity, purchasePrice, purchaseDate]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding stock to portfolio:', error);
      throw error;
    }
  }

  /**
   * Add carbon credit to user portfolio
   */
  static async addCarbonCredit(userId, carbonData) {
    const { creditId, projectName, quantity, purchasePrice, purchaseDate, projectType, region } = carbonData;
    
    const query = `
      INSERT INTO user_carbon_credits (user_id, credit_id, project_name, quantity, purchase_price, purchase_date, project_type, region)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, credit_id) 
      DO UPDATE SET 
        quantity = user_carbon_credits.quantity + EXCLUDED.quantity,
        purchase_price = (user_carbon_credits.quantity * user_carbon_credits.purchase_price + EXCLUDED.quantity * EXCLUDED.purchase_price) / (user_carbon_credits.quantity + EXCLUDED.quantity),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await executeQuery(query, [userId, creditId, projectName, quantity, purchasePrice, purchaseDate, projectType, region]);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding carbon credit to portfolio:', error);
      throw error;
    }
  }

  /**
   * Get user's stock portfolio
   */
  static async getUserStocks(userId) {
    const query = `
      SELECT 
        us.*,
        s.name as stock_name,
        s.sector,
        s.industry,
        s.market_cap,
        s.current_price,
        (us.quantity * s.current_price) as current_value,
        (us.quantity * s.current_price - us.quantity * us.purchase_price) as gain_loss,
        ((s.current_price - us.purchase_price) / us.purchase_price * 100) as gain_loss_percent
      FROM user_stocks us
      LEFT JOIN stocks s ON us.stock_symbol = s.symbol
      WHERE us.user_id = $1
      ORDER BY us.updated_at DESC
    `;

    try {
      const result = await executeQuery(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user stocks:', error);
      throw error;
    }
  }

  /**
   * Get user's carbon credit portfolio
   */
  static async getUserCarbonCredits(userId) {
    const query = `
      SELECT 
        ucc.*,
        (ucc.quantity * ucc.purchase_price) as total_invested,
        (ucc.quantity * ucc.purchase_price) as current_value
      FROM user_carbon_credits ucc
      WHERE ucc.user_id = $1
      ORDER BY ucc.updated_at DESC
    `;

    try {
      const result = await executeQuery(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user carbon credits:', error);
      throw error;
    }
  }

  /**
   * Get user's complete portfolio summary
   */
  static async getPortfolioSummary(userId) {
    try {
      const stocks = await this.getUserStocks(userId);
      const carbonCredits = await this.getUserCarbonCredits(userId);

      // Calculate portfolio metrics
      const totalStockValue = stocks.reduce((sum, stock) => sum + (stock.current_value || 0), 0);
      const totalStockCost = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.purchase_price), 0);
      const totalStockGainLoss = totalStockValue - totalStockCost;
      const totalStockGainLossPercent = totalStockCost > 0 ? (totalStockGainLoss / totalStockCost) * 100 : 0;

      const totalCarbonValue = carbonCredits.reduce((sum, credit) => sum + credit.current_value, 0);
      const totalCarbonCost = carbonCredits.reduce((sum, credit) => sum + (credit.quantity * credit.purchase_price), 0);
      const totalCarbonGainLoss = totalCarbonValue - totalCarbonCost;
      const totalCarbonGainLossPercent = totalCarbonCost > 0 ? (totalCarbonGainLoss / totalCarbonCost) * 100 : 0;

      const totalPortfolioValue = totalStockValue + totalCarbonValue;
      const totalPortfolioCost = totalStockCost + totalCarbonCost;
      const totalPortfolioGainLoss = totalPortfolioValue - totalPortfolioCost;
      const totalPortfolioGainLossPercent = totalPortfolioCost > 0 ? (totalPortfolioGainLoss / totalPortfolioCost) * 100 : 0;

      return {
        summary: {
          totalValue: totalPortfolioValue,
          totalCost: totalPortfolioCost,
          totalGainLoss: totalPortfolioGainLoss,
          totalGainLossPercent: totalPortfolioGainLossPercent,
          stockValue: totalStockValue,
          carbonValue: totalCarbonValue,
          assetCount: stocks.length + carbonCredits.length
        },
        stocks: {
          count: stocks.length,
          totalValue: totalStockValue,
          totalCost: totalStockCost,
          gainLoss: totalStockGainLoss,
          gainLossPercent: totalStockGainLossPercent,
          holdings: stocks
        },
        carbonCredits: {
          count: carbonCredits.length,
          totalValue: totalCarbonValue,
          totalCost: totalCarbonCost,
          gainLoss: totalCarbonGainLoss,
          gainLossPercent: totalCarbonGainLossPercent,
          holdings: carbonCredits
        }
      };
    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      throw error;
    }
  }

  /**
   * Update stock quantity (buy/sell)
   */
  static async updateStockQuantity(userId, stockSymbol, newQuantity, newPrice, transactionDate) {
    const query = `
      UPDATE user_stocks 
      SET 
        quantity = $3,
        purchase_price = $4,
        purchase_date = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND stock_symbol = $2
      RETURNING *
    `;

    try {
      const result = await executeQuery(query, [userId, stockSymbol, newQuantity, newPrice, transactionDate]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating stock quantity:', error);
      throw error;
    }
  }

  /**
   * Remove stock from portfolio
   */
  static async removeStock(userId, stockSymbol) {
    const query = `
      DELETE FROM user_stocks 
      WHERE user_id = $1 AND stock_symbol = $2
      RETURNING *
    `;

    try {
      const result = await executeQuery(query, [userId, stockSymbol]);
      return result.rows[0];
    } catch (error) {
      console.error('Error removing stock from portfolio:', error);
      throw error;
    }
  }

  /**
   * Remove carbon credit from portfolio
   */
  static async removeCarbonCredit(userId, creditId) {
    const query = `
      DELETE FROM user_carbon_credits 
      WHERE user_id = $1 AND credit_id = $2
      RETURNING *
    `;

    try {
      const result = await executeQuery(query, [userId, creditId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error removing carbon credit from portfolio:', error);
      throw error;
    }
  }
}

module.exports = UserPortfolio;
