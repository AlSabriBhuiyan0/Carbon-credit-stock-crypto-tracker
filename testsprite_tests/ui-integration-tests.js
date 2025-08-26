const axios = require('axios');
const config = require('../testsprite.config.js');

class UIIntegrationTests {
  constructor() {
    this.baseURL = config.endpoints.frontend;
    this.apiURL = config.endpoints.backend;
    this.testResults = [];
    this.authToken = null;
  }

  async runAllTests() {
    console.log('🎨 Running UI Integration Tests...');
    
    try {
      await this.authenticate();
      await this.testStockPageAccessibility();
      await this.testAssetSelectionLogic();
      await this.testForecastDisplayLogic();
      await this.testMixedAssetForecasts();
      await this.testAssetTypeDisplay();
      
      this.printResults();
    } catch (error) {
      console.error('❌ UI Integration tests failed:', error.message);
    }
  }

  async authenticate() {
    console.log('  🔑 Authenticating for UI tests...');
    
    try {
      const loginData = {
        email: config.testData.users.admin.email,
        password: config.testData.users.admin.password
      };

      const response = await axios.post(`${this.apiURL}/api/auth/login`, loginData);
      
      if (response.status === 200 && response.data.token) {
        this.authToken = response.data.token;
        console.log('    ✅ Authentication successful');
      } else {
        console.log('    ⚠️  Authentication failed, some tests may be skipped');
      }
    } catch (error) {
      console.log('    ⚠️  Authentication failed, some tests may be skipped');
    }
  }

  async testStockPageAccessibility() {
    console.log('  📈 Testing Stock Page Accessibility...');
    
    try {
      // Test if stock page loads without errors
      const response = await axios.get(`${this.baseURL}/app/stocks`, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500; // Accept any status less than 500
        }
      });
      
      if (response.status === 200) {
        // Check if page contains stock service error
        const hasError = response.data.includes('Stock Service Unavailable') || 
                        response.data.includes('service unavailable') ||
                        response.data.includes('authentication issues');
        
        if (!hasError) {
          this.testResults.push({
            test: 'Stock Page Accessibility',
            status: 'PASS',
            details: 'Stock page loads successfully without service errors'
          });
          console.log('    ✅ Stock Page Accessibility: PASS');
        } else {
          this.testResults.push({
            test: 'Stock Page Accessibility',
            status: 'FAIL',
            details: 'Stock page shows service unavailable error'
          });
          console.log('    ❌ Stock Page Accessibility: FAIL - Service Error');
        }
      } else {
        this.testResults.push({
          test: 'Stock Page Accessibility',
          status: 'FAIL',
          details: `Stock page returned status ${response.status}`
        });
        console.log('    ❌ Stock Page Accessibility: FAIL - Status Error');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Stock Page Accessibility',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stock Page Accessibility: FAIL');
    }
  }

  async testAssetSelectionLogic() {
    console.log('  🎯 Testing Asset Selection Logic...');
    
    try {
      // Test asset selection API endpoints
      const testAssets = {
        stocks: ['AAPL', 'ADBE', 'AMD'],
        crypto: ['BTC', 'ETH', 'VETUSDT'],
        mixed: ['AAPL', 'BTC', 'AMD']
      };

      let allEndpointsWorking = true;
      let errorDetails = [];

      for (const [type, assets] of Object.entries(testAssets)) {
        try {
          const response = await axios.post(`${this.apiURL}/api/assets/select`, {
            assets: assets,
            type: type
          }, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 10000
          });

          if (response.status !== 200) {
            allEndpointsWorking = false;
            errorDetails.push(`${type} selection failed with status ${response.status}`);
          }
        } catch (error) {
          allEndpointsWorking = false;
          errorDetails.push(`${type} selection error: ${error.message}`);
        }
      }

      if (allEndpointsWorking) {
        this.testResults.push({
          test: 'Asset Selection Logic',
          status: 'PASS',
          details: 'All asset selection types (stocks, crypto, mixed) working correctly'
        });
        console.log('    ✅ Asset Selection Logic: PASS');
      } else {
        this.testResults.push({
          test: 'Asset Selection Logic',
          status: 'FAIL',
          details: `Asset selection issues: ${errorDetails.join(', ')}`
        });
        console.log('    ❌ Asset Selection Logic: FAIL');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Asset Selection Logic',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Asset Selection Logic: FAIL');
    }
  }

  async testForecastDisplayLogic() {
    console.log('  🔮 Testing Forecast Display Logic...');
    
    try {
      // Test if forecast API returns correct asset types
      const testAssets = ['AAPL', 'BTC', 'AMD'];
      
      const response = await axios.post(`${this.apiURL}/api/forecast/batch`, {
        assets: testAssets,
        model: 'simple',
        days: 1
      }, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000
      });

      if (response.status === 200) {
        const forecastData = response.data;
        
        // Check if forecasts contain asset type information
        let hasAssetTypes = true;
        let missingTypes = [];

        if (forecastData.forecasts) {
          forecastData.forecasts.forEach(forecast => {
            if (!forecast.assetType && !forecast.type) {
              hasAssetTypes = false;
              missingTypes.push(forecast.symbol || 'unknown');
            }
          });
        }

        if (hasAssetTypes) {
          this.testResults.push({
            test: 'Forecast Display Logic',
            status: 'PASS',
            details: 'Forecast API returns asset type information correctly'
          });
          console.log('    ✅ Forecast Display Logic: PASS');
        } else {
          this.testResults.push({
            test: 'Forecast Display Logic',
            status: 'FAIL',
            details: `Missing asset types for: ${missingTypes.join(', ')}`
          });
          console.log('    ❌ Forecast Display Logic: FAIL - Missing Asset Types');
        }
      } else {
        this.testResults.push({
          test: 'Forecast Display Logic',
          status: 'FAIL',
          details: `Forecast API returned status ${response.status}`
        });
        console.log('    ❌ Forecast Display Logic: FAIL - API Error');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Forecast Display Logic',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Forecast Display Logic: FAIL');
    }
  }

  async testMixedAssetForecasts() {
    console.log('  🔀 Testing Mixed Asset Forecasts...');
    
    try {
      // Test mixed asset selection (2 stocks + 1 crypto)
      const mixedAssets = ['AAPL', 'AMD', 'BTC'];
      
      const response = await axios.post(`${this.apiURL}/api/forecast/mixed`, {
        assets: mixedAssets,
        models: ['simple', 'prophet', 'arima'],
        days: 1
      }, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 20000
      });

      if (response.status === 200) {
        const forecastData = response.data;
        
        // Verify mixed assets are handled correctly
        let correctAssetTypes = true;
        let assetTypeErrors = [];

        if (forecastData.forecasts) {
          forecastData.forecasts.forEach(forecast => {
            const symbol = forecast.symbol;
            const assetType = forecast.assetType || forecast.type;
            
            if (symbol === 'AAPL' || symbol === 'AMD') {
              if (assetType !== 'stock' && assetType !== 'Stock') {
                correctAssetTypes = false;
                assetTypeErrors.push(`${symbol} should be stock, got ${assetType}`);
              }
            } else if (symbol === 'BTC') {
              if (assetType !== 'crypto' && assetType !== 'Crypto') {
                correctAssetTypes = false;
                assetTypeErrors.push(`${symbol} should be crypto, got ${assetType}`);
              }
            }
          });
        }

        if (correctAssetTypes) {
          this.testResults.push({
            test: 'Mixed Asset Forecasts',
            status: 'PASS',
            details: 'Mixed asset forecasts correctly identify asset types'
          });
          console.log('    ✅ Mixed Asset Forecasts: PASS');
        } else {
          this.testResults.push({
            test: 'Mixed Asset Forecasts',
            status: 'FAIL',
            details: `Asset type mismatches: ${assetTypeErrors.join(', ')}`
          });
          console.log('    ❌ Mixed Asset Forecasts: FAIL - Type Mismatches');
        }
      } else {
        this.testResults.push({
          test: 'Mixed Asset Forecasts',
          status: 'FAIL',
          details: `Mixed forecast API returned status ${response.status}`
        });
        console.log('    ❌ Mixed Asset Forecasts: FAIL - API Error');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Mixed Asset Forecasts',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Mixed Asset Forecasts: FAIL');
    }
  }

  async testAssetTypeDisplay() {
    console.log('  🏷️  Testing Asset Type Display...');
    
    try {
      // Test if UI correctly displays asset type labels
      const response = await axios.get(`${this.baseURL}/app/forecasts`, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      if (response.status === 200) {
        const pageContent = response.data;
        
        // Check for unified forecast section
        const hasUnifiedSection = pageContent.includes('Asset Forecasts') || 
                                 pageContent.includes('asset forecasts') ||
                                 pageContent.includes('unified forecasts');
        
        // Check for separate sections (should not exist)
        const hasSeparateSections = pageContent.includes('Stock Market Forecasts') && 
                                   pageContent.includes('Crypto Forecasts');
        
        // Check for asset type indicators
        const hasAssetTypeLabels = pageContent.includes('Stock') || 
                                  pageContent.includes('Crypto') ||
                                  pageContent.includes('stock') ||
                                  pageContent.includes('crypto');

        if (hasUnifiedSection && !hasSeparateSections && hasAssetTypeLabels) {
          this.testResults.push({
            test: 'Asset Type Display',
            status: 'PASS',
            details: 'UI shows unified forecast section with proper asset type labels'
          });
          console.log('    ✅ Asset Type Display: PASS');
        } else {
          let issues = [];
          if (!hasUnifiedSection) issues.push('No unified forecast section');
          if (hasSeparateSections) issues.push('Still has separate sections');
          if (!hasAssetTypeLabels) issues.push('Missing asset type labels');
          
          this.testResults.push({
            test: 'Asset Type Display',
            status: 'FAIL',
            details: `UI display issues: ${issues.join(', ')}`
          });
          console.log('    ❌ Asset Type Display: FAIL - UI Issues');
        }
      } else {
        this.testResults.push({
          test: 'Asset Type Display',
          status: 'FAIL',
          details: `Forecast page returned status ${response.status}`
        });
        console.log('    ❌ Asset Type Display: FAIL - Page Error');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Asset Type Display',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Asset Type Display: FAIL');
    }
  }

  printResults() {
    console.log('\n📊 UI Integration Test Results:');
    console.log('='.repeat(40));
    
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`    ${result.details}`);
      }
    });
  }
}

// Run tests if called directly
if (require.main === module) {
  const uiTests = new UIIntegrationTests();
  uiTests.runAllTests();
}

module.exports = UIIntegrationTests;
