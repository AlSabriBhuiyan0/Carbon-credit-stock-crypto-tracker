# TestSprite Testing Framework

TestSprite is a comprehensive testing framework for the Carbon Credit & Stock Tracker application. It provides automated testing for authentication, API endpoints, WebSocket connections, database operations, and AI forecasting services.

## 🚀 Quick Start

### 1. Run All Tests
```bash
npm run testsprite
```

### 2. Run Specific Test Suites
```bash
# Authentication tests only
npm run testsprite:auth

# API endpoint tests only
npm run testsprite:api

# Check TestSprite setup
npm run testsprite:setup
```

## 📁 Project Structure

```
testsprite_tests/
├── auth-tests.js          # User authentication tests
├── api-tests.js           # API endpoint tests
├── websocket-tests.js     # WebSocket connection tests
├── database-tests.js      # Database operation tests
├── forecasting-tests.js   # AI forecasting tests
├── performance-tests.js   # Performance and load tests
└── results/               # Test results and reports
```

## ⚙️ Configuration

The TestSprite configuration is in `testsprite.config.js` and includes:

- **Project Settings**: Name, version, description
- **Test Configuration**: Directory, output, coverage, timeout
- **Endpoints**: Backend, frontend, and API URLs
- **Test Data**: Sample users, stocks, crypto, carbon projects
- **Database**: Test database configuration
- **WebSocket**: Real-time data connection settings
- **AI Services**: Prophet, ARIMA, and Simple forecasting endpoints
- **Performance**: Load and stress test parameters

## 🧪 Test Suites

### Authentication Tests (`auth-tests.js`)
- User registration
- User login
- Token validation
- Role-based access control
- Password reset functionality

### API Endpoint Tests (`api-tests.js`)
- Stocks API (list, data retrieval)
- Crypto API (list, data retrieval)
- Carbon Credits API (projects, credits)
- Dashboard API (authenticated access)
- Portfolio API (user portfolios)
- Forecasting API (Prophet, ARIMA)

### WebSocket Tests (`websocket-tests.js`)
- Real-time stock data streaming
- Cryptocurrency price updates
- Carbon credit monitoring
- Connection stability and reconnection

### Database Tests (`database-tests.js`)
- Database connectivity
- CRUD operations
- Data integrity
- Performance queries

### AI Forecasting Tests (`forecasting-tests.js`)
- Prophet model accuracy
- ARIMA model performance
- Simple forecasting validation
- Model training and prediction

### Performance Tests (`performance-tests.js`)
- Load testing (100 concurrent users)
- Stress testing (500 concurrent users)
- Response time analysis
- Resource utilization

## 🔧 Setup Requirements

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL database
- Backend server running on port 5001
- Frontend server running on port 3000

### Installation
```bash
# Install dependencies
npm install

# Verify TestSprite MCP is installed
npm list @testsprite/testsprite-mcp
```

### Environment Variables
Create a `.env` file in the project root:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=carbon_tracker_test
DB_USER=postgres
DB_PASSWORD=your_test_password

# API Keys (if required)
FINNHUB_API_KEY=your_finnhub_key
BINANCE_API_KEY=your_binance_key

# Test Configuration
NODE_ENV=test
TEST_TIMEOUT=30000
```

## 📊 Test Results

Test results are automatically saved to `testsprite_tests/results/` and include:

- **Summary Report**: Total tests, passed, failed, success rate
- **Detailed Results**: Individual test outcomes with details
- **Performance Metrics**: Response times, throughput
- **Error Logs**: Detailed error information for debugging

### Sample Output
```
🚀 Initializing TestSprite for Carbon Credit & Stock Tracker...
✅ TestSprite MCP found
✅ Configuration loaded
✅ Test directory: ./testsprite_tests

🧪 Running all TestSprite tests...

📋 Running Authentication Tests...
  📝 Testing User Registration...
    ✅ User Registration: PASS
  🔑 Testing User Login...
    ✅ User Login: PASS
  🎫 Testing Token Validation...
    ✅ Token Validation: PASS

📊 Test Results Summary:
==================================================
Total Test Suites: 6
Passed: 5 ✅
Failed: 1 ❌
Success Rate: 83.3%

🎉 TestSprite execution completed!
```

## 🐛 Troubleshooting

### Common Issues

1. **TestSprite MCP Not Found**
   ```bash
   npm install @testsprite/testsprite-mcp
   ```

2. **Backend Server Not Running**
   ```bash
   # Start backend server
   cd backend && npm start
   ```

3. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check database credentials in config
   - Ensure test database exists

4. **Authentication Tests Failing**
   - Verify admin user exists in database
   - Check password in config matches database
   - Ensure auth endpoints are working

### Debug Mode
```bash
# Run with verbose logging
DEBUG=testsprite:* npm run testsprite

# Run specific test with debugging
node --inspect testsprite_tests/auth-tests.js
```

## 🔄 Continuous Integration

TestSprite can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run TestSprite Tests
  run: |
    npm install
    npm run testsprite
  env:
    NODE_ENV: test
    DB_HOST: localhost
    DB_PORT: 5432
```

## 📈 Performance Testing

### Load Testing
```bash
# Run load test with 100 users over 60 seconds
npm run testsprite:performance:load
```

### Stress Testing
```bash
# Run stress test with 500 users over 120 seconds
npm run testsprite:performance:stress
```

## 🤝 Contributing

To add new tests:

1. Create a new test file in `testsprite_tests/`
2. Follow the existing test structure
3. Add the test to the main runner in `run-testsprite.js`
4. Update the configuration if needed
5. Run tests to verify everything works

### Test File Template
```javascript
const config = require('../testsprite.config.js');

class NewFeatureTests {
  constructor() {
    this.baseURL = config.endpoints.backend;
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Running New Feature Tests...');
    
    try {
      await this.testFeature1();
      await this.testFeature2();
      this.printResults();
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
    }
  }

  // Add your test methods here
}

module.exports = NewFeatureTests;
```

## 📚 Additional Resources

- [TestSprite Documentation](https://docs.testsprite.com)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Jest Testing Framework](https://jestjs.io/)
- [Playwright E2E Testing](https://playwright.dev/)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review test logs in `testsprite_tests/results/`
3. Verify configuration in `testsprite.config.js`
4. Ensure all dependencies are installed
5. Check that backend services are running

---

**Happy Testing! 🎯**
