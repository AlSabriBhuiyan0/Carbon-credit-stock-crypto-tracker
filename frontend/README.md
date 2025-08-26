# 🚀 Frontend Setup Guide - Carbon Credit & Stock Tracker

## 📋 **Overview**
This is the React frontend for the Carbon Credit & Stock Tracker application. It provides a comprehensive dashboard with real-time data visualization, AI forecasting, portfolio management, and role-based access control.

## 🎯 **Current Status: PRODUCTION READY** ✅

### **🚀 What's Working**
- **✅ React Dashboard** - Complete with all components and real-time updates
- **✅ Role-Based Access Control** - Different dashboards for different user types
- **✅ Real-time Data** - WebSocket integration for live updates
- **✅ AI Forecasting Display** - Prophet and ARIMA model results
- **✅ Portfolio Management** - Add/remove stocks and carbon credits
- **✅ Responsive Design** - Works on all screen sizes
- **✅ Authentication System** - JWT-based login/logout

---

## 🏗️ **Architecture Overview**

```
Frontend Architecture
├── React 18 + Hooks          # Modern React with functional components
├── TailwindCSS               # Utility-first CSS framework
├── Chart.js                  # Data visualization library
├── React Router DOM          # Client-side routing
├── Context API               # State management
├── WebSocket Integration     # Real-time data updates
└── Role-Based Components     # Different UIs for different user types
```

### **Core Components**
- **Dashboard**: Main application interface with multiple views
- **Authentication**: Login/register forms with JWT handling
- **Portfolio Management**: Stock and carbon credit tracking
- **AI Forecasting**: Display of Prophet and ARIMA predictions
- **Real-time Updates**: Live market data and notifications

---

## 🚀 **Complete Setup Guide for New System Members**

### **📋 Prerequisites**

Before starting, ensure you have these installed:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Git** - [Download here](https://git-scm.com/)
3. **Backend Server** - Must be running (see backend docs)

### **🔧 Step 1: Project Setup**

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd carbon-credit-and-stock-tracker/frontend

# Verify structure (should NOT have node_modules)
ls -la
# You should see: src/, public/, package.json, tailwind.config.js
# You should NOT see: node_modules/
```

### **🔧 Step 2: Install Dependencies**

```bash
# Install React dependencies
npm install

# Verify installation
npm list --depth=0
# Should show all packages without errors
```

### **🔧 Step 3: Environment Configuration**

```bash
# Create environment file
echo "REACT_APP_API_URL=http://localhost:5001" > .env

# Or create manually with more options
nano .env
```

#### **Environment Variables**

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5001
REACT_APP_WS_URL=ws://localhost:5001

# Application Configuration
REACT_APP_APP_NAME="Carbon Credit & Stock Tracker"
REACT_APP_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_ENABLE_REAL_TIME_UPDATES=true
REACT_APP_ENABLE_AI_FORECASTING=true
```

### **🔧 Step 4: Start the Frontend**

```bash
# Start development server
npm start

# Expected output:
# Compiled successfully!
# You can now view carbon-credit-and-stock-tracker in the browser.
# Local: http://localhost:3000
# On Your Network: http://192.168.x.x:3000
```

---

## 🌐 **Application Structure**

### **Main Routes**
- **`/`** - Home page with overview
- **`/login`** - User authentication
- **`/register`** - User registration
- **`/admin/login`** - Admin authentication
- **`/app/dashboard`** - Main user dashboard
- **`/app/stocks`** - Stock market view
- **`/app/carbon`** - Carbon credits view
- **`/app/portfolio`** - Portfolio management
- **`/app/reports`** - Reports and analytics

### **Role-Based Dashboards**
- **Investor**: Portfolio focus with investment tools
- **Company**: ESG tracking and compliance
- **Regulator**: Oversight and monitoring
- **NGO**: Impact measurement and sustainability
- **Admin**: Full system management

---

## 🎨 **Component Architecture**

### **Dashboard Components**
```
Dashboard
├── Overview Tab
│   ├── PortfolioSummaryCard
│   ├── QuickActionsCard
│   ├── MarketSentimentCard
│   └── SystemHealthCard
├── Stocks Tab
│   ├── StockMarketCard
│   └── StockPriceChart
├── Carbon Tab
│   ├── CarbonCreditsCard
│   └── CarbonCreditChart
├── Portfolio Tab
│   ├── PortfolioSummaryCard
│   └── PortfolioAllocationChart
├── Forecasts Tab
│   └── ForecastingCard
└── Combined Tab
    └── CombinedMetricsCard
```

### **Core Features**
- **Real-time Updates**: WebSocket-powered live data
- **AI Forecasting**: Prophet and ARIMA model display
- **Portfolio Management**: Add/remove assets
- **Role-based Access**: Different UIs for different users
- **Responsive Design**: Mobile and desktop optimized

---

## 🔐 **Authentication & Security**

### **User Types**
- **Public**: Basic access to home and plans
- **Authenticated Users**: Full dashboard access
- **Role-based**: Specific features based on user role
- **Admin**: Complete system access

### **JWT Token Handling**
- Automatic token refresh
- Secure storage in localStorage
- Automatic logout on expiration
- Role-based route protection

---

## 📊 **Data Integration**

### **API Endpoints**
- **Dashboard**: `/api/dashboard/*` - Main dashboard data
- **Portfolio**: `/api/portfolios/*` - Portfolio management
- **Authentication**: `/api/auth/*` - User authentication
- **Stocks**: `/api/stocks/*` - Stock market data
- **Carbon**: `/api/carbon/*` - Carbon credit data

### **Real-time Data**
- **WebSocket Events**: Market updates, notifications
- **Auto-refresh**: Periodic data updates
- **Live Charts**: Real-time chart updates
- **Notifications**: Real-time alerts and updates

---

## 🎯 **Key Features**

### **1. AI Forecasting Display**
- **Prophet Model**: AI-powered time series forecasting
- **ARIMA Model**: Statistical forecasting with RMSE metrics
- **Model Comparison**: Side-by-side predictions
- **Confidence Intervals**: Visual uncertainty representation

### **2. Portfolio Management**
- **Add Assets**: Stocks and carbon credits
- **Track Performance**: Real-time gains/losses
- **Asset Allocation**: Visual portfolio breakdown
- **Export Data**: CSV export functionality

### **3. Real-time Dashboard**
- **Live Updates**: WebSocket-powered data
- **Market Sentiment**: Real-time sentiment analysis
- **System Health**: Backend status monitoring
- **Notifications**: User alerts and updates

---

## 🔍 **Testing the Frontend**

### **1. Basic Functionality**
```bash
# Start the frontend
npm start

# Open browser to http://localhost:3000
# Verify home page loads
# Test navigation between pages
```

### **2. Authentication Flow**
```bash
# Test user registration
# Test user login
# Verify JWT token storage
# Test protected route access
```

### **3. Dashboard Features**
```bash
# Test dashboard loading
# Verify real-time data updates
# Test AI forecasting display
# Test portfolio management
```

### **4. Responsive Design**
```bash
# Test on different screen sizes
# Verify mobile navigation
# Test touch interactions
# Check cross-browser compatibility
```

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Port Already in Use**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

#### **2. Dependencies Issues**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **3. Backend Connection Failed**
```bash
# Verify backend is running on port 5001
curl http://localhost:5001/health

# Check .env file has correct API URL
cat .env
```

#### **4. Build Errors**
```bash
# Check for syntax errors
npm run build

# Verify all imports are correct
# Check for missing dependencies
```

#### **5. WebSocket Connection Issues**
```bash
# Verify backend WebSocket is running
# Check .env has correct WS URL
# Ensure no firewall blocking WebSocket
```

---

## 🛠️ **Development Commands**

### **Available Scripts**
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App
npm run eject
```

### **Development Tools**
- **React Developer Tools**: Browser extension for debugging
- **Redux DevTools**: State management debugging
- **Network Tab**: Monitor API calls and WebSocket
- **Console**: JavaScript error logging

---

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Mobile Features**
- Touch-friendly navigation
- Swipe gestures
- Optimized layouts
- Mobile-first design approach

---

## 🌐 **Browser Support**

### **Supported Browsers**
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### **Required Features**
- ES6+ support
- CSS Grid and Flexbox
- WebSocket support
- Local Storage

---

## 📚 **Additional Resources**

- **Backend Setup**: See `../backend/docs/README.md`
- **System Status**: See `../backend/docs/SYSTEM_STATUS.md`
- **RBAC System**: See `../backend/docs/RBAC_SYSTEM_STATUS.md`
- **React Documentation**: [reactjs.org](https://reactjs.org/)
- **TailwindCSS**: [tailwindcss.com](https://tailwindcss.com/)

---

## 🎯 **What You Can Do Now**

1. **✅ Start the Frontend** - React app will be available on port 3000
2. **✅ Navigate the Dashboard** - Explore all tabs and features
3. **✅ Test Authentication** - Register and login users
4. **✅ View Real-time Data** - See live market updates
5. **✅ Use AI Forecasting** - View Prophet and ARIMA predictions
6. **✅ Manage Portfolios** - Add/remove stocks and carbon credits
7. **✅ Test Responsiveness** - Verify mobile and desktop layouts

---

## 🆘 **Need Help?**

If you encounter any issues:

1. **Check the console**: Browser developer tools
2. **Verify backend**: Ensure backend is running on port 5001
3. **Check environment**: Verify .env file configuration
4. **Review this documentation**: All setup steps are documented above
5. **Check network tab**: Monitor API calls and WebSocket connections

---

**🎉 Your frontend is now ready! The React application is production-ready and fully functional with real-time data, AI forecasting display, and comprehensive portfolio management.**
