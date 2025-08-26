const axios = require('axios');
const config = require('../testsprite.config.js');

class APITests {
  constructor() {
    this.baseURL = config.endpoints.backend;
    this.testResults = [];
    this.authToken = null;
  }

  async runAllTests() {
    console.log('🌐 Running API Endpoint Tests...');
    
    try {
      // First authenticate to get token
      await this.authenticate();
      
      // Run API tests
      await this.testStocksAPI();
      await this.testCryptoAPI();
      await this.testCarbonCreditsAPI();
      await this.testDashboardAPI();
      await this.testPortfolioAPI();
      await this.testForecastingAPI();
      
      this.printResults();
    } catch (error) {
      console.error('❌ API tests failed:', error.message);
    }
  }

  async authenticate() {
    console.log('  🔑 Authenticating for API tests...');
    
    try {
      const loginData = {
        email: config.testData.users.admin.email,
        password: config.testData.users.admin.password
      };

      const response = await axios.post(`${this.baseURL}/api/auth/login`, loginData);
      
      if (response.status === 200 && response.data.token) {
        this.authToken = response.data.token;
        console.log('    ✅ Authentication successful');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.log('    ⚠️  Authentication failed, some tests may be skipped');
    }
  }

  async testStocksAPI() {
    console.log('  📈 Testing Stocks API...');
    
    try {
      // Test get stocks list
      const stocksResponse = await axios.get(`${this.baseURL}/api/stocks`);
      
      if (stocksResponse.status === 200) {
        this.testResults.push({
          test: 'Stocks List API',
          status: 'PASS',
          details: 'Stocks list retrieved successfully'
        });
        console.log('    ✅ Stocks List API: PASS');
      } else {
        throw new Error(`Unexpected status: ${stocksResponse.status}`);
      }

      // Test get specific stock data
      const stockSymbol = config.testData.stocks[0];
      const stockDataResponse = await axios.get(`${this.baseURL}/api/stocks/${stockSymbol}`);
      
      if (stockDataResponse.status === 200) {
        this.testResults.push({
          test: 'Stock Data API',
          status: 'PASS',
          details: `Stock data for ${stockSymbol} retrieved successfully`
        });
        console.log('    ✅ Stock Data API: PASS');
      } else {
        throw new Error(`Unexpected status: ${stockDataResponse.status}`);
      }

    } catch (error) {
      this.testResults.push({
        test: 'Stocks API',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stocks API: FAIL');
    }
  }

  async testCryptoAPI() {
    console.log('  🪙 Testing Crypto API...');
    
    try {
      // Test get crypto list
      const cryptoResponse = await axios.get(`${this.baseURL}/api/crypto`);
      
      if (cryptoResponse.status === 200) {
        this.testResults.push({
          test: 'Crypto List API',
          status: 'PASS',
          details: 'Crypto list retrieved successfully'
        });
        console.log('    ✅ Crypto List API: PASS');
      } else {
        throw new Error(`Unexpected status: ${cryptoResponse.status}`);
      }

      // Test get specific crypto data
      const cryptoSymbol = config.testData.crypto[0];
      const cryptoDataResponse = await axios.get(`${this.baseURL}/api/crypto/${cryptoSymbol}`);
      
      if (cryptoDataResponse.status === 200) {
        this.testResults.push({
          test: 'Crypto Data API',
          status: 'PASS',
          details: `Crypto data for ${cryptoSymbol} retrieved successfully`
        });
        console.log('    ✅ Crypto Data API: PASS');
      } else {
        throw new Error(`Unexpected status: ${cryptoDataResponse.status}`);
      }

    } catch (error) {
      this.testResults.push({
        test: 'Crypto API',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Crypto API: FAIL');
    }
  }

  async testCarbonCreditsAPI() {
    console.log('  🌱 Testing Carbon Credits API...');
    
    try {
      // Test get carbon projects list
      const carbonResponse = await axios.get(`${this.baseURL}/api/carbon/projects`);
      
      if (carbonResponse.status === 200) {
        this.testResults.push({
          test: 'Carbon Projects API',
          status: 'PASS',
          details: 'Carbon projects list retrieved successfully'
        });
        console.log('    ✅ Carbon Projects API: PASS');
      } else {
        throw new Error(`Unexpected status: ${carbonResponse.status}`);
      }

      // Test get carbon credits data
      const carbonCreditsResponse = await axios.get(`${this.baseURL}/api/carbon/credits`);
      
      if (carbonCreditsResponse.status === 200) {
        this.testResults.push({
          test: 'Carbon Credits API',
          status: 'PASS',
          details: 'Carbon credits data retrieved successfully'
        });
        console.log('    ✅ Carbon Credits API: PASS');
      } else {
        throw new Error(`Unexpected status: ${carbonCreditsResponse.status}`);
      }

    } catch (error) {
      this.testResults.push({
        test: 'Carbon Credits API',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Carbon Credits API: FAIL');
    }
  }

  async testDashboardAPI() {
    console.log('  📊 Testing Dashboard API...');
    
    if (!this.authToken) {
      this.testResults.push({
        test: 'Dashboard API',
        status: 'SKIP',
        details: 'No auth token available'
      });
      console.log('    ⚠️  Dashboard API: SKIP (no token)');
      return;
    }

    try {
      const dashboardResponse = await axios.get(`${this.baseURL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (dashboardResponse.status === 200) {
        this.testResults.push({
          test: 'Dashboard API',
          status: 'PASS',
          details: 'Dashboard data retrieved successfully'
        });
        console.log('    ✅ Dashboard API: PASS');
      } else {
        throw new Error(`Unexpected status: ${dashboardResponse.status}`);
      }

    } catch (error) {
      this.testResults.push({
        test: 'Dashboard API',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Dashboard API: FAIL');
    }
  }

  async testPortfolioAPI() {
    console.log('  💼 Testing Portfolio API...');
    
    if (!this.authToken) {
      this.testResults.push({
        test: 'Portfolio API',
        status: 'SKIP',
        details: 'No auth token available'
      });
      console.log('    ⚠️  Portfolio API: SKIP (no token)');
      return;
    }

    try {
      const portfolioResponse = await axios.get(`${this.baseURL}/api/portfolios`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (portfolioResponse.status === 200) {
        this.testResults.push({
          test: 'Portfolio API',
          status: 'PASS',
          details: 'Portfolio data retrieved successfully'
        });
        console.log('    ✅ Portfolio API: PASS');
      } else {
        throw new Error(`Unexpected status: ${portfolioResponse.status}`);
      }

    } catch (error) {
      this.testResults.push({
        test: 'Portfolio API',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Portfolio API: FAIL');
    }
  }

  async testForecastingAPI() {
    console.log('  🔮 Testing Forecasting API...');
    
    try {
      // Test Prophet forecasting
      const prophetResponse = await axios.post(`${this.baseURL}/api/forecast/prophet`, {
        symbol: 'AAPL',
        days: 7
      });
      
      if (prophetResponse.status === 200) {
        this.testResults.push({
          test: 'Prophet Forecasting API',
          status: 'PASS',
          details: 'Prophet forecasting completed successfully'
        });
        console.log('    ✅ Prophet Forecasting API: PASS');
      } else {
        throw new Error(`Unexpected status: ${prophetResponse.status}`);
      }

      // Test ARIMA forecasting
      const arimaResponse = await axios.post(`${this.baseURL}/api/forecast/arima`, {
        symbol: 'BTC',
        days: 7
      });
      
      if (arimaResponse.status === 200) {
        this.testResults.push({
          test: 'ARIMA Forecasting API',
          status: 'PASS',
          details: 'ARIMA forecasting completed successfully'
        });
        console.log('    ✅ ARIMA Forecasting API: PASS');
      } else {
        throw new Error(`Unexpected status: ${arimaResponse.status}`);
      }

    } catch (error) {
      this.testResults.push({
        test: 'Forecasting API',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Forecasting API: FAIL');
    }
  }

  printResults() {
    console.log('\n📊 API Test Results:');
    console.log('='.repeat(40));
    
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Skipped: ${skipped} ⚠️`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`    ${result.details}`);
      }
    });
  }
}

// Run tests if called directly
if (require.main === module) {
  const apiTests = new APITests();
  apiTests.runAllTests();
}

module.exports = APITests;
