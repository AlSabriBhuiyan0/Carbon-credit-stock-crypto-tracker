const mongoose = require('mongoose');
const { Pool } = require('pg');
const { logger } = require('../middleware/errorHandler');
const StockPostgreSQL = require('../models/StockPostgreSQL');
const CarbonCreditPostgreSQL = require('../models/CarbonCreditPostgreSQL');

let mongooseConnection = null;
let postgresPool = null;

/**
 * Check if a PostgreSQL error is transient and can be retried
 */
const isTransientPgError = (err) => {
  // Connection errors that might be transient
  const transientCodes = [
    'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED',
    '28P01', // Authentication failed - might be temporary
    '08000', // Connection exception
    '08003', // Connection does not exist
    '08006', // Connection failure
    '08001', // SQL client unable to establish SQL connection
    '08004', // SQL server rejected establishment of SQL connection
  ];
  
  return transientCodes.includes(err.code) || 
         err.message.includes('connection') ||
         err.message.includes('timeout') ||
         err.message.includes('authentication');
};

/**
 * Initialize database connections
 */
const initializeDatabase = async () => {
  try {
    logger.info('Initializing database connection...');
    
    // Try PostgreSQL first
    if (process.env.DATABASE_URL) {
      try {
        await initializePostgreSQL();
      } catch (error) {
        logger.error('PostgreSQL initialization failed:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Continuing in development mode without PostgreSQL connection');
        } else {
          throw error;
        }
      }
    }
    
    // Try MongoDB as fallback
    if (process.env.MONGODB_URI && !postgresPool) {
      try {
        await initializeMongoDB();
      } catch (error) {
        logger.error('MongoDB initialization failed:', error);
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Continuing in development mode without MongoDB connection');
        } else {
          throw error;
        }
      }
    }
    
    // If neither database is available, log warning
    if (!postgresPool && !mongooseConnection) {
      logger.warn('No database connections available. System will run with limited functionality.');
    }
    
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Initialize PostgreSQL connection
 */
const initializePostgreSQL = async () => {
  try {
    // Validate DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Parse connection string to validate format
    const url = new URL(process.env.DATABASE_URL);
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      throw new Error('Invalid DATABASE_URL protocol. Must be postgresql:// or postgres://');
    }
    
    logger.info('Initializing PostgreSQL connection pool...');
    
    postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased timeout
      keepAlive: true,
      // Add connection validation
      connectionValidation: async (client) => {
        try {
          await client.query('SELECT 1');
          return true;
        } catch (error) {
          logger.error('Connection validation failed:', error);
          return false;
        }
      }
    });

    // Test the connection with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        const client = await postgresPool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger.info('PostgreSQL connection pool established successfully');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        logger.warn(`PostgreSQL connection attempt failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
    
    // Initialize database tables
    await initializePostgreSQLTables();
    
  } catch (error) {
    logger.error('PostgreSQL connection failed:', error);
    
    // Provide helpful error messages for common issues
    if (error.code === '28P01') {
      logger.error('Authentication failed. Please check your username and password in DATABASE_URL');
      logger.error('Common solutions:');
      logger.error('1. Verify PostgreSQL is running: pg_ctl status');
      logger.error('2. Check password: psql -U postgres -h localhost');
      logger.error("3. Reset password: ALTER USER postgres PASSWORD 'new_password';");
      logger.error('4. Verify DATABASE_URL format: postgresql://username:password@host:port/database');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('Connection refused. Please check if PostgreSQL is running');
      logger.error('Start PostgreSQL: pg_ctl start');
    } else if (error.code === '3D000') {
      logger.error('Database does not exist. Please create it:');
      logger.error('createdb -U postgres stock_carbon_tracker');
    } else if (error.code === 'ENOTFOUND') {
      logger.error('Host not found. Please check your DATABASE_URL host configuration');
    } else if (error.code === 'ETIMEDOUT') {
      logger.error('Connection timeout. Please check network connectivity and firewall settings');
    }
    
    // In development mode, don't throw error, just log and continue
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Continuing in development mode without PostgreSQL connection');
      postgresPool = null; // Ensure pool is null
      return;
    }
    
    throw error;
  }
};

/**
 * Initialize PostgreSQL tables
 */
const initializePostgreSQLTables = async () => {
  try {
    // Import and create tables
    const UserPostgreSQL = require('../models/UserPostgreSQL');
    await UserPostgreSQL.createTable();
    
    // Create Stock tables
    await StockPostgreSQL.createTable();
    
    // Create Carbon Credit tables
    await CarbonCreditPostgreSQL.createTable();
    
    // Create Subscription tables
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const UserSubscription = require('../models/UserSubscription');
    await SubscriptionPlan.createTable();
    await UserSubscription.createTable();
    
    // Create User Portfolio tables
    const UserPortfolio = require('../models/UserPortfolio');
    await UserPortfolio.initializeTables();
    
    // Seed default subscription plans
    await SubscriptionPlan.seedDefaultPlans();
    
    logger.info('PostgreSQL tables initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize PostgreSQL tables:', error);
    
    // In development mode, don't throw error, just log and continue
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Continuing in development mode without PostgreSQL tables');
      return;
    }
    
    throw error;
  }
};

/**
 * Ensure pool exists and is usable
 */
const ensurePostgresPool = async () => {
  if (!postgresPool) {
    try {
      await initializePostgreSQL();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('PostgreSQL pool not available, continuing without database');
        return;
      }
      throw error;
    }
  }
};

/**
 * Execute a PostgreSQL query with single retry on transient connection errors
 */
const executeQuery = async (query, params = []) => {
  try {
    await ensurePostgresPool();
    
    // If no PostgreSQL pool is available, provide clear error
    if (!postgresPool) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('PostgreSQL not available, returning mock data for development');
        return { rows: [], rowCount: 0 };
      } else {
        throw new Error('PostgreSQL connection not available');
      }
    }
    
    // Validate pool health before executing query
    if (!postgresPool || postgresPool.ended) {
      logger.warn('PostgreSQL pool not available or ended');
      if (process.env.NODE_ENV === 'development') {
        return { rows: [], rowCount: 0 };
      } else {
        throw new Error('PostgreSQL pool not available');
      }
    }
    
    let client;
    try {
      client = await postgresPool.connect();
      
      // Validate client connection
      try {
        await client.query('SELECT 1');
      } catch (validationError) {
        logger.error('Client connection validation failed:', validationError);
        throw new Error('Database connection validation failed');
      }
      
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      logger.error('PostgreSQL query error:', error);
      
      // Attempt one reconnect + retry on transient errors
      if (isTransientPgError(error)) {
        logger.warn('Transient DB error detected. Reinitializing pool and retrying once...');
        try {
          await postgresPool.end().catch(() => {});
        } catch (_) {}
        postgresPool = null;
        await ensurePostgresPool();
        
        // retry once if pool was reinitialized
        if (postgresPool) {
          client = await postgresPool.connect();
          const result = await client.query(query, params);
          return result;
        } else {
          throw new Error('Failed to reinitialize database connection');
        }
      }
      throw error;
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Database query failed, returning mock data for development');
      return { rows: [], rowCount: 0 };
    }
    throw error;
  }
};

/**
 * Initialize MongoDB connection
 */
const initializeMongoDB = async () => {
  try {
    mongooseConnection = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Set up connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    logger.info('MongoDB connection established');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

/**
 * Get database connection status
 */
const getDatabaseStatus = () => {
  if (postgresPool) {
    try {
      return {
        type: 'postgresql',
        status: 'connected',
        poolSize: postgresPool.totalCount,
        idleCount: postgresPool.idleCount,
        waitingCount: postgresPool.waitingCount
      };
    } catch (error) {
      logger.error('Error getting PostgreSQL status:', error);
      return {
        type: 'postgresql',
        status: 'error',
        error: error.message
      };
    }
  }

  if (mongooseConnection) {
    try {
      return {
        type: 'mongodb',
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState
      };
    } catch (error) {
      logger.error('Error getting MongoDB status:', error);
      return {
        type: 'mongodb',
        status: 'error',
        error: error.message
      };
    }
  }

  return {
    type: 'none',
    status: 'not_initialized',
    error: 'No database connections available'
  };
};

/**
 * Execute a MongoDB operation
 */
const executeMongoOperation = async (operation) => {
  if (!mongooseConnection) {
    throw new Error('MongoDB connection not initialized');
  }

  try {
    return await operation();
  } catch (error) {
    logger.error('MongoDB operation failed:', error);
    throw error;
  }
};

/**
 * Close database connections
 */
const closeDatabaseConnections = async () => {
  try {
    if (postgresPool) {
      await postgresPool.end();
      logger.info('PostgreSQL connection pool closed');
    }

    if (mongooseConnection) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

/**
 * Health check for database
 */
const healthCheck = async () => {
  try {
    if (postgresPool) {
      try {
        const client = await postgresPool.connect();
        await client.query('SELECT 1');
        client.release();
        
        // Get detailed pool status
        const poolStatus = {
          totalCount: postgresPool.totalCount,
          idleCount: postgresPool.idleCount,
          waitingCount: postgresPool.waitingCount
        };
        
        return { 
          status: 'healthy', 
          database: 'postgresql',
          details: {
            type: 'postgresql',
            status: 'connected',
            poolSize: poolStatus.totalCount,
            idleCount: poolStatus.idleCount,
            waitingCount: poolStatus.waitingCount
          }
        };
      } catch (error) {
        logger.error('PostgreSQL health check failed:', error);
        return { 
          status: 'unhealthy', 
          database: 'postgresql',
          error: error.message,
          details: {
            type: 'postgresql',
            status: 'connection_failed',
            error: error.message
          }
        };
      }
    }

    if (mongooseConnection && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        return { 
          status: 'healthy', 
          database: 'mongodb',
          details: {
            type: 'mongodb',
            status: 'connected',
            readyState: mongoose.connection.readyState
          }
        };
      } catch (error) {
        logger.error('MongoDB health check failed:', error);
        return { 
          status: 'unhealthy', 
          database: 'mongodb',
          error: error.message,
          details: {
            type: 'mongodb',
            status: 'ping_failed',
            error: error.message
          }
        };
      }
    }

    // No database connections available
    return { 
      status: 'unhealthy', 
      database: 'none',
      error: 'No database connections available',
      details: {
        type: 'none',
        status: 'not_initialized',
        error: 'No database connections available'
      }
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error.message,
      details: {
        type: 'unknown',
        status: 'error',
        error: error.message
      }
    };
  }
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  try {
    if (postgresPool) {
      const result = await executeQuery(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `);
      return { type: 'postgresql', stats: result.rows };
    }

    if (mongooseConnection) {
      const stats = await mongoose.connection.db.stats();
      return { type: 'mongodb', stats };
    }

    return { type: 'none', stats: null };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return { type: 'none', stats: null, error: error.message };
  }
};

/**
 * Backup database (basic implementation)
 */
const backupDatabase = async () => {
  try {
    if (postgresPool) {
      // For PostgreSQL, you might want to use pg_dump
      logger.info('PostgreSQL backup initiated (manual pg_dump required)');
      return { status: 'manual_backup_required', database: 'postgresql' };
    }

    if (mongooseConnection) {
      // For MongoDB, you might want to use mongodump
      logger.info('MongoDB backup initiated (manual mongodump required)');
      return { status: 'manual_backup_required', database: 'mongodb' };
    }

    return { status: 'no_database_connection' };
  } catch (error) {
    logger.error('Backup failed:', error);
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  getDatabaseStatus,
  executeQuery,
  executeMongoOperation,
  closeDatabaseConnections,
  healthCheck,
  getDatabaseStats,
  backupDatabase
};
