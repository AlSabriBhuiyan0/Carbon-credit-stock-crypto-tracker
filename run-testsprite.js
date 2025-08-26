#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// TestSprite test runner
class TestSpriteRunner {
  constructor() {
    this.config = require('./testsprite.config.js');
    this.testResults = [];
    this.currentTest = null;
  }

  // Initialize TestSprite environment
  async initialize() {
    console.log('🚀 Initializing TestSprite for Carbon Credit & Stock Tracker...');
    
    // Check if TestSprite MCP is available
    try {
      const mcpPath = path.join(__dirname, 'node_modules', '@testsprite', 'testsprite-mcp', 'dist', 'index.js');
      if (!fs.existsSync(mcpPath)) {
        throw new Error('TestSprite MCP not found. Please run: npm install @testsprite/testsprite-mcp');
      }
      
      console.log('✅ TestSprite MCP found');
      console.log('✅ Configuration loaded');
      console.log(`✅ Test directory: ${this.config.tests.directory}`);
      
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('\n🧪 Running all TestSprite tests...');
    
    const testSuites = [
      { name: 'Authentication Tests', file: 'auth-tests.js' },
      { name: 'API Endpoint Tests', file: 'api-tests.js' },
      { name: 'WebSocket Tests', file: 'websocket-tests.js' },
      { name: 'Database Tests', file: 'database-tests.js' },
      { name: 'AI Forecasting Tests', file: 'forecasting-tests.js' },
      { name: 'Performance Tests', file: 'performance-tests.js' }
    ];

    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }
  }

  // Run a specific test suite
  async runTestSuite(suite) {
    console.log(`\n📋 Running ${suite.name}...`);
    
    try {
      const testFile = path.join(this.config.tests.directory, suite.file);
      
      if (!fs.existsSync(testFile)) {
        console.log(`⚠️  Test file not found: ${suite.file}`);
        return;
      }

      const result = await this.executeTest(testFile);
      this.testResults.push({
        suite: suite.name,
        file: suite.file,
        result: result
      });
      
      console.log(`✅ ${suite.name} completed`);
    } catch (error) {
      console.error(`❌ ${suite.name} failed:`, error.message);
      this.testResults.push({
        suite: suite.name,
        file: suite.file,
        result: { success: false, error: error.message }
      });
    }
  }

  // Execute a test file
  async executeTest(testFile) {
    return new Promise((resolve, reject) => {
      const testProcess = spawn('node', [testFile], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output, code });
        } else {
          reject(new Error(`Test failed with code ${code}: ${errorOutput}`));
        }
      });

      testProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  // Generate test report
  generateReport() {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.result.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Test Suites: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const status = result.result.success ? '✅' : '❌';
      console.log(`${status} ${result.suite}`);
    });
    
    // Save results to file
    const resultsFile = path.join(this.config.tests.output, 'test-results.json');
    if (!fs.existsSync(path.dirname(resultsFile))) {
      fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
    }
    
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total: totalTests, passed: passedTests, failed: failedTests },
      results: this.testResults
    }, null, 2));
    
    console.log(`\n📁 Detailed results saved to: ${resultsFile}`);
  }

  // Clean up test environment
  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    // Add any cleanup logic here
    // For example, close database connections, stop test servers, etc.
    
    console.log('✅ Cleanup completed');
  }
}

// Main execution
async function main() {
  const runner = new TestSpriteRunner();
  
  try {
    const initialized = await runner.initialize();
    if (!initialized) {
      process.exit(1);
    }
    
    await runner.runAllTests();
    runner.generateReport();
    await runner.cleanup();
    
    console.log('\n🎉 TestSprite execution completed!');
  } catch (error) {
    console.error('\n💥 TestSprite execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TestSpriteRunner;
