const CarbonCreditPostgreSQL = require('./models/CarbonCreditPostgreSQL');

async function initCarbonTables() {
  try {
    console.log('🔧 Initializing carbon credit tables...');
    
    // Create the tables
    await CarbonCreditPostgreSQL.createTable();
    
    console.log('✅ Carbon credit tables created successfully!');
    
    // Test if we can create a sample project
    console.log('🧪 Testing table operations...');
    
    const testProject = await CarbonCreditPostgreSQL.createProject({
      projectId: 'TEST-001',
      name: 'Test Solar Project',
      type: 'Solar Power',
      location: 'Test Location',
      country: 'Test Country',
      standard: 'Test Standard',
      totalCredits: 10000
    });
    
    console.log('✅ Test project created:', testProject.project_id);
    
    // Test adding credit data
    const testCredit = await CarbonCreditPostgreSQL.addCreditData({
      projectId: 'TEST-001',
      price: 15.50,
      creditsIssued: 10000,
      creditsRetired: 2000,
      verificationDate: new Date(),
      source: 'Test Data'
    });
    
    console.log('✅ Test credit data added:', testCredit.id);
    
    // Test fetching all projects
    const allProjects = await CarbonCreditPostgreSQL.getAllProjects();
    console.log('✅ All projects fetched:', allProjects.length);
    
    console.log('🎉 Carbon tables initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing carbon tables:', error);
    process.exit(1);
  }
}

initCarbonTables();
