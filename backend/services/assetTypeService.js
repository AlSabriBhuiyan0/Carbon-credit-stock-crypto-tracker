/**
 * Asset Type Detection Service
 * Categorizes assets as stocks, crypto, or unknown
 */

class AssetTypeService {
  // Common stock symbols
  static stockSymbols = [
    'AAPL', 'GOOGL', 'MSFT', 'ADBE', 'AMD', 'TSLA', 'NVDA', 'NFLX',
    'AMZN', 'META', 'CRM', 'ORCL', 'INTC', 'CSCO', 'IBM', 'V',
    'JPM', 'JNJ', 'PG', 'UNH', 'HD', 'MA', 'PFE', 'ABT'
  ];

  // Common crypto symbols
  static cryptoSymbols = [
    'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX', 'MATIC',
    'LINK', 'UNI', 'LTC', 'BCH', 'XRP', 'VET', 'VETUSDT', 'DOGE',
    'SHIB', 'TRX', 'EOS', 'XLM', 'ATOM', 'NEAR', 'FTM', 'ALGO'
  ];

  /**
   * Get asset type based on symbol
   * @param {string} symbol - Asset symbol
   * @returns {string} - 'stock', 'crypto', or 'unknown'
   */
  static getAssetType(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      return 'unknown';
    }

    const upperSymbol = symbol.toUpperCase();
    
    if (this.stockSymbols.includes(upperSymbol)) {
      return 'stock';
    } else if (this.cryptoSymbols.includes(upperSymbol)) {
      return 'crypto';
    }
    
    return 'unknown';
  }

  /**
   * Categorize multiple assets
   * @param {Array<string>} assets - Array of asset symbols
   * @returns {Object} - Categorized assets
   */
  static categorizeAssets(assets) {
    if (!Array.isArray(assets)) {
      return { stocks: [], crypto: [], unknown: [] };
    }

    const categorized = {
      stocks: [],
      crypto: [],
      unknown: []
    };

    assets.forEach(asset => {
      const type = this.getAssetType(asset);
      if (type === 'stock') {
        categorized.stocks.push(asset);
      } else if (type === 'crypto') {
        categorized.crypto.push(asset);
      } else {
        categorized.unknown.push(asset);
      }
    });

    return categorized;
  }

  /**
   * Validate mixed asset selection
   * @param {Array<string>} assets - Array of asset symbols
   * @param {number} maxAssets - Maximum number of assets allowed
   * @returns {Object} - Validation result
   */
  static validateMixedSelection(assets, maxAssets = 3) {
    if (!Array.isArray(assets)) {
      return { isValid: false, error: 'Assets must be an array' };
    }

    if (assets.length === 0) {
      return { isValid: false, error: 'No assets provided' };
    }

    if (assets.length > maxAssets) {
      return { isValid: false, error: `Too many assets. Maximum allowed: ${maxAssets}` };
    }

    // Check for invalid symbols
    const invalidAssets = assets.filter(asset => this.getAssetType(asset) === 'unknown');
    if (invalidAssets.length > 0) {
      return { isValid: false, error: `Invalid assets: ${invalidAssets.join(', ')}` };
    }

    const categorized = this.categorizeAssets(assets);
    
    return {
      isValid: true,
      assets: assets,
      categorized: categorized,
      count: assets.length,
      types: assets.map(asset => ({ symbol: asset, type: this.getAssetType(asset) }))
    };
  }

  /**
   * Get all available symbols by type
   * @param {string} type - 'stock', 'crypto', or 'all'
   * @returns {Array<string>} - Array of symbols
   */
  static getAvailableSymbols(type = 'all') {
    switch (type.toLowerCase()) {
      case 'stock':
      case 'stocks':
        return [...this.stockSymbols];
      case 'crypto':
        return [...this.cryptoSymbols];
      case 'all':
        return [...this.stockSymbols, ...this.cryptoSymbols];
      default:
        return [];
    }
  }

  /**
   * Check if symbol is valid
   * @param {string} symbol - Asset symbol
   * @returns {boolean} - True if valid
   */
  static isValidSymbol(symbol) {
    return this.getAssetType(symbol) !== 'unknown';
  }
}

module.exports = AssetTypeService;
