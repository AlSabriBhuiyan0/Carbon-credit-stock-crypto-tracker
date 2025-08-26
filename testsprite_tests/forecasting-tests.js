const axios = require('axios');
const config = require('../testsprite.config.js');

class ForecastingTests {
  constructor() {
    this.baseURL = config.endpoints.backend;
    this.testResults = [];
    this.authToken = null;
  }

  async runAllTests() {
    console.log('🔮 Running AI Forecasting Tests...');
    
    try {
      await this.authenticate();
      await this.testProphetForecasting();
      await this.testARIMAForecasting();
      await this.testSimpleForecasting();
      await this.testForecastingAccuracy();
      await this.testModelPerformance();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Forecasting tests failed:', error.message);
    }
  }

  async authenticate() {
    console.log('  🔑 Authenticating for forecasting tests...');
    
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

  async testProphetForecasting() {
    console.log('  📊 Testing Prophet Forecasting...');
    
    try {
      const testData = {
        symbol: 'AAPL',
        days: 7,
        model: 'prophet',
        parameters: {
          changepoint_prior_scale: 0.05,
          seasonality_prior_scale: 10.0,
          holidays_prior_scale: 10.0
        }
      };

      const response = await axios.post(`${this.baseURL}/api/forecast/prophet`, testData, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
      });
      
      if (response.status === 200) {
        const forecastData = response.data;
        
        // Validate forecast structure
        if (forecastData.predictions && Array.isArray(forecastData.predictions)) {
          this.testResults.push({
            test: 'Prophet Forecasting',
            status: 'PASS',
            details: `Generated ${forecastData.predictions.length} predictions for ${testData.symbol}`
          });
          console.log('    ✅ Prophet Forecasting: PASS');
        } else {
          throw new Error('Invalid forecast data structure');
        }
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.testResults.push({
        test: 'Prophet Forecasting',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Prophet Forecasting: FAIL');
    }
  }

  async testARIMAForecasting() {
    console.log('  📈 Testing ARIMA Forecasting...');
    
    try {
      const testData = {
        symbol: 'BTC',
        days: 5,
        model: 'arima',
        parameters: {
          p: 1,
          d: 1,
          q: 1,
          seasonal: false
        }
      };

      const response = await axios.post(`${this.baseURL}/api/forecast/arima`, testData, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
      });
      
      if (response.status === 200) {
        const forecastData = response.data;
        
        // Validate forecast structure
        if (forecastData.predictions && Array.isArray(forecastData.predictions)) {
          this.testResults.push({
            test: 'ARIMA Forecasting',
            status: 'PASS',
            details: `Generated ${forecastData.predictions.length} predictions for ${testData.symbol}`
          });
          console.log('    ✅ ARIMA Forecasting: PASS');
        } else {
          throw new Error('Invalid forecast data structure');
        }
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.testResults.push({
        test: 'ARIMA Forecasting',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ ARIMA Forecasting: FAIL');
    }
  }

  async testSimpleForecasting() {
    console.log('  📉 Testing Simple Forecasting...');
    
    try {
      const testData = {
        symbol: 'ETH',
        days: 3,
        model: 'simple',
        parameters: {
          method: 'linear_regression',
          window_size: 30
        }
      };

      const response = await axios.post(`${this.baseURL}/api/forecast/simple`, testData, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
      });
      
      if (response.status === 200) {
        const forecastData = response.data;
        
        // Validate forecast structure
        if (forecastData.predictions && Array.isArray(forecastData.predictions)) {
          this.testResults.push({
            test: 'Simple Forecasting',
            status: 'PASS',
            details: `Generated ${forecastData.predictions.length} predictions for ${testData.symbol}`
          });
          console.log('    ✅ Simple Forecasting: PASS');
        } else {
          throw new Error('Invalid forecast data structure');
        }
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.testResults.push({
        test: 'Simple Forecasting',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Simple Forecasting: FAIL');
    }
  }

  async testForecastingAccuracy() {
    console.log('  🎯 Testing Forecasting Accuracy...');
    
    if (!this.authToken) {
      this.testResults.push({
        test: 'Forecasting Accuracy',
        status: 'SKIP',
        details: 'No auth token available'
      });
      console.log('    ⚠️  Forecasting Accuracy: SKIP (no token)');
      return;
    }

    try {
      // Test accuracy metrics endpoint
      const response = await axios.get(`${this.baseURL}/api/forecast/accuracy`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        params: {
          symbol: 'AAPL',
          model: 'prophet',
          days: 30
        }
      });
      
      if (response.status === 200) {
        const accuracyData = response.data;
        
        // Check if accuracy metrics are present
        if (accuracyData.mae !== undefined || accuracyData.rmse !== undefined || accuracyData.mape !== undefined) {
          this.testResults.push({
            test: 'Forecasting Accuracy',
            status: 'PASS',
            details: `Accuracy metrics retrieved: MAE=${accuracyData.mae}, RMSE=${accuracyData.rmse}`
          });
          console.log('    ✅ Forecasting Accuracy: PASS');
        } else {
          throw new Error('Missing accuracy metrics in response');
        }
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.testResults.push({
        test: 'Forecasting Accuracy',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Forecasting Accuracy: FAIL');
    }
  }

  async testModelPerformance() {
    console.log('  ⚡ Testing Model Performance...');
    
    try {
      const models = ['prophet', 'arima', 'simple'];
      const performanceResults = [];
      
      for (const model of models) {
        const startTime = Date.now();
        
        try {
          const response = await axios.post(`${this.baseURL}/api/forecast/${model}`, {
            symbol: 'AAPL',
            days: 1,
            model: model
          }, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 30000 // 30 second timeout
          });
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          if (response.status === 200) {
            performanceResults.push({
              model: model,
              status: 'success',
              responseTime: responseTime
            });
          } else {
            performanceResults.push({
              model: model,
              status: 'failed',
              responseTime: responseTime,
              error: `Status: ${response.status}`
            });
          }
        } catch (error) {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          performanceResults.push({
            model: model,
            status: 'error',
            responseTime: responseTime,
            error: error.message
          });
        }
      }
      
      // Analyze performance results
      const successfulModels = performanceResults.filter(r => r.status === 'success');
      const avgResponseTime = successfulModels.length > 0 
        ? successfulModels.reduce((sum, r) => sum + r.responseTime, 0) / successfulModels.length
        : 0;
      
      if (successfulModels.length === models.length) {
        this.testResults.push({
          test: 'Model Performance',
          status: 'PASS',
          details: `All models successful, average response time: ${avgResponseTime.toFixed(0)}ms`
        });
        console.log('    ✅ Model Performance: PASS');
      } else if (successfulModels.length > 0) {
        this.testResults.push({
          test: 'Model Performance',
          status: 'WARN',
          details: `${successfulModels.length}/${models.length} models successful, avg response: ${avgResponseTime.toFixed(0)}ms`
        });
        console.log('    ⚠️  Model Performance: WARN');
      } else {
        this.testResults.push({
          test: 'Model Performance',
          status: 'FAIL',
          details: 'All models failed'
        });
        console.log('    ❌ Model Performance: FAIL');
      }
      
      // Log detailed performance results
      console.log('    📊 Performance Details:');
      performanceResults.forEach(result => {
        const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
        console.log(`      ${icon} ${result.model}: ${result.responseTime}ms ${result.error ? `(${result.error})` : ''}`);
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'Model Performance',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Model Performance: FAIL');
    }
  }

  printResults() {
    console.log('\n📊 AI Forecasting Test Results:');
    console.log('='.repeat(40));
    
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    const warned = this.testResults.filter(r => r.status === 'WARN').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Skipped: ${skipped} ⚠️`);
    console.log(`Warnings: ${warned} ⚠️`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : 
                   result.status === 'SKIP' ? '⚠️' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`    ${result.details}`);
      }
    });
  }
}

// Run tests if called directly
if (require.main === module) {
  const forecastingTests = new ForecastingTests();
  forecastingTests.runAllTests();
}

module.exports = ForecastingTests;
