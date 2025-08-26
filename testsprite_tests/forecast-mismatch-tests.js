const axios = require('axios');
const config = require('../testsprite.config.js');

class ForecastMismatchTests {
  constructor() {
    this.baseURL = config.endpoints.backend;
    this.frontendURL = config.endpoints.frontend;
    this.testResults = [];
    this.authToken = null;
  }

  async runAllTests() {
    console.log('🔀 Running Forecast Mismatch Tests...');
    
    try {
      await this.authenticate();
      await this.testAssetTypeDetection();
      await this.testForecastSectionLogic();
      await this.testMixedAssetHandling();
      await this.testUIComponentRendering();
      await this.testAssetSelectionValidation();
      
      this.printResults();
      this.generateFixRecommendations();
    } catch (error) {
      console.error('❌ Forecast mismatch tests failed:', error.message);
    }
  }

  async authenticate() {
    console.log('  🔑 Authenticating for forecast mismatch tests...');
    
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

  async testAssetTypeDetection() {
    console.log('  🔍 Testing Asset Type Detection...');
    
    try {
      const testAssets = [
        { symbol: 'AAPL', expectedType: 'stock' },
        { symbol: 'ADBE', expectedType: 'stock' },
        { symbol: 'AMD', expectedType: 'stock' },
        { symbol: 'BTC', expectedType: 'crypto' },
        { symbol: 'ETH', expectedType: 'crypto' },
        { symbol: 'VETUSDT', expectedType: 'crypto' }
      ];
      
      let correctDetections = 0;
      let detectionErrors = [];
      
      for (const asset of testAssets) {
        try {
          const response = await axios.get(`${this.baseURL}/api/assets/${asset.symbol}/type`, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 10000
          });
          
          if (response.status === 200) {
            const assetType = response.data.type || response.data.assetType;
            
            if (assetType && assetType.toLowerCase() === asset.expectedType.toLowerCase()) {
              correctDetections++;
            } else {
              detectionErrors.push(`${asset.symbol}: expected ${asset.expectedType}, got ${assetType}`);
            }
          } else {
            detectionErrors.push(`${asset.symbol}: API returned status ${response.status}`);
          }
        } catch (error) {
          // Try alternative endpoint
          try {
            const altResponse = await axios.get(`${this.baseURL}/api/assets/type/${asset.symbol}`, {
              headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
              timeout: 10000
            });
            
            if (altResponse.status === 200) {
              const assetType = altResponse.data.type || altResponse.data.assetType;
              
              if (assetType && assetType.toLowerCase() === asset.expectedType.toLowerCase()) {
                correctDetections++;
              } else {
                detectionErrors.push(`${asset.symbol}: expected ${asset.expectedType}, got ${assetType}`);
              }
            } else {
              detectionErrors.push(`${asset.symbol}: alternative endpoint failed with status ${altResponse.status}`);
            }
          } catch (altError) {
            detectionErrors.push(`${asset.symbol}: both endpoints failed - ${error.message}`);
          }
        }
      }
      
      const successRate = (correctDetections / testAssets.length) * 100;
      
      if (successRate >= 80) { // At least 80% correct detection
        this.testResults.push({
          test: 'Asset Type Detection',
          status: 'PASS',
          details: `${correctDetections}/${testAssets.length} assets correctly typed (${successRate.toFixed(0)}%)`
        });
        console.log('    ✅ Asset Type Detection: PASS');
      } else {
        this.testResults.push({
          test: 'Asset Type Detection',
          status: 'FAIL',
          details: `Only ${correctDetections}/${testAssets.length} assets correctly typed. Errors: ${detectionErrors.join(', ')}`
        });
        console.log('    ❌ Asset Type Detection: FAIL - Low Detection Rate');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'Asset Type Detection',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Asset Type Detection: FAIL');
    }
  }

  async testForecastSectionLogic() {
    console.log('  📊 Testing Forecast Section Logic...');
    
    try {
      // Test if forecast API correctly categorizes assets
      const mixedAssets = ['AAPL', 'BTC', 'AMD'];
      
      const response = await axios.post(`${this.baseURL}/api/forecast/categorize`, {
        assets: mixedAssets
      }, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000
      });
      
      if (response.status === 200) {
        const categorizedData = response.data;
        
        // Check if assets are properly categorized
        let correctCategorization = true;
        let categorizationErrors = [];
        
        if (categorizedData.stocks && categorizedData.crypto) {
          // Check if stocks are in stocks array
          const stockSymbols = ['AAPL', 'AMD'];
          stockSymbols.forEach(symbol => {
            if (!categorizedData.stocks.includes(symbol)) {
              correctCategorization = false;
              categorizationErrors.push(`${symbol} not in stocks array`);
            }
          });
          
          // Check if crypto is in crypto array
          if (!categorizedData.crypto.includes('BTC')) {
            correctCategorization = false;
            categorizationErrors.push('BTC not in crypto array');
          }
          
          // Check for cross-contamination
          if (categorizedData.stocks.includes('BTC') || categorizedData.crypto.includes('AAPL') || categorizedData.crypto.includes('AMD')) {
            correctCategorization = false;
            categorizationErrors.push('Cross-contamination detected');
          }
        } else {
          correctCategorization = false;
          categorizationErrors.push('Missing categorization structure');
        }
        
        if (correctCategorization) {
          this.testResults.push({
            test: 'Forecast Section Logic',
            status: 'PASS',
            details: 'Assets correctly categorized into stocks and crypto sections'
          });
          console.log('    ✅ Forecast Section Logic: PASS');
        } else {
          this.testResults.push({
            test: 'Forecast Section Logic',
            status: 'FAIL',
            details: `Categorization errors: ${categorizationErrors.join(', ')}`
          });
          console.log('    ❌ Forecast Section Logic: FAIL - Categorization Issues');
        }
      } else {
        this.testResults.push({
          test: 'Forecast Section Logic',
          status: 'FAIL',
          details: `Categorization API returned status ${response.status}`
        });
        console.log('    ❌ Forecast Section Logic: FAIL - API Error');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'Forecast Section Logic',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Forecast Section Logic: FAIL');
    }
  }

  async testMixedAssetHandling() {
    console.log('  🔀 Testing Mixed Asset Handling...');
    
    try {
      // Test if system can handle mixed asset selection
      const mixedSelection = {
        assets: ['AAPL', 'BTC', 'AMD'],
        maxAssets: 3,
        allowMixed: true
      };
      
      const response = await axios.post(`${this.baseURL}/api/assets/validate-mixed`, mixedSelection, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 15000
      });
      
      if (response.status === 200) {
        const validationData = response.data;
        
        // Check validation results
        let validMixedSelection = true;
        let validationErrors = [];
        
        if (validationData.isValid !== undefined) {
          if (!validationData.isValid) {
            validMixedSelection = false;
            validationErrors.push('Mixed selection marked as invalid');
          }
        }
        
        if (validationData.assetTypes) {
          const expectedTypes = {
            'AAPL': 'stock',
            'BTC': 'crypto',
            'AMD': 'stock'
          };
          
          Object.entries(expectedTypes).forEach(([symbol, expectedType]) => {
            const actualType = validationData.assetTypes[symbol];
            if (actualType !== expectedType) {
              validMixedSelection = false;
              validationErrors.push(`${symbol}: expected ${expectedType}, got ${actualType}`);
            }
          });
        }
        
        if (validMixedSelection) {
          this.testResults.push({
            test: 'Mixed Asset Handling',
            status: 'PASS',
            details: 'Mixed asset selection properly validated and categorized'
          });
          console.log('    ✅ Mixed Asset Handling: PASS');
        } else {
          this.testResults.push({
            test: 'Mixed Asset Handling',
            status: 'FAIL',
            details: `Validation errors: ${validationErrors.join(', ')}`
          });
          console.log('    ❌ Mixed Asset Handling: FAIL - Validation Issues');
        }
      } else {
        this.testResults.push({
          test: 'Mixed Asset Handling',
          status: 'FAIL',
          details: `Validation API returned status ${response.status}`
        });
        console.log('    ❌ Mixed Asset Handling: FAIL - API Error');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'Mixed Asset Handling',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Mixed Asset Handling: FAIL');
    }
  }

  async testUIComponentRendering() {
    console.log('  🎨 Testing UI Component Rendering...');
    
    try {
      // Test if forecast API can generate mixed asset forecasts (frontend depends on this)
      const response = await axios.post(`${this.baseURL}/api/forecast/mixed`, {
        assets: ['AAPL', 'BTC', 'AMD'],
        horizon: 7
      }, {
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
        timeout: 20000
      });
      
      if (response.status === 200) {
        const forecastData = response.data;
        
        // Check if forecast data has the expected structure for UI rendering
        let hasCorrectStructure = true;
        let structureIssues = [];
        
        if (!forecastData.forecasts) {
          hasCorrectStructure = false;
          structureIssues.push('Missing forecasts object');
        }
        
        if (!forecastData.categorized) {
          hasCorrectStructure = false;
          structureIssues.push('Missing categorized object');
        }
        
        if (!forecastData.assets || !Array.isArray(forecastData.assets)) {
          hasCorrectStructure = false;
          structureIssues.push('Missing or invalid assets array');
        }
        
        if (hasCorrectStructure) {
          this.testResults.push({
            test: 'UI Component Rendering',
            status: 'PASS',
            details: 'Forecast API provides correct data structure for UI rendering'
          });
          console.log('    ✅ UI Component Rendering: PASS');
        } else {
          this.testResults.push({
            test: 'UI Component Rendering',
            status: 'FAIL',
            details: `Data structure issues: ${structureIssues.join(', ')}`
          });
          console.log('    ❌ UI Component Rendering: FAIL - Structure Issues');
        }
      } else {
        this.testResults.push({
          test: 'UI Component Rendering',
          status: 'FAIL',
          details: `Forecast API returned status ${response.status}`
        });
        console.log('    ❌ UI Component Rendering: FAIL - API Error');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'UI Component Rendering',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ UI Component Rendering: FAIL');
    }
  }

  async testAssetSelectionValidation() {
    console.log('  ✅ Testing Asset Selection Validation...');
    
    try {
      // Test asset selection validation rules
      const testCases = [
        {
          name: 'Valid Mixed Selection',
          assets: ['AAPL', 'BTC', 'AMD'],
          maxAssets: 3,
          expected: true
        },
        {
          name: 'Too Many Assets',
          assets: ['AAPL', 'BTC', 'AMD', 'ETH', 'GOOGL'],
          maxAssets: 3,
          expected: false
        },
        {
          name: 'Invalid Asset Symbol',
          assets: ['AAPL', 'INVALID', 'BTC'],
          maxAssets: 3,
          expected: false
        },
        {
          name: 'Empty Selection',
          assets: [],
          maxAssets: 3,
          expected: false
        }
      ];
      
      let correctValidations = 0;
      let validationErrors = [];
      
      for (const testCase of testCases) {
        try {
          const response = await axios.post(`${this.baseURL}/api/assets/validate-mixed`, {
            assets: testCase.assets,
            maxAssets: testCase.maxAssets
          }, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 10000,
            validateStatus: function (status) {
              return status < 500; // Accept 200 and 400 status codes
            }
          });
          
          if (response.status === 200) {
            const validationResult = response.data.isValid || response.data.valid;
            
            if (validationResult === testCase.expected) {
              correctValidations++;
            } else {
              validationErrors.push(`${testCase.name}: expected ${testCase.expected}, got ${validationResult}`);
            }
          } else if (response.status === 400) {
            // 400 status means validation failed, which is correct for invalid cases
            console.log(`    Debug ${testCase.name}: status=${response.status}, response.data=`, JSON.stringify(response.data));
            console.log(`    Debug ${testCase.name}: response.data type=`, typeof response.data);
            console.log(`    Debug ${testCase.name}: response.data.isValid=`, response.data.isValid);
            
            const validationResult = response.data.isValid;
            
            console.log(`    Debug ${testCase.name}: isValid=${validationResult}, expected=${testCase.expected}`);
            
            if (validationResult === testCase.expected) {
              correctValidations++;
            } else {
              validationErrors.push(`${testCase.name}: expected ${testCase.expected}, got ${validationResult}`);
            }
          } else {
            validationErrors.push(`${testCase.name}: API returned status ${response.status}`);
          }
        } catch (error) {
          validationErrors.push(`${testCase.name}: API error - ${error.message}`);
        }
      }
      
      const successRate = (correctValidations / testCases.length) * 100;
      
      if (successRate >= 75) { // At least 75% correct validation
        this.testResults.push({
          test: 'Asset Selection Validation',
          status: 'PASS',
          details: `${correctValidations}/${testCases.length} test cases correctly validated (${successRate.toFixed(0)}%)`
        });
        console.log('    ✅ Asset Selection Validation: PASS');
      } else {
        this.testResults.push({
          test: 'Asset Selection Validation',
          status: 'FAIL',
          details: `Only ${correctValidations}/${testCases.length} test cases correct. Errors: ${validationErrors.join(', ')}`
        });
        console.log('    ❌ Asset Selection Validation: FAIL - Validation Issues');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'Asset Selection Validation',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Asset Selection Validation: FAIL');
    }
  }

  generateFixRecommendations() {
    console.log('\n🔧 Forecast Mismatch Fix Recommendations:');
    console.log('='.repeat(50));
    
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');
    
    if (failedTests.length === 0) {
      console.log('✅ All forecast mismatch tests passed! No fixes needed.');
      return;
    }
    
    console.log('❌ Issues found. Here are the recommended fixes:\n');
    
    failedTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.test}:`);
      console.log(`   Issue: ${test.details}`);
      
      switch (test.test) {
        case 'Asset Type Detection':
          console.log('   Fix: Implement proper asset type detection logic');
          console.log('   - Create asset type mapping service');
          console.log('   - Add asset type validation in API endpoints');
          console.log('   - Implement fallback detection methods');
          break;
          
        case 'Forecast Section Logic':
          console.log('   Fix: Fix forecast section categorization');
          console.log('   - Update forecast API to properly categorize assets');
          console.log('   - Remove hardcoded section logic');
          console.log('   - Implement dynamic section generation');
          break;
          
        case 'Mixed Asset Handling':
          console.log('   Fix: Enable mixed asset selection support');
          console.log('   - Update asset selection validation');
          console.log('   - Modify forecast generation for mixed assets');
          console.log('   - Update UI to handle mixed selections');
          break;
          
        case 'UI Component Rendering':
          console.log('   Fix: Update UI components for unified display');
          console.log('   - Replace separate forecast sections with unified view');
          console.log('   - Add asset type indicators to forecast cards');
          console.log('   - Update component props and state management');
          break;
          
        case 'Asset Selection Validation':
          console.log('   Fix: Implement proper asset selection validation');
          console.log('   - Add validation rules for mixed asset selection');
          console.log('   - Implement asset symbol validation');
          console.log('   - Add maximum asset limit enforcement');
          break;
      }
      console.log('');
    });
    
    console.log('🚀 Priority Actions:');
    console.log('1. Implement unified asset type detection service');
    console.log('2. Update forecast API to handle mixed assets');
    console.log('3. Replace separate forecast sections with unified view');
    console.log('4. Add asset type indicators to forecast cards');
    console.log('5. Update asset selection validation logic');
    console.log('6. Test mixed asset scenarios thoroughly');
  }

  printResults() {
    console.log('\n📊 Forecast Mismatch Test Results:');
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
  const mismatchTests = new ForecastMismatchTests();
  mismatchTests.runAllTests();
}

module.exports = ForecastMismatchTests;
