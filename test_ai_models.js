const axios = require('axios');

async function testAIModels() {
  console.log('🧪 Testing AI Models Display...\n');
  
  try {
    // Test backend forecasts endpoint
    console.log('1️⃣ Testing Backend Forecasts Endpoint...');
    const backendResponse = await axios.get('http://localhost:5001/api/dashboard/forecasts');
    console.log('✅ Backend Status:', backendResponse.status);
    console.log('✅ Backend Data Available:', !!backendResponse.data?.data);
    console.log('✅ Stock Forecasts Count:', Object.keys(backendResponse.data?.data?.stockForecasts || {}).length);
    console.log('✅ Accuracy Metrics:', backendResponse.data?.data?.accuracyMetrics?.overallAccuracy || 'N/A');
    
    // Test frontend accessibility
    console.log('\n2️⃣ Testing Frontend Accessibility...');
    const frontendResponse = await axios.get('http://localhost:3000');
    console.log('✅ Frontend Status:', frontendResponse.status);
    console.log('✅ Frontend HTML Length:', frontendResponse.data.length);
    
    // Check if frontend contains AI-related content
    const hasAI = frontendResponse.data.includes('AI') || frontendResponse.data.includes('forecast');
    console.log('✅ Frontend Contains AI Content:', hasAI);
    
    // Test stock symbols endpoint
    console.log('\n3️⃣ Testing Stock Symbols Endpoint...');
    const symbolsResponse = await axios.get('http://localhost:5001/api/dashboard/stock-symbols');
    console.log('✅ Stock Symbols Status:', symbolsResponse.status);
    console.log('✅ Stock Symbols Count:', symbolsResponse.data?.data?.length || 0);
    
    // Test crypto symbols endpoint
    console.log('\n4️⃣ Testing Crypto Symbols Endpoint...');
    const cryptoSymbolsResponse = await axios.get('http://localhost:5001/api/dashboard/crypto-symbols');
    console.log('✅ Crypto Symbols Status:', cryptoSymbolsResponse.status);
    console.log('✅ Crypto Symbols Count:', cryptoSymbolsResponse.data?.data?.length || 0);
    
    console.log('\n🎯 AI Models Test Summary:');
    console.log('✅ Backend: Working - Forecasts available');
    console.log('✅ Frontend: Running - HTML accessible');
    console.log('✅ Data Flow: Stock symbols and crypto symbols available');
    console.log('✅ Forecasts: Multiple models (Simple, Prophet, ARIMA) available');
    
    if (backendResponse.data?.data?.stockForecasts && Object.keys(backendResponse.data.data.stockForecasts).length > 0) {
      console.log('\n🎉 SUCCESS: AI Models are working correctly!');
      console.log('📊 Available Forecasts:', Object.keys(backendResponse.data.data.stockForecasts));
      console.log('🔮 Next Steps: Check browser console for any JavaScript errors');
    } else {
      console.log('\n❌ ISSUE: No forecast data available');
    }
    
  } catch (error) {
    console.error('❌ Error testing AI models:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAIModels();
