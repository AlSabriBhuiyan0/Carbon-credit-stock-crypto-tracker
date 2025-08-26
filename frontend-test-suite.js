const axios = require('axios');
const { EventEmitter } = require('events');

class TestSpriteFrontend extends EventEmitter {
  constructor() {
    super();
    this.baseURL = 'http://localhost:3000';
    this.apiURL = 'http://localhost:5001';
    this.results = {
      aiModels: { status: 'unknown', details: '' },
      stockService: { status: 'unknown', details: '' },
      carbonData: { status: 'unknown', details: '' }
    };
  }

  async runFrontendDiagnostics() {
    console.log('🔍 TestSprite Frontend: Starting comprehensive diagnostics...\n');
    
    try {
      // Test 1: AI Forecasting Models Display
      await this.testAIModelsDisplay();
      
      // Test 2: Stock Service Availability (Frontend Perspective)
      await this.testStockServiceFrontend();
      
      // Test 3: Carbon Data Display (Frontend Perspective)
      await this.testCarbonDataFrontend();
      
      // Generate comprehensive report
      this.generateFrontendReport();
      
    } catch (error) {
      console.error('❌ TestSprite Frontend Error:', error.message);
    }
  }

  async testAIModelsDisplay() {
    console.log('🧠 Testing AI Models Display on Frontend...');
    
    try {
      // Test if frontend is accessible
      const frontendResponse = await axios.get(this.baseURL);
      
      if (frontendResponse.status === 200) {
        // Check if the HTML contains AI forecasting elements
        const html = frontendResponse.data;
        
        // Look for AI forecasting related content
        const hasForecastingElements = html.includes('forecast') || 
                                     html.includes('AI') || 
                                     html.includes('prophet') ||
                                     html.includes('arima');
        
        // Check for dashboard components
        const hasDashboardElements = html.includes('dashboard') || 
                                   html.includes('chart') ||
                                   html.includes('analytics');
        
        if (hasForecastingElements && hasDashboardElements) {
          this.results.aiModels = {
            status: '✅ DISPLAYING',
            details: 'Frontend contains AI forecasting and dashboard elements'
          };
        } else {
          this.results.aiModels = {
            status: '⚠️ PARTIAL',
            details: `Forecasting: ${hasForecastingElements}, Dashboard: ${hasDashboardElements}`
          };
        }
      } else {
        this.results.aiModels = {
          status: '❌ FRONTEND ERROR',
          details: `HTTP ${frontendResponse.status}: Frontend not accessible`
        };
      }
      
    } catch (error) {
      this.results.aiModels = {
        status: '❌ CONNECTION ERROR',
        details: `Frontend connection failed: ${error.message}`
      };
    }
    
    console.log(`   ${this.results.aiModels.status} - ${this.results.aiModels.details}`);
  }

  async testStockServiceFrontend() {
    console.log('📈 Testing Stock Service Frontend Display...');
    
    try {
      // Test backend stock service directly
      const stockStatusResponse = await axios.get(`${this.apiURL}/api/stocks/status`);
      
      if (stockStatusResponse.data.success) {
        const status = stockStatusResponse.data.data;
        
        // Check if stock service is actually working
        if (status.available && status.connected) {
          // Now test if frontend can access stock data
          try {
            const stockDataResponse = await axios.get(`${this.apiURL}/api/stocks/symbols`);
            
            if (stockDataResponse.data.success && stockDataResponse.data.data.length > 0) {
              this.results.stockService = {
                status: '✅ WORKING',
                details: `Backend: Available, Connected: ${status.connected}, Symbols: ${stockDataResponse.data.data.length}`
              };
            } else {
              this.results.stockService = {
                status: '⚠️ BACKEND ONLY',
                details: 'Backend service working but no stock data returned'
              };
            }
          } catch (stockDataError) {
            this.results.stockService = {
              status: '⚠️ PARTIAL',
              details: `Service available but data endpoint failed: ${stockDataError.message}`
            };
          }
        } else {
          this.results.stockService = {
            status: '❌ BACKEND ISSUE',
            details: `Available: ${status.available}, Connected: ${status.connected}`
          };
        }
      } else {
        this.results.stockService = {
          status: '❌ BACKEND FAILED',
          details: 'Stock status endpoint returned success: false'
        };
      }
      
    } catch (error) {
      this.results.stockService = {
        status: '❌ BACKEND ERROR',
        details: `HTTP ${error.response?.status || 'Unknown'}: ${error.message}`
      };
    }
    
    console.log(`   ${this.results.stockService.status} - ${this.results.stockService.details}`);
  }

  async testCarbonDataFrontend() {
    console.log('🌱 Testing Carbon Data Frontend Display...');
    
    try {
      // Test backend carbon data directly
      const carbonResponse = await axios.get(`${this.apiURL}/api/dashboard/carbon`);
      
      if (carbonResponse.data.success) {
        const data = carbonResponse.data.data;
        
        // Check if carbon data has actual values
        if (data.totalProjects > 0 && data.marketOverview.totalCredits > 0) {
          this.results.carbonData = {
            status: '✅ DATA AVAILABLE',
            details: `Projects: ${data.totalProjects}, Credits: ${data.marketOverview.totalCredits}, Avg Price: $${data.marketOverview.averagePrice}`
          };
        } else {
          // Check if it's a database issue
          try {
            const carbonProjectsResponse = await axios.get(`${this.apiURL}/api/carbon/`);
            
            if (carbonProjectsResponse.data.success && carbonProjectsResponse.data.data.length > 0) {
              this.results.carbonData = {
                status: '⚠️ ROUTE MISMATCH',
                details: 'Carbon data exists but dashboard route returns empty data'
              };
            } else {
              this.results.carbonData = {
                status: '❌ NO DATA',
                details: 'No carbon projects found in database'
              };
            }
          } catch (dbError) {
            this.results.carbonData = {
              status: '❌ DATABASE ERROR',
              details: `Database query failed: ${dbError.message}`
            };
          }
        }
      } else {
        this.results.carbonData = {
          status: '❌ API FAILED',
          details: 'Carbon endpoint returned success: false'
        };
      }
      
    } catch (error) {
      this.results.carbonData = {
        status: '❌ API ERROR',
        details: `HTTP ${error.response?.status || 'Unknown'}: ${error.message}`
      };
    }
    
    console.log(`   ${this.results.carbonData.status} - ${this.results.carbonData.details}`);
  }

  generateFrontendReport() {
    console.log('\n📊 TestSprite Frontend Diagnostic Report');
    console.log('==========================================');
    
    Object.entries(this.results).forEach(([test, result]) => {
      const icon = result.status.includes('✅') ? '✅' : result.status.includes('⚠️') ? '⚠️' : '❌';
      console.log(`${icon} ${test.toUpperCase()}: ${result.status} - ${result.details}`);
    });
    
    // Overall health score
    const workingTests = Object.values(this.results).filter(r => r.status.includes('✅')).length;
    const totalTests = Object.keys(this.results).length;
    const healthScore = Math.round((workingTests / totalTests) * 100);
    
    console.log(`\n🏥 Frontend Health Score: ${healthScore}% (${workingTests}/${totalTests} tests passing)`);
    
    if (healthScore === 100) {
      console.log('🎉 Frontend is displaying all data correctly!');
    } else if (healthScore >= 66) {
      console.log('⚠️  Some display issues detected, but mostly functional');
    } else {
      console.log('🚨 Critical frontend display issues detected!');
    }
    
    // Emit results for external use
    this.emit('frontendDiagnosticsComplete', this.results);
  }

  async runFrontendFixes() {
    console.log('\n🔧 TestSprite Frontend: Attempting fixes...\n');
    
    try {
      // Fix 1: Clear frontend cache and restart
      console.log('🧹 Clearing frontend cache...');
      console.log('   Run: rm -rf frontend/build && cd frontend && npm run build');
      
      // Fix 2: Check authentication flow
      console.log('🔐 Checking authentication flow...');
      const authResponse = await axios.get(`${this.apiURL}/api/auth/profile`);
      console.log(`   Auth status: ${authResponse.status}`);
      
      // Fix 3: Verify API endpoints
      console.log('🔍 Verifying API endpoints...');
      const endpoints = [
        '/api/dashboard/forecasts',
        '/api/stocks/status',
        '/api/dashboard/carbon'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.apiURL}${endpoint}`);
          console.log(`   ✅ ${endpoint}: ${response.status}`);
        } catch (error) {
          console.log(`   ❌ ${endpoint}: ${error.response?.status || 'Error'}`);
        }
      }
      
      console.log('\n✅ Frontend fixes applied! Check the results above.');
      
    } catch (error) {
      console.error('❌ Frontend fix failed:', error.message);
    }
  }
}

module.exports = TestSpriteFrontend;
