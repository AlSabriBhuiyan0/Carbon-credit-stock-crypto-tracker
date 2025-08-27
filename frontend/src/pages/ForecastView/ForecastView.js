import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  DollarSign,
  Bitcoin,
  Building2
} from 'lucide-react';
import axios from 'axios';

const ForecastView = () => {
  const { user } = useAuth();
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [assetType, setAssetType] = useState('mixed');
  const [forecastHorizon, setForecastHorizon] = useState(7);
  const [maxAssets] = useState(3);

  // Available assets for selection (will be populated from user portfolio)
  const [availableAssets, setAvailableAssets] = useState({
    stocks: [],
    crypto: []
  });

  // Fetch user portfolio to populate available assets
  const { data: userPortfolio, isLoading: portfolioLoading } = useQuery(
    ['user-portfolio'],
    async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token');
        }
        
        const response = await axios.get('http://localhost:5001/api/portfolios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.assets) {
          return response.data;
        } else {
          throw new Error('Invalid portfolio data structure');
        }
      } catch (error) {
        console.log('Could not fetch user portfolio, using default assets:', error.message);
        // Fallback to default assets if portfolio fetch fails
        return {
          assets: [
            { symbol: 'AAPL', type: 'stock', currentPrice: 227.76 },
            { symbol: 'GOOGL', type: 'stock', currentPrice: 2805.50 },
            { symbol: 'MSFT', type: 'stock', currentPrice: 415.22 },
            { symbol: 'BTCUSDT', type: 'crypto', currentPrice: 111897.44 },
            { symbol: 'ETHUSDT', type: 'crypto', currentPrice: 4610.68 }
          ],
          totalValue: 117346.60 // Default total value based on current market prices
        };
      }
    },
    {
      staleTime: 5 * 60 * 1000,
      onSuccess: (data) => {
        console.log('📊 Portfolio data received:', data);
        // Organize portfolio assets by type
        if (data && data.assets) {
          const stocks = data.assets.filter(asset => asset.type === 'stock').map(asset => asset.symbol);
          const crypto = data.assets.filter(asset => asset.type === 'crypto').map(asset => asset.symbol);
          setAvailableAssets({ stocks, crypto });
        }
      }
    }
  );

  // Fetch asset types for validation
  const { data: assetTypes, isLoading: typesLoading } = useQuery(
    ['asset-types', selectedAssets],
    async () => {
      if (selectedAssets.length === 0) return {};
      
      const types = {};
      for (const asset of selectedAssets) {
        try {
          const response = await axios.get(`http://localhost:5001/api/assets/${asset}/type`);
          types[asset] = response.data.type;
        } catch (error) {
          types[asset] = 'unknown';
        }
      }
      return types;
    },
    {
      enabled: selectedAssets.length > 0,
      staleTime: 5 * 60 * 1000
    }
  );

  // Generate forecasts
  const { data: forecastData, isLoading: forecastLoading, refetch: refetchForecast } = useQuery(
    ['forecasts', selectedAssets, forecastHorizon],
    async () => {
      if (selectedAssets.length === 0) return null;
      
      try {
        const response = await axios.post('http://localhost:5001/api/forecast/mixed', {
          assets: selectedAssets,
          horizon: forecastHorizon,
          userId: user?.id,
          useRealData: true
        });
        return response.data;
      } catch (error) {
        console.error('Forecast generation failed:', error);
        throw error;
      }
    },
    {
      enabled: selectedAssets.length > 0,
      staleTime: 2 * 60 * 1000,
      onSuccess: (data) => {
        console.log('📈 Forecast data received:', data);
      }
    }
  );

  // Handle asset selection
  const handleAssetSelect = (asset, type) => {
    if (selectedAssets.length >= maxAssets) {
      toast.error(`Maximum ${maxAssets} assets allowed`);
      return;
    }
    
    if (selectedAssets.includes(asset)) {
      toast.error(`${asset} is already selected`);
      return;
    }
    
    setSelectedAssets([...selectedAssets, asset]);
  };

  // Handle asset removal
  const handleAssetRemove = (asset) => {
    setSelectedAssets(selectedAssets.filter(a => a !== asset));
  };

  // Handle forecast generation
  const handleGenerateForecast = () => {
    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }
    refetchForecast();
  };

  // Handle report download
  const handleDownloadReport = async (format) => {
    if (!forecastData || selectedAssets.length === 0) {
      toast.error('Please generate a forecast first');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/forecast/download', {
        assets: selectedAssets,
        horizon: forecastHorizon,
        format: format
      }, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `forecast_report_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} report downloaded successfully!`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download ${format.toUpperCase()} report`);
    }
  };

  // Get asset icon based on type
  const getAssetIcon = (type) => {
    switch (type) {
      case 'stock':
        return <Building2 className="w-4 h-4" />;
      case 'crypto':
        return <Bitcoin className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  // Get asset color based on type
  const getAssetColor = (type) => {
    switch (type) {
      case 'stock':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'crypto':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Asset Forecasts
          </h1>
          <p className="text-gray-600">
            Select up to {maxAssets} assets (stocks or crypto) to generate unified forecasts
          </p>
        </div>

        {/* Asset Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Asset Selection ({selectedAssets.length}/{maxAssets})
          </h2>
          
          {/* Asset Type Toggle */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setAssetType('stocks')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                assetType === 'stocks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Stocks
            </button>
            <button
              onClick={() => setAssetType('crypto')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                assetType === 'crypto'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bitcoin className="w-4 h-4 inline mr-2" />
              Crypto
            </button>
            <button
              onClick={() => setAssetType('mixed')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                assetType === 'mixed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PieChart className="w-4 h-4 inline mr-2" />
              Mixed
            </button>
          </div>

                           {/* Asset Lists */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Stocks */}
                   {(assetType === 'stocks' || assetType === 'mixed') && (
                     <div>
                       <h3 className="text-lg font-medium text-gray-900 mb-3">
                         <Building2 className="w-4 h-4 inline mr-2 text-blue-600" />
                         Stock Assets
                         {portfolioLoading && <span className="ml-2 text-sm text-gray-500">(Loading...)</span>}
                       </h3>
                       <div className="space-y-2">
                         {portfolioLoading ? (
                           <div className="text-center py-4 text-gray-500">
                             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                             Loading portfolio assets...
                           </div>
                         ) : availableAssets.stocks.length > 0 ? (
                           availableAssets.stocks.map((symbol) => (
                             <button
                               key={symbol}
                               onClick={() => handleAssetSelect(symbol, 'stock')}
                               disabled={selectedAssets.includes(symbol)}
                               className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                                 selectedAssets.includes(symbol)
                                   ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed'
                                   : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                               }`}
                             >
                               {symbol}
                             </button>
                           ))
                         ) : (
                           <div className="text-center py-4 text-gray-500">
                             No stock assets in portfolio
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                               {/* Crypto */}
                   {(assetType === 'crypto' || assetType === 'mixed') && (
                     <div>
                       <h3 className="text-lg font-medium text-gray-900 mb-3">
                         <Bitcoin className="w-4 h-4 inline mr-2 text-orange-600" />
                         Crypto Assets
                         {portfolioLoading && <span className="ml-2 text-sm text-gray-500">(Loading...)</span>}
                       </h3>
                       <div className="space-y-2">
                         {portfolioLoading ? (
                           <div className="text-center py-4 text-gray-500">
                             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
                             Loading portfolio assets...
                           </div>
                         ) : availableAssets.crypto.length > 0 ? (
                           availableAssets.crypto.map((symbol) => (
                             <button
                               key={symbol}
                               onClick={() => handleAssetSelect(symbol, 'crypto')}
                               disabled={selectedAssets.includes(symbol)}
                               className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                                 selectedAssets.includes(symbol)
                                   ? 'bg-orange-50 border-orange-200 text-orange-700 cursor-not-allowed'
                                   : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-orange-300'
                               }`}
                             >
                               {symbol}
                             </button>
                           ))
                         ) : (
                           <div className="text-center py-4 text-gray-500">
                             No crypto assets in portfolio
                           </div>
                         )}
                       </div>
                     </div>
                   )}
          </div>

          {/* Selected Assets */}
          {selectedAssets.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Assets</h3>
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((asset) => (
                  <div
                    key={asset}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getAssetColor(assetTypes?.[asset] || 'unknown')}`}
                  >
                    {getAssetIcon(assetTypes?.[asset] || 'unknown')}
                    <span className="ml-2">{asset}</span>
                    <button
                      onClick={() => handleAssetRemove(asset)}
                      className="ml-2 hover:bg-black hover:bg-opacity-10 rounded-full p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forecast Controls */}
          <div className="mt-6 flex items-center space-x-4">
            <div>
              <label htmlFor="horizon" className="block text-sm font-medium text-gray-700 mb-1">
                Forecast Horizon (days)
              </label>
              <select
                id="horizon"
                value={forecastHorizon}
                onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
            
            <button
              onClick={handleGenerateForecast}
              disabled={selectedAssets.length === 0 || forecastLoading}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                selectedAssets.length === 0 || forecastLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {forecastLoading ? 'Generating...' : 'Generate Forecast'}
            </button>
            
            {forecastData && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownloadReport('pdf')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  📄 PDF
                </button>
                <button
                  onClick={() => handleDownloadReport('csv')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors"
                >
                  📊 CSV
                </button>
                <button
                  onClick={() => handleDownloadReport('excel')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors"
                >
                  📈 Excel
                </button>
              </div>
            )}
          </div>
        </div>

                       {/* Forecast Results */}
               {forecastData && (
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                   <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-semibold text-gray-900">
                       Forecast Results
                     </h2>
                     {forecastData.useRealData && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         ⚡ Real-time Data
                       </span>
                     )}
                   </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock Forecasts */}
              {forecastData.forecasts?.stocks && forecastData.forecasts.stocks.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                    Stock Forecasts
                  </h3>
                  <div className="space-y-4">
                    {forecastData.forecasts.stocks.map((forecast) => (
                      <div key={forecast.symbol} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{forecast.symbol}</span>
                          <span className="text-sm text-gray-500">Stock</span>
                        </div>
                        <div className="space-y-3">
                          {/* Combined Model */}
                          <div className="border-l-4 border-blue-500 pl-3">
                            <div className="text-xs font-medium text-blue-600 mb-2">Combined Model</div>
                            {forecast.forecast.predictions.map((prediction, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">{prediction.date}</span>
                                <span className="font-medium">${prediction.price.toLocaleString()}</span>
                                <span className="text-gray-500">{(prediction.confidence * 100).toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Prophet Model */}
                          {forecast.forecast.prophet && (
                            <div className="border-l-4 border-green-500 pl-3">
                              <div className="text-xs font-medium text-green-600 mb-2">Prophet Model</div>
                              {forecast.forecast.prophet.map((prediction, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{prediction.date}</span>
                                  <span className="font-medium">${prediction.price.toLocaleString()}</span>
                                  <span className="text-gray-500">{(prediction.confidence * 100).toFixed(0)}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* ARIMA Model */}
                          {forecast.forecast.arima && (
                            <div className="border-l-4 border-purple-500 pl-3">
                              <div className="text-xs font-medium text-purple-600 mb-2">ARIMA Model</div>
                              {forecast.forecast.arima.map((prediction, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{prediction.date}</span>
                                  <span className="font-medium">${prediction.price.toLocaleString()}</span>
                                  <span className="text-gray-500">{(prediction.confidence * 100).toFixed(0)}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Crypto Forecasts */}
              {forecastData.forecasts?.crypto && forecastData.forecasts.crypto.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Bitcoin className="w-4 h-4 mr-2 text-orange-600" />
                    Crypto Forecasts
                  </h3>
                  <div className="space-y-4">
                    {forecastData.forecasts.crypto.map((forecast) => (
                      <div key={forecast.symbol} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{forecast.symbol}</span>
                          <span className="text-sm text-gray-500">Crypto</span>
                        </div>
                        <div className="space-y-3">
                          {/* Combined Model */}
                          <div className="border-l-4 border-blue-500 pl-3">
                            <div className="text-xs font-medium text-blue-600 mb-2">Combined Model</div>
                            {forecast.forecast.predictions.map((prediction, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">{prediction.date}</span>
                                <span className="font-medium">${prediction.price.toLocaleString()}</span>
                                <span className="text-gray-500">{(prediction.confidence * 100).toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Prophet Model */}
                          {forecast.forecast.prophet && (
                            <div className="border-l-4 border-green-500 pl-3">
                              <div className="text-xs font-medium text-green-600 mb-2">Prophet Model</div>
                              {forecast.forecast.prophet.map((prediction, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-500">{prediction.date}</span>
                                  <span className="font-medium">${prediction.price.toLocaleString()}</span>
                                  <span className="text-gray-500">{(prediction.confidence * 100).toFixed(0)}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* ARIMA Model */}
                          {forecast.forecast.arima && (
                            <div className="border-l-4 border-purple-500 pl-3">
                              <div className="text-xs font-medium text-purple-600 mb-2">ARIMA Model</div>
                              {forecast.forecast.arima.map((prediction, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{prediction.date}</span>
                                  <span className="font-medium">${prediction.price.toLocaleString()}</span>
                                  <span className="text-gray-500">{(prediction.confidence * 100).toFixed(0)}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {forecastLoading ? (
                      <span className="text-gray-500">Loading...</span>
                    ) : forecastData?.forecasts ? (
                      (() => {
                        let totalValue = 0;
                        console.log('🔍 Calculating portfolio value from forecast data:', forecastData.forecasts);
                        
                        if (forecastData.forecasts.stocks) {
                          forecastData.forecasts.stocks.forEach(stock => {
                            console.log(`📊 Stock ${stock.symbol}: $${stock.currentPrice}`);
                            totalValue += stock.currentPrice || 0;
                          });
                        }
                        if (forecastData.forecasts.crypto) {
                          forecastData.forecasts.crypto.forEach(crypto => {
                            console.log(`📊 Crypto ${crypto.symbol}: $${crypto.currentPrice}`);
                            totalValue += crypto.currentPrice || 0;
                          });
                        }
                        
                        console.log(`💰 Total calculated value: $${totalValue}`);
                        return totalValue > 0 ? `$${totalValue.toLocaleString()}` : 'N/A';
                      })()
                    ) : userPortfolio?.totalValue ? `$${userPortfolio.totalValue.toLocaleString()}` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Selected Assets Value</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedAssets.length > 0 ? selectedAssets.length : 0}
                  </div>
                  <div className="text-sm text-gray-500">Selected Assets</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{forecastHorizon}</div>
                  <div className="text-sm text-gray-500">Forecast Days</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {forecastData?.timestamp ? new Date(forecastData.timestamp).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Last Generated</div>
                </div>
              </div>
              
              {/* Debug Information */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Debug Info</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Selected Assets:</strong> {selectedAssets.join(', ')}</p>
                    <p><strong>Forecast Data Available:</strong> {forecastData ? 'Yes' : 'No'}</p>
                    <p><strong>Forecasts Object:</strong> {forecastData?.forecasts ? 'Available' : 'Not Available'}</p>
                    <p><strong>Stocks Count:</strong> {forecastData?.forecasts?.stocks?.length || 0}</p>
                    <p><strong>Crypto Count:</strong> {forecastData?.forecasts?.crypto?.length || 0}</p>
                    <p><strong>User Portfolio:</strong> {userPortfolio ? 'Available' : 'Not Available'}</p>
                  </div>
                </div>
              )}

              {/* Selected Assets Summary */}
              {selectedAssets.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Selected Assets Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedAssets.map((asset) => {
                      const assetType = assetTypes?.[asset] || 'unknown';
                      const isStock = assetType === 'stock';
                      const isCrypto = assetType === 'crypto';
                      
                      // Get current price from forecast data or fallback
                      let currentPrice = 0;
                      if (forecastData?.forecasts) {
                        if (isStock && forecastData.forecasts.stocks) {
                          const stock = forecastData.forecasts.stocks.find(s => s.symbol === asset);
                          currentPrice = stock?.currentPrice || 0;
                        } else if (isCrypto && forecastData.forecasts.crypto) {
                          const crypto = forecastData.forecasts.crypto.find(c => c.symbol === asset);
                          currentPrice = crypto?.currentPrice || 0;
                        }
                      }
                      
                      return (
                        <div key={asset} className={`p-3 rounded-lg border ${
                          isStock ? 'bg-blue-50 border-blue-200' :
                          isCrypto ? 'bg-orange-50 border-orange-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {getAssetIcon(assetType)}
                              <span className="ml-2 font-medium text-gray-900">{asset}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isStock ? 'bg-blue-100 text-blue-800' :
                              isCrypto ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {assetType}
                            </span>
                          </div>
                          {currentPrice > 0 && (
                            <div className="text-sm text-gray-600">
                              Current Price: <span className="font-medium">${currentPrice.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Assets Selected State */}
        {!forecastData && !forecastLoading && selectedAssets.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assets Selected</h3>
            <p className="text-gray-600 mb-4">
              Select up to {maxAssets} assets from your portfolio to generate forecasts
            </p>
            <div className="text-sm text-gray-500">
              <p>• Choose from available stocks and crypto assets</p>
              <p>• Generate AI-powered price predictions</p>
              <p>• Download detailed reports in multiple formats</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {forecastLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating forecasts...</p>
          </div>
        )}

        {/* Error State */}
        {forecastData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error generating forecasts: {forecastData.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastView;
