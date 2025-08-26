#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Database Setup Script for Carbon Credit & Stock Tracker');
console.log('========================================================\n');

// Check if we're on Windows
const isWindows = process.platform === 'win32';

// Function to run commands with proper error handling
function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed successfully`);
    return result;
  } catch (error) {
    console.log(`❌ ${description} failed: ${error.message}`);
    return null;
  }
}

// Function to check if PostgreSQL is running
function checkPostgreSQLStatus() {
  console.log('\n🔍 Checking PostgreSQL Status...');
  
  if (isWindows) {
    // Windows commands
    try {
      const status = execSync('sc query postgresql-x64-15', { encoding: 'utf8' });
      if (status.includes('RUNNING')) {
        console.log('✅ PostgreSQL service is running');
        return true;
      } else {
        console.log('❌ PostgreSQL service is not running');
        return false;
      }
    } catch (error) {
      console.log('❌ Could not check PostgreSQL service status');
      return false;
    }
  } else {
    // Unix/Linux commands
    try {
      const status = execSync('pg_ctl status -D /usr/local/var/postgres', { encoding: 'utf8' });
      if (status.includes('server is running')) {
        console.log('✅ PostgreSQL is running');
        return true;
      } else {
        console.log('❌ PostgreSQL is not running');
        return false;
      }
    } catch (error) {
      console.log('❌ Could not check PostgreSQL status');
      return false;
    }
  }
}

// Function to start PostgreSQL
function startPostgreSQL() {
  console.log('\n🚀 Starting PostgreSQL...');
  
  if (isWindows) {
    runCommand('net start postgresql-x64-15', 'Starting PostgreSQL service');
  } else {
    runCommand('pg_ctl start -D /usr/local/var/postgres', 'Starting PostgreSQL');
  }
}

// Function to create database and user
function setupDatabase() {
  console.log('\n🗄️ Setting up database...');
  
  try {
    // Try to connect as postgres user
    console.log('📝 Attempting to create database...');
    
    if (isWindows) {
      runCommand('createdb -U postgres stock_carbon_tracker', 'Creating database');
    } else {
      runCommand('createdb -U postgres stock_carbon_tracker', 'Creating database');
    }
    
    console.log('✅ Database setup completed');
  } catch (error) {
    console.log('❌ Database setup failed. You may need to:');
    console.log('   1. Install PostgreSQL if not already installed');
    console.log('   2. Set a password for the postgres user');
    console.log('   3. Create the database manually');
  }
}

// Function to test database connection
function testConnection() {
  console.log('\n🧪 Testing database connection...');
  
  try {
    const result = execSync('psql -U postgres -d stock_carbon_tracker -c "SELECT version();"', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('✅ Database connection successful');
    console.log('📊 PostgreSQL version:', result.trim());
    return true;
  } catch (error) {
    console.log('❌ Database connection failed');
    return false;
  }
}

// Function to create .env file
function createEnvFile() {
  console.log('\n📝 Creating .env file...');
  
  const envPath = path.join(__dirname, '.env');
  const envContent = `# Server Configuration
NODE_ENV=development
PORT=5001
API_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000

# Database Configuration - UPDATE THESE VALUES
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stock_carbon_tracker
# If you have a different password, update the line above
# Example: DATABASE_URL=postgresql://postgres:your_password@localhost:5432/stock_carbon_tracker

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Development
DEBUG=true
ENABLE_SWAGGER=true
ENABLE_LOGGING=true
`;

  try {
    if (fs.existsSync(envPath)) {
      console.log('⚠️ .env file already exists. Please update DATABASE_URL manually.');
      console.log('📋 Current DATABASE_URL should be: postgresql://postgres:your_password@localhost:5432/stock_carbon_tracker');
    } else {
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file created successfully');
      console.log('📋 Please update the DATABASE_URL with your actual PostgreSQL password');
    }
  } catch (error) {
    console.log('❌ Failed to create .env file:', error.message);
  }
}

// Function to provide manual setup instructions
function showManualInstructions() {
  console.log('\n📚 Manual Setup Instructions:');
  console.log('=============================');
  console.log('1. Install PostgreSQL if not already installed');
  console.log('2. Start PostgreSQL service');
  console.log('3. Set a password for the postgres user:');
  console.log('   psql -U postgres');
  console.log('   ALTER USER postgres PASSWORD \'your_password\';');
  console.log('   \\q');
  console.log('4. Create the database:');
  console.log('   createdb -U postgres stock_carbon_tracker');
  console.log('5. Update the .env file with your password');
  console.log('6. Restart the backend server');
}

// Main execution
async function main() {
  console.log('🔍 Starting database setup...\n');
  
  // Check PostgreSQL status
  const isRunning = checkPostgreSQLStatus();
  
  if (!isRunning) {
    console.log('\n⚠️ PostgreSQL is not running. Attempting to start...');
    startPostgreSQL();
    
    // Wait a moment for service to start
    console.log('⏳ Waiting for PostgreSQL to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check status again
    if (!checkPostgreSQLStatus()) {
      console.log('\n❌ Failed to start PostgreSQL automatically');
      showManualInstructions();
      return;
    }
  }
  
  // Setup database
  setupDatabase();
  
  // Test connection
  if (testConnection()) {
    console.log('\n🎉 Database setup completed successfully!');
    console.log('📋 You can now start your backend server');
  } else {
    console.log('\n❌ Database connection test failed');
    showManualInstructions();
  }
  
  // Create .env file
  createEnvFile();
  
  console.log('\n✨ Setup script completed!');
  console.log('📋 Next steps:');
  console.log('   1. Update the .env file with your actual PostgreSQL password');
  console.log('   2. Restart your backend server');
  console.log('   3. Test the admin user creation functionality');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkPostgreSQLStatus, setupDatabase, testConnection };
