const axios = require('axios');

class DataIngestionService {
  constructor() {
    this.ceicApiKey = process.env.CEIC_API_KEY;
    this.dseApiKey = process.env.DSE_API_KEY;
    this.yahooFinanceApiKey = process.env.YAHOO_FINANCE_API_KEY;
    this.unOffsetApiKey = process.env.UN_OFFSET_PLATFORM_API_KEY;
    this.goldStandardApiKey = process.env.GOLD_STANDARD_API_KEY;
    this.unfcccApiKey = process.env.UNFCCC_DI_API_KEY;
    
    this.apis = {
      ceic: 'https://api.ceicdata.com/v1',
      dse: 'https://www.dsebd.org/api',
      yahoo: 'https://query1.finance.yahoo.com/v8/finance',
      unOffset: 'https://offset.climateactiondata.org/api',
      goldStandard: 'https://www.goldstandard.org/api',
      unfccc: 'https://di.unfccc.int/api'
    };

    // Default list of symbols to ingest
    this.DEFAULT_STOCK_SYMBOLS = [
      'AAPL','AMZN','MSFT','GOOGL','TSLA','META','NVDA','NFLX','AMD','INTC',
      'ORCL','IBM','BA','JPM','BAC','WMT','T','VZ','PFE','JNJ',
      'V','MA','KO','PEP','NKE','DIS','ADBE','CRM','UBER','SQ'
    ];

    // Initialize UNFCCC service if available
    this.unfcccService = null;
    this.initializeUNFCCCService();
  }

  async initializeUNFCCCService() {
    try {
      const unfcccService = require('./unfcccNodeService');
      this.unfcccService = unfcccService;
      console.log('UNFCCC service initialized successfully');
    } catch (error) {
      console.warn('UNFCCC service not available:', error.message);
      this.unfcccService = null;
    }
  }

  async ingestStockData(symbols = this.DEFAULT_STOCK_SYMBOLS) {
    try {
      console.log(`Starting stock data ingestion for ${symbols.length} symbols`);
      
      const stockData = [];
      
      for (const symbol of symbols) {
        try {
          const yahooData = await this.getYahooFinanceData(symbol);
          if (yahooData) {
            stockData.push(yahooData);
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error.message);
        }
      }
      
      console.log(`Stock data ingestion completed. Processed ${stockData.length} symbols`);
      return stockData;
      
    } catch (error) {
      console.error('Stock data ingestion failed:', error);
      throw error;
    }
  }

  async getYahooFinanceData(symbol) {
    try {
      const response = await axios.get(`${this.apis.yahoo}/chart/${symbol}`, {
        params: {
          interval: '1d',
          range: '1mo',
          includePrePost: false,
          events: 'div,split'
        }
      });

      return this.transformYahooFinanceData(response.data, symbol);
    } catch (error) {
      console.error(`Yahoo Finance API error for ${symbol}:`, error.message);
      return null;
    }
  }

  async ingestCarbonCreditData() {
    try {
      console.log('Starting carbon credit data ingestion');
      
      let carbonData = [];
      
      // Try to get real data from UNFCCC API first
      if (this.unfcccService && this.unfcccService.isAvailable) {
        try {
          console.log('Attempting to fetch UNFCCC emissions data...');
          const unfcccData = await this.getUNFCCCCarbonData();
          if (unfcccData && unfcccData.length > 0) {
            carbonData = unfcccData;
            console.log(`Successfully fetched ${carbonData.length} records from UNFCCC API`);
          }
        } catch (error) {
          console.warn('UNFCCC API failed, falling back to mock data:', error.message);
        }
      }
      
      // Fall back to mock data if no real data available
      if (carbonData.length === 0) {
        console.log('Using mock carbon credit data');
        carbonData = this.generateMockCarbonData();
      }
      
      console.log(`Carbon credit data ingestion completed. Processed ${carbonData.length} projects`);
      return carbonData;
      
    } catch (error) {
      console.error('Carbon credit data ingestion failed:', error);
      throw error;
    }
  }

  async getUNFCCCCarbonData() {
    try {
      if (!this.unfcccService) {
        throw new Error('UNFCCC service not available');
      }

      // Get carbon credit market data from UNFCCC
      const marketData = await this.unfcccService.getCarbonCreditMarketData();
      
      if (marketData.error) {
        throw new Error(marketData.error);
      }

      // Transform UNFCCC data into carbon credit format
      const carbonProjects = this.transformUNFCCCDataToCarbonCredits(marketData);
      
      return carbonProjects;
      
    } catch (error) {
      console.error('Failed to get UNFCCC carbon data:', error);
      throw error;
    }
  }

  transformUNFCCCDataToCarbonCredits(unfcccData) {
    try {
      const carbonProjects = [];
      
      if (unfcccData.co2_emissions) {
        // Process CO2 emissions data for each country
        for (const [countryCode, countryData] of Object.entries(unfcccData.co2_emissions)) {
          if (countryData.data && countryData.data.length > 0) {
            // Create carbon credit projects based on emissions data
            const project = this.createCarbonProjectFromEmissions(countryCode, countryData);
            if (project) {
              carbonProjects.push(project);
            }
          }
        }
      }

      // Add some additional mock projects if we don't have enough real data
      if (carbonProjects.length < 10) {
        const additionalProjects = this.generateMockCarbonData().slice(0, 10 - carbonProjects.length);
        carbonProjects.push(...additionalProjects);
      }

      return carbonProjects;
      
    } catch (error) {
      console.error('Failed to transform UNFCCC data:', error);
      return this.generateMockCarbonData();
    }
  }

  createCarbonProjectFromEmissions(countryCode, countryData) {
    try {
      if (!countryData.data || countryData.data.length === 0) {
        return null;
      }

      // Get the most recent emissions data
      const recentData = countryData.data
        .filter(item => item.year && item.value)
        .sort((a, b) => b.year - a.year)[0];

      if (!recentData) {
        return null;
      }

      // Calculate carbon credits based on emissions reduction potential
      let emissionsValue = parseFloat(recentData.value) || 0;
      
      // Validate and limit emissions value to prevent extremely large numbers
      // Most emissions data should be in reasonable ranges (thousands to millions)
      if (emissionsValue > 1000000000) { // If greater than 1 billion
        console.warn(`Emissions value too large for ${countryCode}: ${emissionsValue}, limiting to 1 billion`);
        emissionsValue = 1000000000;
      }
      
      // Ensure emissions value is positive and reasonable
      if (emissionsValue <= 0 || isNaN(emissionsValue)) {
        emissionsValue = 100000; // Default to 100k if invalid
      }
      
      // Calculate reduction potential with strict limits
      const reductionPotential = Math.min(
        Math.max(emissionsValue * 0.01, 1000), // 1% reduction, minimum 1k
        100000 // Maximum 100k credits per project
      );
      
      const projectTypes = ['Renewable Energy', 'Energy Efficiency', 'Forest Conservation', 'Clean Technology'];
      const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
      
      return {
        projectId: `UNFCCC-${countryCode}-${Date.now()}`,
        name: `${countryCode} Emissions Reduction Project`,
        type: projectType,
        location: this.getCountryName(countryCode),
        standard: 'UNFCCC Verified',
        status: 'active',
        creditsIssued: Math.floor(reductionPotential),
        creditsRetired: Math.floor(reductionPotential * 0.3),
        price: (Math.random() * 15 + 8).toFixed(2),
        verificationDate: new Date(),
        source: 'UNFCCC API',
        timestamp: new Date(),
        emissionsData: {
          country: countryCode,
          year: recentData.year,
          value: emissionsValue, // Use the validated value
          unit: recentData.unit || 'kt CO2 equivalent'
        }
      };
      
    } catch (error) {
      console.error(`Failed to create carbon project for ${countryCode}:`, error);
      return null;
    }
  }

  getCountryName(countryCode) {
    const countryNames = {
      'USA': 'United States',
      'GBR': 'United Kingdom',
      'DEU': 'Germany',
      'FRA': 'France',
      'JPN': 'Japan',
      'CAN': 'Canada',
      'AUS': 'Australia',
      'BRA': 'Brazil',
      'IND': 'India',
      'CHN': 'China'
    };
    
    return countryNames[countryCode] || countryCode;
  }

  generateMockCarbonData() {
    const projectTypes = ['Renewable Energy', 'Forest Conservation', 'Clean Cookstoves', 'Solar Power', 'Wind Energy'];
    const countries = ['Kenya', 'India', 'Brazil', 'China', 'Uganda', 'Tanzania', 'Ghana', 'Peru'];
    const standards = ['Gold Standard', 'Verified Carbon Standard', 'Clean Development Mechanism'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      projectId: `PROJ-${String(i + 1).padStart(4, '0')}`,
      name: `${projectTypes[i % projectTypes.length]} Project ${i + 1}`,
      type: projectTypes[i % projectTypes.length],
      location: countries[i % countries.length],
      standard: standards[i % standards.length],
      status: 'active',
      creditsIssued: Math.floor(Math.random() * 100000) + 10000,
      creditsRetired: Math.floor(Math.random() * 50000) + 5000,
      price: (Math.random() * 20 + 5).toFixed(2),
      verificationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      source: 'Mock Data',
      timestamp: new Date()
    }));
  }

  transformYahooFinanceData(data, symbol) {
    if (!data || !data.chart || !data.chart.result) return null;
    
    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const timestamp = result.timestamp[result.timestamp.length - 1];
    const close = quote.close[quote.close.length - 1];
    const open = quote.open[0];
    
    return {
      symbol,
      source: 'Yahoo Finance',
      timestamp: new Date(timestamp * 1000),
      price: close,
      volume: quote.volume[quote.volume.length - 1],
      change: close - open,
      changePercent: ((close - open) / open) * 100,
      high: Math.max(...quote.high.filter(h => h !== null)),
      low: Math.min(...quote.low.filter(l => l !== null)),
      open: open
    };
  }

  async getYahooFinanceHistory(symbol, range = '1mo', interval = '1d') {
    try {
      const response = await axios.get(`${this.apis.yahoo}/chart/${symbol}`, {
        params: { interval, range, includePrePost: false, events: 'div,split' }
      });
      const data = response.data?.chart?.result?.[0];
      if (!data) return null;
      const { timestamp = [], indicators = {} } = data;
      const quote = indicators.quote?.[0] || {};
      const opens = quote.open || [];
      const highs = quote.high || [];
      const lows = quote.low || [];
      const closes = quote.close || [];
      const volumes = quote.volume || [];

      const rows = [];
      for (let i = 0; i < timestamp.length; i++) {
        if (closes[i] == null) continue;
        const open = opens[i] ?? closes[i];
        const close = closes[i];
        const prev = i > 0 && closes[i - 1] != null ? closes[i - 1] : open;
        const change = close - prev;
        const changePercent = prev ? (change / prev) * 100 : 0;
        rows.push({
          timestamp: new Date(timestamp[i] * 1000),
          open,
          high: highs[i] ?? close,
          low: lows[i] ?? close,
          close,
          price: close,
          volume: volumes[i] ?? 0,
          change,
          changePercent
        });
      }
      return rows;
    } catch (error) {
      console.error(`Yahoo Finance history error for ${symbol}:`, error.message);
      return [];
    }
  }

  async ingestStockHistory(symbols = this.DEFAULT_STOCK_SYMBOLS, range = '1mo', interval = '1d', storeLatestSummary = false) {
    const results = [];
    for (const symbol of symbols) {
      const rows = await this.getYahooFinanceHistory(symbol, range, interval);
      results.push({ symbol, count: rows.length });
      for (const row of rows) {
        try {
          await this.addHistoricalPrice(symbol, row);
        } catch (e) {
          // ignore duplicates per timestamp
        }
      }
      if (storeLatestSummary && rows.length) {
        const last = rows[rows.length - 1];
        try {
          await this.addLatestSummary(symbol, last);
        } catch (_) {}
      }
    }
    console.log(`Inserted historical rows:`, results);
    return results;
  }

  async addHistoricalPrice(symbol, row) {
    const StockPostgreSQL = require('../models/StockPostgreSQL');
    return StockPostgreSQL.addPriceWithTimestamp(symbol, {
      price: row.price,
      volume: row.volume,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      change: row.change,
      changePercent: row.changePercent,
      timestamp: row.timestamp,
    });
  }

  async addLatestSummary(symbol, row) {
    const StockPostgreSQL = require('../models/StockPostgreSQL');
    return StockPostgreSQL.addPrice(symbol, row);
  }

  isMarketOpen() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (day < 1 || day > 5) return false;
    
    const marketOpen = 9 * 60 + 30;
    const marketClose = 16 * 60;
    const currentTime = hour * 60 + minute;
    
    return currentTime >= marketOpen && currentTime <= marketClose;
  }
}

module.exports = new DataIngestionService();
