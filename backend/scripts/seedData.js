require('dotenv').config();
const StockPostgreSQL = require('../data-processing/StockPostgreSQL');
const CarbonCreditPostgreSQL = require('../data-processing/CarbonCreditPostgreSQL');
const dataIngestionService = require('../data-ingestion/dataIngestion');

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');
    
    // Seed stock data
    console.log('📈 Seeding stock data...');
    const stockData = await dataIngestionService.ingestStockData(dataIngestionService.DEFAULT_STOCK_SYMBOLS);
    
    for (const stock of stockData) {
      if (stock) {
        // Create stock record
        await StockPostgreSQL.create(stock.symbol, {
          name: stock.symbol,
          sector: 'Technology',
          industry: 'Software'
        });
        
        // Add price data
        await StockPostgreSQL.addPrice(stock.symbol, stock);
        console.log(`✅ Added stock data for ${stock.symbol}`);
      }
    }
    
    // Optionally backfill stock history for time-range charts/metrics
    console.log('🕒 Ingesting stock history (1 year, 1d interval)...');
    await dataIngestionService.ingestStockHistory(dataIngestionService.DEFAULT_STOCK_SYMBOLS, '1y', '1d', false);

    // Seed carbon credit data
    console.log('🌿 Seeding carbon credit data...');
    const carbonData = await dataIngestionService.ingestCarbonCreditData();
    
    for (const project of carbonData) {
      if (project) {
        // Create project record
        await CarbonCreditPostgreSQL.createProject({
          projectId: project.projectId,
          name: project.name,
          type: project.type,
          location: project.location,
          country: project.location,
          standard: project.standard,
          totalCredits: project.creditsIssued
        });
        
        // Add credit data
        await CarbonCreditPostgreSQL.addCreditData({
          projectId: project.projectId,
          price: parseFloat(project.price),
          creditsIssued: project.creditsIssued,
          creditsRetired: project.creditsRetired,
          verificationDate: project.verificationDate,
          source: project.source
        });
        console.log(`✅ Added carbon project: ${project.name}`);
      }
    }
    
    console.log('🎉 Data seeding completed successfully!');
    console.log(`📊 Stocks added: ${stockData.filter(s => s).length}`);
    console.log(`🌱 Carbon projects added: ${carbonData.filter(p => p).length}`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedData };
