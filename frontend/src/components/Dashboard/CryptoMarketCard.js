import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Activity, Clock } from 'lucide-react';
import { getCryptoDisplayName, formatCryptoPrice, formatPercentageChange } from '../../api/crypto';
import { generateCryptoData } from '../../utils/timeSeriesData';

const CryptoMarketCard = ({ data, timeRange, expanded = false, onCryptoSelect }) => {
  // Debug logging
  console.log('🔍 CryptoMarketCard received data:', data);
  
  // Default data structure if no data is provided
  const defaultData = {
    cryptos: [],
    totalValue: 0,
    totalChange: 0,
    totalChangePercent: 0,
    topGainers: [],
    topLosers: [],
    volume: 0,
    marketCap: 0,
    active: 0
  };

  const cryptoData = data || defaultData;
  console.log('💰 CryptoMarketCard processed data:', {
    hasData: !!cryptoData,
    cryptosCount: cryptoData.cryptos?.length || 0,
    totalValue: cryptoData.totalValue || 0,
    totalChange: cryptoData.totalChange || 0
  });
  const { 
    cryptos = [], 
    totalValue = 0, 
    totalChange = 0, 
    totalChangePercent = 0, 
    topGainers = [], 
    topLosers = [], 
    volume = 0, 
    marketCap = 0, 
    active = 0 
  } = cryptoData;

  // Format market cap
  const formatMarketCap = (value) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  };

  // Format volume
  const formatVolume = (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const isPositive = totalChangePercent >= 0;
  
  // Handle case where no crypto data is available
  if (!cryptoData || (cryptoData.cryptos && cryptoData.cryptos.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4" data-testid="crypto-overview">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-lg font-semibold text-white">Crypto Market</h3>
              <p className="text-purple-100 text-sm">No crypto data available</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500">Crypto market data is currently unavailable</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-lg font-semibold text-white">Crypto Market</h3>
              <p className="text-purple-100 text-sm">
                {active || cryptos.length} assets tracked • {active || cryptos.length} active
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatMarketCap(marketCap || totalValue)}
            </div>
            <div className={`text-sm ${isPositive ? 'text-green-200' : 'text-red-200'}`}>
              {isPositive ? '+' : ''}{formatPercentageChange(totalChangePercent)}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatMarketCap(marketCap || totalValue)}
            </div>
            <div className="text-xs text-gray-500">Market Cap</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {isPositive ? '+' : ''}{formatPercentageChange(totalChangePercent)}
            </div>
            <div className="text-xs text-gray-500">Avg Change</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatVolume(volume)}
            </div>
            <div className="text-xs text-gray-500">Volume</div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Losers */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <TrendingDown className="w-4 h-4 text-red-500 mr-2" />
              Top Losers
            </h4>
            <div className="space-y-2">
              {topLosers && topLosers.length > 0 ? (
                topLosers.slice(0, 3).map((crypto, index) => (
                  <div
                    key={crypto.symbol || index}
                    className="flex items-center justify-between p-2 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => onCryptoSelect && onCryptoSelect(crypto)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {getCryptoDisplayName(crypto.symbol) || crypto.symbol || `Crypto ${index + 1}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {formatPercentageChange(crypto.priceChangePercent || crypto.change || crypto.priceChange || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCryptoPrice(crypto.price || crypto.lastPrice || crypto.currentPrice || 0)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-2">No loser data available</div>
              )}
            </div>
          </div>

          {/* Crypto List */}
          <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 text-blue-500 mr-2" />
            Crypto Assets ({cryptos.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {cryptos && cryptos.length > 0 ? (
              cryptos.slice(0, 10).map((crypto, index) => (
                <div
                  key={crypto.symbol || index}
                  data-testid="crypto-card"
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onCryptoSelect && onCryptoSelect(crypto)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {getCryptoDisplayName(crypto.symbol) || crypto.symbol || `Crypto ${index + 1}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${(crypto.priceChangePercent || crypto.change || crypto.priceChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(crypto.priceChangePercent || crypto.change || crypto.priceChange || 0) >= 0 ? '+' : ''}{formatPercentageChange(crypto.priceChangePercent || crypto.change || crypto.priceChange || 0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCryptoPrice(crypto.price || crypto.lastPrice || crypto.currentPrice || 0)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">No crypto data available</div>
            )}
          </div>
        </div>

        {/* Top Gainers */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
            Top Gainers
          </h4>
          <div className="space-y-2">
              {topGainers && topGainers.length > 0 ? (
                topGainers.slice(0, 3).map((crypto, index) => (
                  <div
                    key={crypto.symbol || index}
                    className="flex items-center justify-between p-2 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => onCryptoSelect && onCryptoSelect(crypto)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {getCryptoDisplayName(crypto.symbol) || crypto.symbol || `Crypto ${index + 1}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        +{formatPercentageChange(crypto.priceChangePercent || crypto.change || crypto.priceChange || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCryptoPrice(crypto.price || crypto.lastPrice || crypto.currentPrice || 0)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-2">No gainer data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Crypto Price Chart - Positioned at the bottom */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Price Trends</h4>
          <div className="h-64">
            {cryptos && cryptos.length > 0 ? (
              <svg className="w-full h-full" viewBox="0 0 200 80">
                <defs>
                  <linearGradient id="cryptoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                
                {/* Chart area */}
                <rect width="200" height="80" fill="none"/>
                
                                {/* Downward trend line */}
                <g>
                  <path
                    d="M 0 20 L 50 30 L 100 45 L 150 60 L 200 70"
                    stroke="#8B5CF6"
                    strokeWidth="2"
                    fill="none"
                  />
                  
                  {/* Area fill for downward trend */}
                  <path
                    d="M 0 20 L 50 30 L 100 45 L 150 60 L 200 70 L 200 80 L 0 80 Z"
                    fill="url(#cryptoGradient)"
                  />
                </g>
                
                {/* Chart labels */}
                <text x="5" y="15" fill="#6B7280" fontSize="8" fontWeight="500">
                  {isPositive ? '+' : ''}{formatPercentageChange(totalChangePercent)}
                </text>
                <text x="5" y="75" fill="#6B7280" fontSize="6">
                  {timeRange || '24h'} • {active || cryptos.length} assets
                </text>
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                No chart data
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>{active || cryptos.length} Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CryptoMarketCard;
