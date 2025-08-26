const cron = require('node-cron');
const { logger } = require('../middleware/errorHandler');

let scheduledJobs = new Map();

/**
 * Initialize scheduled tasks
 */
const initializeScheduler = () => {
  try {
    // Schedule stock data ingestion
    scheduleStockDataIngestion();
    
    // Schedule carbon credit data ingestion
    scheduleCarbonDataIngestion();
    
    // Schedule model retraining
    scheduleModelRetraining();
    
    // Schedule data cleanup
    scheduleDataCleanup();
    
    // Schedule health checks
    scheduleHealthChecks();
    
    // Schedule report generation
    scheduleReportGeneration();
    
    logger.info('Scheduler initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize scheduler:', error);
  }
};

/**
 * Schedule stock data ingestion tasks
 */
const scheduleStockDataIngestion = () => {
  // Real-time stock data (every 5 minutes during market hours)
  const stockDataJob = cron.schedule('*/5 9-17 * * 1-5', async () => {
    try {
      logger.info('Starting scheduled stock data ingestion');
      
      // Check if markets are open
      if (isMarketOpen()) {
        await ingestStockData();
        logger.info('Stock data ingestion completed successfully');
      } else {
        logger.info('Markets are closed, skipping stock data ingestion');
      }
    } catch (error) {
      logger.error('Scheduled stock data ingestion failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York'
  });

  scheduledJobs.set('stockDataIngestion', stockDataJob);
  logger.info('Stock data ingestion scheduled');
};

/**
 * Schedule carbon credit data ingestion tasks
 */
const scheduleCarbonDataIngestion = () => {
  // Carbon credit data (every hour)
  const carbonDataJob = cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Starting scheduled carbon credit data ingestion');
      await ingestCarbonData();
      logger.info('Carbon credit data ingestion completed successfully');
    } catch (error) {
      logger.error('Scheduled carbon credit data ingestion failed:', error);
    }
  });

  scheduledJobs.set('carbonDataIngestion', carbonDataJob);
  logger.info('Carbon credit data ingestion scheduled');
};

/**
 * Schedule model retraining tasks
 */
const scheduleModelRetraining = () => {
  // Retrain stock forecasting models (weekly on Sunday at 2 AM)
  const stockModelJob = cron.schedule('0 2 * * 0', async () => {
    try {
      logger.info('Starting stock forecasting model retraining');
      await retrainStockModels();
      logger.info('Stock forecasting model retraining completed');
    } catch (error) {
      logger.error('Stock forecasting model retraining failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  scheduledJobs.set('stockModelRetraining', stockModelJob);
};

/**
 * Schedule data cleanup tasks
 */
const scheduleDataCleanup = () => {
  // Clean old data (daily at 3 AM)
  const dataCleanupJob = cron.schedule('0 3 * * *', async () => {
    try {
      logger.info('Starting scheduled data cleanup');
      await cleanupOldData();
      logger.info('Data cleanup completed successfully');
    } catch (error) {
      logger.error('Scheduled data cleanup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  scheduledJobs.set('dataCleanup', dataCleanupJob);
  logger.info('Data cleanup scheduled');
};

/**
 * Schedule health checks
 */
const scheduleHealthChecks = () => {
  // System health check (every 5 minutes)
  const healthCheckJob = cron.schedule('*/5 * * * *', async () => {
    try {
      await performHealthCheck();
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  });

  scheduledJobs.set('healthCheck', healthCheckJob);
  logger.info('Health checks scheduled');
};

/**
 * Schedule report generation
 */
const scheduleReportGeneration = () => {
  // Daily market summary (every day at 7 AM)
  const dailyReportJob = cron.schedule('0 7 * * *', async () => {
    try {
      logger.info('Generating daily market summary report');
      await generateDailyMarketReport();
      logger.info('Daily market summary report generated');
    } catch (error) {
      logger.error('Daily market summary report generation failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  scheduledJobs.set('dailyReport', dailyReportJob);
};

/**
 * Check if markets are open
 */
const isMarketOpen = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 100 + minute;

  // Monday to Friday, 9:30 AM to 4:00 PM (market hours)
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    if (currentTime >= 930 && currentTime <= 1600) {
      return true;
    }
  }

  return false;
};

/**
 * Placeholder functions for scheduled tasks
 */
const ingestStockData = async () => {
  try {
    const ingestion = require('../data-ingestion/dataIngestion');
    await ingestion.ingestStockData();
  } catch (e) {
    logger.warn('Stock data ingestion skipped:', e.message);
  }
};

const ingestCarbonData = async () => {
  try {
    const ingestion = require('../data-ingestion/dataIngestion');
    await ingestion.ingestCarbonCreditData();
  } catch (e) {
    logger.warn('Carbon data ingestion skipped:', e.message);
  }
};

const retrainStockModels = async () => {
  logger.debug('Stock model retraining placeholder');
};

const cleanupOldData = async () => {
  logger.debug('Data cleanup placeholder');
};

const performHealthCheck = async () => {
  logger.debug('Health check placeholder');
};

const generateDailyMarketReport = async () => {
  logger.debug('Daily market report generation placeholder');
};

/**
 * Add a custom scheduled job
 */
const addCustomJob = (name, schedule, task, options = {}) => {
  try {
    if (scheduledJobs.has(name)) {
      logger.warn(`Job ${name} already exists, stopping previous instance`);
      stopJob(name);
    }

    const job = cron.schedule(schedule, task, {
      scheduled: true,
      timezone: options.timezone || 'UTC',
      ...options
    });

    scheduledJobs.set(name, job);
    logger.info(`Custom job ${name} scheduled successfully`);
    return true;
  } catch (error) {
    logger.error(`Failed to schedule custom job ${name}:`, error);
    return false;
  }
};

/**
 * Stop a scheduled job
 */
const stopJob = (name) => {
  const job = scheduledJobs.get(name);
  if (job) {
    job.stop();
    scheduledJobs.delete(name);
    logger.info(`Job ${name} stopped successfully`);
    return true;
  }
  return false;
};

/**
 * Get all scheduled jobs status
 */
const getScheduledJobsStatus = () => {
  const status = {};
  for (const [name, job] of scheduledJobs) {
    status[name] = {
      running: job.running,
      nextDate: job.nextDate(),
      lastDate: job.lastDate()
    };
  }
  return status;
};

/**
 * Stop all scheduled jobs
 */
const stopAllJobs = () => {
  for (const [name, job] of scheduledJobs) {
    job.stop();
    logger.info(`Job ${name} stopped`);
  }
  scheduledJobs.clear();
  logger.info('All scheduled jobs stopped');
};

module.exports = {
  initializeScheduler,
  addCustomJob,
  stopJob,
  getScheduledJobsStatus,
  stopAllJobs
};
