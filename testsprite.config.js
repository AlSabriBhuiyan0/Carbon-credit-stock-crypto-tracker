module.exports = {
  // TestSprite configuration for Carbon Credit & Stock Tracker
  project: {
    name: "carbon-credit-stock-tracker",
    version: "1.0.0",
    description: "Carbon Credit & Stock Tracker with AI Forecasting"
  },
  
  // Test configuration
  tests: {
    directory: "./testsprite_tests",
    output: "./testsprite_tests/results",
    coverage: true,
    parallel: true,
    timeout: 30000
  },
  
  // Application endpoints
  endpoints: {
    backend: "http://localhost:5001",
    frontend: "http://localhost:3000",
    api: "http://localhost:5001/api"
  },
  
  // Test data configuration
  testData: {
    users: {
      admin: {
        email: "alsunny43@gmail.com",
        password: "Alsunny65@",
        role: "admin"
      },
      investor: {
        email: "investor@test.com",
        password: "testpass123",
        role: "investor"
      },
      company: {
        email: "company@test.com",
        password: "testpass123",
        role: "company"
      }
    },
    stocks: ["AAPL", "GOOGL", "MSFT", "TSLA"],
    crypto: ["BTC", "ETH", "BNB", "ADA"],
    carbonProjects: ["reforestation", "renewable-energy", "methane-capture"]
  },
  
  // Database configuration for testing
  database: {
    host: "localhost",
    port: 5432,
    name: "carbon_tracker_test",
    user: "postgres",
    password: "your_test_password"
  },
  
  // WebSocket configuration
  websocket: {
    stocks: "wss://ws.finnhub.io",
    crypto: "wss://stream.binance.com:9443",
    carbon: "wss://localhost:5001"
  },
  
  // AI/ML services configuration
  aiServices: {
    prophet: {
      enabled: true,
      endpoint: "http://localhost:5001/api/forecast/prophet"
    },
    arima: {
      enabled: true,
      endpoint: "http://localhost:5001/api/forecast/arima"
    },
    simple: {
      enabled: true,
      endpoint: "http://localhost:5001/api/forecast/simple"
    }
  },
  
  // Notification settings
  notifications: {
    email: false,
    webhook: false,
    slack: false
  },
  
  // Performance testing
  performance: {
    loadTest: {
      users: 100,
      duration: 60,
      rampUp: 10
    },
    stressTest: {
      users: 500,
      duration: 120,
      rampUp: 30
    }
  }
};
