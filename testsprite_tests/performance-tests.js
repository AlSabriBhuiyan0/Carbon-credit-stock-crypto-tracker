const axios = require('axios');
const config = require('../testsprite.config.js');

class PerformanceTests {
  constructor() {
    this.baseURL = config.endpoints.backend;
    this.testResults = [];
    this.authToken = null;
    this.performanceMetrics = {
      responseTimes: [],
      throughput: [],
      errors: []
    };
  }

  async runAllTests() {
    console.log('⚡ Running Performance Tests...');
    
    try {
      await this.authenticate();
      await this.testResponseTime();
      await this.testLoadTesting();
      await this.testStressTesting();
      await this.testConcurrentRequests();
      await this.testMemoryUsage();
      
      this.printResults();
      this.generatePerformanceReport();
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message);
    }
  }

  async authenticate() {
    console.log('  🔑 Authenticating for performance tests...');
    
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

  async testResponseTime() {
    console.log('  ⏱️  Testing Response Time...');
    
    try {
      const endpoints = [
        '/api/stocks',
        '/api/crypto',
        '/api/carbon/projects',
        '/api/dashboard'
      ];
      
      const responseTimes = [];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        
        try {
          const response = await axios.get(`${this.baseURL}${endpoint}`, {
            headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
            timeout: 10000
          });
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          if (response.status === 200) {
            responseTimes.push({
              endpoint: endpoint,
              responseTime: responseTime,
              status: 'success'
            });
          } else {
            responseTimes.push({
              endpoint: endpoint,
              responseTime: responseTime,
              status: 'failed',
              error: `Status: ${response.status}`
            });
          }
        } catch (error) {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          responseTimes.push({
            endpoint: endpoint,
            responseTime: responseTime,
            status: 'error',
            error: error.message
          });
        }
      }
      
      // Analyze response times
      const successfulRequests = responseTimes.filter(r => r.status === 'success');
      const avgResponseTime = successfulRequests.length > 0 
        ? successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length
        : 0;
      
      const maxResponseTime = Math.max(...responseTimes.map(r => r.responseTime));
      const minResponseTime = Math.min(...responseTimes.map(r => r.responseTime));
      
      if (avgResponseTime < 1000) { // Less than 1 second
        this.testResults.push({
          test: 'Response Time',
          status: 'PASS',
          details: `Average response time: ${avgResponseTime.toFixed(0)}ms (min: ${minResponseTime}ms, max: ${maxResponseTime}ms)`
        });
        console.log('    ✅ Response Time: PASS');
      } else if (avgResponseTime < 3000) { // Less than 3 seconds
        this.testResults.push({
          test: 'Response Time',
          status: 'WARN',
          details: `Average response time: ${avgResponseTime.toFixed(0)}ms (min: ${minResponseTime}ms, max: ${maxResponseTime}ms)`
        });
        console.log('    ⚠️  Response Time: WARN');
      } else {
        this.testResults.push({
          test: 'Response Time',
          status: 'FAIL',
          details: `Average response time: ${avgResponseTime.toFixed(0)}ms (min: ${minResponseTime}ms, max: ${maxResponseTime}ms)`
        });
        console.log('    ❌ Response Time: FAIL');
      }
      
      // Store metrics
      this.performanceMetrics.responseTimes = responseTimes;
      
      // Log detailed results
      console.log('    📊 Response Time Details:');
      responseTimes.forEach(result => {
        const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
        console.log(`      ${icon} ${result.endpoint}: ${result.responseTime}ms ${result.error ? `(${result.error})` : ''}`);
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'Response Time',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Response Time: FAIL');
    }
  }

  async testLoadTesting() {
    console.log('  📊 Testing Load Testing...');
    
    try {
      const loadConfig = config.performance.loadTest;
      const concurrentUsers = loadConfig.users;
      const testDuration = loadConfig.duration;
      const rampUp = loadConfig.rampUp;
      
      console.log(`    🎯 Load Test: ${concurrentUsers} users, ${testDuration}s duration, ${rampUp}s ramp-up`);
      
      const startTime = Date.now();
      const requests = [];
      const results = [];
      
      // Simulate concurrent users
      for (let i = 0; i < concurrentUsers; i++) {
        const delay = (i / concurrentUsers) * rampUp * 1000; // Stagger requests over ramp-up period
        
        setTimeout(async () => {
          const userStartTime = Date.now();
          
          try {
            const response = await axios.get(`${this.baseURL}/api/dashboard`, {
              headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
              timeout: 10000
            });
            
            const userEndTime = Date.now();
            const responseTime = userEndTime - userStartTime;
            
            results.push({
              user: i + 1,
              responseTime: responseTime,
              status: response.status,
              success: true
            });
          } catch (error) {
            const userEndTime = Date.now();
            const responseTime = userEndTime - userStartTime;
            
            results.push({
              user: i + 1,
              responseTime: responseTime,
              status: 'error',
              success: false,
              error: error.message
            });
          }
        }, delay);
      }
      
      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, (testDuration + rampUp) * 1000));
      
      const endTime = Date.now();
      const totalTestTime = endTime - startTime;
      
      // Analyze results
      const successfulRequests = results.filter(r => r.success);
      const failedRequests = results.filter(r => !r.success);
      const avgResponseTime = successfulRequests.length > 0 
        ? successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length
        : 0;
      
      const throughput = (successfulRequests.length / (totalTestTime / 1000)).toFixed(2);
      
      if (successfulRequests.length >= concurrentUsers * 0.9) { // 90% success rate
        this.testResults.push({
          test: 'Load Testing',
          status: 'PASS',
          details: `Success rate: ${((successfulRequests.length / concurrentUsers) * 100).toFixed(1)}%, Throughput: ${throughput} req/s, Avg response: ${avgResponseTime.toFixed(0)}ms`
        });
        console.log('    ✅ Load Testing: PASS');
      } else {
        this.testResults.push({
          test: 'Load Testing',
          status: 'FAIL',
          details: `Success rate: ${((successfulRequests.length / concurrentUsers) * 100).toFixed(1)}%, Throughput: ${throughput} req/s, Avg response: ${avgResponseTime.toFixed(0)}ms`
        });
        console.log('    ❌ Load Testing: FAIL');
      }
      
      // Store metrics
      this.performanceMetrics.throughput = {
        successful: successfulRequests.length,
        failed: failedRequests.length,
        total: concurrentUsers,
        throughput: throughput,
        avgResponseTime: avgResponseTime
      };
      
      console.log(`    📈 Results: ${successfulRequests.length}/${concurrentUsers} successful, ${throughput} req/s throughput`);
      
    } catch (error) {
      this.testResults.push({
        test: 'Load Testing',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Load Testing: FAIL');
    }
  }

  async testStressTesting() {
    console.log('  🔥 Testing Stress Testing...');
    
    try {
      const stressConfig = config.performance.stressTest;
      const concurrentUsers = stressConfig.users;
      const testDuration = stressConfig.duration;
      const rampUp = stressConfig.rampUp;
      
      console.log(`    🎯 Stress Test: ${concurrentUsers} users, ${testDuration}s duration, ${rampUp}s ramp-up`);
      
      const startTime = Date.now();
      const results = [];
      
      // Simulate stress test with higher load
      for (let i = 0; i < concurrentUsers; i++) {
        const delay = (i / concurrentUsers) * rampUp * 1000;
        
        setTimeout(async () => {
          // Make multiple requests per user to increase stress
          for (let j = 0; j < 3; j++) {
            const userStartTime = Date.now();
            
            try {
              const response = await axios.get(`${this.baseURL}/api/stocks`, {
                headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
                timeout: 15000
              });
              
              const userEndTime = Date.now();
              const responseTime = userEndTime - userStartTime;
              
              results.push({
                user: i + 1,
                request: j + 1,
                responseTime: responseTime,
                status: response.status,
                success: true
              });
            } catch (error) {
              const userEndTime = Date.now();
              const responseTime = userEndTime - userStartTime;
              
              results.push({
                user: i + 1,
                request: j + 1,
                responseTime: responseTime,
                status: 'error',
                success: false,
                error: error.message
              });
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }, delay);
      }
      
      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, (testDuration + rampUp) * 1000));
      
      const endTime = Date.now();
      const totalTestTime = endTime - startTime;
      
      // Analyze stress test results
      const successfulRequests = results.filter(r => r.success);
      const failedRequests = results.filter(r => !r.success);
      const avgResponseTime = successfulRequests.length > 0 
        ? successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length
        : 0;
      
      const throughput = (successfulRequests.length / (totalTestTime / 1000)).toFixed(2);
      const errorRate = (failedRequests.length / results.length * 100).toFixed(1);
      
      if (errorRate < 20) { // Less than 20% error rate
        this.testResults.push({
          test: 'Stress Testing',
          status: 'PASS',
          details: `Error rate: ${errorRate}%, Throughput: ${throughput} req/s, Avg response: ${avgResponseTime.toFixed(0)}ms`
        });
        console.log('    ✅ Stress Testing: PASS');
      } else if (errorRate < 40) { // Less than 40% error rate
        this.testResults.push({
          test: 'Stress Testing',
          status: 'WARN',
          details: `Error rate: ${errorRate}%, Throughput: ${throughput} req/s, Avg response: ${avgResponseTime.toFixed(0)}ms`
        });
        console.log('    ⚠️  Stress Testing: WARN');
      } else {
        this.testResults.push({
          test: 'Stress Testing',
          status: 'FAIL',
          details: `Error rate: ${errorRate}%, Throughput: ${throughput} req/s, Avg response: ${avgResponseTime.toFixed(0)}ms`
        });
        console.log('    ❌ Stress Testing: FAIL');
      }
      
      console.log(`    📈 Results: ${successfulRequests.length}/${results.length} successful, ${errorRate}% error rate, ${throughput} req/s throughput`);
      
    } catch (error) {
      this.testResults.push({
        test: 'Stress Testing',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stress Testing: FAIL');
    }
  }

  async testConcurrentRequests() {
    console.log('  🔄 Testing Concurrent Requests...');
    
    try {
      const concurrentCount = 50;
      const requests = [];
      
      console.log(`    🎯 Testing ${concurrentCount} concurrent requests...`);
      
      const startTime = Date.now();
      
      // Create concurrent requests
      for (let i = 0; i < concurrentCount; i++) {
        const request = axios.get(`${this.baseURL}/api/crypto`, {
          headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
          timeout: 10000
        }).then(response => ({
          id: i + 1,
          success: true,
          status: response.status,
          responseTime: Date.now() - startTime
        })).catch(error => ({
          id: i + 1,
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        }));
        
        requests.push(request);
      }
      
      // Wait for all requests to complete
      const results = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Analyze concurrent results
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;
      const successRate = (successful / concurrentCount * 100).toFixed(1);
      
      if (successRate >= 80) { // 80% success rate
        this.testResults.push({
          test: 'Concurrent Requests',
          status: 'PASS',
          details: `Success rate: ${successRate}%, Total time: ${totalTime}ms, ${concurrentCount} concurrent requests`
        });
        console.log('    ✅ Concurrent Requests: PASS');
      } else {
        this.testResults.push({
          test: 'Concurrent Requests',
          status: 'FAIL',
          details: `Success rate: ${successRate}%, Total time: ${totalTime}ms, ${concurrentCount} concurrent requests`
        });
        console.log('    ❌ Concurrent Requests: FAIL');
      }
      
      console.log(`    📈 Results: ${successful}/${concurrentCount} successful (${successRate}%), Total time: ${totalTime}ms`);
      
    } catch (error) {
      this.testResults.push({
        test: 'Concurrent Requests',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Concurrent Requests: FAIL');
    }
  }

  async testMemoryUsage() {
    console.log('  💾 Testing Memory Usage...');
    
    try {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const largeArray = [];
      for (let i = 0; i < 10000; i++) {
        largeArray.push({
          id: i,
          data: `test-data-${i}`,
          timestamp: Date.now()
        });
      }
      
      const afterMemory = process.memoryUsage();
      
      // Calculate memory increase
      const heapUsedIncrease = afterMemory.heapUsed - initialMemory.heapUsed;
      const heapUsedIncreaseMB = (heapUsedIncrease / 1024 / 1024).toFixed(2);
      
      // Clean up
      largeArray.length = 0;
      
      const finalMemory = process.memoryUsage();
      const finalHeapUsedMB = (finalMemory.heapUsed / 1024 / 1024).toFixed(2);
      
      if (heapUsedIncreaseMB < 50) { // Less than 50MB increase
        this.testResults.push({
          test: 'Memory Usage',
          status: 'PASS',
          details: `Memory increase: ${heapUsedIncreaseMB}MB, Final heap: ${finalHeapUsedMB}MB`
        });
        console.log('    ✅ Memory Usage: PASS');
      } else {
        this.testResults.push({
          test: 'Memory Usage',
          status: 'WARN',
          details: `Memory increase: ${heapUsedIncreaseMB}MB, Final heap: ${finalHeapUsedMB}MB`
        });
        console.log('    ⚠️  Memory Usage: WARN');
      }
      
      console.log(`    📊 Memory: +${heapUsedIncreaseMB}MB, Final: ${finalHeapUsedMB}MB`);
      
    } catch (error) {
      this.testResults.push({
        test: 'Memory Usage',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Memory Usage: FAIL');
    }
  }

  generatePerformanceReport() {
    console.log('\n📊 Performance Metrics Summary:');
    console.log('='.repeat(50));
    
    if (this.performanceMetrics.responseTimes.length > 0) {
      const avgResponseTime = this.performanceMetrics.responseTimes
        .filter(r => r.status === 'success')
        .reduce((sum, r) => sum + r.responseTime, 0) / 
        this.performanceMetrics.responseTimes.filter(r => r.status === 'success').length;
      
      console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    }
    
    if (this.performanceMetrics.throughput) {
      console.log(`Load Test Throughput: ${this.performanceMetrics.throughput.throughput} req/s`);
      console.log(`Load Test Success Rate: ${((this.performanceMetrics.throughput.successful / this.performanceMetrics.throughput.total) * 100).toFixed(1)}%`);
    }
    
    // Save detailed performance report
    const reportData = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      performanceMetrics: this.performanceMetrics
    };
    
    const fs = require('fs');
    const reportPath = 'testsprite_tests/results/performance-report.json';
    
    if (!fs.existsSync('testsprite_tests/results')) {
      fs.mkdirSync('testsprite_tests/results', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📁 Detailed performance report saved to: ${reportPath}`);
  }

  printResults() {
    console.log('\n📊 Performance Test Results:');
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
  const performanceTests = new PerformanceTests();
  performanceTests.runAllTests();
}

module.exports = PerformanceTests;
