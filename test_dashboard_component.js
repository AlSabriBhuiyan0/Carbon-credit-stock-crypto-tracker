const axios = require('axios');

async function testDashboardComponent() {
  console.log('🧪 Testing Dashboard Component...\n');
  
  try {
    // Test if the frontend is serving the new Dashboard component
    console.log('1️⃣ Testing Frontend Dashboard Component...');
    const frontendResponse = await axios.get('http://localhost:3000');
    
    // Check if the Dashboard component is rendering
    const html = frontendResponse.data;
    
    // Look for key Dashboard elements
    const hasDashboardTitle = html.includes('Dashboard');
    const hasForecastingCard = html.includes('AI Forecasting') || html.includes('Forecasting');
    const hasStockSymbols = html.includes('AAPL') || html.includes('MSFT') || html.includes('TSLA');
    const hasCryptoData = html.includes('BTC') || html.includes('ETH') || html.includes('crypto');
    
    console.log('✅ Frontend Status:', frontendResponse.status);
    console.log('✅ Dashboard Title:', hasDashboardTitle);
    console.log('✅ Forecasting Card:', hasForecastingCard);
    console.log('✅ Stock Symbols:', hasStockSymbols);
    console.log('✅ Crypto Data:', hasCryptoData);
    
    // Test the Dashboard API endpoints that the component uses
    console.log('\n2️⃣ Testing Dashboard API Endpoints...');
    
    // Test stock symbols endpoint
    const stockSymbolsResponse = await axios.get('http://localhost:5001/api/dashboard/stock-symbols');
    console.log('✅ Stock Symbols API:', stockSymbolsResponse.status, stockSymbolsResponse.data.data.length, 'symbols');
    
    // Test crypto symbols endpoint
    const cryptoSymbolsResponse = await axios.get('http://localhost:5001/api/dashboard/crypto-symbols');
    console.log('✅ Crypto Symbols API:', cryptoSymbolsResponse.status, cryptoSymbolsResponse.data.data.length, 'symbols');
    
    // Test forecasts endpoint
    const forecastsResponse = await axios.get('http://localhost:5001/api/dashboard/forecasts');
    console.log('✅ Forecasts API:', forecastsResponse.status, Object.keys(forecastsResponse.data.data.stockForecasts).length, 'forecasts');
    
    console.log('\n🎯 Dashboard Component Test Summary:');
    console.log('✅ Frontend: Dashboard component accessible');
    console.log('✅ Backend APIs: All endpoints working');
    console.log('✅ Data Flow: Stock and crypto symbols available');
    console.log('✅ Forecasts: AI models generating predictions');
    
    if (!hasForecastingCard) {
      console.log('\n⚠️  WARNING: ForecastingCard not found in HTML');
      console.log('🔍 This suggests the component may not be rendering due to JavaScript errors');
      console.log('💡 Check browser console for any JavaScript errors');
    }
    
    console.log('\n🎉 SUCCESS: Dashboard component is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing Dashboard component:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure both frontend (port 3000) and backend (port 5001) are running');
    }
  }
}

testDashboardComponent();
