#!/usr/bin/env node

/**
 * Initialize Notifications and Reports Tables
 * This script creates the necessary database tables for the notification and reporting system
 */

const NotificationPostgreSQL = require('../models/NotificationPostgreSQL');
const ReportPostgreSQL = require('../models/ReportPostgreSQL');

async function initializeTables() {
  console.log('🚀 Initializing Notifications and Reports Tables');
  console.log('================================================\n');

  try {
    // Initialize notifications table
    console.log('1. Creating notifications table...');
    const notificationModel = new NotificationPostgreSQL();
    const notificationsTableCreated = await notificationModel.createTable();
    
    if (notificationsTableCreated) {
      console.log('✅ Notifications table created successfully');
    } else {
      console.log('❌ Failed to create notifications table');
      return false;
    }

    // Initialize reports table
    console.log('\n2. Creating reports table...');
    const reportModel = new ReportPostgreSQL();
    const reportsTableCreated = await reportModel.createTable();
    
    if (reportsTableCreated) {
      console.log('✅ Reports table created successfully');
    } else {
      console.log('❌ Failed to create reports table');
      return false;
    }

    // Create some sample notifications for demo users
    console.log('\n3. Creating sample notifications for demo users...');
    const sampleNotifications = [
      {
        title: 'Welcome to Carbon Credit & Stock Tracker!',
        message: 'Thank you for joining our platform. Explore your dashboard to get started.',
        type: 'info',
        priority: 'normal',
        action_required: false
      },
      {
        title: 'System Maintenance Notice',
        message: 'Scheduled maintenance will occur on Sunday at 2 AM EST. Service may be temporarily unavailable.',
        type: 'warning',
        priority: 'normal',
        action_required: false
      },
      {
        title: 'New Feature Available',
        message: 'Check out our new reporting system! Generate comprehensive reports for your portfolio and ESG metrics.',
        type: 'success',
        priority: 'normal',
        action_required: true,
        action_url: '/reports'
      }
    ];

    // Get demo users from database
    const usersQuery = 'SELECT id, username, role FROM users WHERE username LIKE \'demo_%\'';

    try {
      const usersResult = await notificationModel.pool.query(usersQuery);
      
      let sampleNotificationsCreated = 0;
      for (const user of usersResult.rows) {
        for (const notificationData of sampleNotifications) {
          try {
            await notificationModel.create({
              user_id: user.id,
              ...notificationData
            });
            sampleNotificationsCreated++;
          } catch (error) {
            console.log(`⚠️ Failed to create notification for ${user.username}: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Created ${sampleNotificationsCreated} sample notifications for ${usersResult.rows.length} demo users`);

      // Create some sample reports for demo users
      console.log('\n4. Creating sample reports for demo users...');
      const sampleReports = [
        {
          title: 'Portfolio Performance Summary',
          description: 'Monthly portfolio performance analysis with carbon credit impact',
          type: 'portfolio',
          category: 'investment',
          status: 'completed',
          format: 'pdf',
          parameters: { period: 'monthly', include_carbon: true }
        },
        {
          title: 'ESG Compliance Report',
          description: 'Environmental, Social, and Governance compliance status',
          type: 'compliance',
          category: 'regulatory',
          status: 'completed',
          format: 'excel',
          parameters: { framework: 'gri', scope: 'all' }
        },
        {
          title: 'Carbon Footprint Analysis',
          description: 'Detailed carbon emissions analysis and offset strategies',
          type: 'environmental',
          category: 'sustainability',
          status: 'completed',
          format: 'pdf',
          parameters: { scope: '1_2_3', include_recommendations: true }
        }
      ];

      let sampleReportsCreated = 0;
      for (const user of usersResult.rows) {
        for (const reportData of sampleReports) {
          try {
            await reportModel.create({
              user_id: user.id,
              ...reportData
            });
            sampleReportsCreated++;
          } catch (error) {
            console.log(`⚠️ Failed to create report for ${user.username}: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Created ${sampleReportsCreated} sample reports for ${usersResult.rows.length} demo users`);

      // Display summary
      console.log('\n📊 Summary:');
      console.log('============');
      console.log(`• Notifications table: ${notificationsTableCreated ? '✅ Created' : '❌ Failed'}`);
      console.log(`• Reports table: ${reportsTableCreated ? '✅ Created' : '❌ Failed'}`);
      console.log(`• Sample notifications: ${sampleNotificationsCreated} created`);
      console.log(`• Sample reports: ${sampleReportsCreated} created`);

      console.log('\n🎉 Tables initialization completed successfully!');
      console.log('\n💡 You can now:');
      console.log('   • Use the notification system to send alerts to users');
      console.log('   • Generate and manage reports through the API');
      console.log('   • View notifications in the frontend dashboard');
      console.log('   • Access reporting features in the admin panel');

      // Close database connections
      await notificationModel.close();
      await reportModel.close();

      return true;

    } catch (dbError) {
      console.log('⚠️ Could not create sample data (database query failed):', dbError.message);
      console.log('✅ Tables created successfully, but no sample data was added');
      
      // Close database connections
      await notificationModel.close();
      await reportModel.close();
      
      return true;
    }

  } catch (error) {
    console.error('\n❌ Error initializing tables:', error.message);
    return false;
  }
}

// Run the script
if (require.main === module) {
  initializeTables()
    .then((success) => {
      if (success) {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Script failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Script failed with error:', error);
      process.exit(1);
    });
}

module.exports = { initializeTables };
