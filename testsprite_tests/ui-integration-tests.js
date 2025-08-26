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
      // Test if stock API endpoints are working (frontend depends on these)
      const stockResponse = await axios.get(`${this.apiURL}/api/stocks`, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000
      });
      
      if (stockResponse.status === 200) {
        this.testResults.push({
          test: 'Stock Page Accessibility',
          status: 'PASS',
          details: 'Stock API endpoints working - frontend can access stock data'
        });
        console.log('    ✅ Stock Page Accessibility: PASS');
      } else {
        this.testResults.push({
          test: 'Stock Page Accessibility',
          status: 'FAIL',
          details: `Stock API returned status ${stockResponse.status}`
        });
        console.log('    ❌ Stock Page Accessibility: FAIL - API Error');
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
          const response = await axios.post(`${this.apiURL}/api/assets/validate-mixed`, {
            assets: assets,
            maxAssets: 3
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
      
      const response = await axios.post(`${this.apiURL}/api/forecast/categorize`, {
        assets: testAssets
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
        horizon: 1
      }, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 20000
      });

      if (response.status === 200) {
        const forecastData = response.data;
        
        // Verify mixed assets are handled correctly
        let correctAssetTypes = true;
        let assetTypeErrors = [];

        if (forecastData.forecasts && forecastData.categorized) {
          // Check stocks
          if (forecastData.categorized.stocks) {
            if (!forecastData.categorized.stocks.includes('AAPL') || !forecastData.categorized.stocks.includes('AMD')) {
              correctAssetTypes = false;
              assetTypeErrors.push('AAPL and AMD should be in stocks array');
            }
          }
          
          // Check crypto
          if (forecastData.categorized.crypto) {
            if (!forecastData.categorized.crypto.includes('BTC')) {
              correctAssetTypes = false;
              assetTypeErrors.push('BTC should be in crypto array');
            }
          }
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
      // Test if asset type detection API is working correctly
      const testAssets = ['AAPL', 'BTC', 'AMD'];
      let allTestsPassed = true;
      const errors = [];
      
      for (const asset of testAssets) {
        try {
          const response = await axios.get(`${this.apiURL}/api/assets/${asset}/type`, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 15000
          });
          
          if (response.status !== 200) {
            allTestsPassed = false;
            errors.push(`${asset}: API returned status ${response.status}`);
          } else if (!response.data.type) {
            allTestsPassed = false;
            errors.push(`${asset}: No type returned`);
          } else {
            // Verify correct asset type
            const expectedType = ['AAPL', 'AMD'].includes(asset) ? 'stock' : 'crypto';
            if (response.data.type !== expectedType) {
              allTestsPassed = false;
              errors.push(`${asset}: Expected ${expectedType}, got ${response.data.type}`);
            }
          }
        } catch (error) {
          allTestsPassed = false;
          errors.push(`${asset}: ${error.message}`);
        }
      }
      
      if (allTestsPassed) {
        this.testResults.push({
          test: 'Asset Type Display',
          status: 'PASS',
          details: 'Asset type detection working correctly for all assets'
        });
        console.log('    ✅ Asset Type Display: PASS');
      } else {
        this.testResults.push({
          test: 'Asset Type Display',
          status: 'FAIL',
          details: `Asset type detection issues: ${errors.join(', ')}`
        });
        console.log('    ❌ Asset Type Display: FAIL');
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
