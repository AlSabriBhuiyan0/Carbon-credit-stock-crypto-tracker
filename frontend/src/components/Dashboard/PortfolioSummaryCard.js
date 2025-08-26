import React from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Activity,
  Target,
  BarChart3,
  Shield,
  Wallet
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters';
import { PortfolioChart, StockPriceChart } from '../Charts';
import { generatePortfolioData } from '../../utils/timeSeriesData';

const PortfolioSummaryCard = ({ data, timeRange = '1W' }) => {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalValue = 0,
    totalChange = 0,
    totalChangePercent = 0,
    allocation = {},
    performance = {},
    recentTransactions = [],
    riskMetrics = {},
    goals = []
  } = data;



  const {
    dailyReturn = 0,
    weeklyReturn = 0,
    monthlyReturn = 0,
    yearlyReturn = 0,
    sharpeRatio = 0,
    maxDrawdown = 0
  } = performance;

  const {
    riskLevel = 'medium',
    riskScore = 0,
    volatility = 0,
    beta = 0
  } = riskMetrics;

  // Risk level color mapping
  const getRiskColor = (level) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Return color mapping
  const getReturnColor = (value) => {
    if (value >= 0) return 'text-green-600';
    return 'text-red-600';
  };

  // Allocation color mapping
  const getAllocationColor = (type) => {
    switch (type.toLowerCase()) {
      case 'stocks':
        return 'bg-blue-500';
      case 'carboncredits':
        return 'bg-green-500';
      case 'cash':
        return 'bg-gray-500';
      case 'bonds':
        return 'bg-purple-500';
      case 'commodities':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Portfolio Summary</h3>
              <p className="text-teal-100 text-sm">
                Total Value: {formatCurrency(totalValue)}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${getReturnColor(totalChangePercent)}`}>
              {totalChangePercent >= 0 ? '+' : ''}{formatPercentage(totalChangePercent / 100)}
            </div>
            <div className="text-teal-100 text-sm">
              {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Portfolio Performance */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h4 className="font-semibold text-teal-800">Performance Overview</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-lg font-bold ${getReturnColor(dailyReturn)}`}>
                {dailyReturn >= 0 ? '+' : ''}{formatPercentage(dailyReturn / 100)}
              </div>
              <div className="text-xs text-gray-600">Daily</div>
            </div>
            
            <div className="text-center">
              <div className={`text-lg font-bold ${getReturnColor(weeklyReturn)}`}>
                {weeklyReturn >= 0 ? '+' : ''}{formatPercentage(weeklyReturn / 100)}
              </div>
              <div className="text-xs text-gray-600">Weekly</div>
            </div>
            
            <div className="text-center">
              <div className={`text-lg font-bold ${getReturnColor(monthlyReturn)}`}>
                {monthlyReturn >= 0 ? '+' : ''}{formatPercentage(monthlyReturn / 100)}
              </div>
              <div className="text-xs text-gray-600">Monthly</div>
            </div>
            
            <div className="text-center">
              <div className={`text-lg font-bold ${getReturnColor(yearlyReturn)}`}>
                {yearlyReturn >= 0 ? '+' : ''}{formatPercentage(yearlyReturn / 100)}
              </div>
              <div className="text-xs text-gray-600">Yearly</div>
            </div>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Asset Allocation</h4>
          </div>
          
          <div className="space-y-3">
            {Object.entries(allocation).map(([type, percentage], index) => (
              <motion.div
                key={type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${getAllocationColor(type)}`}></div>
                  <span className="text-sm text-gray-700 capitalize">
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">
                    {formatPercentage(percentage / 100)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency((percentage / 100) * totalValue)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Risk Assessment</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`px-2 py-1 rounded text-sm font-medium ${getRiskColor(riskLevel)}`}>
                {riskLevel.toUpperCase()}
              </div>
              <div className="text-xs text-gray-600 mt-1">Risk Level</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {formatPercentage(riskScore / 100)}
              </div>
              <div className="text-xs text-gray-600">Risk Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {formatPercentage(volatility / 100)}
              </div>
              <div className="text-xs text-gray-600">Volatility</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {beta.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">Beta</div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Performance Metrics</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sharpe Ratio:</span>
                <span className="text-sm font-semibold text-green-600">
                  {sharpeRatio.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max Drawdown:</span>
                <span className="text-sm font-semibold text-red-600">
                  {formatPercentage(maxDrawdown / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Return:</span>
                <span className={`text-sm font-semibold ${getReturnColor(totalChangePercent)}`}>
                  {totalChangePercent >= 0 ? '+' : ''}{formatPercentage(totalChangePercent / 100)}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Portfolio Value:</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(totalValue)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Absolute Change:</span>
                <span className={`text-sm font-semibold ${getReturnColor(totalChange)}`}>
                  {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated:</span>
                <span className="text-sm font-semibold text-green-600">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Recent Transactions</h4>
          </div>
          
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((tx, index) => (
              <motion.div
                key={tx.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-white rounded text-sm"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.type === 'buy' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-gray-700 font-medium">
                    {tx.symbol || `Asset ${index + 1}`}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    tx.type === 'buy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'buy' ? 'BUY' : 'SELL'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {tx.amount ? formatNumber(tx.amount) : '100'} shares
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Financial Goals */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-indigo-800">Financial Goals</h4>
          </div>
          
          <div className="space-y-3">
            {goals.slice(0, 3).map((goal, index) => (
              <motion.div
                key={goal.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {goal.name || `Goal ${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Target: {formatCurrency(goal.target || 10000)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-semibold text-indigo-600">
                    {formatPercentage(goal.progress || Math.random() * 100)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(goal.current || Math.random() * 10000)} / {formatCurrency(goal.target || 10000)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Portfolio Charts */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Analytics</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Allocation Chart */}
            <div className="h-64">
              <PortfolioChart 
                data={Object.entries(allocation).map(([type, value]) => ({
                  label: type.charAt(0).toUpperCase() + type.slice(1),
                  value: value || Math.random() * 10000
                }))}
                title="Asset Allocation"
                height={250}
                chartType="pie"
              />
            </div>
            
            {/* Performance Trend Chart */}
            <div className="h-64">
              <StockPriceChart 
                data={generatePortfolioData(
                  timeRange,
                  totalChangePercent || 5
                )}
                title={`Performance Trend (${timeRange})`}
                height={250}
              />
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummaryCard;
