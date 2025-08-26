# 🚀 Complete Setup Guide for New System Members

## 📋 **Overview**
This guide will walk you through setting up the Carbon Credit & Stock Tracker system from scratch on a new system. Follow these steps in order to get everything working.

## 🎯 **What You'll Have After Setup**
- ✅ **Backend API Server** running on port 5001
- ✅ **Frontend React App** running on port 3000
- ✅ **PostgreSQL Database** with all tables created
- ✅ **AI Forecasting Services** (Prophet + ARIMA) working
- ✅ **Real-time Data** from Yahoo Finance and UNFCCC
- ✅ **Portfolio Management** system fully functional
- ✅ **Role-Based Access Control** with demo users

---

## 🛠️ **Prerequisites Installation**

### **1. Install Node.js 18+**
```bash
# Windows: Download from https://nodejs.org/
# Mac: brew install node
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
```

### **2. Install Python 3.8+**
```bash
# Windows: Download from https://www.python.org/
# Mac: brew install python
# Ubuntu: sudo apt-get install python3 python3-pip

# Verify installation
python --version  # Should show Python 3.8.x or higher
pip --version     # Should show pip version
```

### **3. Install PostgreSQL 13+**
```bash
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib

# Verify installation
psql --version  # Should show psql version
```

### **4. Install Git**
```bash
# Windows: Download from https://git-scm.com/
# Mac: brew install git
# Ubuntu: sudo apt-get install git

# Verify installation
git --version  # Should show git version
```

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Clone the Repository**
```bash
# Clone the project
git clone <your-repo-url>
cd carbon-credit-and-stock-tracker

# Verify structure (should NOT have node_modules)
ls -la
# You should see: backend/, frontend/, README.md
# You should NOT see: node_modules/
```

### **Step 2: Backend Setup**
```bash
# Navigate to backend
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install pandas numpy scikit-learn statsmodels
pip install prophet  # For AI forecasting

# Verify Python packages
python -c "import pandas, numpy, statsmodels; print('✅ Python packages installed')"
```

### **Step 3: Database Setup**
```bash
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

### **Step 4: Environment Configuration**
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

#### **Required .env Configuration**
```env
# Server Configuration
NODE_ENV=development
PORT=5001
API_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/stock_carbon_tracker

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# Development Settings
DEBUG=true
ENABLE_SWAGGER=true
```

### **Step 5: Start Backend Server**
```bash
# Start the server
npm start

# Expected output:
# 🚀 Server starting...
# 📊 Initializing database connection...
# ✅ Database connected successfully
# 🔐 JWT middleware initialized
# 🌐 WebSocket service initialized
# 📈 Stock data ingestion scheduled
# 🌱 Carbon credit data ingestion scheduled
# ✅ Server running on port 5001
```

### **Step 6: Frontend Setup**
```bash
# Open new terminal
cd ../frontend

# Install React dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:5001" > .env
```

### **Step 7: Start Frontend**
```bash
# Start React development server
npm start

# Expected output:
# Compiled successfully!
# You can now view carbon-credit-and-stock-tracker in the browser.
# Local: http://localhost:3000
```

---

## 🧪 **Testing Your Setup**

### **1. Test Backend Health**
```bash
# Test server health
curl http://localhost:5001/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### **2. Test Database Connection**
```bash
# Test database
psql -U postgres -d stock_carbon_tracker -c "SELECT COUNT(*) FROM users;"
# Expected: A number (may be 0 if no users yet)
```

### **3. Test Frontend**
```bash
# Open browser to http://localhost:3000
# Should see the home page
# Navigate to /login to test authentication
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

## 👥 **Demo Users Setup**

### **Create Admin User**
```bash
# Register admin user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123!@#",
    "role": "admin",
    "first_name": "Admin",
    "last_name": "User"
  }'
```

### **Create Demo Users**
```bash
# Investor
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "investor",
    "email": "investor@demo.com",
    "password": "Demo123!@#",
    "role": "investor",
    "first_name": "Demo",
    "last_name": "Investor"
  }'

# Company
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "company",
    "email": "company@demo.com",
    "password": "Demo123!@#",
    "role": "company",
    "first_name": "Demo",
    "last_name": "Company"
  }'

# Regulator
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "regulator",
    "email": "regulator@demo.com",
    "password": "Demo123!@#",
    "role": "regulator",
    "first_name": "Demo",
    "last_name": "Regulator"
  }'

# NGO
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ngo",
    "email": "ngo@demo.com",
    "password": "Demo123!@#",
    "role": "ngo",
    "first_name": "Demo",
    "last_name": "NGO"
  }'
```

---

## 🌐 **Access Your Application**

### **Frontend URLs**
- **Main App**: http://localhost:3000
- **Dashboard**: http://localhost:3000/app/dashboard
- **Stocks**: http://localhost:3000/app/stocks
- **Carbon Credits**: http://localhost:3000/app/carbon
- **Portfolio**: http://localhost:3000/app/portfolio
- **Reports**: http://localhost:3000/app/reports

### **Backend API**
- **API Base**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/health
- **Documentation**: http://localhost:5001/api-docs

### **Demo User Credentials**
- **Admin**: admin@example.com / Admin123!@#
- **Investor**: investor@demo.com / Demo123!@#
- **Company**: company@demo.com / Demo123!@#
- **Regulator**: regulator@demo.com / Demo123!@#
- **NGO**: ngo@demo.com / Demo123!@#

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

#### **4. Node Modules Issues**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **5. Frontend Build Errors**
```bash
# Check for syntax errors
npm run build

# Verify all imports are correct
# Check for missing dependencies
```

---

## 📚 **Additional Resources**

- **Root README**: See `../README.md`
- **Backend Docs**: See `README.md`
- **Frontend Docs**: See `../frontend/README.md`
- **System Status**: See `SYSTEM_STATUS.md`
- **RBAC System**: See `RBAC_SYSTEM_STATUS.md`

---

## 🎯 **What You Can Do Now**

1. **✅ View Real-time Stock Data** - Live prices from Yahoo Finance
2. **✅ AI Forecasting** - Prophet + ARIMA predictions
3. **✅ Carbon Credit Tracking** - UN/UNFCCC data integration
4. **✅ Portfolio Management** - Add/remove stocks and carbon credits
5. **✅ Role-based Access** - Different dashboards for different user types
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

**🎉 Congratulations! Your Carbon Credit & Stock Tracker system is now fully set up and ready to use. The system is production-ready and fully functional with AI forecasting, real-time data, and comprehensive portfolio management.**
