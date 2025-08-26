const axios = require('axios');
const { EventEmitter } = require('events');

class TestSprite extends EventEmitter {
  constructor() {
    super();
    this.baseURL = 'http://localhost:5001';
    this.results = {
      models: { status: 'unknown', details: '' },
      stockService: { status: 'unknown', details: '' },
      carbonData: { status: 'unknown', details: '' }
    };
  }

  async runDiagnostics() {
    console.log('🔍 TestSprite: Starting comprehensive diagnostics...\n');
    
    try {
      // Test 1: AI Models Display
      await this.testAIModels();
      
      // Test 2: Stock Service Availability
      await this.testStockService();
      
      // Test 3: Carbon Data Fetching
      await this.testCarbonData();
      
      // Generate comprehensive report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ TestSprite Error:', error.message);
    }
  }

  async testAIModels() {
    console.log('🧠 Testing AI Models Display...');
    
    try {
      // Test forecast endpoint
      const forecastResponse = await axios.get(`${this.baseURL}/api/dashboard/forecasts?model=prophet&cryptoSymbols=BTCUSDT,ETHUSDT&timeRange=1w`);
      
      if (forecastResponse.data.success) {
        const data = forecastResponse.data.data;
        
        // Check if stock forecasts exist
        const hasStockForecasts = data.stockForecasts && Object.keys(data.stockForecasts).length > 0;
        const hasCryptoForecasts = data.cryptoForecasts && Object.keys(data.cryptoForecasts).length > 0;
        const hasAccuracyMetrics = data.accuracyMetrics && data.accuracyMetrics.overallAccuracy > 0;
        
        if (hasStockForecasts && hasCryptoForecasts && hasAccuracyMetrics) {
          this.results.models = {
            status: '✅ WORKING',
            details: `Stock forecasts: ${Object.keys(data.stockForecasts).length}, Crypto forecasts: ${Object.keys(data.cryptoForecasts).length}, Accuracy: ${data.accuracyMetrics.overallAccuracy}%`
          };
        } else {
          this.results.models = {
            status: '⚠️ PARTIAL',
            details: `Stock: ${hasStockForecasts}, Crypto: ${hasCryptoForecasts}, Accuracy: ${hasAccuracyMetrics}`
          };
        }
      } else {
        this.results.models = {
          status: '❌ FAILED',
          details: 'Forecast endpoint returned success: false'
        };
      }
      
    } catch (error) {
      this.results.models = {
        status: '❌ ERROR',
        details: `HTTP ${error.response?.status || 'Unknown'}: ${error.message}`
      };
    }
    
    console.log(`   ${this.results.models.status} - ${this.results.models.details}`);
  }

  async testStockService() {
    console.log('📈 Testing Stock Service Availability...');
    
    try {
      // Test stock status endpoint
      const statusResponse = await axios.get(`${this.baseURL}/api/stocks/status`);
      
      if (statusResponse.data.success) {
        const status = statusResponse.data.data;
        
        if (status.available && status.connected) {
          this.results.stockService = {
            status: '✅ AVAILABLE',
            details: `Connected: ${status.connected}, Active: ${status.active}, Symbols: ${status.subscribedSymbols?.length || 0}`
          };
        } else {
          this.results.stockService = {
            status: '⚠️ PARTIAL',
            details: `Connected: ${status.connected}, Active: ${status.active}`
          };
        }
      } else {
        this.results.stockService = {
          status: '❌ FAILED',
          details: 'Status endpoint returned success: false'
        };
      }
      
    } catch (error) {
      this.results.stockService = {
        status: '❌ ERROR',
        details: `HTTP ${error.response?.status || 'Unknown'}: ${error.message}`
      };
    }
    
    console.log(`   ${this.results.stockService.status} - ${this.results.stockService.details}`);
  }

  async testCarbonData() {
    console.log('🌱 Testing Carbon Data Fetching...');
    
    try {
      // Test carbon endpoint
      const carbonResponse = await axios.get(`${this.baseURL}/api/dashboard/carbon`);
      
      if (carbonResponse.data.success) {
        const data = carbonResponse.data.data;
        
        if (data.totalProjects > 0 && data.marketOverview.totalCredits > 0) {
          this.results.carbonData = {
            status: '✅ FETCHING',
            details: `Projects: ${data.totalProjects}, Total Credits: ${data.marketOverview.totalCredits}, Avg Price: $${data.marketOverview.averagePrice}`
          };
        } else {
          this.results.carbonData = {
            status: '⚠️ EMPTY',
            details: `Projects: ${data.totalProjects}, Credits: ${data.marketOverview.totalCredits}`
          };
        }
      } else {
        this.results.carbonData = {
          status: '❌ FAILED',
          details: 'Carbon endpoint returned success: false'
        };
      }
      
    } catch (error) {
      this.results.carbonData = {
        status: '❌ ERROR',
        details: `HTTP ${error.response?.status || 'Unknown'}: ${error.message}`
      };
    }
    
    console.log(`   ${this.results.carbonData.status} - ${this.results.carbonData.details}`);
  }

  generateReport() {
    console.log('\n📊 TestSprite Diagnostic Report');
    console.log('================================');
    
    Object.entries(this.results).forEach(([test, result]) => {
      const icon = result.status.includes('✅') ? '✅' : result.status.includes('⚠️') ? '⚠️' : '❌';
      console.log(`${icon} ${test.toUpperCase()}: ${result.status} - ${result.details}`);
    });
    
    // Overall health score
    const workingTests = Object.values(this.results).filter(r => r.status.includes('✅')).length;
    const totalTests = Object.keys(this.results).length;
    const healthScore = Math.round((workingTests / totalTests) * 100);
    
    console.log(`\n🏥 Overall Health Score: ${healthScore}% (${workingTests}/${totalTests} tests passing)`);
    
    if (healthScore === 100) {
      console.log('🎉 All systems are working perfectly!');
    } else if (healthScore >= 66) {
      console.log('⚠️  Some issues detected, but system is mostly functional');
    } else {
      console.log('🚨 Critical issues detected! System needs immediate attention');
    }
    
    // Emit results for external use
    this.emit('diagnosticsComplete', this.results);
  }

  async runQuickFix() {
    console.log('\n🔧 TestSprite: Attempting quick fixes...\n');
    
    try {
      // Fix 1: Restart unified WebSocket service
      console.log('🔄 Restarting unified WebSocket service...');
      await axios.post(`${this.baseURL}/api/unified/restart-all`);
      console.log('   ✅ WebSocket services restarted');
      
      // Fix 2: Clear service caches
      console.log('🧹 Clearing service caches...');
      await axios.post(`${this.baseURL}/api/unified/cache/clear-all`);
      console.log('   ✅ Caches cleared');
      
      // Fix 3: Force refresh dashboard data
      console.log('🔄 Forcing dashboard refresh...');
      await axios.get(`${this.baseURL}/api/dashboard/realtime`);
      console.log('   ✅ Dashboard refreshed');
      
      console.log('\n✅ Quick fixes applied! Running diagnostics again...\n');
      
      // Run diagnostics again to see if fixes worked
      await this.runDiagnostics();
      
    } catch (error) {
      console.error('❌ Quick fix failed:', error.message);
    }
  }
}

module.exports = TestSprite;
