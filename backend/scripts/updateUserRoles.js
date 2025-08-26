const { executeQuery } = require('../services/database');

async function updateUserRoles() {
  console.log('🔄 Updating users table to support new role constraints...');
  
  try {
    // First, check if the table exists and what the current constraint is
    const checkTableQuery = `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `;
    
    const tableInfo = await executeQuery(checkTableQuery);
    console.log('📊 Current table info:', tableInfo.rows);
    
    // Update existing users with 'user' role to 'public' role
    const updateUsersQuery = `
      UPDATE users 
      SET role = 'public' 
      WHERE role = 'user' OR role NOT IN ('investor', 'company', 'regulator', 'ngo', 'public', 'admin')
    `;
    
    const updateResult = await executeQuery(updateUsersQuery);
    console.log(`✅ Updated ${updateResult.rowCount} users to 'public' role`);
    
    // Drop the old constraint if it exists
    try {
      const dropConstraintQuery = `
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS users_role_check
      `;
      await executeQuery(dropConstraintQuery);
      console.log('✅ Dropped old role constraint');
    } catch (error) {
      console.log('ℹ️ No old constraint to drop or constraint name different');
    }
    
    // Add the new constraint
    const addConstraintQuery = `
      ALTER TABLE users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('investor', 'company', 'regulator', 'ngo', 'public', 'admin'))
    `;
    
    await executeQuery(addConstraintQuery);
    console.log('✅ Added new role constraint');
    
    // Update the default value
    const updateDefaultQuery = `
      ALTER TABLE users 
      ALTER COLUMN role SET DEFAULT 'public'
    `;
    
    await executeQuery(updateDefaultQuery);
    console.log('✅ Updated default role to "public"');
    
    console.log('🎉 User roles update completed successfully!');
    
    // Show current users and their roles
    const showUsersQuery = `
      SELECT username, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    const users = await executeQuery(showUsersQuery);
    console.log('\n📋 Current users:');
    users.rows.forEach(user => {
      console.log(`   ${user.username} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating user roles:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateUserRoles()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = updateUserRoles;
