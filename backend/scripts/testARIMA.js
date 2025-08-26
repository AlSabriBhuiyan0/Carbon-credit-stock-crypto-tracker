require('dotenv').config();
const { runARIMA } = require('../forcasting/arimaNodeService');

async function testARIMA() {
  try {
    console.log('🧪 Testing ARIMA integration...');
    
    const testData = {
      series: [
        { ds: '2024-01-01', y: 100 }, { ds: '2024-01-02', y: 101 },
        { ds: '2024-01-03', y: 102 }, { ds: '2024-01-04', y: 103 },
        { ds: '2024-01-05', y: 104 }, { ds: '2024-01-06', y: 105 },
        { ds: '2024-01-07', y: 106 }, { ds: '2024-01-08', y: 107 },
        { ds: '2024-01-09', y: 108 }, { ds: '2024-01-10', y: 109 },
        { ds: '2024-01-11', y: 110 }, { ds: '2024-01-12', y: 111 },
        { ds: '2024-01-13', y: 112 }, { ds: '2024-01-14', y: 113 },
        { ds: '2024-01-15', y: 114 }, { ds: '2024-01-16', y: 115 },
        { ds: '2024-01-17', y: 116 }, { ds: '2024-01-18', y: 117 },
        { ds: '2024-01-19', y: 118 }, { ds: '2024-01-20', y: 119 }
      ],
      horizonDays: 3,
      params: { max_p: 3, max_d: 2, max_q: 3 }
    };
    
    console.log('📊 Sending test data to ARIMA...');
    const result = await runARIMA(testData);
    
    console.log('✅ ARIMA integration successful!');
    console.log('📈 Model:', result.model);
    console.log('🔮 Next prediction:', result.next);
    console.log('📊 Forecast path:', result.path.length, 'days');
    console.log('📋 ARIMA Order:', result.order);
    console.log('📊 Performance RMSE:', result.performance?.rmse);
    
    return result;
  } catch (error) {
    console.error('❌ ARIMA test failed:', error.message);
    throw error;
  }
}

testARIMA()
  .then(() => {
    console.log('🎉 All ARIMA tests passed!');
    console.log('🚀 ARIMA is ready to use in the dashboard!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
