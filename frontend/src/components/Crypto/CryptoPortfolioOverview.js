import React from 'react';
import { getCryptoDisplayName, formatCryptoPrice, getSentimentColor } from '../../api/crypto';

const CryptoPortfolioOverview = ({ data }) => {
  if (!data) return null;

  const { results, totalAssets, successfulQueries, timestamp } = data;

  // Calculate portfolio summary
  const portfolioSummary = Object.entries(results).reduce((acc, [symbol, result]) => {
    if (result.currentPrice && result.sentiment) {
      acc.totalAssets++;
      acc.totalValue += result.currentPrice.price || 0;
      
      if (result.sentiment.sentiment === 'bullish') acc.bullishCount++;
      else if (result.sentiment.sentiment === 'bearish') acc.bearishCount++;
      else acc.neutralCount++;
    }
    return acc;
  }, { totalAssets: 0, totalValue: 0, bullishCount: 0, bearishCount: 0, neutralCount: 0 });

  return (
    <div className="space-y-4">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Assets</p>
          <p className="text-xl font-bold text-gray-900">{portfolioSummary.totalAssets}</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Success Rate</p>
          <p className="text-xl font-bold text-gray-900">
            {totalAssets > 0 ? Math.round((successfulQueries / totalAssets) * 100) : 0}%
          </p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Last Update</p>
          <p className="text-sm font-medium text-gray-900">
            {timestamp ? new Date(timestamp).toLocaleTimeString() : 'N/A'}
          </p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-sm font-medium text-green-600">Active</p>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Market Sentiment Distribution</h4>
        <div className="flex space-x-2">
          <div className="flex-1 bg-green-100 rounded-lg p-2 text-center">
            <p className="text-xs text-green-700">Bullish</p>
            <p className="text-lg font-bold text-green-700">{portfolioSummary.bullishCount}</p>
          </div>
          <div className="flex-1 bg-red-100 rounded-lg p-2 text-center">
            <p className="text-xs text-red-700">Bearish</p>
            <p className="text-lg font-bold text-red-700">{portfolioSummary.bearishCount}</p>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-700">Neutral</p>
            <p className="text-lg font-bold text-gray-700">{portfolioSummary.neutralCount}</p>
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Asset Details</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.entries(results).map(([symbol, result]) => {
            if (!result.currentPrice || !result.sentiment) return null;
            
            return (
              <div key={symbol} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-700">
                      {symbol.slice(0, 3)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getCryptoDisplayName(symbol)}
                    </p>
                    <p className="text-xs text-gray-500">{symbol}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCryptoPrice(result.currentPrice.price)}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(result.sentiment.sentiment)} bg-opacity-10`}>
                      {result.sentiment.sentiment}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(result.sentiment.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Portfolio Status */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
        Portfolio monitoring {totalAssets} crypto assets • 
        {successfulQueries} successful queries • 
        Last updated {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
};

export default CryptoPortfolioOverview;
