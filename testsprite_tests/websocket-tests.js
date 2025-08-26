const WebSocket = require('ws');
const config = require('../testsprite.config.js');

class WebSocketTests {
  constructor() {
    this.testResults = [];
    this.connections = new Map();
  }

  async runAllTests() {
    console.log('🔌 Running WebSocket Tests...');
    
    try {
      await this.testStocksWebSocket();
      await this.testCryptoWebSocket();
      await this.testCarbonWebSocket();
      await this.testConnectionStability();
      
      this.printResults();
      await this.cleanup();
    } catch (error) {
      console.error('❌ WebSocket tests failed:', error.message);
    }
  }

  async testStocksWebSocket() {
    console.log('  📈 Testing Stocks WebSocket...');
    
    try {
      const ws = new WebSocket(config.websocket.stocks);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Stocks WebSocket connection timeout'));
        }, 10000);

        ws.on('open', () => {
          console.log('    ✅ Stocks WebSocket connected');
          
          // Subscribe to stock data
          const subscribeMsg = {
            type: 'subscribe',
            symbol: 'AAPL'
          };
          
          ws.send(JSON.stringify(subscribeMsg));
          
          setTimeout(() => {
            clearTimeout(timeout);
            ws.close();
            
            this.testResults.push({
              test: 'Stocks WebSocket',
              status: 'PASS',
              details: 'Stocks WebSocket connection and subscription successful'
            });
            
            resolve();
          }, 3000);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log('    📊 Received stocks data:', message.type || 'data');
          } catch (error) {
            console.log('    📊 Received raw data');
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
        test: 'Stocks WebSocket',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Stocks WebSocket: FAIL');
    }
  }

  async testCryptoWebSocket() {
    console.log('  🪙 Testing Crypto WebSocket...');
    
    try {
      const ws = new WebSocket(config.websocket.crypto);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Crypto WebSocket connection timeout'));
        }, 10000);

        ws.on('open', () => {
          console.log('    ✅ Crypto WebSocket connected');
          
          // Subscribe to crypto data
          const subscribeMsg = {
            method: 'SUBSCRIBE',
            params: ['btcusdt@trade'],
            id: 1
          };
          
          ws.send(JSON.stringify(subscribeMsg));
          
          setTimeout(() => {
            clearTimeout(timeout);
            ws.close();
            
            this.testResults.push({
              test: 'Crypto WebSocket',
              status: 'PASS',
              details: 'Crypto WebSocket connection and subscription successful'
            });
            
            resolve();
          }, 3000);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log('    📊 Received crypto data:', message.e || 'data');
          } catch (error) {
            console.log('    📊 Received raw data');
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
        test: 'Crypto WebSocket',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Crypto WebSocket: FAIL');
    }
  }

  async testCarbonWebSocket() {
    console.log('  🌱 Testing Carbon WebSocket...');
    
    try {
      const ws = new WebSocket(config.websocket.carbon);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Carbon WebSocket connection timeout'));
        }, 10000);

        ws.on('open', () => {
          console.log('    ✅ Carbon WebSocket connected');
          
          // Subscribe to carbon data
          const subscribeMsg = {
            type: 'subscribe',
            channel: 'carbon-credits'
          };
          
          ws.send(JSON.stringify(subscribeMsg));
          
          setTimeout(() => {
            clearTimeout(timeout);
            ws.close();
            
            this.testResults.push({
              test: 'Carbon WebSocket',
              status: 'PASS',
              details: 'Carbon WebSocket connection and subscription successful'
            });
            
            resolve();
          }, 3000);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log('    📊 Received carbon data:', message.type || 'data');
          } catch (error) {
            console.log('    📊 Received raw data');
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
        test: 'Carbon WebSocket',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Carbon WebSocket: FAIL');
    }
  }

  async testConnectionStability() {
    console.log('  🔄 Testing Connection Stability...');
    
    try {
      const connections = [];
      const promises = [];
      
      // Test multiple simultaneous connections
      for (let i = 0; i < 3; i++) {
        const ws = new WebSocket(config.websocket.stocks);
        connections.push(ws);
        
        const promise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error(`Connection ${i} timeout`));
          }, 5000);

          ws.on('open', () => {
            clearTimeout(timeout);
            setTimeout(() => {
              ws.close();
              resolve();
            }, 1000);
          });

          ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
        
        promises.push(promise);
      }
      
      await Promise.all(promises);
      
      this.testResults.push({
        test: 'Connection Stability',
        status: 'PASS',
        details: 'Multiple simultaneous connections handled successfully'
      });
      
      console.log('    ✅ Connection Stability: PASS');
      
    } catch (error) {
      this.testResults.push({
        test: 'Connection Stability',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Connection Stability: FAIL');
    }
  }

  async cleanup() {
    console.log('  🧹 Cleaning up WebSocket connections...');
    
    // Close all open connections
    for (const [name, connection] of this.connections) {
      if (connection.readyState === WebSocket.OPEN) {
        connection.close();
      }
    }
    
    this.connections.clear();
    console.log('    ✅ Cleanup completed');
  }

  printResults() {
    console.log('\n📊 WebSocket Test Results:');
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
  const wsTests = new WebSocketTests();
  wsTests.runAllTests();
}

module.exports = WebSocketTests;
