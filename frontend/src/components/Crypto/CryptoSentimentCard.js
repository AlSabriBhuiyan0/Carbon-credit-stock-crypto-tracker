import React from 'react';
import { getSentimentColor, getSentimentBgColor } from '../../api/crypto';

const CryptoSentimentCard = ({ data }) => {
  if (!data) return null;

  const { sentiment, confidence, metrics } = data;

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
        return '📈';
      case 'bearish':
        return '📉';
      case 'neutral':
      default:
        return '➡️';
    }
  };

  const getSentimentDescription = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
        return 'Market sentiment is positive with upward momentum';
      case 'bearish':
        return 'Market sentiment is negative with downward pressure';
      case 'neutral':
      default:
        return 'Market sentiment is balanced with mixed signals';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Sentiment */}
      <div className={`p-4 rounded-lg ${getSentimentBgColor(sentiment)}`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getSentimentIcon(sentiment)}</span>
          <div>
            <h4 className={`font-semibold ${getSentimentColor(sentiment)} capitalize`}>
              {sentiment || 'Neutral'}
            </h4>
            <p className="text-sm text-gray-600">
              {getSentimentDescription(sentiment)}
            </p>
          </div>
        </div>
        
        {/* Confidence Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Confidence</span>
            <span className="font-medium">{Math.round(confidence * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                sentiment === 'bullish' ? 'bg-green-500' : 
                sentiment === 'bearish' ? 'bg-red-500' : 'bg-gray-500'
              }`}
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900">Key Metrics</h5>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Price Change */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Price Change (7d)</span>
            <span className={`font-medium ${
              metrics?.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics?.priceChange ? `${metrics.priceChange >= 0 ? '+' : ''}${metrics.priceChange.toFixed(2)}%` : 'N/A'}
            </span>
          </div>

          {/* Volatility */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Volatility</span>
            <span className="font-medium text-gray-900">
              {metrics?.volatility ? `${metrics.volatility.toFixed(2)}%` : 'N/A'}
            </span>
          </div>

          {/* Volume Trend */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Volume Trend</span>
            <span className={`font-medium ${
              metrics?.volumeTrend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics?.volumeTrend ? `${metrics.volumeTrend >= 0 ? '+' : ''}${metrics.volumeTrend.toFixed(2)}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Analysis Period */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
        Analysis based on 7-day data
      </div>
    </div>
  );
};

export default CryptoSentimentCard;
