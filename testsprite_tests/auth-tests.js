const axios = require('axios');
const config = require('../testsprite.config.js');

class AuthTests {
  constructor() {
    this.baseURL = config.endpoints.backend;
    this.testResults = [];
    this.authToken = null;
  }

  async runAllTests() {
    console.log('🔐 Running Authentication Tests...');
    
    try {
      await this.testUserRegistration();
      await this.testUserLogin();
      await this.testTokenValidation();
      await this.testRoleBasedAccess();
      await this.testPasswordReset();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Authentication tests failed:', error.message);
    }
  }

  async testUserRegistration() {
    console.log('  📝 Testing User Registration...');
    
    try {
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'investor'
      };

      const response = await axios.post(`${this.baseURL}/api/auth/register`, testUser);
      
      if (response.status === 201 || response.status === 200) {
        this.testResults.push({
          test: 'User Registration',
          status: 'PASS',
          details: 'User registered successfully'
        });
        console.log('    ✅ User Registration: PASS');
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.testResults.push({
        test: 'User Registration',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ User Registration: FAIL');
    }
  }

  async testUserLogin() {
    console.log('  🔑 Testing User Login...');
    
    try {
      const loginData = {
        email: config.testData.users.admin.email,
        password: config.testData.users.admin.password
      };

      const response = await axios.post(`${this.baseURL}/api/auth/login`, loginData);
      
      if (response.status === 200 && response.data.token) {
        this.authToken = response.data.token;
        this.testResults.push({
          test: 'User Login',
          status: 'PASS',
          details: 'User logged in successfully, token received'
        });
        console.log('    ✅ User Login: PASS');
      } else {
        throw new Error('No token received in response');
      }
    } catch (error) {
      this.testResults.push({
        test: 'User Login',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ User Login: FAIL');
    }
  }

  async testTokenValidation() {
    console.log('  🎫 Testing Token Validation...');
    
    if (!this.authToken) {
      this.testResults.push({
        test: 'Token Validation',
        status: 'SKIP',
        details: 'No auth token available'
      });
      console.log('    ⚠️  Token Validation: SKIP (no token)');
      return;
    }

    try {
      const response = await axios.get(`${this.baseURL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.status === 200) {
        this.testResults.push({
          test: 'Token Validation',
          status: 'PASS',
          details: 'Token validated successfully'
        });
        console.log('    ✅ Token Validation: PASS');
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.testResults.push({
        test: 'Token Validation',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Token Validation: FAIL');
    }
  }

  async testRoleBasedAccess() {
    console.log('  👥 Testing Role-Based Access...');
    
    if (!this.authToken) {
      this.testResults.push({
        test: 'Role-Based Access',
        status: 'SKIP',
        details: 'No auth token available'
      });
      console.log('    ⚠️  Role-Based Access: SKIP (no token)');
      return;
    }

    try {
      // Test admin endpoint access
      const response = await axios.get(`${this.baseURL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.status === 200) {
        this.testResults.push({
          test: 'Role-Based Access',
          status: 'PASS',
          details: 'Admin endpoint accessible with valid token'
        });
        console.log('    ✅ Role-Based Access: PASS');
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.testResults.push({
        test: 'Role-Based Access',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Role-Based Access: FAIL');
    }
  }

  async testPasswordReset() {
    console.log('  🔄 Testing Password Reset...');
    
    try {
      const resetData = {
        email: config.testData.users.admin.email
      };

      const response = await axios.post(`${this.baseURL}/api/auth/forgot-password`, resetData);
      
      if (response.status === 200) {
        this.testResults.push({
          test: 'Password Reset',
          status: 'PASS',
          details: 'Password reset request sent successfully'
        });
        console.log('    ✅ Password Reset: PASS');
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.testResults.push({
        test: 'Password Reset',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Password Reset: FAIL');
    }
  }

  printResults() {
    console.log('\n📊 Authentication Test Results:');
    console.log('='.repeat(40));
    
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Skipped: ${skipped} ⚠️`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`    ${result.details}`);
      }
    });
  }
}

// Run tests if called directly
if (require.main === module) {
  const authTests = new AuthTests();
  authTests.runAllTests();
}

module.exports = AuthTests;
