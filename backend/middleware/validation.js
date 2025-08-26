const Joi = require('joi');
const { AppError } = require('./errorHandler');

/**
 * Generic validation middleware using Joi schemas
 */
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return next(new AppError(errorMessage, 400));
    }

    // Replace req[property] with validated data
    req[property] = value;
    next();
  };
};

/**
 * Validation schemas for different entities
 */

// User validation schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .optional()
      .messages({
        'any.only': 'Passwords do not match'
      }),
    role: Joi.string()
      .valid('investor', 'company', 'regulator', 'ngo', 'public', 'admin')
      .default('public'),
    company_id: Joi.string().optional(),
    first_name: Joi.string().min(1).max(50).optional(),
    last_name: Joi.string().min(1).max(50).optional(),
    selectedPlan: Joi.string()
      .valid('starter', 'professional', 'enterprise')
      .optional()
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  updateProfile: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .optional(),
    email: Joi.string()
      .email()
      .optional(),
    firstName: Joi.string()
      .min(1)
      .max(50)
      .optional(),
    lastName: Joi.string()
      .min(1)
      .max(50)
      .optional(),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional(),
    preferences: Joi.object({
      notifications: Joi.boolean().optional(),
      emailAlerts: Joi.boolean().optional(),
      smsAlerts: Joi.boolean().optional(),
      dashboardView: Joi.string().valid('stock', 'carbon', 'combined').optional()
    }).optional()
  })
};

// Stock validation schemas
const stockSchemas = {
  createStock: Joi.object({
    ticker: Joi.string()
      .pattern(/^[A-Z]{1,5}$/)
      .required()
      .messages({
        'string.pattern.base': 'Ticker must be 1-5 uppercase letters',
        'any.required': 'Ticker is required'
      }),
    companyName: Joi.string()
      .min(1)
      .max(100)
      .required(),
    exchange: Joi.string()
      .min(1)
      .max(50)
      .required(),
    sector: Joi.string()
      .min(1)
      .max(50)
      .optional(),
    industry: Joi.string()
      .min(1)
      .max(50)
      .optional()
  }),

  updateStockPrice: Joi.object({
    openPrice: Joi.number()
      .positive()
      .required(),
    closePrice: Joi.number()
      .positive()
      .required(),
    highPrice: Joi.number()
      .positive()
      .required(),
    lowPrice: Joi.number()
      .positive()
      .required(),
    volume: Joi.number()
      .integer()
      .min(0)
      .required(),
    date: Joi.date()
      .iso()
      .max('now')
      .required()
  }),

  stockQuery: Joi.object({
    ticker: Joi.string().optional(),
    exchange: Joi.string().optional(),
    sector: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    page: Joi.number().integer().min(1).default(1)
  })
};

// Carbon credit validation schemas
const carbonSchemas = {
  createCarbonCredit: Joi.object({
    type: Joi.string()
      .valid('VER', 'CER', 'VCU', 'CCU', 'custom')
      .required(),
    amount: Joi.number()
      .positive()
      .required()
      .messages({
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required'
      }),
    unit: Joi.string()
      .valid('tCO2e', 'tCO2', 'kgCO2e')
      .default('tCO2e'),
    projectId: Joi.string()
      .required()
      .messages({
        'any.required': 'Project ID is required'
      }),
    vintage: Joi.number()
      .integer()
      .min(2000)
      .max(new Date().getFullYear())
      .optional(),
    standard: Joi.string()
      .valid('VCS', 'GS', 'CDM', 'CAR', 'ACR', 'custom')
      .optional(),
    country: Joi.string()
      .length(2)
      .optional(),
    price: Joi.number()
      .positive()
      .optional()
  }),

  createTransaction: Joi.object({
    creditId: Joi.string()
      .required()
      .messages({
        'any.required': 'Credit ID is required'
      }),
    senderId: Joi.string()
      .required(),
    receiverId: Joi.string()
      .required(),
    amount: Joi.number()
      .positive()
      .required(),
    type: Joi.string()
      .valid('transfer', 'retirement', 'offset', 'trading')
      .required(),
    price: Joi.number()
      .positive()
      .optional(),
    notes: Joi.string()
      .max(500)
      .optional()
  }),

  carbonQuery: Joi.object({
    type: Joi.string().optional(),
    projectId: Joi.string().optional(),
    standard: Joi.string().optional(),
    country: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    minAmount: Joi.number().positive().optional(),
    maxAmount: Joi.number().positive().optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    page: Joi.number().integer().min(1).default(1)
  })
};

// Portfolio validation schemas
const portfolioSchemas = {
  createPortfolio: Joi.object({
    name: Joi.string()
      .min(1)
      .max(100)
      .required(),
    description: Joi.string()
      .max(500)
      .optional(),
    type: Joi.string()
      .valid('stock', 'carbon', 'mixed')
      .default('mixed'),
    isPublic: Joi.boolean().default(false)
  }),

  addStockToPortfolio: Joi.object({
    stockSymbol: Joi.string()
      .required()
      .messages({
        'any.required': 'Stock symbol is required'
      }),
    quantity: Joi.number()
      .positive()
      .required(),
    purchasePrice: Joi.number()
      .positive()
      .required(),
    purchaseDate: Joi.date()
      .iso()
      .max('now')
      .required()
  }),

  addCarbonToPortfolio: Joi.object({
    creditId: Joi.string()
      .required()
      .messages({
        'any.required': 'Carbon credit ID is required'
      }),
    quantity: Joi.number()
      .positive()
      .required(),
    purchasePrice: Joi.number()
      .positive()
      .required(),
    purchaseDate: Joi.date()
      .iso()
      .max('now')
      .required()
  })
};

// Notification validation schemas
const notificationSchemas = {
  createAlert: Joi.object({
    type: Joi.string()
      .valid('stock_price', 'carbon_price', 'portfolio_value', 'compliance', 'custom')
      .required(),
    condition: Joi.string()
      .valid('above', 'below', 'equals', 'changes_by')
      .required(),
    threshold: Joi.number()
      .required(),
    assetId: Joi.string()
      .when('type', {
        is: Joi.string().valid('stock_price', 'carbon_price'),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    message: Joi.string()
      .max(200)
      .optional(),
    channels: Joi.array()
      .items(Joi.string().valid('email', 'sms', 'push', 'in_app'))
      .min(1)
      .default(['in_app'])
  }),

  updatePreferences: Joi.object({
    emailAlerts: Joi.boolean().optional(),
    smsAlerts: Joi.boolean().optional(),
    pushNotifications: Joi.boolean().optional(),
    inAppNotifications: Joi.boolean().optional(),
    frequency: Joi.string()
      .valid('immediate', 'hourly', 'daily', 'weekly')
      .optional(),
    quietHours: Joi.object({
      enabled: Joi.boolean().optional(),
      start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional()
  })
};

// Report validation schemas
const reportSchemas = {
  generateReport: Joi.object({
    type: Joi.string()
      .valid('portfolio', 'carbon_footprint', 'esg', 'compliance', 'custom')
      .required(),
    format: Joi.string()
      .valid('pdf', 'csv', 'excel', 'json')
      .default('pdf'),
    dateRange: Joi.object({
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().required()
    }).required(),
    includeCharts: Joi.boolean().default(true),
    includeData: Joi.boolean().default(true),
    filters: Joi.object().optional()
  })
};

// Dashboard validation schemas
const dashboardSchemas = {
  getDashboardData: Joi.object({
    view: Joi.string()
      .valid('stock', 'carbon', 'combined', 'overview')
      .default('overview'),
    timeRange: Joi.string()
      .valid('1d', '1w', '1m', '3m', '6m', '1y', 'all')
      .default('1m'),
    refresh: Joi.boolean().default(false)
  })
};

module.exports = {
  validateRequest,
  userSchemas,
  stockSchemas,
  carbonSchemas,
  portfolioSchemas,
  notificationSchemas,
  reportSchemas,
  dashboardSchemas
};
