import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Leaf, 
  Layers,
  Calendar,
  Clock,
  TrendingUp,
  LineChart,
  Shield,
  Target,
  Brain,
  BarChart
} from 'lucide-react';

const ViewToggle = ({ activeView, timeRange, forecastModel, onViewChange, onTimeRangeChange, onForecastModelChange }) => {
  const viewOptions = [
    { id: 'overview', label: 'Overview', icon: Target, description: 'Complete Dashboard' },
    { id: 'stock', label: 'Stocks', icon: BarChart3, description: 'Market Data' },
    { id: 'carbon', label: 'Carbon', icon: Leaf, description: 'Credits & Projects' },
    { id: 'crypto', label: 'Crypto', icon: TrendingUp, description: 'Cryptocurrency' },
    { id: 'sentiment', label: 'Sentiment', icon: TrendingUp, description: 'Market Analysis' },
    { id: 'blockchain', label: 'Blockchain', icon: Shield, description: 'Carbon Verification' },
    { id: 'forecasts', label: 'Forecasts', icon: LineChart, description: 'AI Predictions' },
    { id: 'combined', label: 'Combined', icon: Layers, description: 'Portfolio View' }
  ];

  const timeRanges = [
    { id: '1d', label: '1 Day', icon: Clock },
    { id: '1w', label: '1 Week', icon: Calendar },
    { id: '1m', label: '1 Month', icon: Calendar },
    { id: '3m', label: '3 Months', icon: Calendar },
    { id: '6m', label: '6 Months', icon: Calendar },
    { id: '1y', label: '1 Year', icon: Calendar }
  ];

  const forecastModels = [
    { id: 'simple', label: 'Simple', icon: BarChart, description: 'Technical Analysis' },
    { id: 'prophet', label: 'Prophet', icon: Brain, description: 'AI Forecasting' },
    { id: 'arima', label: 'ARIMA', icon: BarChart3, description: 'Statistical Model' }
  ];

  return (
    <div className="flex flex-col space-y-4">
      {/* View Toggle */}
      <div className="flex flex-wrap bg-gray-100 rounded-lg p-1 gap-1">
        {viewOptions.map((option) => {
          const Icon = option.icon;
          const isActive = activeView === option.id;
          
          return (
            <motion.button
              key={option.id}
              data-testid={`${option.id}-tab`}
              onClick={() => onViewChange(option.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.description}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Time Range Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {timeRanges.map((range) => {
          const Icon = range.icon;
          const isActive = timeRange === range.id;
          
          return (
            <motion.button
              key={range.id}
              onClick={() => onTimeRangeChange(range.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{range.label}</span>
              <span className="sm:hidden">{range.id}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Forecast Model Toggle - Only show when forecasts view is active */}
      {activeView === 'forecasts' && (
        <div className="flex bg-gray-100 rounded-lg p-1">
          {forecastModels.map((model) => {
            const Icon = model.icon;
            const isActive = forecastModel === model.id;
            
            return (
              <motion.button
                key={model.id}
                onClick={() => onForecastModelChange(model.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{model.label}</span>
                <span className="sm:hidden">{model.description}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewToggle;
