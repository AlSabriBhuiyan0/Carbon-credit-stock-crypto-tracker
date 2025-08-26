const express = require('express');
const router = express.Router();
const unifiedWebSocketService = require('../services/unifiedWebSocketService');

// ===== UNIFIED SERVICE STATUS =====

// Get status of all services
router.get('/status', (req, res) => {
  try {
    const status = unifiedWebSocketService.getAllServicesStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting unified service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service status'
    });
  }
});

// Get status of specific service
router.get('/status/:service', (req, res) => {
  try {
    const { service } = req.params;
    const status = unifiedWebSocketService.getServiceStatus(service);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error(`Error getting ${req.params.service} service status:`, error);
    res.status(400).json({
      success: false,
      error: `Invalid service: ${req.params.service}`
    });
  }
});

// ===== SERVICE CONTROL =====

// Start a specific service
router.post('/start/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const result = await unifiedWebSocketService.startService(service);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: unifiedWebSocketService.getServiceStatus(service)
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error starting ${req.params.service} service:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to start ${req.params.service} service`
    });
  }
});

// Stop a specific service
router.post('/stop/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const result = await unifiedWebSocketService.stopService(service);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error stopping ${req.params.service} service:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to stop ${req.params.service} service`
    });
  }
});

// Start all services
router.post('/start-all', async (req, res) => {
  try {
    const services = ['binance', 'stocks', 'carbon'];
    const results = {};
    
    for (const service of services) {
      try {
        const result = await unifiedWebSocketService.startService(service);
        results[service] = result;
      } catch (error) {
        results[service] = { success: false, error: error.message };
      }
    }
    
    res.json({
      success: true,
      message: 'Started all services',
      data: results
    });
  } catch (error) {
    console.error('Error starting all services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start all services'
    });
  }
});

// Stop all services
router.post('/stop-all', async (req, res) => {
  try {
    await unifiedWebSocketService.stopAllServices();
    res.json({
      success: true,
      message: 'All services stopped'
    });
  } catch (error) {
    console.error('Error stopping all services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop all services'
    });
  }
});

// ===== SUBSCRIPTION MANAGEMENT =====

// Subscribe to a symbol on a specific service
router.post('/subscribe/:service/:symbol', (req, res) => {
  try {
    const { service, symbol } = req.params;
    const result = unifiedWebSocketService.subscribe(service, symbol);
    
    res.json({
      success: true,
      message: `Subscribed to ${symbol} on ${service}`,
      data: result
    });
  } catch (error) {
    console.error(`Error subscribing to ${req.params.symbol} on ${req.params.service}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Unsubscribe from a symbol on a specific service
router.post('/unsubscribe/:service/:symbol', (req, res) => {
  try {
    const { service, symbol } = req.params;
    const result = unifiedWebSocketService.unsubscribe(service, symbol);
    
    res.json({
      success: true,
      message: `Unsubscribed from ${symbol} on ${service}`,
      data: result
    });
  } catch (error) {
    console.error(`Error unsubscribing from ${req.params.symbol} on ${req.params.service}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ===== DATA RETRIEVAL =====

// Get data for a specific symbol on a specific service
router.get('/data/:service/:symbol', (req, res) => {
  try {
    const { service, symbol } = req.params;
    const data = unifiedWebSocketService.getData(service, symbol);
    
    if (data) {
      res.json({
        success: true,
        data: data
      });
    } else {
      res.status(404).json({
        success: false,
        error: `No data available for ${symbol} on ${service}`
      });
    }
  } catch (error) {
    console.error(`Error getting data for ${req.params.symbol} on ${req.params.service}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all data for a specific service
router.get('/data/:service', (req, res) => {
  try {
    const { service } = req.params;
    const data = unifiedWebSocketService.getAllData(service);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error(`Error getting all data for ${req.params.service}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ===== WEBSOCKET ENDPOINTS =====

// Start WebSocket for a specific service
router.post('/websocket/start/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const result = await unifiedWebSocketService.startService(service);
    
    if (result.success) {
      res.json({
        success: true,
        message: `WebSocket started for ${service}`,
        data: unifiedWebSocketService.getServiceStatus(service)
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error starting WebSocket for ${req.params.service}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to start WebSocket for ${req.params.service}`
    });
  }
});

// Stop WebSocket for a specific service
router.post('/websocket/stop/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const result = await unifiedWebSocketService.stopService(service);
    
    if (result.success) {
      res.json({
        success: true,
        message: `WebSocket stopped for ${service}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error stopping WebSocket for ${req.params.service}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to stop WebSocket for ${req.params.service}`
    });
  }
});

// ===== HEALTH CHECK =====

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    const status = unifiedWebSocketService.getAllServicesStatus();
    const overallHealth = Object.values(status).every(service => service.isHealthy);
    
    res.json({
      success: true,
      data: {
        overall: overallHealth,
        services: status,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// ===== CACHE MANAGEMENT =====

// Clear cache for a specific service
router.post('/cache/clear/:service', (req, res) => {
  try {
    const { service } = req.params;
    
    if (unifiedWebSocketService.cache[service]) {
      unifiedWebSocketService.cache[service].clear();
      res.json({
        success: true,
        message: `Cache cleared for ${service}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Invalid service: ${service}`
      });
    }
  } catch (error) {
    console.error(`Error clearing cache for ${req.params.service}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to clear cache for ${req.params.service}`
    });
  }
});

// Clear all caches
router.post('/cache/clear-all', (req, res) => {
  try {
    Object.keys(unifiedWebSocketService.cache).forEach(service => {
      unifiedWebSocketService.cache[service].clear();
    });
    
    res.json({
      success: true,
      message: 'All caches cleared'
    });
  } catch (error) {
    console.error('Error clearing all caches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear all caches'
    });
  }
});

module.exports = router;
