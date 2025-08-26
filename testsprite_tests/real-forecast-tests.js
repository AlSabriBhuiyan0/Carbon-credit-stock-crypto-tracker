const axios = require('axios');
const config = require('../testsprite.config.js');

class RealForecastTests {
  constructor() {
    this.baseURL = config.endpoints.backend;
    this.frontendURL = config.endpoints.frontend;
    this.testResults = [];
    this.authToken = null;
    this.userId = null;
    this.userPortfolio = null;
  }

  async runAllTests() {
    console.log('🌐 Running Real Forecast Integration Tests...');
    
    try {
      await this.authenticate();
      await this.testUserPortfolioAccess();
      await this.testRealDataIntegration();
      await this.testUserSpecificForecasts();
      await this.testDownloadFunctionality();
      await this.testRealTimeDataFetching();
      
      this.printResults();
      this.generateFixRecommendations();
    } catch (error) {
      console.error('❌ Real forecast tests failed:', error.message);
    }
  }

  async authenticate() {
    console.log('  🔑 Authenticating for real forecast tests...');
    
    try {
      const loginData = {
        email: config.testData.users.admin.email,
        password: config.testData.users.admin.password
      };

      const response = await axios.post(`${this.baseURL}/api/auth/login`, loginData);
      
      if (response.status === 200 && response.data.token) {
        this.authToken = response.data.token;
        this.userId = response.data.user.id;
        console.log('    ✅ Authentication successful');
        console.log(`    👤 User ID: ${this.userId}`);
      } else {
        console.log('    ⚠️  Authentication failed, some tests may be skipped');
      }
    } catch (error) {
      console.log('    ⚠️  Authentication failed, some tests may be skipped');
    }
  }

  async testUserPortfolioAccess() {
    console.log('  💼 Testing User Portfolio Access...');
    
    try {
      if (!this.authToken) {
        this.testResults.push({
          test: 'User Portfolio Access',
          status: 'SKIP',
          details: 'Authentication required'
        });
        console.log('    ⏭️  User Portfolio Access: SKIP');
        return;
      }

      const response = await axios.get(`${this.baseURL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 15000
      });
      
      if (response.status === 200) {
        this.userPortfolio = response.data;
        const hasAssets = this.userPortfolio.assets && this.userPortfolio.assets.length > 0;
        
        if (hasAssets) {
          this.testResults.push({
            test: 'User Portfolio Access',
            status: 'PASS',
            details: `Portfolio loaded with ${this.userPortfolio.assets.length} assets`
          });
          console.log('    ✅ User Portfolio Access: PASS');
        } else {
          this.testResults.push({
            test: 'User Portfolio Access',
            status: 'FAIL',
            details: 'Portfolio loaded but no assets found'
          });
          console.log('    ❌ User Portfolio Access: FAIL - No Assets');
        }
      } else {
        this.testResults.push({
          test: 'User Portfolio Access',
          status: 'FAIL',
          details: `API returned status ${response.status}`
        });
        console.log('    ❌ User Portfolio Access: FAIL - API Error');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        this.testResults.push({
          test: 'User Portfolio Access',
          status: 'FAIL',
          details: 'Portfolio endpoint not implemented (404)'
        });
        console.log('    ❌ User Portfolio Access: FAIL - Endpoint Missing');
      } else {
        this.testResults.push({
          test: 'User Portfolio Access',
          status: 'FAIL',
          details: error.message
        });
        console.log('    ❌ User Portfolio Access: FAIL');
      }
    }
  }

  async testRealDataIntegration() {
    console.log('  📊 Testing Real Data Integration...');
    
    try {
      // Test if we can fetch real stock data
      const stockResponse = await axios.get(`${this.baseURL}/api/stocks/list`, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000
      });
      
      // Test if we can fetch real crypto data
      const cryptoResponse = await axios.get(`${this.baseURL}/api/crypto/list`, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000
      });
      
      let realDataWorking = true;
      const errors = [];
      
      if (stockResponse.status === 200) {
        const stockData = stockResponse.data;
        if (stockData.stocks && stockData.stocks.length > 0) {
          const hasRealPrices = stockData.stocks.some(stock => 
            stock.price && stock.price > 0 && stock.lastUpdated
          );
          if (!hasRealPrices) {
            realDataWorking = false;
            errors.push('Stock data missing real prices or timestamps');
          }
        } else {
          realDataWorking = false;
          errors.push('No stock data returned');
        }
      } else {
        realDataWorking = false;
        errors.push(`Stock API returned status ${stockResponse.status}`);
      }
      
      if (cryptoResponse.status === 200) {
        const cryptoData = cryptoResponse.data;
        if (cryptoData.cryptos && cryptoData.cryptos.length > 0) {
          const hasRealPrices = cryptoData.cryptos.some(crypto => 
            crypto.price && crypto.price > 0 && crypto.lastUpdated
          );
          if (!hasRealPrices) {
            realDataWorking = false;
            errors.push('Crypto data missing real prices or timestamps');
          }
        } else {
          realDataWorking = false;
          errors.push('No crypto data returned');
        }
      } else {
        realDataWorking = false;
        errors.push(`Crypto API returned status ${cryptoResponse.status}`);
      }
      
      if (realDataWorking) {
        this.testResults.push({
          test: 'Real Data Integration',
          status: 'PASS',
          details: 'Real stock and crypto data accessible'
        });
        console.log('    ✅ Real Data Integration: PASS');
      } else {
        this.testResults.push({
          test: 'Real Data Integration',
          status: 'FAIL',
          details: `Data issues: ${errors.join(', ')}`
        });
        console.log('    ❌ Real Data Integration: FAIL');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Real Data Integration',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Real Data Integration: FAIL');
    }
  }

  async testUserSpecificForecasts() {
    console.log('  👤 Testing User-Specific Forecasts...');
    
    try {
      if (!this.userPortfolio || !this.userPortfolio.assets || this.userPortfolio.assets.length === 0) {
        this.testResults.push({
          test: 'User-Specific Forecasts',
          status: 'SKIP',
          details: 'No portfolio assets available'
        });
        console.log('    ⏭️  User-Specific Forecasts: SKIP');
        return;
      }

      // Get user's actual assets
      const userAssets = this.userPortfolio.assets.slice(0, 3); // Max 3 assets
      const assetSymbols = userAssets.map(asset => asset.symbol);
      
      console.log(`    📋 Testing with user assets: ${assetSymbols.join(', ')}`);
      
      const response = await axios.post(`${this.baseURL}/api/forecast/mixed`, {
        assets: assetSymbols,
        horizon: 7,
        userId: this.userId
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        timeout: 15000
      });
      
      if (response.status === 200) {
        const forecastData = response.data;
        
        // Check if forecast uses user's actual assets
        const usesUserAssets = assetSymbols.every(symbol => 
          forecastData.assets.includes(symbol)
        );
        
        // Check if forecast data is realistic (not mock data)
        const hasRealisticData = this.checkRealisticForecastData(forecastData);
        
        if (usesUserAssets && hasRealisticData) {
          this.testResults.push({
            test: 'User-Specific Forecasts',
            status: 'PASS',
            details: `Forecast generated for user assets: ${assetSymbols.join(', ')}`
          });
          console.log('    ✅ User-Specific Forecasts: PASS');
        } else {
          this.testResults.push({
            test: 'User-Specific Forecasts',
            status: 'FAIL',
            details: 'Forecast not user-specific or uses mock data'
          });
          console.log('    ❌ User-Specific Forecasts: FAIL');
        }
      } else {
        this.testResults.push({
          test: 'User-Specific Forecasts',
          status: 'FAIL',
          details: `API returned status ${response.status}`
        });
        console.log('    ❌ User-Specific Forecasts: FAIL - API Error');
      }
    } catch (error) {
      this.testResults.push({
        test: 'User-Specific Forecasts',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ User-Specific Forecasts: FAIL');
    }
  }

  async testDownloadFunctionality() {
    console.log('  📥 Testing Download Functionality...');
    
    try {
      const testFormats = ['csv', 'pdf', 'excel'];
      let allDownloadsWorking = true;
      const errors = [];
      
      for (const format of testFormats) {
        try {
          const response = await axios.post(`${this.baseURL}/api/forecast/download`, {
            assets: ['AAPL', 'BTC'],
            horizon: 7,
            format: format
          }, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 15000,
            validateStatus: function (status) {
              return status < 500;
            }
          });
          
          if (response.status === 200) {
            // Check if response contains actual file data
            const hasFileData = response.data && response.data.length > 0;
            const hasCorrectHeaders = response.headers['content-disposition'] && 
                                    response.headers['content-type'];
            
            if (hasFileData && hasCorrectHeaders) {
              console.log(`      ✅ ${format.toUpperCase()} download working`);
            } else {
              allDownloadsWorking = false;
              errors.push(`${format}: Missing file data or headers`);
            }
          } else {
            allDownloadsWorking = false;
            errors.push(`${format}: API returned status ${response.status}`);
          }
        } catch (error) {
          allDownloadsWorking = false;
          errors.push(`${format}: ${error.message}`);
        }
      }
      
      if (allDownloadsWorking) {
        this.testResults.push({
          test: 'Download Functionality',
          status: 'PASS',
          details: 'All download formats (CSV, PDF, Excel) working correctly'
        });
        console.log('    ✅ Download Functionality: PASS');
      } else {
        this.testResults.push({
          test: 'Download Functionality',
          status: 'FAIL',
          details: `Download issues: ${errors.join(', ')}`
        });
        console.log('    ❌ Download Functionality: FAIL');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Download Functionality',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Download Functionality: FAIL');
    }
  }

  async testRealTimeDataFetching() {
    console.log('  ⚡ Testing Real-Time Data Fetching...');
    
    try {
      // Test if forecast service can fetch real-time data
      const response = await axios.post(`${this.baseURL}/api/forecast/mixed`, {
        assets: ['AAPL', 'BTC'],
        horizon: 7,
        useRealData: true
      }, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000
      });
      
      if (response.status === 200) {
        const forecastData = response.data;
        
        // Check if data has real-time indicators
        const hasRealTimeData = this.checkRealTimeDataIndicators(forecastData);
        
        if (hasRealTimeData) {
          this.testResults.push({
            test: 'Real-Time Data Fetching',
            status: 'PASS',
            details: 'Forecast service fetches real-time data'
          });
          console.log('    ✅ Real-Time Data Fetching: PASS');
        } else {
          this.testResults.push({
            test: 'Real-Time Data Fetching',
            status: 'FAIL',
            details: 'Forecast service not using real-time data'
          });
          console.log('    ❌ Real-Time Data Fetching: FAIL');
        }
      } else {
        this.testResults.push({
          test: 'Real-Time Data Fetching',
          status: 'FAIL',
          details: `API returned status ${response.status}`
        });
        console.log('    ❌ Real-Time Data Fetching: FAIL - API Error');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Real-Time Data Fetching',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Real-Time Data Fetching: FAIL');
    }
  }

  checkRealisticForecastData(forecastData) {
    // Check if forecast data looks realistic (not hardcoded mock values)
    if (!forecastData.forecasts) return false;
    
    let hasRealisticData = true;
    
    if (forecastData.forecasts.stocks) {
      forecastData.forecasts.stocks.forEach(stock => {
        if (stock.forecast && stock.forecast.predictions) {
          stock.forecast.predictions.forEach(prediction => {
            // Check if prices are realistic (not hardcoded like 150.25, 151.50)
            if (prediction.price === 150.25 || prediction.price === 151.50 || 
                prediction.price === 152.75) {
              hasRealisticData = false;
            }
          });
        }
      });
    }
    
    if (forecastData.forecasts.crypto) {
      forecastData.forecasts.crypto.forEach(crypto => {
        if (crypto.forecast && crypto.forecast.predictions) {
          crypto.forecast.predictions.forEach(prediction => {
            // Check if prices are realistic (not hardcoded like 45000, 45500)
            if (prediction.price === 45000 || prediction.price === 45500 || 
                prediction.price === 46000) {
              hasRealisticData = false;
            }
          });
        }
      });
    }
    
    return hasRealisticData;
  }

  checkRealTimeDataIndicators(forecastData) {
    // Check for indicators that data is real-time
    if (!forecastData.timestamp) return false;
    
    const timestamp = new Date(forecastData.timestamp);
    const now = new Date();
    const timeDiff = Math.abs(now - timestamp);
    
    // Data should be recent (within last 5 minutes)
    return timeDiff < 5 * 60 * 1000;
  }

  printResults() {
    console.log('\n📊 Real Forecast Integration Test Results:');
    console.log('='.repeat(55));
    
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Skipped: ${skipped} ⏭️`);
    console.log(`Success Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⏭️' : '❌';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`    ${result.details}`);
      }
    });
  }

  generateFixRecommendations() {
    console.log('\n🔧 Real Forecast Integration Fix Recommendations:');
    console.log('='.repeat(60));
    
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');
    
    if (failedTests.length === 0) {
      console.log('✅ All real forecast integration tests passed! No fixes needed.');
      return;
    }
    
    console.log('❌ Issues found. Here are the recommended fixes:\n');
    
    failedTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.test}:`);
      console.log(`   Issue: ${test.details}`);
      
      switch (test.test) {
        case 'User Portfolio Access':
          console.log('   Fix: Implement portfolio endpoint and user asset management');
          console.log('   - Create /api/portfolio endpoint');
          console.log('   - Store user asset selections');
          console.log('   - Link forecasts to user accounts');
          break;
          
        case 'Real Data Integration':
          console.log('   Fix: Integrate real-time data sources');
          console.log('   - Connect to live stock APIs (Alpha Vantage, Yahoo Finance)');
          console.log('   - Connect to live crypto APIs (Binance, CoinGecko)');
          console.log('   - Implement real-time price fetching');
          break;
          
        case 'User-Specific Forecasts':
          console.log('   Fix: Make forecasts user-specific');
          console.log('   - Use user portfolio assets for forecasts');
          console.log('   - Store forecast history per user');
          console.log('   - Implement user preferences for forecast models');
          break;
          
        case 'Download Functionality':
          console.log('   Fix: Fix download endpoint issues');
          console.log('   - Ensure proper file generation');
          console.log('   - Set correct content headers');
          console.log('   - Handle different file formats properly');
          break;
          
        case 'Real-Time Data Fetching':
          console.log('   Fix: Implement real-time data fetching');
          console.log('   - Add real-time data flag to forecast API');
          console.log('   - Fetch latest prices before generating forecasts');
          console.log('   - Update forecast models with live data');
          break;
      }
      console.log('');
    });
    
    console.log('🚀 Priority Actions:');
    console.log('1. Fix download functionality for all formats');
    console.log('2. Integrate real-time data sources (stocks and crypto)');
    console.log('3. Implement user portfolio management');
    console.log('4. Make forecasts user-specific based on portfolio');
    console.log('5. Add real-time data fetching to forecast generation');
    console.log('6. Test all functionality with real user data');
  }
}

// Run tests if called directly
if (require.main === module) {
  const realForecastTests = new RealForecastTests();
  realForecastTests.runAllTests();
}

module.exports = RealForecastTests;
