#!/usr/bin/env node

/**
 * Demo Users Initialization Script
 * This script creates demo users for testing different roles
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Demo users configuration
const DEMO_USERS = [
  {
    username: 'demo_investor',
    email: 'investor@demo.com',
    password: 'Demo123!@#',
    role: 'investor',
    first_name: 'John',
    last_name: 'Greenfield',
    company_id: 'INV_001',
    account_status: 'active'
  },
  {
    username: 'demo_company',
    email: 'company@demo.com',
    password: 'Demo123!@#',
    role: 'company',
    first_name: 'Sarah',
    last_name: 'Corporation',
    company_id: 'COMP_001',
    account_status: 'active'
  },
  {
    username: 'demo_regulator',
    email: 'regulator@demo.com',
    password: 'Demo123!@#',
    role: 'regulator',
    first_name: 'Michael',
    last_name: 'Oversight',
    company_id: 'REG_001',
    account_status: 'active'
  },
  {
    username: 'demo_ngo',
    email: 'ngo@demo.com',
    password: 'Demo123!@#',
    role: 'ngo',
    first_name: 'Emma',
    last_name: 'Impact',
    company_id: 'NGO_001',
    account_status: 'active'
  },
  {
    username: 'admin',
    email: 'admin@demo.com',
    password: 'Admin123!@#',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    company_id: 'ADMIN_001',
    account_status: 'active'
  }
];

// Database connection
let pool;

async function connectToDatabase() {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    return false;
  }
}

async function createUsersTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'public',
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        company_id VARCHAR(50),
        account_status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Users table created/verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to create users table:', error.message);
    return false;
  }
}

async function createDemoUsers() {
  try {
    console.log('\n🔧 Creating demo users...');
    
    for (const user of DEMO_USERS) {
      try {
        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE username = $1 OR email = $2',
          [user.username, user.email]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`⚠️ User ${user.username} already exists, skipping...`);
          continue;
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(user.password, saltRounds);
        
        // Insert user
        const insertQuery = `
          INSERT INTO users (username, email, password_hash, role, first_name, last_name, company_id, account_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, username, email, role
        `;
        
        const result = await pool.query(insertQuery, [
          user.username,
          user.email,
          passwordHash,
          user.role,
          user.first_name,
          user.last_name,
          user.company_id,
          user.account_status
        ]);
        
        console.log(`✅ Created ${user.role} user: ${user.username} (ID: ${result.rows[0].id})`);
        
      } catch (error) {
        console.error(`❌ Failed to create user ${user.username}:`, error.message);
      }
    }
    
    console.log('\n✅ Demo users creation completed');
    return true;
  } catch (error) {
    console.error('❌ Failed to create demo users:', error.message);
    return false;
  }
}

async function listUsers() {
  try {
    const result = await pool.query('SELECT id, username, email, role, account_status, created_at FROM users ORDER BY created_at');
    
    console.log('\n📋 Current users in database:');
    console.log('=' .repeat(80));
    console.log('ID\tUsername\t\tEmail\t\t\tRole\t\tStatus\t\tCreated');
    console.log('-' .repeat(80));
    
    result.rows.forEach(user => {
      console.log(`${user.id}\t${user.username.padEnd(16)}\t${user.email.padEnd(20)}\t${user.role.padEnd(12)}\t${user.account_status.padEnd(12)}\t${user.created_at.toISOString().split('T')[0]}`);
    });
    
    console.log(`\nTotal users: ${result.rows.length}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to list users:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Demo Users Initialization Script');
  console.log('===================================\n');
  
  try {
    // Connect to database
    const connected = await connectToDatabase();
    if (!connected) {
      console.log('\n❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Create users table
    const tableCreated = await createUsersTable();
    if (!tableCreated) {
      console.log('\n❌ Cannot proceed without users table');
      process.exit(1);
    }
    
    // Create demo users
    const usersCreated = await createDemoUsers();
    if (!usersCreated) {
      console.log('\n❌ Failed to create demo users');
      process.exit(1);
    }
    
    // List all users
    await listUsers();
    
    console.log('\n🎉 Demo users initialization completed successfully!');
    console.log('\n📋 Demo User Credentials:');
    console.log('==========================');
    
    DEMO_USERS.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });
    
    console.log('💡 You can now use these credentials to test different user roles');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DEMO_USERS, createDemoUsers };
