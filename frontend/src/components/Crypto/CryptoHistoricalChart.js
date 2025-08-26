import React from 'react';
import { formatCryptoPrice } from '../../api/crypto';

const CryptoHistoricalChart = ({ data, symbol }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p>No historical data available</p>
          <p className="text-sm">Select a different asset or timeframe</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.map((item, index) => ({
    index,
    timestamp: new Date(item.timestamp),
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume
  }));

  // Find min/max for chart scaling
  const allPrices = [
    ...chartData.map(d => d.high),
    ...chartData.map(d => d.low),
    ...chartData.map(d => d.open),
    ...chartData.map(d => d.close)
  ].filter(v => v !== null && v !== undefined);
  
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  // Chart dimensions
  const chartHeight = 300;
  const chartWidth = 600;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };

  // Scale functions
  const xScale = (index) => margin.left + (index / (chartData.length - 1)) * (chartWidth - margin.left - margin.right);
  const yScale = (price) => margin.top + chartHeight - margin.top - margin.bottom - 
    ((price - (minPrice - padding)) / (maxPrice - minPrice + 2 * padding)) * (chartHeight - margin.top - margin.bottom);

  // Generate candlestick paths
  const generateCandlesticks = () => {
    return chartData.map((candle, index) => {
      const x = xScale(index);
      const openY = yScale(candle.open);
      const closeY = yScale(candle.close);
      const highY = yScale(candle.high);
      const lowY = yScale(candle.low);
      
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#10b981' : '#ef4444';
      
      // Wick (high-low line)
      const wick = `M ${x} ${highY} L ${x} ${lowY}`;
      
      // Body (open-close rectangle)
      const bodyWidth = Math.max(2, (chartWidth - margin.left - margin.right) / chartData.length * 0.8);
      const bodyX = x - bodyWidth / 2;
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      
      return { wick, body: { x: bodyX, y: bodyY, width: bodyWidth, height: bodyHeight }, color, isGreen };
    });
  };

  const candlesticks = generateCandlesticks();

  // Generate volume bars
  const generateVolumeBars = () => {
    const maxVolume = Math.max(...chartData.map(d => d.volume));
    const volumeHeight = 60;
    
    return chartData.map((item, index) => {
      const x = xScale(index);
      const volumeY = chartHeight - margin.bottom + 10;
      const volumeBarHeight = (item.volume / maxVolume) * volumeHeight;
      const barWidth = Math.max(1, (chartWidth - margin.left - margin.right) / chartData.length * 0.6);
      
      return {
        x: x - barWidth / 2,
        y: volumeY - volumeBarHeight,
        width: barWidth,
        height: volumeBarHeight,
        volume: item.volume
      };
    });
  };

  const volumeBars = generateVolumeBars();

  return (
    <div className="space-y-4">
      {/* Chart Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600">Current Price</p>
          <p className="text-lg font-bold text-blue-900">
            {formatCryptoPrice(chartData[chartData.length - 1]?.close || 0)}
          </p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600">24h High</p>
          <p className="text-lg font-bold text-green-900">
            {formatCryptoPrice(Math.max(...chartData.map(d => d.high)))}
          </p>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">24h Low</p>
          <p className="text-lg font-bold text-red-900">
            {formatCryptoPrice(Math.min(...chartData.map(d => d.low)))}
          </p>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-600">Volume</p>
          <p className="text-lg font-bold text-purple-900">
            {chartData[chartData.length - 1]?.volume?.toLocaleString() || 'N/A'}
          </p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-gray-50 rounded-lg p-4">
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Grid lines */}
          <defs>
            <pattern id="chartGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#chartGrid)" />
          
          {/* Price axis */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={chartHeight - margin.bottom}
            stroke="#9ca3af"
            strokeWidth="1"
          />
          
          {/* Time axis */}
          <line
            x1={margin.left}
            y1={chartHeight - margin.bottom}
            x2={chartWidth - margin.right}
            y2={chartHeight - margin.bottom}
            stroke="#9ca3af"
            strokeWidth="1"
          />
          
          {/* Y-axis labels (price) */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick, index) => {
            const price = minPrice - padding + tick * (maxPrice - minPrice + 2 * padding);
            return (
              <g key={index}>
                <line
                  x1={margin.left - 5}
                  y1={yScale(price)}
                  x2={margin.left}
                  y2={yScale(price)}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
                <text
                  x={margin.left - 10}
                  y={yScale(price)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-500"
                >
                  {formatCryptoPrice(price)}
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels (time) */}
          {chartData.filter((_, index) => index % Math.ceil(chartData.length / 6) === 0).map((item, index) => (
            <g key={index}>
              <line
                x1={xScale(item.index)}
                y1={chartHeight - margin.bottom}
                x2={xScale(item.index)}
                y2={chartHeight - margin.bottom + 5}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text
                x={xScale(item.index)}
                y={chartHeight - margin.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {item.timestamp.toLocaleDateString()}
              </text>
            </g>
          ))}
          
          {/* Candlesticks */}
          {candlesticks.map((candle, index) => (
            <g key={index}>
              {/* Wick */}
              <path
                d={candle.wick}
                stroke={candle.color}
                strokeWidth="1"
                fill="none"
              />
              
              {/* Body */}
              <rect
                x={candle.body.x}
                y={candle.body.y}
                width={candle.body.width}
                height={candle.body.height}
                fill={candle.color}
                stroke={candle.color}
                strokeWidth="1"
              />
            </g>
          ))}
          
          {/* Volume bars */}
          {volumeBars.map((bar, index) => (
            <rect
              key={index}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill="rgba(59, 130, 246, 0.3)"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">Bullish (Close ≥ Open)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-600">Bearish (Close &lt; Open)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 bg-opacity-30 rounded"></div>
          <span className="text-gray-600">Volume</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="max-h-48 overflow-y-auto">
        <h4 className="font-medium text-gray-900 mb-2">Recent Data Points</h4>
        <div className="space-y-1">
          {chartData.slice(-10).reverse().map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <span className="text-gray-600">
                {item.timestamp.toLocaleDateString()}
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-gray-900">
                  O: {formatCryptoPrice(item.open)}
                </span>
                <span className="text-gray-900">
                  H: {formatCryptoPrice(item.high)}
                </span>
                <span className="text-gray-900">
                  L: {formatCryptoPrice(item.low)}
                </span>
                <span className="text-gray-900">
                  C: {formatCryptoPrice(item.close)}
                </span>
                <span className="text-gray-500">
                  V: {item.volume.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CryptoHistoricalChart;
