require('dotenv').config();
const dataIngestionService = require('../data-ingestion/dataIngestion');

(async () => {
	try {
		console.log('📥 Backfilling 1 year of daily stock history for default symbols...');
		const symbols = dataIngestionService.DEFAULT_STOCK_SYMBOLS;
		const results = await dataIngestionService.ingestStockHistory(symbols, '1y', '1d', false);
		console.log('✅ Backfill complete:', results);
		process.exit(0);
	} catch (err) {
		console.error('❌ Backfill failed:', err);
		process.exit(1);
	}
})();
