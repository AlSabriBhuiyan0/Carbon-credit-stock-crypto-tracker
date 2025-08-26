import React from 'react';
import { formatCryptoPrice } from '../../api/crypto';

const CryptoForecastChart = ({ data, type, symbol }) => {
  // Enhanced data validation
  if (!data) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No forecast data available</p>
          <p className="text-sm">Select a different asset or timeframe</p>
        </div>
      </div>
    );
  }

  // Check if data has required structure
  if (!data.path || !Array.isArray(data.path) || data.path.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p>Invalid forecast data structure</p>
          <p className="text-sm">Data format error - please try again</p>
        </div>
      </div>
    );
  }

  // Validate data points
  const validDataPoints = data.path.filter(point => 
    point && typeof point.yhat === 'number' && !isNaN(point.yhat) &&
    point.yhat_lower && point.yhat_upper
  );

  if (validDataPoints.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">❌</div>
          <p>No valid forecast points</p>
          <p className="text-sm">All forecast data is invalid</p>
        </div>
      </div>
    );
  }

  const { path, next, summary } = data;
  
  // Prepare chart data
  const chartData = path.map((point, index) => ({
    day: index + 1,
    forecast: point.yhat,
    lower: point.yhat_lower,
    upper: point.yhat_upper,
    date: point.ds
  }));

  // Find min/max for chart scaling
  const allValues = [
    ...path.map(p => p.yhat),
    ...path.map(p => p.yhat_lower),
    ...path.map(p => p.yhat_upper)
  ].filter(v => v !== null && v !== undefined);
  
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = range * 0.1;

  // Chart dimensions
  const chartHeight = 200;
  const chartWidth = 400;
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };

  // Scale functions
  const xScale = (day) => margin.left + (day / chartData.length) * (chartWidth - margin.left - margin.right);
  const yScale = (value) => margin.top + chartHeight - margin.top - margin.bottom - 
    ((value - (minValue - padding)) / (maxValue - minValue + 2 * padding)) * (chartHeight - margin.top - margin.bottom);

  // Generate SVG path for forecast line
  const generateForecastPath = () => {
    const points = chartData.map(point => 
      `${xScale(point.day)},${yScale(point.forecast)}`
    ).join(' ');
    
    return `M ${points}`;
  };

  // Generate SVG path for confidence interval
  const generateConfidencePath = () => {
    const upperPoints = chartData.map(point => 
      `${xScale(point.day)},${yScale(point.upper)}`
    ).join(' ');
    
    const lowerPoints = chartData.slice().reverse().map(point => 
      `${xScale(point.day)},${yScale(point.lower)}`
    ).join(' ');
    
    return `M ${upperPoints} L ${lowerPoints} Z`;
  };

  return (
    <div className="space-y-4">
      {/* Forecast Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">Next Day Forecast</p>
          <p className="text-lg font-bold text-blue-900">
            {formatCryptoPrice(next?.yhat || 0)}
          </p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600">Confidence Range</p>
          <p className="text-sm font-medium text-green-900">
            ±{next?.yhat && next?.yhat_upper && next?.yhat_lower ? 
              formatCryptoPrice((next.yhat_upper - next.yhat_lower) / 2) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 rounded-lg p-4">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Confidence interval area */}
          <path
            d={generateConfidencePath()}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="none"
          />
          
          {/* Forecast line */}
          <path
            d={generateForecastPath()}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {chartData.map((point, index) => (
            <circle
              key={index}
              cx={xScale(point.day)}
              cy={yScale(point.forecast)}
              r="3"
              fill="#3b82f6"
            />
          ))}
          
          {/* Axes */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={chartHeight - margin.bottom}
            stroke="#9ca3af"
            strokeWidth="1"
          />
          <line
            x1={margin.left}
            y1={chartHeight - margin.bottom}
            x2={chartWidth - margin.right}
            y2={chartHeight - margin.bottom}
            stroke="#9ca3af"
            strokeWidth="1"
          />
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick, index) => {
            const value = minValue - padding + tick * (maxValue - minValue + 2 * padding);
            return (
              <g key={index}>
                <line
                  x1={margin.left - 5}
                  y1={yScale(value)}
                  x2={margin.left}
                  y2={yScale(value)}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
                <text
                  x={margin.left - 10}
                  y={yScale(value)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-500"
                >
                  {formatCryptoPrice(value)}
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels */}
          {chartData.filter((_, index) => index % Math.ceil(chartData.length / 5) === 0).map((point, index) => (
            <g key={index}>
              <line
                x1={xScale(point.day)}
                y1={chartHeight - margin.bottom}
                x2={xScale(point.day)}
                y2={chartHeight - margin.bottom + 5}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text
                x={xScale(point.day)}
                y={chartHeight - margin.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                Day {point.day}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Forecast Details */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Forecast Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Model Type</p>
            <p className="font-medium text-gray-900 capitalize">{type}</p>
          </div>
          <div>
            <p className="text-gray-600">Horizon</p>
            <p className="font-medium text-gray-900">{path.length} days</p>
          </div>
          <div>
            <p className="text-gray-600">Trend</p>
            <p className="font-medium text-gray-900 capitalize">
              {summary?.forecastTrend || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Confidence</p>
            <p className="font-medium text-gray-900">
              {summary?.confidence ? `${Math.round(summary.confidence * 100)}%` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Path Table */}
      <div className="max-h-32 overflow-y-auto">
        <h4 className="font-medium text-gray-900 mb-2">Daily Forecasts</h4>
        <div className="space-y-1">
          {chartData.slice(0, 7).map((point, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <span className="text-gray-600">Day {point.day}</span>
              <span className="font-medium">{formatCryptoPrice(point.forecast)}</span>
              <span className="text-xs text-gray-500">
                {point.lower && point.upper ? 
                  `${formatCryptoPrice(point.lower)} - ${formatCryptoPrice(point.upper)}` : 
                  'N/A'
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CryptoForecastChart;
