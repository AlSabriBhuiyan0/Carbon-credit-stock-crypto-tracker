# 🚀 Carbon credit tracker and stock,crypto asset prediction app

A comprehensive full-stack analytics platform for tracking and visualizing stock market data, crypto assets, and carbon credit transactions with AI-powered forecasting capabilities.

## 🎯 **Project Status: PRODUCTION READY** ✅

### **🚀 Core Features Implemented & Tested**
- **✅ AI Forecasting Models**: Prophet (AI) + ARIMA (Statistical) - FULLY OPERATIONAL
- **✅ Real Data Integration**: Yahoo Finance + UN/UNFCCC data - WORKING
- **✅ Frontend Dashboard**: Complete with real-time updates - WORKING
- **✅ Backend API**: Full REST API with authentication - WORKING
- **✅ Database**: PostgreSQL with comprehensive models - WORKING
- **✅ Portfolio Management**: Full CRUD operations - WORKING

---

## 🏗️ **System Architecture**

- **Frontend**: React.js + TailwindCSS + Chart.js
- **Backend**: Node.js/Express + PostgreSQL
- **AI Models**: Prophet (Facebook) + ARIMA (Statistical)
- **Data Sources**: Yahoo Finance + UNFCCC + Crypto APIs + Mock fallback
- **Authentication**: JWT-based with Role-Based Access Control (RBAC)
- **Real-time**: WebSocket integration for live updates

---

## 📁 **Project Structure**

```
carbon-credit-and-stock-tracker/
├── backend/                 # Node.js API server
│   ├── models/             # Database models
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   ├── middleware/         # Authentication & validation
│   ├── forcasting/         # Python AI services
│   └── docs/               # Backend documentation
├── frontend/                # React application
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
└── README.md               # This file
```

---

## 🚀 **Complete Setup Guide for New System Members**

### **📋 Prerequisites**

Before starting, ensure you have these installed on your system:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Python 3.8+** - [Download here](https://www.python.org/)
3. **PostgreSQL 13+** - [Download here](https://www.postgresql.org/)
4. **Git** - [Download here](https://git-scm.com/)

### **🔧 Step 1: Clone & Setup Project**

```bash
# Clone the repository
git clone <your-repo-url>
cd carbon-credit-and-stock-tracker

# Verify the structure (should NOT have node_modules)
ls -la
# You should see: backend/, frontend/, README.md
# You should NOT see: node_modules/
```

### **🔧 Step 2: Backend Setup**

```bash
# Navigate to backend
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install pandas numpy scikit-learn statsmodels
pip install prophet  # For AI forecasting

# Copy environment template
cp env.example .env

# Edit .env file with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/stock_carbon_tracker
# JWT_SECRET=your_super_secret_jwt_key_here
```

### **🔧 Step 3: Database Setup**

```bash
# Start PostgreSQL service
# Windows: Start PostgreSQL service from Services
# Mac/Linux: sudo service postgresql start

# Create database
psql -U postgres
CREATE DATABASE stock_carbon_tracker;
\q

# Test connection
psql -U postgres -d stock_carbon_tracker -c "SELECT version();"
```

### **🔧 Step 4: Frontend Setup**

```bash
# Navigate to frontend
cd ../frontend

# Install React dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:5001" > .env
```

### **🔧 Step 5: Start the Application**

```bash
# Terminal 1: Start Backend
cd backend
npm start
# Server will start on http://localhost:5001

# Terminal 2: Start Frontend
cd frontend
npm start
# React app will start on http://localhost:3000
```

---

## 🌐 **Access the Application**

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

---

## 👥 **Demo Users (Pre-configured)**

### **Admin User**
- **Username**: admin
- **Password**: Admin123!@#
- **Access**: Full system access

### **Demo Users**
- **Investor**: investor@demo.com / Demo123!@#
- **Company**: company@demo.com / Demo123!@#
- **Regulator**: regulator@demo.com / Demo123!@#
- **NGO**: ngo@demo.com / Demo123!@#

---

## 🔍 **Troubleshooting**

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

---

## 📚 **Additional Documentation**

- **Backend Setup**: See `backend/docs/README.md`
- **Frontend Setup**: See `frontend/README.md`
- **System Status**: See `backend/docs/SYSTEM_STATUS.md`
- **RBAC System**: See `backend/docs/RBAC_SYSTEM_STATUS.md`

---

## 🎯 **What You Can Do Now**

1. **✅ View Real-time Stock Data** - Live prices from Yahoo Finance
2. **✅ View Real-time Crypto Data** - Live prices and volumes from crypto APIs
3. **✅ AI Forecasting** - Prophet + ARIMA predictions for stocks and crypto
4. **✅ Carbon Credit Tracking** - UN/UNFCCC data integration with real market data
5. **✅ Portfolio Management** - Add/remove stocks, crypto, and carbon credits
6. **✅ Role-based Access** - Different dashboards for different user types
7. **✅ Real-time Updates** - WebSocket-powered live data

---

## 🆘 **Need Help?**

If you encounter any issues:

1. **Check the logs**: `backend/logs/app.log`
2. **Verify environment**: Ensure all variables in `.env` are set
3. **Check services**: Ensure PostgreSQL is running
4. **Review documentation**: Check the docs folders in both backend and frontend

---

**🎉 Welcome to the Carbon credit tracker and stock,crypto asset prediction platform! The system is production-ready and fully functional.**


