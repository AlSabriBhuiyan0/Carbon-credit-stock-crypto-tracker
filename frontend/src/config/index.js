// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// App Configuration
export const APP_CONFIG = {
  name: 'Carbon Credit & Stock Tracker',
  version: '1.0.0',
  description: 'Comprehensive platform for tracking stocks and carbon credits',
  defaultCurrency: 'USD',
  defaultLanguage: 'en',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  supportedFileTypes: ['.csv', '.xlsx', '.pdf', '.json'],
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100
  },
  refreshIntervals: {
    stockPrices: 30000, // 30 seconds
    portfolio: 60000,    // 1 minute
    notifications: 30000 // 30 seconds
  }
};

// Feature Flags
export const FEATURES = {
  portfolioManagement: true,
  carbonCredits: true,
  stockTrading: true,
  reporting: true,
  notifications: true,
  adminPanel: true,
  demoMode: true
};

// Demo Configuration
export const DEMO_CONFIG = {
  enabled: true,
  maxDemoUsers: 10,
  demoDataExpiry: 24 * 60 * 60 * 1000, // 24 hours
  mockDataRefresh: 5 * 60 * 1000 // 5 minutes
};

// Chart Configuration
export const CHART_CONFIG = {
  defaultColors: [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16'  // Lime
  ],
  defaultHeight: 400,
  animationDuration: 750,
  responsive: true
};

// Validation Rules
export const VALIDATION_RULES = {
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  stockSymbol: {
    minLength: 1,
    maxLength: 10,
    pattern: /^[A-Z]+$/
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  network: {
    connectionFailed: 'Connection failed. Please check your internet connection.',
    timeout: 'Request timed out. Please try again.',
    serverError: 'Server error. Please try again later.',
    unauthorized: 'You are not authorized to perform this action.',
    forbidden: 'Access denied. You do not have permission for this resource.',
    notFound: 'The requested resource was not found.',
    validationError: 'Please check your input and try again.'
  },
  portfolio: {
    stockNotFound: 'Stock not found in our system.',
    insufficientFunds: 'Insufficient funds for this transaction.',
    invalidQuantity: 'Invalid quantity. Please enter a positive number.',
    invalidPrice: 'Invalid price. Please enter a positive number.',
    duplicateAsset: 'This asset is already in your portfolio.'
  }
};

// Success Messages
export const SUCCESS_MESSAGES = {
  portfolio: {
    stockAdded: 'Stock added to portfolio successfully.',
    carbonCreditAdded: 'Carbon credit added to portfolio successfully.',
    assetUpdated: 'Asset updated successfully.',
    assetRemoved: 'Asset removed from portfolio successfully.'
  },
  auth: {
    loginSuccess: 'Login successful.',
    logoutSuccess: 'Logout successful.',
    registrationSuccess: 'Registration successful.',
    passwordReset: 'Password reset email sent.'
  }
};

export default {
  API_BASE_URL,
  APP_CONFIG,
  FEATURES,
  DEMO_CONFIG,
  CHART_CONFIG,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
