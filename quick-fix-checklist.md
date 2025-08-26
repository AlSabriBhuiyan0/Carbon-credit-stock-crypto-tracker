# 🚀 Quick Fix Checklist - Start Here!

## ⚡ Immediate Actions (Today)

### 1. Check Backend Server Status
```bash
cd backend
npm run dev  # or whatever starts your backend
# Check console for errors
```

### 2. Verify Database Connection
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d carbon_tracker
# If password fails, check your .env file
```

### 3. Test Stock Endpoints Manually
```bash
# Test if backend is responding
curl http://localhost:5001/api/health

# Test stock endpoint
curl http://localhost:5001/api/stocks
```

## 🔧 Critical Fixes (This Week)

### Fix 1: Stock Service Routes
**File**: `backend/routes/stocks.js`
**Issue**: Routes not working (404 errors)

```javascript
// Add this basic route to test
router.get('/', (req, res) => {
  res.json({ message: 'Stock service working', status: 'ok' });
});

router.get('/list', (req, res) => {
  res.json({ stocks: ['AAPL', 'GOOGL', 'MSFT'] });
});
```

### Fix 2: Asset Type Detection
**File**: `backend/services/assetTypeService.js` (create new)
**Issue**: No asset type detection

```javascript
class AssetTypeService {
  static getAssetType(symbol) {
    const stockSymbols = ['AAPL', 'ADBE', 'AMD', 'GOOGL', 'MSFT'];
    const cryptoSymbols = ['BTC', 'ETH', 'VETUSDT', 'BNB', 'ADA'];
    
    if (stockSymbols.includes(symbol.toUpperCase())) {
      return 'stock';
    } else if (cryptoSymbols.includes(symbol.toUpperCase())) {
      return 'crypto';
    }
    return 'unknown';
  }
}

module.exports = AssetTypeService;
```

### Fix 3: Basic Asset Endpoints
**File**: `backend/routes/assets.js` (create new)
**Issue**: Missing asset selection endpoints

```javascript
const express = require('express');
const router = express.Router();
const AssetTypeService = require('../services/assetTypeService');

router.get('/:symbol/type', (req, res) => {
  const { symbol } = req.params;
  const assetType = AssetTypeService.getAssetType(symbol);
  res.json({ symbol, type: assetType });
});

router.post('/validate-mixed', (req, res) => {
  const { assets, maxAssets = 3 } = req.body;
  
  if (!assets || assets.length === 0) {
    return res.status(400).json({ isValid: false, error: 'No assets provided' });
  }
  
  if (assets.length > maxAssets) {
    return res.status(400).json({ isValid: false, error: 'Too many assets' });
  }
  
  const assetTypes = {};
  assets.forEach(asset => {
    assetTypes[asset] = AssetTypeService.getAssetType(asset);
  });
  
  res.json({ 
    isValid: true, 
    assetTypes,
    count: assets.length 
  });
});

module.exports = router;
```

### Fix 4: Update Main App
**File**: `backend/server.js`
**Issue**: Routes not registered

```javascript
// Add this line with your other route imports
const assetsRouter = require('./routes/assets');

// Add this line with your other app.use statements
app.use('/api/assets', assetsRouter);
```

## 🧪 Test After Each Fix

```bash
# Test specific fixes
npm run testsprite:stock      # Test stock service
npm run testsprite:mismatch   # Test asset detection
npm run testsprite:ui        # Test UI fixes

# Test everything
npm run testsprite
```

## 📋 Success Checklist

After implementing fixes, verify:

- [ ] Backend server starts without errors
- [ ] `curl http://localhost:5001/api/stocks` returns data
- [ ] `curl http://localhost:5001/api/assets/AAPL/type` returns `{"symbol":"AAPL","type":"stock"}`
- [ ] Stock page loads without "Service Unavailable" error
- [ ] TestSprite tests show fewer failures

## 🚨 If Still Broken

1. **Check backend logs** for specific error messages
2. **Verify port numbers** in your configuration
3. **Check if services are running** (database, external APIs)
4. **Test endpoints one by one** to isolate issues
5. **Run TestSprite again** to see what's still failing

## 📞 Next Steps

1. **Start with Fix 1** (stock routes)
2. **Test immediately** after each fix
3. **Move to Fix 2** (asset detection)
4. **Continue until TestSprite passes**
5. **Then implement the full solution** from the main analysis document

---

**Remember**: Fix one thing at a time and test immediately. TestSprite will tell you exactly what's working and what's not!
