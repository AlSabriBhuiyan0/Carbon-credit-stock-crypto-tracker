# 🚀 Backend Setup Guide - Carbon credit tracker and stock,crypto asset prediction platform

## 📋 **Overview**
This backend provides a comprehensive API for carbon credit, stock, and crypto asset tracking, including AI forecasting capabilities (Prophet + ARIMA) and UNFCCC emissions data integration.

## 🎯 **Current Status: PRODUCTION READY** ✅

### **🚀 What's Working**
- **✅ Node.js/Express API Server** - Full REST API with authentication
- **✅ PostgreSQL Database** - Complete data models and relationships
- **✅ AI Forecasting Services** - Prophet (AI) + ARIMA (Statistical) models
- **✅ Authentication System** - JWT-based with Role-Based Access Control
- **✅ Real-time Updates** - WebSocket integration
- **✅ Data Ingestion** - Yahoo Finance + UNFCCC integration
- **✅ Portfolio Management** - Full CRUD operations for user portfolios

---

## 🏗️ **Architecture Overview**

```
Backend Architecture
├── Express.js Server          # Main API server
├── PostgreSQL Database        # Data persistence
├── Python AI Services        # Forecasting models
├── JWT Authentication        # User management
├── Role-Based Access Control # Security & permissions
├── WebSocket Service         # Real-time updates
└── Data Ingestion Services  # External data sources
```

### **Core Services**
- **Data Ingestion**: Stock, crypto, and carbon credit data collection
- **Forecasting**: ML-powered price predictions using ARIMA and Prophet models
- **UNFCCC**: Greenhouse gas emissions data from UNFCCC DI API
- **Authentication**: JWT-based user authentication and authorization
- **Database**: PostgreSQL models and data processing

---

## 🚀 **Complete Setup Guide for New System Members**

### **📋 Prerequisites**

Before starting, ensure you have these installed:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Python 3.8+** - [Download here](https://www.python.org/)
3. **PostgreSQL 13+** - [Download here](https://www.postgresql.org/)
4. **Git** - [Download here](https://git-scm.com/)

### **🔧 Step 1: Project Setup**

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd carbon-credit-and-stock-tracker/backend

# Verify structure (should NOT have node_modules)
ls -la
# You should see: models/, routes/, services/, package.json
# You should NOT see: node_modules/
```

### **🔧 Step 2: Install Dependencies**

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install pandas numpy scikit-learn statsmodels
pip install prophet  # For AI forecasting

# Verify Python packages
python -c "import pandas, numpy, statsmodels; print('✅ Python packages installed')"
```

### **🔧 Step 3: Environment Configuration**

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

#### **Required Environment Variables**

```env
# Server Configuration
NODE_ENV=development
PORT=5001
API_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/stock_carbon_tracker

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# API Keys (Optional for development)
YAHOO_FINANCE_API_KEY=your_yahoo_finance_key_here
UNFCCC_DI_API_KEY=your_unfccc_di_api_key_here

# Development Settings
DEBUG=true
ENABLE_SWAGGER=true
```

### **🔧 Step 4: Database Setup**

#### **PostgreSQL Installation & Setup**

```bash
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
# Windows: Start from Services app
# Mac: brew services start postgresql
# Ubuntu: sudo service postgresql start

# Create database
psql -U postgres
CREATE DATABASE stock_carbon_tracker;
\q

# Test connection
psql -U postgres -d stock_carbon_tracker -c "SELECT version();"
```

#### **Database Schema Creation**

```bash
# The database tables will be created automatically when you start the server
# All models include createTable() methods that run on startup
```

### **🔧 Step 5: Start the Backend Server**

```bash
# Start the server
npm start

# Or for development with auto-restart
npm run dev
```

#### **Expected Output**
```
🚀 Server starting...
📊 Initializing database connection...
✅ Database connected successfully
🔐 JWT middleware initialized
🌐 WebSocket service initialized
📈 Stock data ingestion scheduled
🌱 Carbon credit data ingestion scheduled
✅ Server running on port 5001
```

---

## 🌐 **API Endpoints**

### **Health Check**
- `GET /health` - Server health status

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### **Dashboard**
- `GET /api/dashboard/` - Main dashboard data
- `GET /api/dashboard/stocks` - Stock market data
- `GET /api/dashboard/crypto` - Crypto asset data
- `GET /api/dashboard/carbon` - Carbon credit data
- `GET /api/dashboard/forecasts` - AI predictions
- `GET /api/dashboard/sentiment` - Market sentiment
- `GET /api/dashboard/blockchain` - Blockchain status

### **Portfolio Management**
- `GET /api/portfolios/summary` - User portfolio summary
- `POST /api/portfolios/stocks` - Add stock to portfolio
- `POST /api/portfolios/crypto` - Add crypto asset to portfolio
- `POST /api/portfolios/carbon` - Add carbon credit to portfolio
- `PUT /api/portfolios/stocks/:symbol` - Update stock quantity
- `PUT /api/portfolios/crypto/:symbol` - Update crypto quantity
- `DELETE /api/portfolios/stocks/:symbol` - Remove stock from portfolio
- `DELETE /api/portfolios/crypto/:symbol` - Remove crypto asset from portfolio

### **Stocks**
- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/:symbol` - Get stock by symbol
- `GET /api/stocks/:symbol/history` - Get stock price history

### **Crypto Assets**
- `GET /api/crypto` - Get all crypto assets
- `GET /api/crypto/:symbol` - Get crypto asset by symbol
- `GET /api/crypto/:symbol/history` - Get crypto price history

### **Carbon Credits**
- `GET /api/carbon` - Get carbon credit data
- `GET /api/carbon/projects` - Get carbon projects
- `GET /api/carbon/market` - Get market data

---

## 🔐 **Authentication & Security**

### **JWT Token Structure**
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "role": "investor|company|regulator|ngo|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### **Role-Based Access Control (RBAC)**
- **Admin**: Full system access
- **Investor**: Portfolio management, market data
- **Company**: ESG tracking, compliance reporting
- **Regulator**: Oversight, audit access
- **NGO**: Impact tracking, sustainability metrics

### **Protected Routes**
All API endpoints (except `/health` and `/api/auth/*`) require valid JWT tokens.

---

## 🤖 **AI Forecasting Services**

### **Prophet Model (AI)**
- **Status**: ✅ FULLY OPERATIONAL
- **Use Case**: Long-term strategic forecasting
- **Input**: Time series data with dates
- **Output**: Predictions with confidence intervals

### **ARIMA Model (Statistical)**
- **Status**: ✅ FULLY OPERATIONAL
- **Use Case**: Short-term tactical predictions
- **Input**: Pure numeric time series
- **Output**: Statistical forecasts with RMSE metrics

### **Python Service Location**
```
backend/forcasting/
├── arimaService.py      # ARIMA forecasting
├── forecastService.py   # Prophet forecasting
└── unfcccService.py     # UNFCCC data service
```

---

## 📊 **Database Models**

### **Core Tables**
- **users** - User accounts and authentication
- **user_subscriptions** - Subscription plans
- **stocks** - Stock market data
- **carbon_credits** - Carbon credit projects
- **user_portfolios** - User asset holdings
- **notifications** - User notifications
- **reports** - Generated reports

### **Database Schema**
```sql
-- Example: Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('investor', 'company', 'regulator', 'ngo', 'admin')),
  account_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔍 **Testing the Backend**

### **1. Health Check**
```bash
curl http://localhost:5001/health
# Expected: {"status":"healthy","timestamp":"2025-08-23T..."}
```

### **2. Test Authentication**
```bash
# Register a test user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!@#","role":"investor"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

### **3. Test Dashboard API**
```bash
# Get dashboard data (requires token from login)
curl -X GET http://localhost:5001/api/dashboard/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. Test AI Forecasting**
```bash
# Test Prophet forecasting
curl -X GET "http://localhost:5001/api/dashboard/forecasts?symbols=AAPL&model=prophet&timeRange=1w" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test ARIMA forecasting
curl -X GET "http://localhost:5001/api/dashboard/forecasts?symbols=AAPL&model=arima&timeRange=1w" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Port Already in Use**
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5001 | xargs kill -9
```

#### **2. Database Connection Failed**
```bash
# Check PostgreSQL status
pg_ctl status

# Start PostgreSQL
pg_ctl start

# Verify credentials in .env file
# Test connection manually
psql -U postgres -d stock_carbon_tracker
```

#### **3. Python Dependencies Missing**
```bash
# Install required packages
pip install pandas numpy scikit-learn statsmodels prophet

# Verify installation
python -c "import pandas, numpy, statsmodels; print('All packages installed')"
```

#### **4. JWT Token Issues**
```bash
# Check JWT_SECRET in .env file
# Ensure it's a strong, unique secret
# Restart server after changing JWT_SECRET
```

#### **5. AI Forecasting Not Working**
```bash
# Check Python service files exist
ls backend/forcasting/

# Verify Python packages
python -c "import prophet; print('Prophet installed')"
python -c "import statsmodels; print('Statsmodels installed')"
```

---

## 📚 **Additional Resources**

- **System Status**: See `SYSTEM_STATUS.md`
- **RBAC System**: See `RBAC_SYSTEM_STATUS.md`
- **System Improvements**: See `SYSTEM_IMPROVEMENTS_SUMMARY.md`
- **API Documentation**: Available at `/api-docs` when server is running

---

## 🎯 **What You Can Do Now**

1. **✅ Start the Backend Server** - API will be available on port 5001
2. **✅ Test Authentication** - Register and login users
3. **✅ Access Dashboard API** - Get real-time market data
4. **✅ Use AI Forecasting** - Get Prophet and ARIMA predictions
5. **✅ Manage Portfolios** - Add/remove stocks and carbon credits
6. **✅ Real-time Updates** - WebSocket-powered live data

---

## 🆘 **Need Help?**

If you encounter any issues:

1. **Check the logs**: `backend/logs/app.log`
2. **Verify environment**: Ensure all variables in `.env` are set
3. **Check services**: Ensure PostgreSQL is running
4. **Review this documentation**: All setup steps are documented above
5. **Check system status**: See `SYSTEM_STATUS.md` for current status

---

**🎉 Your backend is now ready! The system is production-ready and fully functional with AI forecasting, real-time data, and comprehensive portfolio management.**
