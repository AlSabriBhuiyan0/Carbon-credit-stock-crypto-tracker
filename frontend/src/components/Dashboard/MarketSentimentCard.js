import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Smile, 
  Frown, 
  Meh, 
  BarChart3, 
  Target, 
  Zap 
} from 'lucide-react';
import { formatPercentage, formatNumberWithUnit } from '../../utils/formatters';

const MarketSentimentCard = ({ data, timeRange = '1W' }) => {
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
    overallSentiment = 'neutral',
    overallScore: apiOverallScore,
    stockSentiment = {},
    carbonSentiment = {},
    marketIndicators = {},
    sentimentTrends = [],
    riskMetrics = {}
  } = data;

  const {
    score: stockScore = 0,
    confidence = 0,
    change = 0,
    volume = 0
  } = stockSentiment;

  const {
    score: carbonScore = 0,
    confidence: carbonConfidence = 0,
    change: carbonChange = 0,
    volume: carbonVolume = 0
  } = carbonSentiment;

  const {
    score: cryptoScore = 0,
    confidence: cryptoConfidence = 0,
    change: cryptoChange = 0,
    volume: cryptoVolume = 0
  } = data.cryptoSentiment || {};

  const {
    volatility = 0,
    correlation = 0,
    momentum = 0,
    fearGreedIndex = 50
  } = marketIndicators;

  const {
    riskLevel = 'medium',
    riskScore = 0,
    maxDrawdown = 0,
    sharpeRatio = 0
  } = riskMetrics;

  // Sentiment color mapping
  const getSentimentColor = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish':
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'bearish':
      case 'negative':
        return 'text-red-600 bg-red-100';
      case 'neutral':
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish':
      case 'positive':
        return <Smile className="w-5 h-5" />;
      case 'bearish':
      case 'negative':
        return <Frown className="w-5 h-5" />;
      case 'neutral':
      default:
        return <Meh className="w-5 h-5" />;
    }
  };

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

  const getFearGreedColor = (index) => {
    if (index >= 70) return 'text-green-600';
    if (index >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const displayScore = Number(apiOverallScore ?? stockScore ?? 0);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Market Sentiment</h3>
              <p className="text-purple-100 text-sm">
                Real-time sentiment analysis & market indicators
              </p>
              <div className="text-xs text-purple-200 mt-1">
                Time Range: {timeRange}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(overallSentiment)}`}>
              <div className="flex items-center space-x-1">
                {getSentimentIcon(overallSentiment)}
                <span className="capitalize">{overallSentiment}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overall Sentiment Score */}
        <div className="mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatPercentage(displayScore)}
            </div>
            <div className="text-sm text-gray-600 mb-4">Overall Sentiment Score</div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <motion.div
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, displayScore))}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Bearish</span>
              <span>Neutral</span>
              <span>Bullish</span>
            </div>
          </div>
        </div>

        {/* Sentiment Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Stock Market Sentiment */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">Stock Market</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentiment Score:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {formatPercentage(stockScore || 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {formatPercentage(confidence)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Change:</span>
                <span className={`text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}{formatPercentage(change)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Volume:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {formatNumberWithUnit(volume, 'M')}
                </span>
              </div>
            </div>
          </div>

          {/* Carbon Credits Sentiment */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Activity className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Carbon Credits</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentiment Score:</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatPercentage(carbonScore / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatPercentage(carbonConfidence / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Change:</span>
                <span className={`text-sm font-semibold ${carbonChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {carbonChange >= 0 ? '+' : ''}{formatPercentage(carbonChange / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Volume:</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatNumberWithUnit(carbonVolume, 'M')}
                </span>
              </div>
            </div>
          </div>

          {/* Crypto Market Sentiment */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-800">Crypto Market</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sentiment Score:</span>
                <span className="text-sm font-semibold text-purple-600">
                  {formatPercentage(cryptoScore || 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="text-sm font-semibold text-purple-600">
                  {formatPercentage(cryptoConfidence || 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Change:</span>
                <span className={`text-sm font-semibold ${cryptoChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {cryptoChange >= 0 ? '+' : ''}{formatPercentage(cryptoChange || 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Volume:</span>
                <span className="text-sm font-semibold text-purple-600">
                  {formatNumberWithUnit(cryptoVolume || 0, 'M')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Indicators */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Market Indicators</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatPercentage(volatility)}
              </div>
              <div className="text-xs text-gray-600">Volatility</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatPercentage(correlation)}
              </div>
              <div className="text-xs text-gray-600">Correlation</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {formatPercentage(momentum)}
              </div>
              <div className="text-xs text-gray-600">Momentum</div>
            </div>
            
            <div className="text-center">
              <div className={`text-lg font-bold ${getFearGreedColor(fearGreedIndex)}`}>
                {fearGreedIndex}
              </div>
              <div className="text-xs text-gray-600">Fear & Greed</div>
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
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
                {formatPercentage(riskScore)}
              </div>
              <div className="text-xs text-gray-600">Risk Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {formatPercentage(maxDrawdown)}
              </div>
              <div className="text-xs text-gray-600">Max Drawdown</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {sharpeRatio.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">Sharpe Ratio</div>
            </div>
          </div>
        </div>

        {/* Sentiment Trends */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-indigo-800">Recent Trends</h4>
          </div>
          
          <div className="space-y-2">
            {sentimentTrends.slice(0, 5).map((trend, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-white rounded"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    trend.sentiment === 'positive' ? 'bg-green-500' : 
                    trend.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-700">
                    {trend.factor || `Factor ${index + 1}`}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    trend.sentiment === 'positive' ? 'text-green-600' : 
                    trend.sentiment === 'negative' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {trend.sentiment}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trend.impact || 'Medium'} impact
                  </div>
                </div>
              </motion.div>
            ))}
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

export default MarketSentimentCard;
