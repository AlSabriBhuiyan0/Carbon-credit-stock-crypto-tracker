require('dotenv').config();
const forecastingService = require('../forcasting/forecasting');

async function main() {
  const symbol = process.argv[2] || 'MSFT';
  const model = (process.argv[3] || 'prophet').toLowerCase();
  const horizon = parseInt(process.argv[4] || '1', 10);

  try {
    const result = await forecastingService.generateStockForecast(symbol, horizon, model, { horizonDays: horizon });
    const out = {
      symbol,
      model: result.model || model,
      horizonDays: result.horizonDays || horizon,
      next: result.next || null,
      pathLength: Array.isArray(result.path) ? result.path.length : 0,
      pathFirst: Array.isArray(result.path) && result.path.length > 0 ? result.path[0] : null,
    };
    console.log(JSON.stringify(out, null, 2));
  } catch (err) {
    console.error('Forecast failed:', err.message);
    process.exit(1);
  }
}

main();
