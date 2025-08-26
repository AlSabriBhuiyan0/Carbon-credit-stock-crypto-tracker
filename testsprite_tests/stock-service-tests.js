const axios = require('axios');
const config = require('../testsprite.config.js');

class StockServiceTests {
  constructor() {
    this.baseURL = config.endpoints.backend;
    this.frontendURL = config.endpoints.frontend;
    this.testResults = [];
    this.authToken = null;
  }

  async runAllTests() {
    console.log('📈 Running Stock Service Tests...');
    
    try {
      await this.authenticate();
      await this.testStockServiceHealth();
      await this.testStockAPIEndpoints();
      await this.testStockDataRetrieval();
      await this.testStockPageRendering();
      await this.testStockAuthentication();
      await this.testStockWebSocketConnection();
      
      this.printResults();
      this.generateFixRecommendations();
    } catch (error) {
      console.error('❌ Stock service tests failed:', error.message);
    }
  }

  async authenticate() {
    console.log('  🔑 Authenticating for stock service tests...');
    
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
        console.log('    ⚠️  Authentication failed, some tests may be skipped');
      }
    } catch (error) {
      console.log('    ⚠️  Authentication failed, some tests may be skipped');
    }
  }

  async testStockServiceHealth() {
    console.log('  🏥 Testing Stock Service Health...');
    
    try {
      // Test basic health endpoint
      const healthResponse = await axios.get(`${this.baseURL}/api/health`, {
        timeout: 10000
      });
      
      if (healthResponse.status === 200) {
        const healthData = healthResponse.data;
        
        // Check if stock service is mentioned in health data
        const stockServiceHealthy = healthData.services && 
                                   healthData.services.stock && 
                                   healthData.services.stock.status === 'healthy';
        
        if (stockServiceHealthy) {
          this.testResults.push({
            test: 'Stock Service Health',
            status: 'PASS',
            details: 'Stock service reported as healthy'
          });
          console.log('    ✅ Stock Service Health: PASS');
        } else {
          this.testResults.push({
            test: 'Stock Service Health',
            status: 'FAIL',
            details: 'Stock service not healthy or missing from health check'
          });
          console.log('    ❌ Stock Service Health: FAIL - Service Unhealthy');
        }
      } else {
        this.testResults.push({
          test: 'Stock Service Health',
          status: 'FAIL',
          details: `Health endpoint returned status ${healthResponse.status}`
        });
        console.log('    ❌ Stock Service Health: FAIL - Health Endpoint Error');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Stock Service Health',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stock Service Health: FAIL');
    }
  }

  async testStockAPIEndpoints() {
    console.log('  🔌 Testing Stock API Endpoints...');
    
    try {
      const endpoints = [
        '/api/stocks',
        '/api/stocks/list',
        '/api/stocks/prices',
        '/api/stocks/symbols'
      ];
      
      let workingEndpoints = 0;
      let failedEndpoints = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.baseURL}${endpoint}`, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 10000,
            validateStatus: function (status) {
              return status < 500; // Accept any status less than 500
            }
          });
          
          if (response.status === 200) {
            workingEndpoints++;
          } else {
            failedEndpoints.push(`${endpoint} (${response.status})`);
          }
        } catch (error) {
          failedEndpoints.push(`${endpoint} (${error.message})`);
        }
      }
      
      const successRate = (workingEndpoints / endpoints.length) * 100;
      
      if (successRate >= 75) { // At least 75% of endpoints working
        this.testResults.push({
          test: 'Stock API Endpoints',
          status: 'PASS',
          details: `${workingEndpoints}/${endpoints.length} endpoints working (${successRate.toFixed(0)}%)`
        });
        console.log('    ✅ Stock API Endpoints: PASS');
      } else {
        this.testResults.push({
          test: 'Stock API Endpoints',
          status: 'FAIL',
          details: `Only ${workingEndpoints}/${endpoints.length} endpoints working. Failed: ${failedEndpoints.join(', ')}`
        });
        console.log('    ❌ Stock API Endpoints: FAIL - Low Success Rate');
      }
      
      console.log(`    📊 Endpoint Status: ${workingEndpoints}/${endpoints.length} working`);
      
    } catch (error) {
      this.testResults.push({
        test: 'Stock API Endpoints',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stock API Endpoints: FAIL');
    }
  }

  async testStockDataRetrieval() {
    console.log('  📊 Testing Stock Data Retrieval...');
    
    try {
      // Test specific stock data retrieval
      const testSymbols = ['AAPL', 'GOOGL', 'MSFT'];
      let successfulRetrievals = 0;
      let failedRetrievals = [];
      
      for (const symbol of testSymbols) {
        try {
          const response = await axios.get(`${this.baseURL}/api/stocks/${symbol}`, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 15000
          });
          
          if (response.status === 200) {
            const stockData = response.data;
            
            // Check if stock data has required fields
            if (stockData.symbol && (stockData.price || stockData.close || stockData.lastPrice)) {
              successfulRetrievals++;
            } else {
              failedRetrievals.push(`${symbol} (missing data fields)`);
            }
          } else {
            failedRetrievals.push(`${symbol} (status ${response.status})`);
          }
        } catch (error) {
          failedRetrievals.push(`${symbol} (${error.message})`);
        }
      }
      
      if (successfulRetrievals === testSymbols.length) {
        this.testResults.push({
          test: 'Stock Data Retrieval',
          status: 'PASS',
          details: `Successfully retrieved data for all ${testSymbols.length} test symbols`
        });
        console.log('    ✅ Stock Data Retrieval: PASS');
      } else {
        this.testResults.push({
          test: 'Stock Data Retrieval',
          status: 'FAIL',
          details: `Only ${successfulRetrievals}/${testSymbols.length} symbols successful. Failed: ${failedRetrievals.join(', ')}`
        });
        console.log('    ❌ Stock Data Retrieval: FAIL - Data Retrieval Issues');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'Stock Data Retrieval',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stock Data Retrieval: FAIL');
    }
  }

  async testStockPageRendering() {
    console.log('  🌐 Testing Stock Page Rendering...');
    
    try {
      // Test if stock page loads without service errors
      const response = await axios.get(`${this.frontendURL}/app/stocks`, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 20000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (response.status === 200) {
        const pageContent = response.data;
        
        // Check for error messages
        const hasServiceError = pageContent.includes('Stock Service Unavailable') ||
                               pageContent.includes('service unavailable') ||
                               pageContent.includes('authentication issues') ||
                               pageContent.includes('try logging out');
        
        // Check for stock content
        const hasStockContent = pageContent.includes('stock') ||
                               pageContent.includes('Stock') ||
                               pageContent.includes('market') ||
                               pageContent.includes('price');
        
        if (!hasServiceError && hasStockContent) {
          this.testResults.push({
            test: 'Stock Page Rendering',
            status: 'PASS',
            details: 'Stock page loads successfully with stock content'
          });
          console.log('    ✅ Stock Page Rendering: PASS');
        } else if (hasServiceError) {
          this.testResults.push({
            test: 'Stock Page Rendering',
            status: 'FAIL',
            details: 'Stock page shows service unavailable error'
          });
          console.log('    ❌ Stock Page Rendering: FAIL - Service Error');
        } else {
          this.testResults.push({
            test: 'Stock Page Rendering',
            status: 'FAIL',
            details: 'Stock page loads but lacks stock content'
          });
          console.log('    ❌ Stock Page Rendering: FAIL - No Stock Content');
        }
      } else {
        this.testResults.push({
          test: 'Stock Page Rendering',
          status: 'FAIL',
          details: `Stock page returned status ${response.status}`
        });
        console.log('    ❌ Stock Page Rendering: FAIL - Page Error');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'Stock Page Rendering',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stock Page Rendering: FAIL');
    }
  }

  async testStockAuthentication() {
    console.log('  🔐 Testing Stock Authentication...');
    
    try {
      // Test stock endpoints with and without authentication
      const testEndpoint = '/api/stocks';
      
      // Test without authentication
      try {
        const unauthenticatedResponse = await axios.get(`${this.baseURL}${testEndpoint}`, {
          timeout: 10000
        });
        
        if (unauthenticatedResponse.status === 401) {
          this.testResults.push({
            test: 'Stock Authentication',
            status: 'PASS',
            details: 'Stock endpoints properly require authentication'
          });
          console.log('    ✅ Stock Authentication: PASS');
        } else {
          this.testResults.push({
            test: 'Stock Authentication',
            status: 'WARN',
            details: 'Stock endpoints accessible without authentication (security concern)'
          });
          console.log('    ⚠️  Stock Authentication: WARN - No Auth Required');
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.testResults.push({
            test: 'Stock Authentication',
            status: 'PASS',
            details: 'Stock endpoints properly require authentication'
          });
          console.log('    ✅ Stock Authentication: PASS');
        } else {
          this.testResults.push({
            test: 'Stock Authentication',
            status: 'FAIL',
            details: `Authentication test failed: ${error.message}`
          });
          console.log('    ❌ Stock Authentication: FAIL');
        }
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'Stock Authentication',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stock Authentication: FAIL');
    }
  }

  async testStockWebSocketConnection() {
    console.log('  🔌 Testing Stock WebSocket Connection...');
    
    try {
      // Test WebSocket connection for real-time stock data
      const WebSocket = require('ws');
      const ws = new WebSocket(config.websocket.stocks);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        ws.on('open', () => {
          console.log('    ✅ Stock WebSocket connected');
          
          // Subscribe to stock data
          const subscribeMsg = {
            type: 'subscribe',
            symbols: ['AAPL', 'GOOGL', 'MSFT']
          };
          
          ws.send(JSON.stringify(subscribeMsg));
          
          setTimeout(() => {
            clearTimeout(timeout);
            ws.close();
            
            this.testResults.push({
              test: 'Stock WebSocket Connection',
              status: 'PASS',
              details: 'Stock WebSocket connection and subscription successful'
            });
            
            resolve();
          }, 3000);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log('    📊 Received stock data:', message.type || 'data');
          } catch (error) {
            console.log('    📊 Received raw stock data');
          }
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        ws.on('close', () => {
          clearTimeout(timeout);
        });
      });

    } catch (error) {
      this.testResults.push({
        test: 'Stock WebSocket Connection',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stock WebSocket Connection: FAIL');
    }
  }

  generateFixRecommendations() {
    console.log('\n🔧 Stock Service Fix Recommendations:');
    console.log('='.repeat(50));
    
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');
    
    if (failedTests.length === 0) {
      console.log('✅ All stock service tests passed! No fixes needed.');
      return;
    }
    
    console.log('❌ Issues found. Here are the recommended fixes:\n');
    
    failedTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.test}:`);
      console.log(`   Issue: ${test.details}`);
      
      // Provide specific fix recommendations based on test type
      switch (test.test) {
        case 'Stock Service Health':
          console.log('   Fix: Check stock service configuration and ensure it\'s running');
          console.log('   - Verify stock service dependencies are installed');
          console.log('   - Check stock service logs for errors');
          console.log('   - Ensure stock API keys are valid and configured');
          break;
          
        case 'Stock API Endpoints':
          console.log('   Fix: Verify stock API endpoint implementations');
          console.log('   - Check if stock routes are properly defined');
          console.log('   - Verify stock controllers are working');
          console.log('   - Test stock service connectivity');
          break;
          
        case 'Stock Data Retrieval':
          console.log('   Fix: Resolve stock data fetching issues');
          console.log('   - Check stock data provider API status');
          console.log('   - Verify stock data models and schemas');
          console.log('   - Test stock data processing pipeline');
          break;
          
        case 'Stock Page Rendering':
          console.log('   Fix: Fix stock page display issues');
          console.log('   - Check frontend stock component errors');
          console.log('   - Verify stock data is being passed to frontend');
          console.log('   - Test stock page routing and rendering');
          break;
          
        case 'Stock Authentication':
          console.log('   Fix: Resolve stock authentication issues');
          console.log('   - Check JWT token validation for stock endpoints');
          console.log('   - Verify user permissions for stock access');
          console.log('   - Test authentication middleware');
          break;
          
        case 'Stock WebSocket Connection':
          console.log('   Fix: Fix stock WebSocket connectivity');
          console.log('   - Check WebSocket server configuration');
          console.log('   - Verify stock data streaming setup');
          console.log('   - Test WebSocket authentication');
          break;
      }
      console.log('');
    });
    
    console.log('🚀 Priority Actions:');
    console.log('1. Check stock service logs for specific error messages');
    console.log('2. Verify stock API keys and external service connectivity');
    console.log('3. Test stock endpoints individually to isolate issues');
    console.log('4. Check frontend console for JavaScript errors');
    console.log('5. Verify database connections for stock data');
  }

  printResults() {
    console.log('\n📊 Stock Service Test Results:');
    console.log('='.repeat(40));
    
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warned = this.testResults.filter(r => r.status === 'WARN').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Warnings: ${warned} ⚠️`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
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
  const stockTests = new StockServiceTests();
  stockTests.runAllTests();
}

module.exports = StockServiceTests;
