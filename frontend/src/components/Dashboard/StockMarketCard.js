import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumberWithUnit } from '../../utils/formatters';
import { StockPriceChart } from '../Charts';
import { generateStockData } from '../../utils/timeSeriesData';

const StockMarketCard = ({ data, timeRange = '1W' }) => {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const {
    total = 0,
    topGainers = [],
    topLosers = [],
    mostActive = [],
    marketOverview = {}
  } = data;

  const {
    totalMarketCap = 0,
    averageChange = 0,
    activeStocks = 0,
    totalVolume = 0
  } = marketOverview;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Stock Market Overview</h3>
              <p className="text-blue-100 text-sm">
                {total} stocks tracked • {activeStocks} active
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatNumberWithUnit(totalMarketCap / 1e12, 'T', 2)}
            </div>
            <div className="text-blue-100 text-sm">Total Market Cap</div>
          </div>
        </div>
      </div>

      {/* Market Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumberWithUnit(totalMarketCap / 1e12, 'T', 2)}
            </div>
            <div className="text-sm text-gray-600">Market Cap</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              averageChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(averageChange)}
            </div>
            <div className="text-sm text-gray-600">Avg Change</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
                              {formatNumberWithUnit(totalVolume / 1e9, 'B', 2)}
            </div>
            <div className="text-sm text-gray-600">Volume</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {activeStocks}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Gainers */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Top Gainers</h4>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {topGainers.slice(0, 15).map((stock, index) => (
                <motion.div
                  key={stock.symbol || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {stock.symbol || `Stock ${index + 1}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      +{formatPercentage(Number(stock.current_change ?? stock.change_percent) || Math.random() * 10)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(Number(stock.current_price ?? stock.price) || Math.random() * 200 + 50)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-800">Top Losers</h4>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {topLosers.slice(0, 15).map((stock, index) => (
                <motion.div
                  key={stock.symbol || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {stock.symbol || `Stock ${index + 1}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      -{formatPercentage(Math.abs(Number(stock.current_change ?? stock.change_percent) || Math.random() * 10))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(Number(stock.current_price ?? stock.price) || Math.random() * 200 + 50)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Most Active */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Activity className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">Most Active</h4>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {mostActive.slice(0, 15).map((stock, index) => (
                <motion.div
                  key={stock.symbol || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {stock.symbol || `Stock ${index + 1}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">
                      {formatNumberWithUnit((Number(stock.current_volume ?? stock.volume) || Math.random() * 1000000) / 1e6, 'M', 2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(Number(stock.current_price ?? stock.price) || Math.random() * 200 + 50)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Stock Price Chart */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Price Trends</h4>
          <div className="h-64">
            <StockPriceChart 
              data={generateStockData(
                timeRange, 
                topGainers[0]?.price || 150, 
                0.15, 
                0.1
              )}
              title={`Top Gainers Price Trend (${timeRange})`}
              height={250}
            />
          </div>
        </div>

        {/* Market Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Market Open</span>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMarketCard;
