/**
 * Utility functions for generating realistic time series data
 * based on selected time ranges
 */

/**
 * Generate time series data points based on time range
 * @param {string} timeRange - Time range ('1D', '1W', '1M', '3M', '1Y')
 * @param {number} dataPoints - Number of data points to generate
 * @param {Function} valueGenerator - Function to generate values for each point
 * @returns {Array} Array of data points with timestamps
 */
export const generateTimeSeriesData = (timeRange, dataPoints, valueGenerator) => {
  const now = new Date();
  const data = [];
  
  let intervalMs;
  let startDate;
  
  switch (timeRange) {
    case '1D':
      intervalMs = 24 * 60 * 60 * 1000 / dataPoints; // 1 day divided into dataPoints
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '1W':
      intervalMs = 7 * 24 * 60 * 60 * 1000 / dataPoints; // 1 week divided into dataPoints
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '1M':
      intervalMs = 30 * 24 * 60 * 60 * 1000 / dataPoints; // 1 month divided into dataPoints
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3M':
      intervalMs = 90 * 24 * 60 * 60 * 1000 / dataPoints; // 3 months divided into dataPoints
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1Y':
      intervalMs = 365 * 24 * 60 * 60 * 1000 / dataPoints; // 1 year divided into dataPoints
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      intervalMs = 7 * 24 * 60 * 60 * 1000 / dataPoints; // Default to 1 week
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(startDate.getTime() + (i * intervalMs));
    const values = valueGenerator(i, timestamp, data);
    data.push({
      timestamp,
      ...values
    });
  }
  
  return data;
};

/**
 * Generate realistic stock price data with trends and volatility
 * @param {string} timeRange - Time range
 * @param {number} basePrice - Base price
 * @param {number} volatility - Price volatility (0-1)
 * @param {number} trend - Price trend (-1 to 1, negative = down, positive = up)
 * @returns {Array} Array of stock data points
 */
export const generateStockData = (timeRange, basePrice = 100, volatility = 0.1, trend = 0) => {
  const dataPoints = timeRange === '1D' ? 24 : timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : 90;
  
  return generateTimeSeriesData(timeRange, dataPoints, (index, timestamp, existingData) => {
    let price = basePrice;
    
    // Apply trend
    const trendFactor = 1 + (trend * 0.001 * index);
    price *= trendFactor;
    
    // Apply volatility
    const volatilityFactor = 1 + ((Math.random() - 0.5) * volatility * 2);
    price *= volatilityFactor;
    
    // Ensure price doesn't go negative
    price = Math.max(0.01, price);
    
    // Generate volume based on price movement
    const baseVolume = 1000000;
    const volumeVariation = Math.random() * 0.5 + 0.75; // 75% to 125% of base
    const volume = Math.floor(baseVolume * volumeVariation);
    
    return {
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(volume)
    };
  });
};

/**
 * Generate realistic carbon credit data
 * @param {string} timeRange - Time range
 * @param {number} basePrice - Base credit price
 * @param {number} baseCredits - Base credits issued
 * @returns {Array} Array of carbon credit data points
 */
export const generateCarbonCreditData = (timeRange, basePrice = 15, baseCredits = 50000) => {
  const dataPoints = timeRange === '1D' ? 24 : timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : 90;
  
  return generateTimeSeriesData(timeRange, dataPoints, (index, timestamp, existingData) => {
    // Generate realistic price progression
    const priceVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
    const price = basePrice * (1 + priceVariation);
    
    // Generate realistic credits progression
    const creditsVariation = (Math.random() - 0.5) * 0.3; // ±15% variation
    const credits_issued = baseCredits * (1 + creditsVariation);
    
    return {
      price: parseFloat(price.toFixed(2)),
      credits_issued: Math.floor(credits_issued)
    };
  });
};

/**
 * Generate portfolio performance data
 * @param {string} timeRange - Time range
 * @param {number} baseReturn - Base return percentage
 * @returns {Array} Array of performance data points
 */
export const generatePortfolioData = (timeRange, baseReturn = 5) => {
  const dataPoints = timeRange === '1D' ? 24 : timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : 90;
  
  return generateTimeSeriesData(timeRange, dataPoints, (index, timestamp, existingData) => {
    // Generate realistic return progression
    const returnVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
    const returnValue = baseReturn * (1 + returnVariation);
    
    return {
      price: parseFloat(returnValue.toFixed(2)),
      volume: 1000 // Fixed volume for portfolio charts
    };
  });
};

/**
 * Format timestamp for chart labels based on time range
 * @param {Date} timestamp - Timestamp to format
 * @param {string} timeRange - Time range
 * @returns {string} Formatted timestamp string
 */
export const formatChartTimestamp = (timestamp, timeRange) => {
  switch (timeRange) {
    case '1D':
      return timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    case '1W':
      return timestamp.toLocaleDateString('en-US', { 
        weekday: 'short' 
      });
    case '1M':
    case '3M':
      return timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    case '1Y':
      return timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      });
    default:
      return timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
  }
};
