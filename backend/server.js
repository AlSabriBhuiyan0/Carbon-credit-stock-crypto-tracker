const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const util = require('util');

// Silence DEP0060 util._extend warning by aliasing to Object.assign
if (util && typeof util._extend === 'function') {
  // eslint-disable-next-line no-underscore-dangle
  util._extend = Object.assign;
}

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const carbonRoutes = require('./routes/carbon');
const userRoutes = require('./routes/users');
const portfolioRoutes = require('./routes/portfolios');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const subscriptionRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const unifiedRoutes = require('./routes/unified');
const assetsRoutes = require('./routes/assets');
const forecastRoutes = require('./routes/forecast');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const { validateRequest } = require('./middleware/validation');

// Import services
const { initializeDatabase, getDatabaseStatus, healthCheck, getDatabaseStats } = require('./services/database');
const { initializeScheduler } = require('./services/scheduler');
const { initializeWebSocket } = require('./services/websocket');
const pythonEnvManager = require('./services/pythonEnvironmentManager');
const unifiedWebSocketService = require('./services/unifiedWebSocketService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stock Market + Carbon Credits Tracker API',
      version: '1.0.0',
      description: 'Comprehensive API for tracking stocks and carbon credits',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Rate limiting - More generous for dashboard usage
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (much more generous)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static assets
    return req.path === '/health' || req.path === '/health/db' || req.path === '/health/db/stats';
  },
  // Clear rate limiting state on server restart
  store: new (require('express-rate-limit')).MemoryStore()
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));
// app.use(limiter); // Temporarily disabled for testing

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database health endpoints
app.get('/health/db', async (req, res) => {
  try {
    const basic = await healthCheck();
    const details = getDatabaseStatus();
    res.status(200).json({ ...basic, details });
  } catch (e) {
    res.status(503).json({ error: 'Service Unavailable', message: e.message });
  }
});

app.get('/health/db/stats', async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    res.status(200).json(stats);
  } catch (e) {
    res.status(503).json({ error: 'Service Unavailable', message: e.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/unfccc', authenticateToken, require('./routes/unfccc'));
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/portfolios', authenticateToken, portfolioRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crypto', require('./routes/crypto')); // Temporarily disabled auth for testing
app.use('/api/unified', unifiedRoutes); // New unified service routes
app.use('/api/assets', assetsRoutes); // Asset type detection and validation
app.use('/api/forecast', forecastRoutes); // Forecast categorization and mixed asset handling

// Debug route without authentication
app.get('/debug/crypto/forecast/:symbol', async (req, res) => {
  try {
    const cryptoForecastingService = require('./services/cryptoForecastingService');
    const { symbol } = req.params;
    const { horizonDays = 3 } = req.query;
    
    console.log(`🧪 Debug forecast request for ${symbol}, horizon: ${horizonDays}`);
    
    // Test historical data first
    const historicalData = await cryptoForecastingService.getHistoricalData(symbol, '1d', 30);
    console.log(`📊 Historical data length: ${historicalData.length}`);
    
    if (historicalData.length === 0) {
      return res.status(400).json({ 
        error: 'No historical data available',
        symbol,
        message: 'Binance API returned empty data'
      });
    }
    
    console.log(`📊 Sample historical data:`, historicalData[0]);
    
    // Test Prophet forecasting
    const prophetForecast = await cryptoForecastingService.generateProphetForecast(symbol, parseInt(horizonDays));
    console.log(`🔮 Prophet forecast result:`, prophetForecast);
    
    res.json({ 
      success: true, 
      data: {
        symbol,
        historicalDataLength: historicalData.length,
        prophetForecast
      }
    });
    
  } catch (error) {
    console.error(`❌ Debug forecast error:`, error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

// WebSocket initialization
initializeWebSocket(io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5001;

// Initialize services and start server
async function startServer() {
  try {
    // Initialize database connection (optional for development)
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.warn('⚠️  Database initialization failed, continuing without database...');
      console.warn('   Some features may not work properly.');
    }
    
    // Initialize Python environment for forecasting services
    try {
      console.log('🐍 Initializing Python environment...');
      await pythonEnvManager.checkEnvironment();
      console.log('✅ Python environment ready');
    } catch (pyError) {
      console.warn('⚠️  Python environment initialization failed, forecasting services may not work...');
      console.warn('   Error:', pyError.message);
    }
    
    // Initialize scheduled tasks
    initializeScheduler();
    
    // Initialize unified WebSocket service
    try {
      console.log('🔗 Initializing unified WebSocket service...');
      // Start all services by default
      await unifiedWebSocketService.startService('binance');
      await unifiedWebSocketService.startService('stocks');
      await unifiedWebSocketService.startService('carbon');
      console.log('✅ Unified WebSocket service ready');
    } catch (wsError) {
      console.warn('⚠️  Unified WebSocket service initialization failed, some real-time features may not work...');
      console.warn('   Error:', wsError.message);
    }
    
    // Start server
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 Unified Service: http://localhost:${PORT}/api/unified/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();
