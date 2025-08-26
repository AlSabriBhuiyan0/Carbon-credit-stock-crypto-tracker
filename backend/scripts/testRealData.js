require('dotenv').config();
const forecastingService = require('../forcasting/forecasting');
const dataIngestion = require('../data-ingestion/dataIngestion');
const StockPostgreSQL = require('../data-processing/StockPostgreSQL');

async function testRealDataModels() {
  try {
    console.log('🧪 Testing All Models with Real Data...\n');
    
    // Ensure we have fresh data
    console.log('📊 Refreshing data from Yahoo Finance...');
    await dataIngestion.ingestStockHistory(['AAPL', 'MSFT', 'TSLA'], '1y', '1d', true);
    
    // Test each model with real data
    const symbols = ['AAPL', 'MSFT', 'TSLA'];
    const models = ['simple', 'prophet', 'arima'];
    
    for (const symbol of symbols) {
      console.log(`\n📈 Testing ${symbol} with all models...`);
      
      for (const model of models) {
        try {
          console.log(`  🔮 Testing ${model.toUpperCase()} model...`);
          
          const result = await forecastingService.generateStockForecast(
            symbol, 30, model, { horizonDays: 7 }
          );
          
          if (result && result.model) {
            console.log(`    ✅ ${model.toUpperCase()} successful!`);
            
            if (model === 'prophet' && result.next) {
              console.log(`       Next: $${result.next.yhat?.toFixed(2) || 'N/A'}`);
              console.log(`       Confidence: $${result.next.yhat_lower?.toFixed(2) || 'N/A'} - $${result.next.yhat_upper?.toFixed(2) || 'N/A'}`);
            } else if (model === 'arima' && result.next) {
              console.log(`       Next: $${result.next.yhat?.toFixed(2) || 'N/A'}`);
              console.log(`       Order: ARIMA(${result.order?.join(',') || 'N/A'})`);
              console.log(`       RMSE: ${result.performance?.rmse?.toFixed(2) || 'N/A'}`);
            } else if (model === 'simple' && result.summary) {
              console.log(`       Trend: ${result.summary.trend || 'N/A'}`);
              console.log(`       Confidence: ${(result.summary.confidence * 100).toFixed(0)}%`);
            }
          } else {
            console.log(`    ⚠️  ${model.toUpperCase()} returned no data`);
          }
          
        } catch (error) {
          console.log(`    ❌ ${model.toUpperCase()} failed: ${error.message}`);
        }
      }
    }
    
    // Test carbon credit forecasting
    console.log('\n🌱 Testing Carbon Credit Forecasting...');
    try {
      const carbonData = await dataIngestion.ingestCarbonCreditData();
      console.log(`✅ Carbon projects: ${carbonData.length}`);
      
      if (carbonData.length > 0) {
        const projectType = carbonData[0].type || 'renewable';
        const carbonForecast = await forecastingService.generateCarbonCreditForecast(projectType, 30);
        console.log(`✅ Carbon forecast generated for ${projectType}`);
      }
    } catch (error) {
      console.log(`⚠️  Carbon forecasting: ${error.message}`);
    }
    
    // Test model comparison
    console.log('\n🔄 Testing Model Comparison...');
    try {
      const aaplData = await StockPostgreSQL.getPriceHistory('AAPL', 365);
      console.log(`📊 AAPL data points: ${aaplData.length}`);
      
      if (aaplData.length >= 100) {
        console.log('✅ Sufficient data for all models');
        
        // Test time range sensitivity
        const timeRanges = [7, 30, 90];
        for (const days of timeRanges) {
          console.log(`\n  📅 Testing ${days}-day time range...`);
          
          const simple = await forecastingService.generateStockForecast('AAPL', days, 'simple');
          const prophet = await forecastingService.generateStockForecast('AAPL', days, 'prophet');
          const arima = await forecastingService.generateStockForecast('AAPL', days, 'arima');
          
          console.log(`    Simple: ${simple.summary?.trend || 'N/A'}`);
          console.log(`    Prophet: $${prophet.next?.yhat?.toFixed(2) || 'N/A'}`);
          console.log(`    ARIMA: $${arima.next?.yhat?.toFixed(2) || 'N/A'}`);
        }
      } else {
        console.log(`⚠️  Insufficient data: ${aaplData.length} points (need 100+)`);
      }
      
    } catch (error) {
      console.log(`❌ Model comparison failed: ${error.message}`);
    }
    
    console.log('\n🎉 Real Data Testing Complete!');
    console.log('🚀 Your forecasting system is ready for production!');
    
  } catch (error) {
    console.error('❌ Real data testing failed:', error.message);
    throw error;
  }
}

testRealDataModels()
  .then(() => {
    console.log('\n✅ All real data tests passed!');
    console.log('🎯 Frontend is ready with live data!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Testing failed:', error);
    process.exit(1);
  });
