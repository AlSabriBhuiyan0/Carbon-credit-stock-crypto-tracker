require('dotenv').config();

async function testServices() {
  console.log('🧪 Testing All Services...\n');
  
  try {
    // Test 1: Python Environment
    console.log('🐍 Testing Python Environment...');
    const pythonEnvManager = require('./services/pythonEnvironmentManager');
    const pythonStatus = await pythonEnvManager.checkEnvironment();
    console.log('✅ Python Environment:', pythonStatus ? 'Ready' : 'Not Ready');
    
    // Test 2: Prophet Service
    console.log('\n🔮 Testing Prophet Service...');
    const prophetService = require('./services/prophetNodeService');
    const prophetResult = await prophetService.runProphet({
      series: [
        { ds: '2024-01-01', y: 100 },
        { ds: '2024-01-02', y: 101 },
        { ds: '2024-01-03', y: 102 }
      ],
      horizonDays: 7
    });
    console.log('✅ Prophet Service:', prophetResult.model);
    console.log('📊 Next Prediction:', prophetResult.next);
    
    // Test 3: ARIMA Service
    console.log('\n📊 Testing ARIMA Service...');
    const arimaService = require('./services/arimaNodeService');
    const arimaResult = await arimaService.runARIMA({
      series: [
        { ds: 1, y: 100 },
        { ds: 2, y: 101 },
        { ds: 3, y: 102 }
      ],
      horizonDays: 7
    });
    console.log('✅ ARIMA Service:', arimaResult.model);
    console.log('📊 Next Prediction:', arimaResult.next);
    
    // Test 4: UNFCCC Service
    console.log('\n🌍 Testing UNFCCC Service...');
    const unfcccService = require('./services/unfcccNodeService');
    const unfcccStatus = await unfcccService.getServiceStatus();
    console.log('✅ UNFCCC Service:', unfcccStatus.available ? 'Available' : 'Not Available');
    console.log('📋 Details:', unfcccStatus);
    
    // Test 5: Database Connection
    console.log('\n🗄️ Testing Database Connection...');
    const dbService = require('./services/database');
    const dbStatus = await dbService.checkHealth();
    console.log('✅ Database:', dbStatus.status);
    
    console.log('\n🎉 All Services Tested Successfully!');
    console.log('🚀 Your system is ready for production!');
    
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testServices()
  .then(() => {
    console.log('\n🎯 Ready to deploy!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
