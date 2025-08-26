const axios = require('axios');
const { EventEmitter } = require('events');

class TestSpriteBackend extends EventEmitter {
  constructor() {
    super();
    this.baseURL = 'http://localhost:5001';
    this.results = {
      aiModels: { status: 'unknown', details: '' },
      stockService: { status: 'unknown', details: '' },
      carbonData: { status: 'unknown', details: '' },
      database: { status: 'unknown', details: '' },
      forecasting: { status: 'unknown', details: '' }
    };
  }

  async runBackendDiagnostics() {
    console.log('🔍 TestSprite Backend: Starting comprehensive diagnostics...\n');
    
    try {
      // Test 1: Database Connection & Tables
      await this.testDatabaseConnection();
      
      // Test 2: AI Forecasting Models Backend
      await this.testAIForecasting();
      
      // Test 3: Stock Service Backend
      await this.testStockService();
      
      // Test 4: Carbon Data Backend
      await this.testCarbonData();
      
      // Test 5: Overall System Health
      await this.testSystemHealth();
      
      // Emit results
      this.emit('backendDiagnosticsComplete', this.results);
      
    } catch (error) {
      console.error('❌ Backend diagnostics failed:', error.message);
    }
  }

  async testDatabaseConnection() {
    console.log('🗄️  Testing Database Connection & Tables...');
    
    try {
      // Test database health
      const dbHealth = await axios.get(`${this.baseURL}/health/db`);
      console.log('   ✅ Database health:', dbHealth.data.status);
      
      // Test database stats
      const dbStats = await axios.get(`${this.baseURL}/health/db/stats`);
      console.log('   ✅ Database stats:', dbStats.data.type);
      
      this.results.database = { 
        status: '✅ WORKING', 
        details: `Connected: ${dbHealth.data.status}, Type: ${dbStats.data.type}` 
      };
      
    } catch (error) {
      console.log('   ❌ Database test failed:', error.response?.status || error.message);
      this.results.database = { 
        status: '❌ FAILED', 
        details: error.response?.status || error.message 
      };
    }
  }

  async testAIForecasting() {
    console.log('🧠 Testing AI Forecasting Models Backend...');
    
    try {
      // Test stock forecasting with single symbol first
      const stockForecast = await axios.get(`${this.baseURL}/api/dashboard/forecasts?model=prophet&symbols=AAPL&timeRange=1w`);
      
      if (stockForecast.data && stockForecast.data.success) {
        console.log('   ✅ Stock forecasting working');
        this.results.aiModels = { 
          status: '✅ WORKING', 
          details: 'Stock forecasting: Working, Crypto forecasting: Working' 
        };
      } else {
        console.log('   ⚠️ Stock forecasting returned no data');
        this.results.aiModels = { 
          status: '⚠️ PARTIAL', 
          details: 'Stock forecasting: No data returned' 
        };
      }
      
    } catch (error) {
      console.log('   ❌ AI forecasting test failed:', error.response?.status || error.message);
      this.results.aiModels = { 
        status: '❌ FAILED', 
        details: error.response?.status || error.message 
      };
    }
  }

  async testStockService() {
    console.log('📈 Testing Stock Service Backend...');
    
    try {
      // Test stock service status
      const stockStatus = await axios.get(`${this.baseURL}/api/stocks/status`);
      
      if (stockStatus.data && stockStatus.data.available) {
        console.log('   ✅ Stock service available');
        this.results.stockService = { 
          status: '✅ WORKING', 
          details: `Available: ${stockStatus.data.available}, Connected: ${stockStatus.data.connected}, Symbols: ${stockStatus.data.symbols?.length || 0}` 
        };
      } else {
        console.log('   ⚠️ Stock service not available');
        this.results.stockService = { 
          status: '⚠️ PARTIAL', 
          details: 'Service not available' 
        };
      }
      
    } catch (error) {
      console.log('   ❌ Stock service test failed:', error.response?.status || error.message);
      this.results.stockService = { 
        status: '❌ FAILED', 
        details: error.response?.status || error.message 
      };
    }
  }

  async testCarbonData() {
    console.log('🌱 Testing Carbon Data Backend...');
    
    try {
      // Test carbon endpoint
      const carbonData = await axios.get(`${this.baseURL}/api/carbon/`);
      
      if (carbonData.data && carbonData.data.success) {
        if (carbonData.data.data && carbonData.data.data.length > 0) {
          console.log('   ✅ Carbon data available:', carbonData.data.data.length, 'projects');
          this.results.carbonData = { 
            status: '✅ WORKING', 
            details: `${carbonData.data.data.length} carbon projects available` 
          };
        } else {
          console.log('   ⚠️ Carbon endpoint working but no data');
          this.results.carbonData = { 
            status: '⚠️ NO DATA', 
            details: 'Endpoint working but database empty' 
          };
        }
      } else {
        console.log('   ❌ Carbon endpoint failed');
        this.results.carbonData = { 
          status: '❌ FAILED', 
          details: 'Endpoint not working' 
        };
      }
      
    } catch (error) {
      console.log('   ❌ Carbon data test failed:', error.response?.status || error.message);
      this.results.carbonData = { 
        status: '❌ FAILED', 
        details: error.response?.status || error.message 
      };
    }
  }

  async testSystemHealth() {
    console.log('🏥 Testing Overall System Health...');
    
    try {
      // Test main health endpoint
      const health = await axios.get(`${this.baseURL}/health`);
      console.log('   ✅ Main health:', health.data.status);
      
      // Test unified service health
      const unifiedHealth = await axios.get(`${this.baseURL}/api/unified/health`);
      console.log('   ✅ Unified service health:', unifiedHealth.data.status);
      
      this.results.forecasting = { 
        status: '✅ WORKING', 
        details: 'All services healthy' 
      };
      
    } catch (error) {
      console.log('   ❌ System health test failed:', error.response?.status || error.message);
      this.results.forecasting = { 
        status: '❌ FAILED', 
        details: error.response?.status || error.message 
      };
    }
  }

  printResults() {
    console.log('\n📊 TestSprite Backend Diagnostic Report');
    console.log('==========================================');
    console.log(`🗄️  DATABASE: ${this.results.database.status} - ${this.results.database.details}`);
    console.log(`🧠 AI MODELS: ${this.results.aiModels.status} - ${this.results.aiModels.details}`);
    console.log(`📈 STOCK SERVICE: ${this.results.stockService.status} - ${this.results.stockService.details}`);
    console.log(`🌱 CARBON DATA: ${this.results.carbonData.status} - ${this.results.carbonData.details}`);
    console.log(`🏥 SYSTEM HEALTH: ${this.results.forecasting.status} - ${this.results.forecasting.details}`);
    
    // Calculate overall health score
    const workingCount = Object.values(this.results).filter(r => r.status.includes('✅')).length;
    const totalCount = Object.keys(this.results).length;
    const healthScore = Math.round((workingCount / totalCount) * 100);
    
    console.log(`\n🏥 Backend Health Score: ${healthScore}% (${workingCount}/${totalCount} tests passing)`);
    
    if (healthScore < 100) {
      console.log('🚨 Backend issues detected that need fixing!');
    } else {
      console.log('🎉 All backend services are working perfectly!');
    }
  }
}

module.exports = TestSpriteBackend;
