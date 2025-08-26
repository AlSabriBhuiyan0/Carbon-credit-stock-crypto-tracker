const { Pool } = require('pg');

class StockPostgreSQL {
  static pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  static async createTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS stocks (
          id SERIAL PRIMARY KEY,
          symbol VARCHAR(10) NOT NULL,
          name VARCHAR(255),
          sector VARCHAR(100),
          industry VARCHAR(100),
          market_cap DECIMAL(20,2),
          pe_ratio DECIMAL(10,4),
          dividend_yield DECIMAL(5,4),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stock_prices (
          id SERIAL PRIMARY KEY,
          stock_id INTEGER REFERENCES stocks(id),
          symbol VARCHAR(10) NOT NULL,
          price DECIMAL(10,4) NOT NULL,
          volume BIGINT,
          open DECIMAL(10,4),
          high DECIMAL(10,4),
          low DECIMAL(10,4),
          close DECIMAL(10,4),
          change DECIMAL(10,4),
          change_percent DECIMAL(8,4),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
        CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol ON stock_prices(symbol);
        CREATE INDEX IF NOT EXISTS idx_stock_prices_timestamp ON stock_prices(timestamp);
        CREATE UNIQUE INDEX IF NOT EXISTS uidx_stock_prices_symbol_ts ON stock_prices(symbol, timestamp);
      `;

      await this.pool.query(query);
      console.log('Stocks table created successfully');
    } catch (error) {
      console.error('Error creating stocks table:', error);
      throw error;
    }
  }

  static async create(symbol, data = {}) {
    try {
      const query = `
        INSERT INTO stocks (symbol, name, sector, industry, market_cap, pe_ratio, dividend_yield)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        symbol,
        data.name || null,
        data.sector || null,
        data.industry || null,
        data.marketCap || null,
        data.peRatio || null,
        data.dividendYield || null
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating stock:', error);
      throw error;
    }
  }

  static async addPrice(symbol, priceData) {
    try {
      const query = `
        INSERT INTO stock_prices (symbol, price, volume, open, high, low, close, change, change_percent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        symbol,
        priceData.price,
        priceData.volume,
        priceData.open,
        priceData.high,
        priceData.low,
        priceData.close,
        priceData.change,
        priceData.changePercent
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding stock price:', error);
      throw error;
    }
  }

  static async addPriceWithTimestamp(symbol, priceData) {
    try {
      const query = `
        INSERT INTO stock_prices (symbol, price, volume, open, high, low, close, change, change_percent, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
        RETURNING *
      `;

      const values = [
        symbol,
        priceData.price,
        priceData.volume,
        priceData.open,
        priceData.high,
        priceData.low,
        priceData.close,
        priceData.change,
        priceData.changePercent,
        priceData.timestamp
      ];

      const result = await this.pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error adding stock price with timestamp:', error);
      throw error;
    }
  }

  static async listSymbols() {
    try {
      const result = await this.pool.query('SELECT DISTINCT symbol FROM stocks');
      return result.rows.map(r => r.symbol);
    } catch (error) {
      console.error('Error listing symbols:', error);
      return [];
    }
  }

  static async getRangeSnapshot(days = 1) {
    try {
      const query = `
        WITH in_range AS (
          SELECT symbol, price, volume, timestamp,
                 FIRST_VALUE(price) OVER (PARTITION BY symbol ORDER BY timestamp ASC) AS first_price,
                 FIRST_VALUE(timestamp) OVER (PARTITION BY symbol ORDER BY timestamp ASC) AS first_ts,
                 LAST_VALUE(price) OVER (PARTITION BY symbol ORDER BY timestamp RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_price,
                 LAST_VALUE(volume) OVER (PARTITION BY symbol ORDER BY timestamp RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_volume
          FROM stock_prices
          WHERE timestamp >= NOW() - INTERVAL '${days} days'
        ), final AS (
          SELECT DISTINCT ON (symbol) symbol,
            first_price,
            last_price,
            last_volume,
            CASE WHEN first_price IS NOT NULL AND first_price <> 0
                 THEN ((last_price - first_price) / first_price) * 100
                 ELSE 0 END AS range_change_percent
          FROM in_range
          ORDER BY symbol, timestamp DESC
        )
        SELECT * FROM final;
      `;
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting range snapshot:', error);
      return [];
    }
  }

  static async findBySymbol(symbol) {
    try {
      const query = `
        SELECT s.*, 
               sp.price as current_price,
               sp.change_percent as current_change,
               sp.volume as current_volume
        FROM stocks s
        LEFT JOIN LATERAL (
          SELECT * FROM stock_prices 
          WHERE symbol = s.symbol 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) sp ON true
        WHERE s.symbol = $1
      `;
      
      const result = await this.pool.query(query, [symbol]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding stock by symbol:', error);
      throw error;
    }
  }

  static async getPriceHistory(symbol, days = 30) {
    try {
      const query = `
        SELECT * FROM stock_prices 
        WHERE symbol = $1 
        AND timestamp >= NOW() - INTERVAL '${days} days'
        ORDER BY timestamp ASC
      `;
      
      const result = await this.pool.query(query, [symbol]);
      return result.rows;
    } catch (error) {
      console.error('Error getting price history:', error);
      throw error;
    }
  }

  static async getAllStocks() {
    try {
      const query = `
        SELECT DISTINCT ON (s.symbol) s.*, 
               sp.price as current_price,
               sp.change_percent as current_change,
               sp.volume as current_volume,
               CASE 
                 WHEN sp.price IS NOT NULL AND sp.volume IS NOT NULL 
                 THEN (sp.price * sp.volume)::DECIMAL(20,2)
                 ELSE NULL 
               END as calculated_market_cap
        FROM stocks s
        LEFT JOIN LATERAL (
          SELECT * FROM stock_prices 
          WHERE symbol = s.symbol 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) sp ON true
        ORDER BY s.symbol, s.id DESC
      `;
      
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting all stocks:', error);
      throw error;
    }
  }

  static async getTopGainers(limit = 5) {
    try {
      const query = `
        SELECT DISTINCT ON (s.symbol) s.*, 
               sp.price as current_price,
               sp.change_percent as current_change,
               sp.volume as current_volume,
               CASE 
                 WHEN sp.price IS NOT NULL AND sp.volume IS NOT NULL 
                 THEN (sp.price * sp.volume)::DECIMAL(20,2)
                 ELSE NULL 
               END as calculated_market_cap
        FROM stocks s
        LEFT JOIN LATERAL (
          SELECT * FROM stock_prices 
          WHERE symbol = s.symbol 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) sp ON true
        WHERE sp.change_percent IS NOT NULL
        ORDER BY s.symbol, sp.change_percent DESC
        LIMIT $1
      `;
      
      const result = await this.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting top gainers:', error);
      return [];
    }
  }

  static async getTopLosers(limit = 5) {
    try {
      const query = `
        SELECT DISTINCT ON (s.symbol) s.*, 
               sp.price as current_price,
               sp.change_percent as current_change,
               sp.volume as current_volume,
               CASE 
                 WHEN sp.price IS NOT NULL AND sp.volume IS NOT NULL 
                 THEN (sp.price * sp.volume)::DECIMAL(20,2)
                 ELSE NULL 
               END as calculated_market_cap
        FROM stocks s
        LEFT JOIN LATERAL (
          SELECT * FROM stock_prices 
          WHERE symbol = s.symbol 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) sp ON true
        WHERE sp.change_percent IS NOT NULL
        ORDER BY s.symbol, sp.change_percent ASC
        LIMIT $1
      `;
      
      const result = await this.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting top losers:', error);
      throw error;
    }
  }

  static async getMostActive(limit = 5) {
    try {
      const query = `
        SELECT DISTINCT ON (s.symbol) s.*, 
               sp.price as current_price,
               sp.change_percent as current_change,
               sp.volume as current_volume,
               CASE 
                 WHEN sp.price IS NOT NULL AND sp.volume IS NOT NULL 
                 THEN (sp.price * sp.volume)::DECIMAL(20,2)
                 ELSE NULL 
               END as calculated_market_cap
        FROM stocks s
        LEFT JOIN LATERAL (
          SELECT * FROM stock_prices 
          WHERE symbol = s.symbol 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) sp ON true
        WHERE sp.volume IS NOT NULL
        ORDER BY s.symbol, sp.volume DESC
        LIMIT $1
      `;
      
      const result = await this.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting most active stocks:', error);
      return [];
    }
  }
}

module.exports = StockPostgreSQL;
