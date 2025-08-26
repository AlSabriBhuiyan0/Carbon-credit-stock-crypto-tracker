const axios = require('axios');
const config = require('../testsprite.config.js');

class ForecastHorizonTests {
  constructor() {
    this.baseURL = config.endpoints.backend;
    this.frontendURL = config.endpoints.frontend;
    this.testResults = [];
    this.authToken = null;
  }

  async runAllTests() {
    console.log('📅 Running Forecast Horizon Tests...');
    
    try {
      await this.authenticate();
      await this.testForecastHorizonOptions();
      await this.testForecastDataGeneration();
      await this.testDownloadFunctionality();
      
      this.printResults();
      this.generateFixRecommendations();
    } catch (error) {
      console.error('❌ Forecast horizon tests failed:', error.message);
    }
  }

  async authenticate() {
    console.log('  🔑 Authenticating for forecast horizon tests...');
    
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

  async testForecastHorizonOptions() {
    console.log('  📅 Testing Forecast Horizon Options...');
    
    try {
      const testHorizons = [3, 7, 14, 30];
      let allHorizonsWorking = true;
      const errors = [];
      
      for (const horizon of testHorizons) {
        try {
          const response = await axios.post(`${this.baseURL}/api/forecast/mixed`, {
            assets: ['AAPL', 'BTC'],
            horizon: horizon
          }, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 15000
          });
          
          if (response.status === 200) {
            const forecastData = response.data;
            
            // Check if horizon is correctly set in response
            if (forecastData.horizon !== horizon) {
              allHorizonsWorking = false;
              errors.push(`Horizon ${horizon}: Response shows ${forecastData.horizon} instead of ${horizon}`);
            }
            
            // Check if predictions match the horizon
            if (forecastData.forecasts) {
              if (forecastData.forecasts.stocks && forecastData.forecasts.stocks.length > 0) {
                const stockPredictions = forecastData.forecasts.stocks[0].forecast.predictions;
                if (stockPredictions.length !== horizon) {
                  allHorizonsWorking = false;
                  errors.push(`Horizon ${horizon}: Stock predictions show ${stockPredictions.length} days instead of ${horizon}`);
                }
              }
              
              if (forecastData.forecasts.crypto && forecastData.forecasts.crypto.length > 0) {
                const cryptoPredictions = forecastData.forecasts.crypto[0].forecast.predictions;
                if (cryptoPredictions.length !== horizon) {
                  allHorizonsWorking = false;
                  errors.push(`Horizon ${horizon}: Crypto predictions show ${cryptoPredictions.length} days instead of ${horizon}`);
                }
              }
            }
          } else {
            allHorizonsWorking = false;
            errors.push(`Horizon ${horizon}: API returned status ${response.status}`);
          }
        } catch (error) {
          allHorizonsWorking = false;
          errors.push(`Horizon ${horizon}: ${error.message}`);
        }
      }
      
      if (allHorizonsWorking) {
        this.testResults.push({
          test: 'Forecast Horizon Options',
          status: 'PASS',
          details: 'All forecast horizons (3, 7, 14, 30 days) working correctly'
        });
        console.log('    ✅ Forecast Horizon Options: PASS');
      } else {
        this.testResults.push({
          test: 'Forecast Horizon Options',
          status: 'FAIL',
          details: `Horizon issues: ${errors.join(', ')}`
        });
        console.log('    ❌ Forecast Horizon Options: FAIL');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Forecast Horizon Options',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Forecast Horizon Options: FAIL');
    }
  }

  async testForecastDataGeneration() {
    console.log('  📊 Testing Forecast Data Generation...');
    
    try {
      const testCases = [
        { horizon: 7, expectedDays: 7 },
        { horizon: 15, expectedDays: 15 },
        { horizon: 30, expectedDays: 30 }
      ];
      
      let allGenerationsWorking = true;
      const errors = [];
      
      for (const testCase of testCases) {
        try {
          const response = await axios.post(`${this.baseURL}/api/forecast/mixed`, {
            assets: ['AAPL'],
            horizon: testCase.horizon
          }, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 15000
          });
          
          if (response.status === 200) {
            const forecastData = response.data;
            
            if (forecastData.forecasts && forecastData.forecasts.stocks) {
              const stockForecast = forecastData.forecasts.stocks[0];
              const predictions = stockForecast.forecast.predictions;
              
              if (predictions.length !== testCase.expectedDays) {
                allGenerationsWorking = false;
                errors.push(`Horizon ${testCase.horizon}: Generated ${predictions.length} days instead of ${testCase.expectedDays}`);
              }
              
              // Check if dates are sequential and cover the full horizon
              if (predictions.length > 1) {
                const firstDate = new Date(predictions[0].date);
                const lastDate = new Date(predictions[predictions.length - 1].date);
                const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff !== testCase.expectedDays - 1) {
                  allGenerationsWorking = false;
                  errors.push(`Horizon ${testCase.horizon}: Date range is ${daysDiff + 1} days instead of ${testCase.expectedDays}`);
                }
              }
            }
          } else {
            allGenerationsWorking = false;
            errors.push(`Horizon ${testCase.horizon}: API returned status ${response.status}`);
          }
        } catch (error) {
          allGenerationsWorking = false;
          errors.push(`Horizon ${testCase.horizon}: ${error.message}`);
        }
      }
      
      if (allGenerationsWorking) {
        this.testResults.push({
          test: 'Forecast Data Generation',
          status: 'PASS',
          details: 'Forecast data generated correctly for all horizons'
        });
        console.log('    ✅ Forecast Data Generation: PASS');
      } else {
        this.testResults.push({
          test: 'Forecast Data Generation',
          status: 'FAIL',
          details: `Generation issues: ${errors.join(', ')}`
        });
        console.log('    ❌ Forecast Data Generation: FAIL');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Forecast Data Generation',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Forecast Data Generation: FAIL');
    }
  }

  async testDownloadFunctionality() {
    console.log('  📥 Testing Download Functionality...');
    
    try {
      // Test if download endpoint exists
      const downloadResponse = await axios.post(`${this.baseURL}/api/forecast/download`, {
        assets: ['AAPL', 'BTC'],
        horizon: 7,
        format: 'pdf'
      }, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500; // Accept any status less than 500
        }
      });
      
      if (downloadResponse.status === 200) {
        // Check if response contains download data
        const hasDownloadData = downloadResponse.data.downloadUrl || 
                               downloadResponse.data.fileData || 
                               downloadResponse.headers['content-disposition'];
        
        if (hasDownloadData) {
          this.testResults.push({
            test: 'Download Functionality',
            status: 'PASS',
            details: 'Forecast download endpoint working correctly'
          });
          console.log('    ✅ Download Functionality: PASS');
        } else {
          this.testResults.push({
            test: 'Download Functionality',
            status: 'FAIL',
            details: 'Download endpoint exists but no download data returned'
          });
          console.log('    ❌ Download Functionality: FAIL - No Download Data');
        }
      } else if (downloadResponse.status === 404) {
        this.testResults.push({
          test: 'Download Functionality',
          status: 'FAIL',
          details: 'Download endpoint not implemented (404)'
        });
        console.log('    ❌ Download Functionality: FAIL - Endpoint Missing');
      } else {
        this.testResults.push({
          test: 'Download Functionality',
          status: 'FAIL',
          details: `Download endpoint returned status ${downloadResponse.status}`
        });
        console.log('    ❌ Download Functionality: FAIL - Status Error');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        this.testResults.push({
          test: 'Download Functionality',
          status: 'FAIL',
          details: 'Download endpoint not implemented (404)'
        });
        console.log('    ❌ Download Functionality: FAIL - Endpoint Missing');
      } else {
        this.testResults.push({
          test: 'Download Functionality',
          status: 'FAIL',
          details: error.message
        });
        console.log('    ❌ Download Functionality: FAIL');
      }
    }
  }

  printResults() {
    console.log('\n📊 Forecast Horizon Test Results:');
    console.log('='.repeat(45));
    
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

  generateFixRecommendations() {
    console.log('\n🔧 Forecast Horizon Fix Recommendations:');
    console.log('='.repeat(50));
    
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');
    
    if (failedTests.length === 0) {
      console.log('✅ All forecast horizon tests passed! No fixes needed.');
      return;
    }
    
    console.log('❌ Issues found. Here are the recommended fixes:\n');
    
    failedTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.test}:`);
      console.log(`   Issue: ${test.details}`);
      
      switch (test.test) {
        case 'Forecast Horizon Options':
          console.log('   Fix: Update forecast service to respect horizon parameter');
          console.log('   - Modify forecast generation logic to use horizon parameter');
          console.log('   - Generate correct number of prediction days');
          console.log('   - Update mock data generation for different horizons');
          break;
          
        case 'Forecast Data Generation':
          console.log('   Fix: Implement proper forecast data generation');
          console.log('   - Generate sequential dates for the full horizon period');
          console.log('   - Ensure predictions array length matches horizon');
          console.log('   - Add realistic price progression over time');
          break;
          
        case 'Download Functionality':
          console.log('   Fix: Implement forecast download functionality');
          console.log('   - Create download endpoint for forecast reports');
          console.log('   - Support multiple formats (PDF, CSV, Excel)');
          console.log('   - Include asset details, predictions, and charts');
          break;
      }
      console.log('');
    });
    
    console.log('🚀 Priority Actions:');
    console.log('1. Fix forecast horizon parameter handling');
    console.log('2. Implement proper forecast data generation for all horizons');
    console.log('3. Add forecast download functionality');
    console.log('4. Test all horizon options (3, 7, 14, 30 days)');
    console.log('5. Verify download formats and data completeness');
  }
}

// Run tests if called directly
if (require.main === module) {
  const horizonTests = new ForecastHorizonTests();
  horizonTests.runAllTests();
}

module.exports = ForecastHorizonTests;
