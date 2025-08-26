require('dotenv').config();
const forecastingService = require('../forcasting/forecasting');

async function testAllModels() {
  try {
    console.log('🧪 Testing All Forecasting Models...\n');
    
    // Test Simple Model
    console.log('📊 Testing Simple Model...');
    const simpleResult = await forecastingService.generateStockForecast(
      'AAPL', 30, 'simple', { horizonDays: 7 }
    );
    console.log('✅ Simple forecast successful!');
    console.log('📈 Model:', simpleResult.model);
    console.log('📊 Summary:', simpleResult.summary);
    
    // Test Prophet Model
    console.log('\n📊 Testing Prophet Model...');
    const prophetResult = await forecastingService.generateStockForecast(
      'AAPL', 30, 'prophet', { horizonDays: 7 }
    );
    console.log('✅ Prophet forecast successful!');
    console.log('📈 Model:', prophetResult.model);
    console.log('🔮 Next prediction:', prophetResult.next);
    console.log('📊 Forecast path:', prophetResult.path?.length || 0, 'days');
    
    // Test ARIMA Model
    console.log('\n📊 Testing ARIMA Model...');
    const arimaResult = await forecastingService.generateStockForecast(
      'AAPL', 30, 'arima', { horizonDays: 7 }
    );
    console.log('✅ ARIMA forecast successful!');
    console.log('📈 Model:', arimaResult.model);
    console.log('🔮 Next prediction:', arimaResult.next);
    console.log('📊 Forecast path:', arimaResult.path?.length || 0, 'days');
    console.log('📋 ARIMA Order:', arimaResult.order);
    console.log('📊 Performance RMSE:', arimaResult.performance?.rmse);
    
    console.log('\n🎉 All forecasting models tested successfully!');
    console.log('🚀 Dashboard is ready with Prophet vs ARIMA comparison!');
    
    return { simple: simpleResult, prophet: prophetResult, arima: arimaResult };
  } catch (error) {
    console.error('❌ Forecast test failed:', error.message);
    throw error;
  }
}

testAllModels()
  .then(() => {
    console.log('\n🎯 Ready to deploy to frontend!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
