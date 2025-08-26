import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import { formatCryptoPrice, formatPercentageChange } from '../../api/crypto';

const CryptoPriceCard = ({ data, isSelected, onClick }) => {
  if (!data) return null;

  // Debug logging
  console.log('CryptoPriceCard data:', data);

  const { symbol, price, timestamp } = data;
  
  // Validate required data
  if (!symbol || price === undefined || price === null) {
    console.error('Invalid data structure for CryptoPriceCard:', data);
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50">
        <p className="text-red-600 text-sm">Invalid data for {symbol || 'Unknown'}</p>
        <p className="text-red-500 text-xs">Price: {price}</p>
      </div>
    );
  }
  
  // Calculate a mock price change for demonstration (in real app, this would come from API)
  const priceChange = Math.random() * 10 - 5; // Random change between -5% and +5%
  const isPositive = priceChange >= 0;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-primary-300 bg-primary-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{symbol}</h3>
        <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? (
            <ArrowTrendingUpIcon className="w-4 h-4" />
          ) : (
            <ArrowTrendingDownIcon className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {formatPercentageChange(priceChange)}
          </span>
        </div>
      </div>
      
      <div className="mb-2">
        <p className="text-2xl font-bold text-gray-900">
          {formatCryptoPrice(price)}
        </p>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Last updated</span>
        <span>{timestamp ? new Date(timestamp).toLocaleTimeString() : 'N/A'}</span>
      </div>
      
      {isSelected && (
        <div className="mt-2 pt-2 border-t border-primary-200">
          <div className="text-xs text-primary-600 font-medium">
            ✓ Selected for detailed view
          </div>
        </div>
      )}
    </div>
  );
};

export default CryptoPriceCard;
