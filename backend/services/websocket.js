const jwt = require('jsonwebtoken');
const { logger } = require('../middleware/errorHandler');

let io = null;

/**
 * Initialize WebSocket service
 */
const initializeWebSocket = (socketIO) => {
  io = socketIO;
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected to WebSocket`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    // Join company room if applicable
    if (socket.handshake.auth.companyId) {
      socket.join(`company:${socket.handshake.auth.companyId}`);
    }

    // Handle stock market subscriptions
    socket.on('subscribe:stocks', (data) => {
      const { tickers } = data;
      if (Array.isArray(tickers)) {
        tickers.forEach(ticker => {
          socket.join(`stock:${ticker.toUpperCase()}`);
        });
        logger.info(`User ${socket.userId} subscribed to stocks: ${tickers.join(', ')}`);
      }
    });

    // Handle carbon credit subscriptions
    socket.on('subscribe:carbon', (data) => {
      const { projectIds, types } = data;
      
      if (Array.isArray(projectIds)) {
        projectIds.forEach(projectId => {
          socket.join(`project:${projectId}`);
        });
      }
      
      if (Array.isArray(types)) {
        types.forEach(type => {
          socket.join(`carbon:${type}`);
        });
      }
      
      logger.info(`User ${socket.userId} subscribed to carbon credits`);
    });

    // Handle portfolio subscriptions
    socket.on('subscribe:portfolio', (portfolioId) => {
      socket.join(`portfolio:${portfolioId}`);
      logger.info(`User ${socket.userId} subscribed to portfolio: ${portfolioId}`);
    });

    // Handle custom alerts
    socket.on('subscribe:alerts', (alertTypes) => {
      if (Array.isArray(alertTypes)) {
        alertTypes.forEach(type => {
          socket.join(`alert:${type}`);
        });
        logger.info(`User ${socket.userId} subscribed to alerts: ${alertTypes.join(', ')}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User ${socket.userId} disconnected from WebSocket. Reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for user ${socket.userId}:`, error);
    });
  });

  logger.info('WebSocket service initialized successfully');
};

/**
 * Emit stock price updates to subscribed clients
 */
const emitStockUpdate = (ticker, data) => {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot emit stock update');
    return;
  }

  try {
    io.to(`stock:${ticker.toUpperCase()}`).emit('stock:update', {
      ticker: ticker.toUpperCase(),
      ...data,
      timestamp: new Date().toISOString()
    });

    // Emit to all users for market overview
    io.emit('market:update', {
      type: 'stock',
      ticker: ticker.toUpperCase(),
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Stock update emitted for ${ticker}:`, data);
  } catch (error) {
    logger.error(`Failed to emit stock update for ${ticker}:`, error);
  }
};

/**
 * Emit carbon credit updates to subscribed clients
 */
const emitCarbonUpdate = (projectId, data) => {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot emit carbon update');
    return;
  }

  try {
    io.to(`project:${projectId}`).emit('carbon:update', {
      projectId,
      ...data,
      timestamp: new Date().toISOString()
    });

    // Emit to all users for market overview
    io.emit('market:update', {
      type: 'carbon',
      projectId,
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Carbon update emitted for project ${projectId}:`, data);
  } catch (error) {
    logger.error(`Failed to emit carbon update for project ${projectId}:`, error);
  }
};

/**
 * Emit portfolio updates to specific users
 */
const emitPortfolioUpdate = (portfolioId, userId, data) => {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot emit portfolio update');
    return;
  }

  try {
    // Emit to portfolio subscribers
    io.to(`portfolio:${portfolioId}`).emit('portfolio:update', {
      portfolioId,
      ...data,
      timestamp: new Date().toISOString()
    });

    // Emit to specific user
    io.to(`user:${userId}`).emit('portfolio:personal:update', {
      portfolioId,
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Portfolio update emitted for ${portfolioId}:`, data);
  } catch (error) {
    logger.error(`Failed to emit portfolio update for ${portfolioId}:`, error);
  }
};

/**
 * Emit notifications to specific users
 */
const emitNotification = (userId, notification) => {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot emit notification');
    return;
  }

  try {
    io.to(`user:${userId}`).emit('notification:new', {
      ...notification,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Notification emitted for user ${userId}:`, notification);
  } catch (error) {
    logger.error(`Failed to emit notification for user ${userId}:`, error);
  }
};

/**
 * Emit alerts to subscribed users
 */
const emitAlert = (alertType, data) => {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot emit alert');
    return;
  }

  try {
    io.to(`alert:${alertType}`).emit('alert:new', {
      type: alertType,
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Alert emitted for type ${alertType}:`, data);
  } catch (error) {
    logger.error(`Failed to emit alert for type ${alertType}:`, error);
  }
};

/**
 * Emit system-wide announcements
 */
const emitAnnouncement = (announcement) => {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot emit announcement');
    return;
  }

  try {
    io.emit('system:announcement', {
      ...announcement,
      timestamp: new Date().toISOString()
    });

    logger.info(`System announcement emitted:`, announcement);
  } catch (error) {
    logger.error('Failed to emit system announcement:', error);
  }
};

/**
 * Get connected users count
 */
const getConnectedUsersCount = () => {
  if (!io) return 0;
  return io.engine.clientsCount;
};

/**
 * Get connected users by room
 */
const getConnectedUsersByRoom = (room) => {
  if (!io) return [];
  
  const roomSockets = io.sockets.adapter.rooms.get(room);
  if (!roomSockets) return [];
  
  return Array.from(roomSockets);
};

/**
 * Disconnect a specific user
 */
const disconnectUser = (userId) => {
  if (!io) return false;

  try {
    const userSockets = Array.from(io.sockets.sockets.values())
      .filter(socket => socket.userId === userId);

    userSockets.forEach(socket => {
      socket.disconnect(true);
    });

    logger.info(`Disconnected user ${userId} from WebSocket`);
    return true;
  } catch (error) {
    logger.error(`Failed to disconnect user ${userId}:`, error);
    return false;
  }
};

/**
 * Broadcast to all connected clients
 */
const broadcastToAll = (event, data) => {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot broadcast');
    return;
  }

  try {
    io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });

    logger.debug(`Broadcast sent to all clients: ${event}`);
  } catch (error) {
    logger.error(`Failed to broadcast ${event}:`, error);
  }
};

module.exports = {
  initializeWebSocket,
  emitStockUpdate,
  emitCarbonUpdate,
  emitPortfolioUpdate,
  emitNotification,
  emitAlert,
  emitAnnouncement,
  getConnectedUsersCount,
  getConnectedUsersByRoom,
  disconnectUser,
  broadcastToAll
};
