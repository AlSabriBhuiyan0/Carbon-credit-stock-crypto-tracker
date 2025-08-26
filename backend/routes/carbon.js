const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const asyncHandler = require('../utils/asyncHandler');
const CarbonCreditPostgreSQL = require('../data-processing/CarbonCreditPostgreSQL');
const dataIngestionService = require('../data-ingestion/dataIngestion');
const unifiedWebSocketService = require('../services/unifiedWebSocketService');

// Get all carbon credit projects
router.get('/', asyncHandler(async (req, res) => {
  console.log('🔍 Carbon route called - no auth required');
  try {
    const projects = await CarbonCreditPostgreSQL.getAllProjects();
    
    if (projects.length === 0) {
      // If no projects exist, fetch some initial data and store it
      console.log('🔍 No carbon projects found, ingesting initial data...');
      const carbonData = await dataIngestionService.ingestCarbonCreditData();
      
      // Store the ingested data in the database
      for (const project of carbonData) {
        if (project) {
          try {
            // Create project record
            await CarbonCreditPostgreSQL.createProject({
              projectId: project.projectId,
              name: project.name,
              type: project.type,
              location: project.location,
              country: project.location, // Using location as country for now
              standard: project.standard,
              totalCredits: project.creditsIssued
            });
            
            // Add credit data
            await CarbonCreditPostgreSQL.addCreditData({
              projectId: project.projectId,
              price: parseFloat(project.price),
              creditsIssued: project.creditsIssued,
              creditsRetired: project.creditsRetired,
              verificationDate: project.verificationDate,
              source: project.source
            });
            
            console.log(`✅ Stored carbon project: ${project.name}`);
          } catch (dbError) {
            console.error(`❌ Failed to store project ${project.projectId}:`, dbError.message);
          }
        }
      }
      
      // Fetch the newly stored projects
      const updatedProjects = await CarbonCreditPostgreSQL.getAllProjects();
      console.log(`🎯 Carbon data ingestion completed. Stored ${updatedProjects.length} projects.`);
      return res.json({ success: true, data: updatedProjects });
    }
    
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching carbon projects:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch carbon projects' });
  }
}));

// Get carbon projects by type
router.get('/type/:type', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { type } = req.params;
    const projects = await CarbonCreditPostgreSQL.getProjectsByType(type);
    
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects by type:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects by type' });
  }
}));

// Get carbon project by ID
router.get('/project/:projectId', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await CarbonCreditPostgreSQL.findProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('Error fetching carbon project:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch carbon project' });
  }
}));

// Get carbon credit market overview
router.get('/market/overview', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const projects = await CarbonCreditPostgreSQL.getAllProjects();
    
    // Calculate market statistics with validation
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    
    // Calculate total credits with validation to prevent extremely large numbers
    let totalCreditsIssued = projects.reduce((sum, p) => {
      const credits = p.current_credits_issued || 0;
      // Limit individual project credits to prevent overflow
      const validCredits = Math.min(credits, 1000000); // Max 1M credits per project
      return sum + validCredits;
    }, 0);
    
    let totalCreditsRetired = projects.reduce((sum, p) => {
      const credits = p.current_credits_retired || 0;
      const validCredits = Math.min(credits, 1000000); // Max 1M credits per project
      return sum + validCredits;
    }, 0);
    
    // Ensure totals are reasonable (max 100M total credits)
    totalCreditsIssued = Math.min(totalCreditsIssued, 100000000);
    totalCreditsRetired = Math.min(totalCreditsRetired, 100000000);
    
    // Calculate average price
    const projectsWithPrice = projects.filter(p => p.current_price);
    const averagePrice = projectsWithPrice.length > 0 
      ? projectsWithPrice.reduce((sum, p) => sum + parseFloat(p.current_price), 0) / projectsWithPrice.length
      : 0;
    
    const overview = {
      totalProjects,
      activeProjects,
      totalCreditsIssued,
      totalCreditsRetired,
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      availableCredits: totalCreditsIssued - totalCreditsRetired,
      lastUpdated: new Date()
    };
    
    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch market overview' });
  }
}));

// Get real-time carbon credit data
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    // Get data from unified service
    const carbonData = unifiedWebSocketService.getAllData('carbon');
    
    // Get database data as fallback
    const projects = await CarbonCreditPostgreSQL.getAllProjects();
    
    // Combine real-time and database data
    const realtimeData = {
      realtime: carbonData,
      database: projects,
      timestamp: new Date(),
      serviceStatus: unifiedWebSocketService.getServiceStatus('carbon')
    };
    
    res.json({ success: true, data: realtimeData });
  } catch (error) {
    console.error('Error fetching real-time carbon data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch real-time carbon data' });
  }
});

// Start carbon WebSocket service
router.post('/websocket/start', authenticateToken, async (req, res) => {
  try {
    const { symbols = ['EUA', 'CCA', 'RGGI', 'VER'] } = req.body;
    
    // Start the carbon service in unified service
    await unifiedWebSocketService.startService('carbon');
    
    // Subscribe to symbols
    symbols.forEach(symbol => {
      unifiedWebSocketService.subscribe('carbon', symbol);
    });
    
    res.json({ 
      success: true, 
      message: 'Carbon WebSocket started successfully via unified service',
      symbols: symbols
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop carbon WebSocket service
router.post('/websocket/stop', authenticateToken, async (req, res) => {
  try {
    await unifiedWebSocketService.stopService('carbon');
    res.json({ 
      success: true, 
      message: 'Carbon WebSocket stopped successfully via unified service'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh carbon credit data (admin only)
router.post('/refresh', authenticateToken, requireRole(['admin', 'analyst']), asyncHandler(async (req, res) => {
  try {
    const carbonData = await dataIngestionService.ingestCarbonCreditData();
    
    // Store the new data
    for (const project of carbonData) {
      if (project) {
        // Create project record
        await CarbonCreditPostgreSQL.createProject({
          projectId: project.projectId,
          name: project.name,
          type: project.type,
          location: project.location,
          country: project.location, // Using location as country for now
          standard: project.standard,
          totalCredits: project.creditsIssued
        });
        
        // Add credit data
        await CarbonCreditPostgreSQL.addCreditData({
          projectId: project.projectId,
          price: parseFloat(project.price),
          creditsIssued: project.creditsIssued,
          creditsRetired: project.creditsRetired,
          verificationDate: project.verificationDate,
          source: project.source
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: `Refreshed data for ${carbonData.length} carbon projects`,
      data: carbonData 
    });
  } catch (error) {
    console.error('Error refreshing carbon credit data:', error);
    res.status(500).json({ success: false, error: 'Failed to refresh carbon credit data' });
  }
}));

module.exports = router;
