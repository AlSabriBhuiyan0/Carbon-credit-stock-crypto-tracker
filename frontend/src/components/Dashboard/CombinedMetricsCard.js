import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Leaf, 
  Target, 
  BarChart3, 
  Globe, 
  Shield,
  Activity,
  PieChart,
  Brain,
  BarChart
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

const CombinedMetricsCard = ({ data, timeRange = '1W' }) => {
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
    totalPortfolioValue = 0,
    esgScore = 0,
    sustainabilityRating = 'N/A',
    carbonFootprint = 0,
    carbonOffset = 0,
    portfolioPerformance = {},
    sustainabilityMetrics = {},
    riskMetrics = {}
  } = data;

  const {
    totalReturn = 0,
    volatility = 0,
    sharpeRatio = 0,
    maxDrawdown = 0
  } = portfolioPerformance;

  const {
    renewableEnergyRatio = 0,
    carbonIntensity = 0,
    socialImpactScore = 0,
    governanceScore = 0
  } = sustainabilityMetrics;

  const {
    overallRisk = 'medium',
    climateRisk = 'medium',
    regulatoryRisk = 'medium',
    marketRisk = 'medium'
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

  // ESG score color mapping
  const getESGColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Combined Portfolio Metrics</h3>
              <p className="text-emerald-100 text-sm">
                ESG, Sustainability & Performance Overview
              </p>
              <div className="text-xs text-emerald-200 mt-1">
                Time Range: {timeRange} • Last Updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatCurrency(totalPortfolioValue)}
            </div>
            <div className="text-emerald-100 text-sm">Total Portfolio Value</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* ESG Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center border border-green-200"
          >
            <div className="flex items-center justify-center mb-2">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <div className={`text-2xl font-bold ${getESGColor(esgScore)}`}>
              {esgScore}
            </div>
            <div className="text-sm text-green-800">ESG Score</div>
            <div className="text-xs text-green-600 mt-1">Out of 100</div>
          </motion.div>

          {/* Sustainability Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 text-center border border-blue-200"
          >
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {sustainabilityRating}
            </div>
            <div className="text-sm text-blue-800">Sustainability</div>
            <div className="text-xs text-blue-600 mt-1">Rating</div>
          </motion.div>

          {/* Carbon Offset */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 text-center border border-purple-200"
          >
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(carbonOffset)}
            </div>
            <div className="text-sm text-purple-800">Carbon Offset</div>
            <div className="text-xs text-purple-600 mt-1">Tons CO2</div>
          </motion.div>

          {/* Portfolio Return */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 text-center border border-orange-200"
          >
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(totalReturn / 100)}
            </div>
            <div className="text-sm text-orange-800">Total Return</div>
            <div className="text-xs text-orange-600 mt-1">{timeRange}</div>
          </motion.div>
        </div>

        {/* Portfolio Performance */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Portfolio Performance</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Volatility:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPercentage(volatility / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sharpe Ratio:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Number(sharpeRatio ?? 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max Drawdown:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPercentage(maxDrawdown / 100)}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Carbon Intensity:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {Number(carbonIntensity ?? 0).toFixed(2)} tCO2e/$M
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Renewable Energy:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPercentage(renewableEnergyRatio / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Social Impact:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {socialImpactScore}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Risk Assessment</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overall Risk:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(overallRisk)}`}>
                  {overallRisk.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Climate Risk:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(climateRisk)}`}>
                  {climateRisk.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Regulatory Risk:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(regulatoryRisk)}`}>
                  {regulatoryRisk.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Market Risk:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(marketRisk)}`}>
                  {marketRisk.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sustainability Breakdown */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <PieChart className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Sustainability Breakdown</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {formatPercentage(renewableEnergyRatio / 100)}
              </div>
              <div className="text-sm text-green-800">Renewable Energy</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {governanceScore}/100
              </div>
              <div className="text-sm text-blue-800">Governance</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {formatNumber(carbonFootprint)}
              </div>
              <div className="text-sm text-purple-800">Carbon Footprint</div>
            </div>
          </div>
        </div>

        {/* Model Performance Comparison */}
        {data.modelPerformance && (
          <div className="bg-indigo-50 rounded-lg p-4 mt-6">
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-indigo-800">AI Model Performance Comparison</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Prophet Model */}
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <h5 className="font-semibold text-purple-800 text-sm">Prophet (AI)</h5>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Accuracy:</span>
                    <span className="font-semibold">{data.modelPerformance.prophet?.accuracy?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Confidence:</span>
                    <span className="font-semibold">{data.modelPerformance.prophet?.confidence?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Seasonality:</span>
                    <span className="font-semibold">{data.modelPerformance.prophet?.seasonality?.toFixed(0) || 0}%</span>
                  </div>
                </div>
              </div>
              
              {/* ARIMA Model */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <h5 className="font-semibold text-green-800 text-sm">ARIMA (Stats)</h5>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Accuracy:</span>
                    <span className="font-semibold">{data.modelPerformance.arima?.accuracy?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Confidence:</span>
                    <span className="font-semibold">{data.modelPerformance.arima?.confidence?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Stationarity:</span>
                    <span className="font-semibold">{data.modelPerformance.arima?.stationarity?.toFixed(0) || 0}%</span>
                  </div>
                </div>
              </div>
              
              {/* Simple Model */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart className="w-4 h-4 text-blue-600" />
                  <h5 className="font-semibold text-blue-800 text-sm">Simple (Tech)</h5>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Accuracy:</span>
                    <span className="font-semibold">{data.modelPerformance.simple?.accuracy?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Confidence:</span>
                    <span className="font-semibold">{data.modelPerformance.simple?.confidence?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Speed:</span>
                    <span className="font-semibold">{data.modelPerformance.simple?.speed?.toFixed(0) || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-indigo-100 rounded text-xs text-indigo-800">
              <strong>Model Insights:</strong> Prophet excels at seasonality detection, ARIMA provides statistical rigor, 
              while Simple offers fast technical analysis. Choose based on your forecasting needs.
            </div>
          </div>
        )}

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

export default CombinedMetricsCard;
