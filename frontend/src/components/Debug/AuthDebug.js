import React from 'react';

const AuthDebug = () => {
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  const testStockAPI = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/stocks/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('Stock API test result:', data);
      alert(`Stock API test: ${response.ok ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Stock API test error:', error);
      alert(`Stock API test ERROR: ${error.message}`);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid #ccc', 
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h4>🔍 Auth Debug Panel</h4>
      <div><strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}</div>
      <div><strong>Refresh:</strong> {refreshToken ? '✅ Present' : '❌ Missing'}</div>
      {token && (
        <div style={{ marginTop: '5px', fontSize: '10px', wordBreak: 'break-all' }}>
          <strong>Token Preview:</strong> {token.substring(0, 20)}...
        </div>
      )}
      <button 
        onClick={testStockAPI}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Test Stock API
      </button>
    </div>
  );
};

export default AuthDebug;
