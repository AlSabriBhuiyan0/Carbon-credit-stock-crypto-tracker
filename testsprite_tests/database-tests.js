const { Pool } = require('pg');
const config = require('../testsprite.config.js');

class DatabaseTests {
  constructor() {
    this.testResults = [];
    this.pool = null;
  }

  async runAllTests() {
    console.log('🗄️  Running Database Tests...');
    
    try {
      await this.initializeConnection();
      await this.testDatabaseConnection();
      await this.testTableExistence();
      await this.testCRUDOperations();
      await this.testDataIntegrity();
      await this.testPerformanceQueries();
      
      this.printResults();
      await this.cleanup();
    } catch (error) {
      console.error('❌ Database tests failed:', error.message);
    }
  }

  async initializeConnection() {
    console.log('  🔌 Initializing database connection...');
    
    try {
      this.pool = new Pool({
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('    ✅ Database connection established');
    } catch (error) {
      console.log('    ⚠️  Database connection failed, some tests may be skipped');
      console.log(`    Error: ${error.message}`);
    }
  }

  async testDatabaseConnection() {
    console.log('  🔗 Testing Database Connection...');
    
    if (!this.pool) {
      this.testResults.push({
        test: 'Database Connection',
        status: 'SKIP',
        details: 'No database connection available'
      });
      console.log('    ⚠️  Database Connection: SKIP (no connection)');
      return;
    }

    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT version()');
      client.release();
      
      if (result.rows && result.rows.length > 0) {
        this.testResults.push({
          test: 'Database Connection',
          status: 'PASS',
          details: 'Database connection and query successful'
        });
        console.log('    ✅ Database Connection: PASS');
      } else {
        throw new Error('No results returned from version query');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Database Connection',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Database Connection: FAIL');
    }
  }

  async testTableExistence() {
    console.log('  📋 Testing Table Existence...');
    
    if (!this.pool) {
      this.testResults.push({
        test: 'Table Existence',
        status: 'SKIP',
        details: 'No database connection available'
      });
      console.log('    ⚠️  Table Existence: SKIP (no connection)');
      return;
    }

    try {
      const expectedTables = [
        'users',
        'carbon_credits',
        'stocks',
        'crypto',
        'portfolios',
        'transactions'
      ];

      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      client.release();

      const existingTables = result.rows.map(row => row.table_name);
      const missingTables = expectedTables.filter(table => !existingTables.includes(table));

      if (missingTables.length === 0) {
        this.testResults.push({
          test: 'Table Existence',
          status: 'PASS',
          details: 'All expected tables exist'
        });
        console.log('    ✅ Table Existence: PASS');
      } else {
        this.testResults.push({
          test: 'Table Existence',
          status: 'FAIL',
          details: `Missing tables: ${missingTables.join(', ')}`
        });
        console.log('    ❌ Table Existence: FAIL');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Table Existence',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Table Existence: FAIL');
    }
  }

  async testCRUDOperations() {
    console.log('  🔄 Testing CRUD Operations...');
    
    if (!this.pool) {
      this.testResults.push({
        test: 'CRUD Operations',
        status: 'SKIP',
        details: 'No database connection available'
      });
      console.log('    ⚠️  CRUD Operations: SKIP (no connection)');
      return;
    }

    try {
      const client = await this.pool.connect();
      
      // Test CREATE operation
      const createResult = await client.query(`
        INSERT INTO users (email, password, first_name, last_name, role, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, ['test@example.com', 'hashedpassword', 'Test', 'User', 'investor']);
      
      const userId = createResult.rows[0].id;
      
      // Test READ operation
      const readResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      
      if (readResult.rows.length === 0) {
        throw new Error('User not found after creation');
      }
      
      // Test UPDATE operation
      await client.query('UPDATE users SET first_name = $1 WHERE id = $2', ['Updated', userId]);
      
      const updateResult = await client.query('SELECT first_name FROM users WHERE id = $1', [userId]);
      
      if (updateResult.rows[0].first_name !== 'Updated') {
        throw new Error('Update operation failed');
      }
      
      // Test DELETE operation
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      const deleteResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      
      if (deleteResult.rows.length > 0) {
        throw new Error('Delete operation failed');
      }
      
      client.release();
      
      this.testResults.push({
        test: 'CRUD Operations',
        status: 'PASS',
        details: 'Create, Read, Update, Delete operations successful'
      });
      console.log('    ✅ CRUD Operations: PASS');
      
    } catch (error) {
      this.testResults.push({
        test: 'CRUD Operations',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ CRUD Operations: FAIL');
    }
  }

  async testDataIntegrity() {
    console.log('  🔒 Testing Data Integrity...');
    
    if (!this.pool) {
      this.testResults.push({
        test: 'Data Integrity',
        status: 'SKIP',
        details: 'No database connection available'
      });
      console.log('    ⚠️  Data Integrity: SKIP (no connection)');
      return;
    }

    try {
      const client = await this.pool.connect();
      
      // Test foreign key constraints
      const constraintResult = await client.query(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      `);
      
      if (constraintResult.rows.length > 0) {
        this.testResults.push({
          test: 'Data Integrity',
          status: 'PASS',
          details: `Found ${constraintResult.rows.length} foreign key constraints`
        });
        console.log('    ✅ Data Integrity: PASS');
      } else {
        this.testResults.push({
          test: 'Data Integrity',
          status: 'WARN',
          details: 'No foreign key constraints found'
        });
        console.log('    ⚠️  Data Integrity: WARN (no constraints)');
      }
      
      client.release();
      
    } catch (error) {
      this.testResults.push({
        test: 'Data Integrity',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Data Integrity: FAIL');
    }
  }

  async testPerformanceQueries() {
    console.log('  ⚡ Testing Performance Queries...');
    
    if (!this.pool) {
      this.testResults.push({
        test: 'Performance Queries',
        status: 'SKIP',
        details: 'No database connection available'
      });
      console.log('    ⚠️  Performance Queries: SKIP (no connection)');
      return;
    }

    try {
      const client = await this.pool.connect();
      
      // Test query performance
      const startTime = Date.now();
      
      const result = await client.query(`
        SELECT 
          u.email,
          u.role,
          COUNT(p.id) as portfolio_count
        FROM users u
        LEFT JOIN portfolios p ON u.id = p.user_id
        GROUP BY u.id, u.email, u.role
        ORDER BY portfolio_count DESC
        LIMIT 10
      `);
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      client.release();
      
      if (queryTime < 1000) { // Less than 1 second
        this.testResults.push({
          test: 'Performance Queries',
          status: 'PASS',
          details: `Complex query completed in ${queryTime}ms`
        });
        console.log('    ✅ Performance Queries: PASS');
      } else {
        this.testResults.push({
          test: 'Performance Queries',
          status: 'WARN',
          details: `Query took ${queryTime}ms (slow)`
        });
        console.log('    ⚠️  Performance Queries: WARN (slow)');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'Performance Queries',
        status: 'FAIL',
        details: error.message
      });
      console.log('    ❌ Performance Queries: FAIL');
    }
  }

  async cleanup() {
    console.log('  🧹 Cleaning up database connections...');
    
    if (this.pool) {
      await this.pool.end();
      console.log('    ✅ Database connections closed');
    }
  }

  printResults() {
    console.log('\n📊 Database Test Results:');
    console.log('='.repeat(40));
    
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    const warned = this.testResults.filter(r => r.status === 'WARN').length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Skipped: ${skipped} ⚠️`);
    console.log(`Warnings: ${warned} ⚠️`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : 
                   result.status === 'SKIP' ? '⚠️' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`    ${result.details}`);
      }
    });
  }
}

// Run tests if called directly
if (require.main === module) {
  const dbTests = new DatabaseTests();
  dbTests.runAllTests();
}

module.exports = DatabaseTests;
