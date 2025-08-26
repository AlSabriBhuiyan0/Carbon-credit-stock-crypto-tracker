import React, { useState } from 'react';
import { StockPriceChart, CarbonCreditChart, PortfolioChart } from './index';

const ChartDemo = () => {
  const [activeTab, setActiveTab] = useState('stocks');

  // Sample stock data
  const stockData = [
    { timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), price: 150.25, volume: 1500000 },
    { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), price: 152.80, volume: 1800000 },
    { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), price: 151.45, volume: 1200000 },
    { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), price: 154.20, volume: 2000000 },
    { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), price: 153.75, volume: 1600000 },
    { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), price: 156.90, volume: 2200000 },
    { timestamp: new Date(), price: 158.45, volume: 2500000 }
  ];

  // Sample carbon credit data
  const carbonData = [
    { timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), price: 12.50, credits_issued: 50000 },
    { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), price: 12.80, credits_issued: 55000 },
    { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), price: 13.20, credits_issued: 60000 },
    { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), price: 13.50, credits_issued: 65000 },
    { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), price: 13.80, credits_issued: 70000 },
    { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), price: 14.10, credits_issued: 75000 },
    { timestamp: new Date(), price: 14.45, credits_issued: 80000 }
  ];

  // Sample portfolio data
  const portfolioData = [
    { label: 'Stocks', value: 45000 },
    { label: 'Carbon Credits', value: 25000 },
    { label: 'Bonds', value: 20000 },
    { label: 'Cash', value: 10000 }
  ];

  const tabs = [
    { id: 'stocks', label: 'Stock Charts', icon: '📈' },
    { id: 'carbon', label: 'Carbon Credits', icon: '🌱' },
    { id: 'portfolio', label: 'Portfolio', icon: '📊' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chart.js Dashboard Demo</h1>
        <p className="text-gray-600">Interactive charts for stock prices, carbon credits, and portfolio analysis</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="space-y-8">
        {activeTab === 'stocks' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Stock Market Charts</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price & Volume Trend</h3>
                <StockPriceChart 
                  data={stockData}
                  title="AAPL Stock Performance"
                  height={300}
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Hover over data points for detailed info</li>
                  <li>• Click legend items to toggle datasets</li>
                  <li>• Responsive design for all screen sizes</li>
                  <li>• Real-time data updates support</li>
                  <li>• Custom tooltips with formatting</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'carbon' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Carbon Credit Charts</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Trends (Line Chart)</h3>
                <CarbonCreditChart 
                  data={carbonData}
                  title="Carbon Credit Price Trends"
                  height={300}
                  chartType="line"
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume Analysis (Bar Chart)</h3>
                <CarbonCreditChart 
                  data={carbonData}
                  title="Credits Issued Volume"
                  height={300}
                  chartType="bar"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Portfolio Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation (Pie Chart)</h3>
                <PortfolioChart 
                  data={portfolioData}
                  title="Portfolio Distribution"
                  height={300}
                  chartType="pie"
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Diversified View (Doughnut Chart)</h3>
                <PortfolioChart 
                  data={portfolioData}
                  title="Investment Breakdown"
                  height={300}
                  chartType="doughnut"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Features */}
      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">Chart.js Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">🎨 Interactive Design</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Hover effects and tooltips</li>
              <li>• Clickable legends</li>
              <li>• Responsive layouts</li>
              <li>• Smooth animations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">📊 Multiple Chart Types</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Line charts for trends</li>
              <li>• Bar charts for comparisons</li>
              <li>• Pie charts for distributions</li>
              <li>• Doughnut charts for analysis</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">⚡ Performance</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Lightweight library</li>
              <li>• Real-time updates</li>
              <li>• Smooth scrolling</li>
              <li>• Mobile optimized</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartDemo;
