const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const ReportPostgreSQL = require('../models/ReportPostgreSQL');
const asyncHandler = require('../utils/asyncHandler');
const Joi = require('joi');

// Initialize report model
const reportModel = new ReportPostgreSQL();

// Joi validation schemas
const reportSchemas = {
  create: Joi.object({
    title: Joi.string().required().max(255),
    description: Joi.string().allow('', null),
    type: Joi.string().required(),
    category: Joi.string().allow('', null),
    status: Joi.string().valid('draft', 'processing', 'completed', 'failed').default('draft'),
    format: Joi.string().valid('pdf', 'excel', 'csv', 'json').default('pdf'),
    parameters: Joi.object().default({}),
    expires_at: Joi.date().allow(null, '')
  }),
  
  update: Joi.object({
    title: Joi.string().max(255),
    description: Joi.string().allow('', null),
    type: Joi.string(),
    category: Joi.string().allow('', null),
    status: Joi.string().valid('draft', 'processing', 'completed', 'failed'),
    format: Joi.string().valid('pdf', 'excel', 'csv', 'json'),
    parameters: Joi.object(),
    expires_at: Joi.date().allow(null, '')
  }),
  
  generate: Joi.object({
    title: Joi.string().required().max(255),
    description: Joi.string().allow('', null),
    type: Joi.string().required(),
    category: Joi.string().allow('', null),
    format: Joi.string().valid('pdf', 'excel', 'csv', 'json').default('pdf'),
    parameters: Joi.object().default({}),
    expires_at: Joi.date().allow(null, '')
  })
};

// Get all reports for the authenticated user
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, type, category, status, format } = req.query;
  
  const options = {
    limit: parseInt(limit),
    offset: parseInt(offset),
    type: type || null,
    category: category || null,
    status: status || null,
    format: format || null
  };

  try {
    const reports = await reportModel.getByUserId(req.user.id, options);
    const stats = await reportModel.getStats(req.user.id);
    
    res.json({
      success: true,
      data: {
        reports,
        stats,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: stats.total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
}));

// Get all reports (admin only)
router.get('/all', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { limit = 100, offset = 0, type, category, status, user_id } = req.query;
  
  const options = {
    limit: parseInt(limit),
    offset: parseInt(offset),
    type: type || null,
    category: category || null,
    status: status || null,
    userId: user_id ? parseInt(user_id) : null
  };

  try {
    const reports = await reportModel.getAll(options);
    
    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: reports.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
}));

// Get report by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const report = await reportModel.getById(parseInt(id), req.user.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report',
      message: error.message
    });
  }
}));

// Create a new report
router.post('/', authenticateToken, validateRequest(reportSchemas.create), asyncHandler(async (req, res) => {
  try {
    const report = await reportModel.create({
      user_id: req.user.id,
      ...req.body
    });
    
    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
      message: error.message
    });
  }
}));

// Generate a new report (with processing status)
router.post('/generate', authenticateToken, validateRequest(reportSchemas.generate), asyncHandler(async (req, res) => {
  try {
    // Create report with processing status
    const report = await reportModel.create({
      user_id: req.user.id,
      status: 'processing',
      ...req.body
    });
    
    // Simulate report generation process
    setTimeout(async () => {
      try {
        // Update report status to completed
        await reportModel.update(report.id, {
          status: 'completed',
          generated_at: new Date().toISOString(),
          file_path: `/reports/${report.id}.${req.body.format}`,
          file_size: Math.floor(Math.random() * 1000000) + 50000 // Random file size
        });
        
        console.log(`Report ${report.id} generated successfully`);
      } catch (updateError) {
        console.error('Error updating report status:', updateError);
        await reportModel.update(report.id, { status: 'failed' });
      }
    }, 2000); // Simulate 2 second processing time
    
    res.status(201).json({
      success: true,
      message: 'Report generation started',
      data: {
        ...report,
        estimated_completion: new Date(Date.now() + 2000).toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message
    });
  }
}));

// Update report
router.put('/:id', authenticateToken, validateRequest(reportSchemas.update), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const report = await reportModel.update(parseInt(id), req.body, req.user.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }
    
    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report',
      message: error.message
    });
  }
}));

// Delete report
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const report = await reportModel.delete(parseInt(id), req.user.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }
    
    res.json({
      success: true,
      message: 'Report deleted successfully',
      data: report
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
      message: error.message
    });
  }
}));

// Download report (increment download count)
router.get('/:id/download', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const report = await reportModel.getById(parseInt(id), req.user.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }
    
    if (report.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Report is not ready for download',
        message: `Report status: ${report.status}`
      });
    }
    
    // Increment download count
    await reportModel.incrementDownloadCount(parseInt(id));
    
    // In a real application, you would serve the actual file here
    // For now, we'll just return the file info
    res.json({
      success: true,
      message: 'Report download initiated',
      data: {
        report_id: report.id,
        title: report.title,
        format: report.format,
        file_path: report.file_path,
        file_size: report.file_size,
        download_url: `/api/reports/${report.id}/file`
      }
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report',
      message: error.message
    });
  }
}));

// Search reports
router.get('/search/:term', authenticateToken, asyncHandler(async (req, res) => {
  const { term } = req.params;
  const { limit = 50, offset = 0, type, category } = req.query;
  
  const options = {
    limit: parseInt(limit),
    offset: parseInt(offset),
    type: type || null,
    category: category || null
  };

  try {
    const reports = await reportModel.search(term, options);
    
    res.json({
      success: true,
      data: {
        reports,
        search_term: term,
        pagination: {
          limit: options.limit,
          offset: options.offset,
          total: reports.length
        }
      }
    });
  } catch (error) {
    console.error('Error searching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search reports',
      message: error.message
    });
  }
}));

// Get report statistics
router.get('/stats/overview', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const stats = await reportModel.getStats(req.user.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report statistics',
      message: error.message
    });
  }
}));

// Get popular report types (admin only)
router.get('/stats/popular-types', authenticateToken, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    const popularTypes = await reportModel.getPopularTypes(parseInt(limit));
    
    res.json({
      success: true,
      data: popularTypes
    });
  } catch (error) {
    console.error('Error fetching popular report types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular report types',
      message: error.message
    });
  }
}));

// Get report templates (predefined report types)
router.get('/templates', authenticateToken, asyncHandler(async (req, res) => {
  const templates = [
    {
      id: 'portfolio_summary',
      title: 'Portfolio Summary Report',
      description: 'Comprehensive overview of investment portfolio performance',
      type: 'portfolio',
      category: 'investment',
      parameters: {
        date_range: 'last_30_days',
        include_charts: true,
        include_benchmarks: true
      },
      formats: ['pdf', 'excel']
    },
    {
      id: 'carbon_footprint',
      title: 'Carbon Footprint Analysis',
      description: 'Detailed analysis of carbon emissions and offset strategies',
      type: 'environmental',
      category: 'sustainability',
      parameters: {
        scope: 'all',
        include_recommendations: true,
        comparison_period: 'year_over_year'
      },
      formats: ['pdf', 'excel']
    },
    {
      id: 'esg_compliance',
      title: 'ESG Compliance Report',
      description: 'Environmental, Social, and Governance compliance status',
      type: 'compliance',
      category: 'regulatory',
      parameters: {
        framework: 'gri',
        include_metrics: true,
        include_actions: true
      },
      formats: ['pdf', 'excel']
    },
    {
      id: 'market_analysis',
      title: 'Market Analysis Report',
      description: 'Comprehensive market trends and investment opportunities',
      type: 'market',
      category: 'analysis',
      parameters: {
        sectors: 'all',
        include_forecasts: true,
        include_risk_assessment: true
      },
      formats: ['pdf', 'excel', 'csv']
    }
  ];
  
  res.json({
    success: true,
    data: templates
  });
}));

module.exports = router;
