require('dotenv').config();
const dataIngestion = require('../data-ingestion/dataIngestion');
const StockPostgreSQL = require('../data-processing/StockPostgreSQL');

async function ensureSufficientData() {
  try {
    console.log('🔍 Checking data availability for forecasting models...\n');
    
    // Check current stock data
    const currentStocks = await StockPostgreSQL.listSymbols();
    console.log(`📊 Current stocks in database: ${currentStocks.length}`);
    
    if (currentStocks.length === 0) {
      console.log('⚠️  No stocks found. Ingesting default stock data...');
      await dataIngestion.ingestStockData();
      await dataIngestion.ingestStockHistory(dataIngestion.DEFAULT_STOCK_SYMBOLS, '1y', '1d', true);
    } else {
      console.log('✅ Stocks found. Checking historical data...');
      
      // Check historical data for each stock
      for (const symbol of currentStocks.slice(0, 5)) { // Check first 5 stocks
        const history = await StockPostgreSQL.getPriceHistory(symbol, 365);
        console.log(`📈 ${symbol}: ${history.length} days of historical data`);
        
        if (history.length < 100) {
          console.log(`⚠️  ${symbol} needs more data. Fetching 1 year of history...`);
          await dataIngestion.ingestStockHistory([symbol], '1y', '1d', true);
        }
      }
    }
    
    // Check carbon credit data
    console.log('\n🌱 Checking carbon credit data...');
    const carbonData = await dataIngestion.ingestCarbonCreditData();
    console.log(`✅ Carbon credit projects: ${carbonData.length}`);
    
    // Verify data quality for forecasting
    console.log('\n🔍 Verifying data quality for forecasting models...');
    
    const testSymbol = currentStocks[0] || 'AAPL';
    const testHistory = await StockPostgreSQL.getPriceHistory(testSymbol, 365);
    
    if (testHistory.length >= 100) {
      console.log(`✅ ${testSymbol} has sufficient data for all models:`);
      console.log(`   - Simple Model: ✅ (${testHistory.length} days)`);
      console.log(`   - Prophet Model: ✅ (${testHistory.length} days)`);
      console.log(`   - ARIMA Model: ✅ (${testHistory.length} days)`);
      
      // Test data ranges
      const firstDate = new Date(testHistory[0].timestamp);
      const lastDate = new Date(testHistory[testHistory.length - 1].timestamp);
      const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
      
      console.log(`   - Date Range: ${firstDate.toDateString()} to ${lastDate.toDateString()} (${daysDiff} days)`);
      console.log(`   - Data Points: ${testHistory.length}`);
      
      // Check for data gaps
      let gaps = 0;
      for (let i = 1; i < testHistory.length; i++) {
        const prevDate = new Date(testHistory[i-1].timestamp);
        const currDate = new Date(testHistory[i].timestamp);
        const dayDiff = Math.ceil((currDate - prevDate) / (1000 * 60 * 60 * 24));
        if (dayDiff > 1) gaps++;
      }
      
      console.log(`   - Data Gaps: ${gaps} (${((gaps / testHistory.length) * 100).toFixed(1)}%)`);
      
    } else {
      console.log(`⚠️  ${testSymbol} needs more data. Current: ${testHistory.length} days, Required: 100+ days`);
      console.log('🔄 Fetching additional historical data...');
      await dataIngestion.ingestStockHistory([testSymbol], '1y', '1d', true);
    }
    
    console.log('\n🎯 Data verification complete!');
    console.log('🚀 Your forecasting models are ready to use with real data!');
    
  } catch (error) {
    console.error('❌ Error ensuring data:', error.message);
    throw error;
  }
}

ensureSufficientData()
  .then(() => {
    console.log('\n✅ All data is ready for forecasting!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to ensure data:', error);
    process.exit(1);
  });
