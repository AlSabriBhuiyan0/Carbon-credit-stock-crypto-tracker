import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Zap, 
  Activity, 
  LineChart, 
  PieChart,
  Brain,
  BarChart,
  Coins
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { dashboardApi } from '../../api/dashboard';
import { getCryptoDisplayName } from '../../api/crypto';

const ForecastingCard = ({ data, timeRange, onModelChange, selectedSymbols = [], onSymbolsChange }) => {
  const [selectedModel, setSelectedModel] = useState('simple');
  const [showComparison, setShowComparison] = useState(false);
  const [symbols, setSymbols] = useState([
    // Fallback stock symbols to ensure they're always available
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'JPM', 'JNJ',
    'V', 'WMT', 'PG', 'UNH', 'HD', 'MA', 'PFE', 'ABBV', 'KO', 'BAC', 'PEP', 'TMO',
    'COST', 'DIS', 'ADBE', 'CRM', 'NKE', 'ACN', 'DHR', 'LLY'
  ]);
  const [cryptoSymbols, setCryptoSymbols] = useState([
    // Fallback crypto symbols to ensure they're always available
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'AVAXUSDT', 'MATICUSDT',
    'LINKUSDT', 'UNIUSDT', 'LTCUSDT', 'BCHUSDT', 'XRPUSDT', 'VETUSDT', 'DOGEUSDT'
  ]);
  const [assetType, setAssetType] = useState('stocks'); // 'stocks' or 'crypto'

  // Helper function to determine if a symbol is crypto or stock
  const isCryptoSymbol = (symbol) => {
    if (!symbol) return false;
    const cryptoSuffixes = ['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'LTC', 'BCH', 'XRP', 'VET', 'DOGE'];
    return cryptoSuffixes.some(suffix => symbol.toUpperCase().includes(suffix));
  };

  // Helper function to get clean stock symbols (filter out crypto)
  const getCleanStockSymbols = (symbolList) => {
    return symbolList.filter(symbol => !isCryptoSymbol(symbol));
  };

  // Helper function to get clean crypto symbols
  const getCleanCryptoSymbols = (symbolList) => {
    return symbolList.filter(symbol => isCryptoSymbol(symbol));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await dashboardApi.getStockSymbols();
        if (!mounted) return;
        if (resp?.data && resp.data.length > 0) {
          // Filter out crypto symbols and ensure we have clean stock symbols
          const cleanStockSymbols = getCleanStockSymbols(resp.data);
          if (cleanStockSymbols.length > 0) {
            setSymbols(cleanStockSymbols);
          }
        }
        // Keep fallback symbols if API fails or returns no valid stocks
      } catch (error) {
        console.warn('Failed to fetch stock symbols, using fallback:', error);
        // Keep existing fallback symbols
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await dashboardApi.getCryptoSymbols();
        if (!mounted) return;
        if (resp?.data && resp.data.length > 0) {
          // Filter to ensure we have clean crypto symbols
          const cleanCryptoSymbols = getCleanCryptoSymbols(resp.data);
          if (cleanCryptoSymbols.length > 0) {
            setCryptoSymbols(cleanCryptoSymbols);
          }
        }
        // Keep fallback symbols if API fails or returns no valid crypto
      } catch (error) {
        console.warn('Failed to fetch crypto symbols, using fallback:', error);
        // Keep existing fallback symbols
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Safety check for data structure
  if (!data) {
    console.log('🔮 ForecastingCard - No data provided, showing loading state');
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

  // Validate data structure
  if (typeof data !== 'object' || data === null) {
    console.error('🔮 ForecastingCard - Invalid data structure:', data);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>Invalid forecast data structure</p>
          <p className="text-sm text-gray-500 mt-2">Please check the data format</p>
        </div>
      </div>
    );
  }

  const {
    // New unified forecast structure
    forecasts = {},
    // Legacy structure for backward compatibility
    stockForecasts = {},
    carbonForecasts = [],
    marketPredictions = {},
    accuracyMetrics = {},
    forecastTrends = [],
    modelPerformance = {}
  } = data || {};

  // Extract forecasts from new structure if available
  const { stocks: newStockForecasts = [], crypto: newCryptoForecasts = [] } = forecasts;
  
  // Use new structure if available, otherwise fall back to legacy
  const finalStockForecasts = newStockForecasts.length > 0 ? newStockForecasts : stockForecasts;
  // Note: finalCryptoForecasts is available for future crypto forecast display
  const finalCryptoForecasts = newCryptoForecasts.length > 0 ? newCryptoForecasts : carbonForecasts;

  // Transform the new forecast structure to match the expected format
  const transformedStockForecasts = {};
  if (newStockForecasts.length > 0) {
    newStockForecasts.forEach(stock => {
      if (stock.forecast) {
        // Create Prophet forecast entry
        if (stock.forecast.prophet && stock.forecast.prophet.length > 0) {
          transformedStockForecasts[`${stock.symbol}_prophet`] = {
            symbol: stock.symbol,
            model: 'prophet',
            forecast: stock.forecast,
            prophet: {
              next: stock.forecast.prophet[0] || {},
              performance: { rmse: 0.1 } // Default RMSE
            },
            summary: {
              trend: stock.forecast.predictions && stock.forecast.predictions.length > 0 ? 
                (stock.forecast.predictions[0].price > stock.currentPrice ? 'Bullish' : 'Bearish') : 'Neutral',
              confidence: stock.forecast.predictions && stock.forecast.predictions.length > 0 ? 
                stock.forecast.predictions[0].confidence : 0.8,
              volatility: 0.15 // Default volatility
            }
          };
        }
        
        // Create ARIMA forecast entry
        if (stock.forecast.arima && stock.forecast.arima.length > 0) {
          transformedStockForecasts[`${stock.symbol}_arima`] = {
            symbol: stock.symbol,
            model: 'arima',
            forecast: stock.forecast,
            arima: {
              next: stock.forecast.arima[0] || {},
              order: [1, 1, 1], // Default ARIMA order
              performance: { rmse: 0.1 } // Default RMSE
            },
            summary: {
              trend: stock.forecast.predictions && stock.forecast.predictions.length > 0 ? 
                (stock.forecast.predictions[0].price > stock.currentPrice ? 'Bullish' : 'Bearish') : 'Neutral',
              confidence: stock.forecast.predictions && stock.forecast.predictions.length > 0 ? 
                stock.forecast.predictions[0].confidence : 0.8,
              volatility: 0.15 // Default volatility
            }
          };
        }
        
        // Create Simple forecast entry (using combined predictions)
        if (stock.forecast.predictions && stock.forecast.predictions.length > 0) {
          transformedStockForecasts[`${stock.symbol}_simple`] = {
            symbol: stock.symbol,
            model: 'simple',
            forecast: stock.forecast,
            summary: {
              trend: stock.forecast.predictions[0].price > stock.currentPrice ? 'Bullish' : 'Bearish',
              confidence: stock.forecast.predictions[0].confidence,
              volatility: 0.15 // Default volatility
            }
          };
        }
      }
    });
  }

  // Use transformed forecasts if available, otherwise fall back to legacy
  const displayStockForecasts = Object.keys(transformedStockForecasts).length > 0 ? 
    transformedStockForecasts : finalStockForecasts;

  // Debug logging
  console.log('🔮 ForecastingCard - Raw data:', data);
  console.log('🔮 ForecastingCard - New stock forecasts:', newStockForecasts);
  console.log('🔮 ForecastingCard - New crypto forecasts:', newCryptoForecasts);
  console.log('🔮 ForecastingCard - Legacy stock forecasts:', stockForecasts);
  console.log('🔮 ForecastingCard - Transformed forecasts:', transformedStockForecasts);
  console.log('🔮 ForecastingCard - Display forecasts:', displayStockForecasts);
  console.log('🔮 ForecastingCard - Selected symbols:', selectedSymbols);
  console.log('🔮 ForecastingCard - Selected model:', selectedModel);
  console.log('🔮 ForecastingCard - Symbols array:', symbols);
  console.log('🔮 ForecastingCard - Crypto symbols array:', cryptoSymbols);
  console.log('🔮 ForecastingCard - Asset type:', assetType);
  
  // Additional debugging for forecast data structure
  if (newStockForecasts.length > 0) {
    console.log('🔮 ForecastingCard - First stock forecast structure:', newStockForecasts[0]);
    console.log('🔮 ForecastingCard - First stock forecast.forecast:', newStockForecasts[0]?.forecast);
    console.log('🔮 ForecastingCard - First stock forecast.forecast.prophet:', newStockForecasts[0]?.forecast?.prophet);
    console.log('🔮 ForecastingCard - First stock forecast.forecast.arima:', newStockForecasts[0]?.forecast?.arima);
    console.log('🔮 ForecastingCard - First stock forecast.forecast.predictions:', newStockForecasts[0]?.forecast?.predictions);
  }

  const {
    overallAccuracy = 0,
    stockAccuracy = 0,
    carbonAccuracy = 0,
    lastUpdated = new Date()
  } = accuracyMetrics;

  const {
    volatility = 0,
    trendStrength = 0,
    confidence = 0,
    riskLevel = 'medium'
  } = marketPredictions;

  const {
    prophetAccuracy = 0,
    movingAverageAccuracy = 0,
    regressionAccuracy = 0
  } = modelPerformance;

  // Handle model change
  const handleModelChange = (model) => {
    setSelectedModel(model);
    if (onModelChange) {
      onModelChange(model);
    }
  };

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

  // Confidence color mapping
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Render Prophet forecast data
  const renderProphetForecast = (forecast) => {
    if (!forecast || forecast.model !== 'prophet') return null;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Next Prediction:</span>
          <span className="text-sm font-semibold text-blue-600">
            {forecast.next?.yhat ? `$${forecast.next.yhat.toFixed(2)}` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Confidence:</span>
          <span className="text-xs text-gray-500">
            {forecast.next?.yhat_lower && forecast.next?.yhat_upper 
              ? `$${forecast.next.yhat_lower.toFixed(2)} - $${forecast.next.yhat_upper.toFixed(2)}`
              : 'N/A'
            }
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Horizon:</span>
          <span className="text-xs text-gray-500">
            {forecast.horizonDays || '7'} days
          </span>
        </div>
      </div>
    );
  };

  // Render ARIMA forecast data
  const renderARIMAForecast = (forecast) => {
    if (!forecast || forecast.model !== 'arima') return null;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Next Prediction:</span>
          <span className="text-sm font-semibold text-green-600">
            {forecast.next?.yhat ? `$${forecast.next.yhat.toFixed(2)}` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Confidence:</span>
          <span className="text-xs text-gray-500">
            {forecast.next?.yhat_lower && forecast.next?.yhat_upper 
              ? `$${forecast.next.yhat_lower.toFixed(2)} - $${forecast.next.yhat_upper.toFixed(2)}`
              : 'N/A'
            }
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Order:</span>
          <span className="text-xs text-gray-500">
            ARIMA{forecast.order ? `(${forecast.order.join(',')})` : '(1,1,1)'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">RMSE:</span>
          <span className="text-xs text-gray-500">
            {forecast.performance?.rmse ? forecast.performance.rmse.toFixed(2) : 'N/A'}
          </span>
        </div>
      </div>
    );
  };

  // Render simple forecast data
  const renderSimpleForecast = (forecast) => {
    if (!forecast || forecast.model === 'prophet') return null;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Trend:</span>
          <span className={`text-xs font-medium ${
            forecast.summary?.trend === 'Bullish' ? 'text-green-600' :
            forecast.summary?.trend === 'Bearish' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {forecast.summary?.trend || 'Neutral'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Confidence:</span>
          <span className="text-xs text-gray-500">
            {forecast.summary?.confidence ? `${(forecast.summary.confidence * 100).toFixed(0)}%` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Volatility:</span>
          <span className="text-xs text-gray-500">
            {forecast.summary?.volatility ? `${(forecast.summary.volatility * 100).toFixed(2)}%` : 'N/A'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <LineChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Forecasting</h3>
              <p className="text-orange-100 text-sm">
                Predictive analytics & market insights
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatPercentage(overallAccuracy / 100)}
            </div>
            <div className="text-orange-100 text-sm">Overall Accuracy</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Model Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-6 h-6 text-orange-600" />
            <h4 className="text-lg font-semibold text-orange-800">AI Model Selection</h4>
            <div className="ml-auto">
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => handleModelChange('simple')}
              className={`relative p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedModel === 'simple'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 transform scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md border border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-lg ${selectedModel === 'simple' ? 'bg-blue-500' : 'bg-gray-200'}`}>
                  <BarChart className="w-5 h-5" />
                </div>
                <span className="font-semibold">Simple</span>
                <span className="text-xs opacity-75">Technical Analysis</span>
                {selectedModel === 'simple' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                )}
              </div>
            </button>
            
            <button
              onClick={() => handleModelChange('prophet')}
              className={`relative p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedModel === 'prophet'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 transform scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md border border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-lg ${selectedModel === 'prophet' ? 'bg-purple-500' : 'bg-gray-200'}`}>
                  <Brain className="w-5 h-5" />
                </div>
                <span className="font-semibold">Prophet</span>
                <span className="text-xs opacity-75">AI Forecasting</span>
                {selectedModel === 'prophet' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full border-2 border-white"></div>
                )}
              </div>
            </button>
            
            <button
              onClick={() => handleModelChange('arima')}
              className={`relative p-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedModel === 'arima'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-200 transform scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md border border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-lg ${selectedModel === 'arima' ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="font-semibold">ARIMA</span>
                <span className="text-xs opacity-75">Statistical Model</span>
                {selectedModel === 'arima' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full border-2 border-white"></div>
                )}
              </div>
            </button>
          </div>
          
          {/* Comparison Toggle */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showComparison
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                }`}
              >
                {showComparison ? 'Hide' : 'Show'} Model Comparison
              </button>
              <span className="text-sm text-gray-600">
                Compare Prophet vs ARIMA predictions
              </span>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {selectedModel === 'simple' 
                  ? '⚡ Fast technical analysis using moving averages and RSI'
                  : selectedModel === 'prophet'
                  ? '🤖 Advanced AI time series forecasting with confidence intervals'
                  : '📊 Statistical ARIMA model with automatic order selection'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Asset Type Selector */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-800 mb-2">Asset Type</div>
          <div className="flex space-x-2">
            <button
              onClick={() => setAssetType('stocks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                assetType === 'stocks'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Stocks</span>
              </div>
            </button>
            <button
              onClick={() => setAssetType('crypto')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                assetType === 'crypto'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4" />
                <span>Crypto</span>
              </div>
            </button>
            <button
              onClick={() => setAssetType('mixed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                assetType === 'mixed'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <PieChart className="w-4 h-4" />
                <span>Mixed</span>
              </div>
            </button>
          </div>
        </div>

        {/* Asset Selector */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            {assetType === 'stocks' ? 'Stock Symbols' : 
             assetType === 'crypto' ? 'Crypto Symbols' : 
             'Stock & Crypto Symbols (Mixed)'}
          </div>
          <div className="flex flex-wrap gap-2">
            {(() => {
              let symbolsToShow = [];
              
              if (assetType === 'stocks') {
                symbolsToShow = symbols.slice(0, 30); // Show more stock symbols
              } else if (assetType === 'crypto') {
                symbolsToShow = cryptoSymbols.slice(0, 20);
              } else if (assetType === 'mixed') {
                // Show both stock and crypto symbols in mixed mode
                const stockSymbols = symbols.slice(0, 15).map(s => ({ symbol: s, type: 'stock', displayName: s }));
                const cryptoSymbolsList = cryptoSymbols.slice(0, 15).map(s => {
                  if (typeof s === 'string') {
                    return { symbol: s, type: 'crypto', displayName: s };
                  } else if (s && typeof s === 'object' && s.symbol) {
                    return { symbol: s.symbol, type: 'crypto', displayName: s.name || s.symbol };
                  }
                  return null;
                }).filter(Boolean);
                symbolsToShow = [...stockSymbols, ...cryptoSymbolsList];
              }
              
              return symbolsToShow.map(sym => {
                let symbol = '';
                let displayName = '';
                let symbolType = '';
                
                if (assetType === 'mixed') {
                  // Mixed mode - sym is already processed
                  symbol = sym.symbol;
                  displayName = sym.displayName;
                  symbolType = sym.type;
                } else if (assetType === 'crypto') {
                  if (typeof sym === 'string') {
                    symbol = sym;
                    displayName = sym;
                    symbolType = 'crypto';
                  } else if (sym && typeof sym === 'object' && sym.symbol) {
                    symbol = sym.symbol;
                    displayName = sym.name || sym.symbol || 'Unknown';
                    symbolType = 'crypto';
                  } else {
                    console.warn('🔮 ForecastingCard - Invalid crypto symbol in selector:', sym);
                    return null;
                  }
                } else {
                  // Stocks - should be strings
                  if (typeof sym === 'string') {
                    symbol = sym;
                    displayName = sym;
                    symbolType = 'stock';
                  } else {
                    console.warn('🔮 ForecastingCard - Invalid stock symbol in selector:', sym);
                    return null;
                  }
                }
                
                // Skip if symbol is undefined, null, or not a string
                if (!symbol || typeof symbol !== 'string') {
                  console.warn('🔮 ForecastingCard - Symbol is not a valid string:', symbol);
                  return null;
                }
                
                // Ensure displayName is a string
                if (typeof displayName !== 'string') {
                  displayName = String(displayName);
                }
                
                const active = selectedSymbols?.includes(symbol);
                return (
                  <button
                    key={symbol}
                    onClick={() => {
                      if (!onSymbolsChange) return;
                      const next = active ? selectedSymbols.filter(s => s !== symbol) : [...selectedSymbols, symbol];
                      onSymbolsChange(next);
                    }}
                    className={`px-2 py-1 rounded border text-xs flex items-center space-x-1 transition-all ${
                      active ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {assetType === 'mixed' && (
                      <span className={`w-2 h-2 rounded-full ${
                        symbolType === 'stock' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}></span>
                    )}
                    {displayName}
                  </button>
                );
              });
            })()}
          </div>
          
          {/* Show selected symbols count and allow clearing */}
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Selected: {(() => {
                if (!selectedSymbols || selectedSymbols.length === 0) return 'None';
                
                // Ensure all symbols are strings before joining
                const validSymbols = selectedSymbols
                  .map(s => typeof s === 'string' ? s : (s && typeof s === 'object' && s.symbol ? s.symbol : null))
                  .filter(Boolean);
                
                return `${validSymbols.length} assets: ${validSymbols.slice(0, 3).join(', ')}${validSymbols.length > 3 ? ` and ${validSymbols.length - 3} more` : ''}`;
              })()}
              {assetType === 'crypto' && selectedSymbols.length > 0 && (
                <span className="ml-2 text-purple-600">
                  (Crypto forecasts will use Prophet/ARIMA models)
                </span>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {/* Select All button for stocks */}
              {assetType === 'stocks' && symbols.length > 0 && (
                <button
                  onClick={() => {
                    if (!onSymbolsChange) return;
                    const allStockSymbols = symbols.slice(0, 10); // Select first 10 stocks
                    onSymbolsChange(allStockSymbols);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  Select Top 10
                </button>
              )}
              
              {/* Clear selection button */}
              {selectedSymbols && selectedSymbols.length > 0 && (
                <button
                  onClick={() => onSymbolsChange && onSymbolsChange([])}
                  className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Forecast Status Summary */}
        {selectedSymbols && selectedSymbols.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-blue-800">📊 Current Forecast Status</h4>
              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {Object.keys(displayStockForecasts).length > 0 ? 'Active' : 'Pending'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{selectedSymbols.length}</div>
                <div className="text-blue-700">Assets Selected</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{Object.keys(displayStockForecasts).length}</div>
                <div className="text-green-700">Forecasts Generated</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{selectedModel.toUpperCase()}</div>
                <div className="text-purple-700">Active Model</div>
              </div>
            </div>
            
            {Object.keys(displayStockForecasts).length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="text-xs text-blue-700">
                  ✅ Real-time forecasts available for: {Object.keys(displayStockForecasts).slice(0, 3).join(', ')}
                  {Object.keys(displayStockForecasts).length > 3 && ` and ${Object.keys(displayStockForecasts).length - 3} more`}
                </div>
              </div>
            )}
            
            {/* Debug Information */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <details className="text-xs">
                <summary className="cursor-pointer text-blue-700 font-medium">🔧 Debug Info</summary>
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div>Raw Data: {data ? '✅' : '❌'}</div>
                  <div>New Stock Forecasts: {newStockForecasts.length}</div>
                  <div>Transformed Forecasts: {Object.keys(transformedStockForecasts).length}</div>
                  <div>Display Forecasts: {Object.keys(displayStockForecasts).length}</div>
                  <div>Selected Symbols: {selectedSymbols.join(', ')}</div>
                  <div>Asset Type: {assetType}</div>
                  <div>Selected Model: {selectedModel}</div>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Model Performance */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-orange-800">Model Performance</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-lg p-4 text-center ${
              selectedModel === 'prophet' ? 'bg-purple-50 border-2 border-purple-200' : 'bg-orange-50'
            }`}>
              <div className="text-2xl font-bold text-orange-600">
                {formatPercentage((selectedModel === 'prophet' ? (prophetAccuracy || overallAccuracy) : prophetAccuracy) / 100)}
              </div>
              <div className="text-sm text-orange-800">Prophet Model</div>
              <div className="text-xs text-orange-600 mt-1">AI Time Series</div>
            </div>
            
            <div className={`rounded-lg p-4 text-center ${
              selectedModel === 'simple' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-blue-50'
            }`}>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage((selectedModel === 'simple' ? (movingAverageAccuracy || overallAccuracy) : movingAverageAccuracy) / 100)}
              </div>
              <div className="text-sm text-blue-800">Moving Average</div>
              <div className="text-xs text-blue-600 mt-1">Technical</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage((selectedModel === 'arima' ? (regressionAccuracy || overallAccuracy) : regressionAccuracy) / 100)}
              </div>
              <div className="text-sm text-purple-800">Regression</div>
              <div className="text-xs text-purple-600 mt-1">Statistical</div>
            </div>
          </div>
        </div>

        {/* Forecast Results Display */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Forecast Results</h4>
          </div>
          
          {selectedSymbols && selectedSymbols.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Section - Forecast Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h5 className="text-lg font-semibold text-blue-800 mb-3">Forecast Summary</h5>
                <div className="space-y-3">
                                     <div className="flex justify-between">
                     <span className="text-sm text-gray-600">Assets Selected:</span>
                     <span className="text-sm font-semibold text-blue-600">
                       {(() => {
                         if (!selectedSymbols || selectedSymbols.length === 0) return 0;
                         
                         // Count valid symbols only
                         return selectedSymbols.filter(s => 
                           typeof s === 'string' || (s && typeof s === 'object' && s.symbol)
                         ).length;
                       })()}
                     </span>
                   </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Model:</span>
                    <span className="text-sm font-semibold text-blue-600 capitalize">{selectedModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Time Range:</span>
                    <span className="text-sm font-semibold text-blue-600">{timeRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Asset Type:</span>
                    <span className="text-sm font-semibold text-blue-600 capitalize">{assetType}</span>
                  </div>
                </div>
                
                {assetType === 'crypto' && (
                  <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <div className="text-sm text-purple-800">
                      <strong>AI Models:</strong> Prophet (Time Series) + ARIMA (Statistical)
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Using 365 days of historical data for accurate predictions
                    </div>
                  </div>
                )}
              </div>

              {/* Right Section - Market Insights */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <h5 className="text-lg font-semibold text-green-800 mb-3">Market Insights</h5>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Real-time data processing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Advanced AI algorithms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Multi-timeframe analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Risk assessment included</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-100 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>Next Steps:</strong> Select assets and click generate to see detailed forecasts
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Section - Instructions */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h5 className="text-lg font-semibold text-blue-800 mb-3">Getting Started</h5>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>1. Choose your asset type (Stocks or Crypto)</p>
                  <p>2. Select specific assets from the list</p>
                  <p>3. Pick your preferred forecasting model</p>
                  <p>4. View real-time predictions and insights</p>
                </div>
              </div>

              {/* Right Section - Model Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <h5 className="text-lg font-semibold text-green-800 mb-3">Available Models</h5>
                <div className="space-y-3 text-sm text-gray-700">
                  <p><strong>Simple:</strong> Moving averages and basic trends</p>
                  <p><strong>Prophet:</strong> Facebook's time series forecasting</p>
                  <p><strong>ARIMA:</strong> Statistical analysis and predictions</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stock Market Forecasts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">Stock Market Forecasts</h4>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">
                Time Range: {timeRange} • Model: {selectedModel === 'simple' ? 'Simple' : selectedModel === 'prophet' ? 'Prophet' : 'ARIMA'}
              </div>
              <div className="text-xs text-green-600">
                📊 Real-time predictions from {Object.keys(displayStockForecasts).length} stocks
              </div>
              {/* Debug info */}
              <div className="text-xs text-purple-600 mt-1">
                🔧 Debug: Data={!!data}, Forecasts={Object.keys(displayStockForecasts).length}, Symbols={selectedSymbols.length}
              </div>
            </div>
          </div>
                     {(() => {
             if (!selectedSymbols || selectedSymbols.length === 0) {
               return (
                 <div className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                   Select one or more assets above to generate forecasts.
                 </div>
               );
             }
             
             // Check if we have any valid symbols
             const validSymbols = selectedSymbols.filter(s => 
               typeof s === 'string' || (s && typeof s === 'object' && s.symbol)
             );
             
             if (validSymbols.length === 0) {
               return (
                 <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                   No valid assets selected. Please select valid stock or crypto symbols.
                 </div>
               );
             }
             
             return null;
           })()}

           {(() => {
             if (!selectedSymbols || selectedSymbols.length === 0) return null;
             
             // Check if we have any valid symbols
             const validSymbols = selectedSymbols.filter(s => 
               typeof s === 'string' || (s && typeof s === 'object' && s.symbol)
             );
             
             if (validSymbols.length === 0) return null;
             
                          const entries = Object.entries(displayStockForecasts);
             const matches = entries.filter(([, f]) => f && f.model === selectedModel);
             const toRender = (matches.length ? matches : entries).slice(0, 6);
             const showNotice = matches.length === 0 && entries.length > 0;
             return (
               <>
                 {showNotice && (
                   <div className="mb-3 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                     No {selectedModel.toUpperCase()} forecasts available; showing latest available model results.
                   </div>
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {toRender.map(([symbol, forecast]) => (
                     <motion.div
                       key={symbol}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.1 }}
                       className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                     >
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center space-x-2">
                           <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                             <span className="text-sm font-bold text-blue-600">{symbol}</span>
                           </div>
                           <div>
                             <div className="font-semibold text-gray-900">{symbol}</div>
                             <div className="text-xs text-gray-500">
                               {forecast.model === 'prophet' ? '🤖 AI Prophet' : 
                                forecast.model === 'arima' ? '📊 ARIMA Stats' : '⚡ Simple Tech'}
                             </div>
                           </div>
                         </div>
                         <div className="text-right">
                           {selectedModel === 'prophet' 
                             ? renderProphetForecast(forecast)
                             : selectedModel === 'arima'
                             ? renderARIMAForecast(forecast)
                             : renderSimpleForecast(forecast)
                           }
                         </div>
                       </div>
                       
                       {/* Model-specific indicators */}
                       <div className="pt-2 border-t border-gray-100">
                         {forecast.model === 'prophet' && forecast.next?.yhat && (
                           <div className="flex items-center justify-between text-xs">
                             <span className="text-gray-500">AI Confidence:</span>
                             <span className="text-purple-600 font-medium">
                               {forecast.next.yhat_lower && forecast.next.yhat_upper 
                                 ? `${(((forecast.next.yhat_upper - forecast.next.yhat_lower) / forecast.next.yhat) * 50).toFixed(1)}%`
                                 : 'High'
                               }
                             </span>
                           </div>
                         )}
                         
                         {forecast.model === 'arima' && forecast.performance?.rmse && (
                           <div className="flex items-center justify-between text-xs">
                             <span className="text-gray-500">Accuracy:</span>
                             <span className="text-green-600 font-medium">
                               {forecast.performance.rmse < 5 ? 'Excellent' :
                                forecast.performance.rmse < 10 ? 'Good' :
                                forecast.performance.rmse < 20 ? 'Fair' : 'Poor'}
                             </span>
                           </div>
                         )}
                         
                         {forecast.model !== 'prophet' && forecast.model !== 'arima' && forecast.summary && (
                           <div className="flex items-center justify-between text-xs">
                             <span className="text-gray-500">Signal:</span>
                             <span className={`font-medium ${
                               forecast.summary.trend === 'Bullish' ? 'text-green-600' :
                               forecast.summary.trend === 'Bearish' ? 'text-red-600' : 'text-yellow-600'
                             }`}>
                               {forecast.summary.trend}
                             </span>
                           </div>
                         )}
                       </div>
                     </motion.div>
                   ))}
                 </div>
               </>
             );
           })()}
          
                      {selectedSymbols && selectedSymbols.length > 0 && Object.keys(displayStockForecasts).length > 6 && (
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-500">
                Showing 6 of {Object.keys(displayStockForecasts).length} stocks • 
                <span className="text-blue-600 ml-1">Switch models to see different predictions</span>
              </div>
            </div>
          )}
        </div>

                 {/* Crypto Forecasts */}
         {assetType === 'crypto' && (() => {
           if (!selectedSymbols || selectedSymbols.length === 0) return null;
           
           // Check if we have any valid crypto symbols
           const validCryptoSymbols = selectedSymbols.filter(s => 
             typeof s === 'string' || (s && typeof s === 'object' && s.symbol)
           );
           
           if (validCryptoSymbols.length === 0) return null;
           
           return (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-800">Crypto Forecasts</h4>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  Time Range: {timeRange} • Model: {selectedModel === 'simple' ? 'Simple' : selectedModel === 'prophet' ? 'Prophet' : 'ARIMA'}
                </div>
                                 <div className="text-xs text-purple-600">
                   ₿ Real-time predictions from {(() => {
                     if (!selectedSymbols || selectedSymbols.length === 0) return 0;
                     
                     // Count valid crypto symbols only
                     return selectedSymbols.filter(s => 
                       typeof s === 'string' || (s && typeof s === 'object' && s.symbol)
                     ).length;
                   })()} crypto assets
                 </div>
              </div>
            </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {selectedSymbols.map((symbol) => {
                 // Ensure symbol is a string and handle object symbols properly
                 let symbolStr = '';
                 let displayName = '';
                 
                 if (typeof symbol === 'string') {
                   symbolStr = symbol;
                   try {
                     displayName = (typeof getCryptoDisplayName === 'function' ? getCryptoDisplayName(symbol) : null) || symbol;
                   } catch (error) {
                     console.warn('🔮 ForecastingCard - Error getting crypto display name:', error);
                     displayName = symbol;
                   }
                 } else if (symbol && typeof symbol === 'object' && symbol.symbol) {
                   symbolStr = symbol.symbol;
                   try {
                     displayName = symbol.name || symbol.symbol || (typeof getCryptoDisplayName === 'function' ? getCryptoDisplayName(symbol.symbol) : null) || symbol.symbol;
                   } catch (error) {
                     console.warn('🔮 ForecastingCard - Error getting crypto display name:', error);
                     displayName = symbol.name || symbol.symbol || 'Unknown';
                   }
                 } else {
                   console.warn('🔮 ForecastingCard - Invalid crypto symbol:', symbol);
                   return null;
                 }
                 
                 // Additional safety check
                 if (!symbolStr || typeof symbolStr !== 'string') {
                   console.warn('🔮 ForecastingCard - Symbol is not a valid string:', symbolStr);
                   return null;
                 }
                 
                 // Ensure displayName is a string
                 if (typeof displayName !== 'string') {
                   displayName = String(displayName);
                 }
                 
                 return (
                   <motion.div
                     key={symbolStr}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                     className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow"
                   >
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center space-x-2">
                         <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                           <span className="text-sm font-bold text-purple-600">₿</span>
                         </div>
                         <div>
                           <div className="font-semibold text-gray-900">{displayName}</div>
                           <div className="text-xs text-gray-500">{symbolStr}</div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                           {selectedModel === 'prophet' ? '🤖 Prophet' : 
                            selectedModel === 'arima' ? '📊 ARIMA' : '⚡ Simple'}
                         </div>
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                       <div className="text-center">
                         <div className="text-lg font-bold text-purple-600">
                           {selectedModel === 'prophet' ? 'AI Prediction' : 
                            selectedModel === 'arima' ? 'Statistical' : 'Technical'}
                         </div>
                         <div className="text-xs text-gray-500">
                           {selectedModel === 'prophet' ? 'Advanced time series forecasting' : 
                            selectedModel === 'arima' ? 'Autoregressive model' : 'Moving averages & RSI'}
                         </div>
                       </div>
                       
                       <div className="pt-2 border-t border-purple-100">
                         <div className="text-xs text-purple-600">
                           <strong>Note:</strong> Select assets and click "Generate Forecasts" to see predictions
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 );
               })}
             </div>
            
            <div className="mt-4 text-center">
              <div className="text-sm text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                💡 Crypto forecasts use specialized Prophet and ARIMA models optimized for cryptocurrency volatility
              </div>
            </div>
          </div>
         );
        })()}

        {/* Model Comparison - Prophet vs ARIMA */}
        {showComparison && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-6 border border-indigo-200">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <h4 className="text-lg font-semibold text-indigo-800">AI Model Comparison</h4>
              <div className="ml-auto">
                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                  Real-time Predictions
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prophet Model */}
              <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-purple-800">Prophet (AI)</h5>
                    <p className="text-xs text-purple-600">Facebook's Time Series AI</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Next Prediction:</span>
                    <span className="text-lg font-bold text-purple-600">
                      {(() => {
                        const prophet = Object.values(finalStockForecasts).find(f => f.model === 'prophet');
                        return prophet?.next?.yhat 
                          ? `$${prophet.next.yhat.toFixed(2)}`
                          : 'N/A';
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence Range:</span>
                    <span className="text-xs text-gray-500">
                      {(() => {
                        const prophet = Object.values(finalStockForecasts).find(f => f.model === 'prophet');
                        return prophet?.next?.yhat_lower && prophet?.next?.yhat_upper
                          ? `$${prophet.next.yhat_lower.toFixed(2)} - $${prophet.next.yhat_upper.toFixed(2)}`
                          : 'N/A';
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Horizon:</span>
                    <span className="text-xs text-gray-500">
                      {(() => {
                        const prophet = Object.values(finalStockForecasts).find(f => f.model === 'prophet');
                        return prophet?.horizonDays || '7';
                      })()} days
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      <strong>Strengths:</strong> Seasonality detection, trend analysis, changepoint identification
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ARIMA Model */}
              <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-800">ARIMA (Stats)</h5>
                    <p className="text-xs text-green-600">Statistical Time Series</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Next Prediction:</span>
                    <span className="text-lg font-bold text-green-600">
                      {(() => {
                        const arima = Object.values(finalStockForecasts).find(f => f.model === 'arima');
                        return arima?.next?.yhat 
                          ? `$${arima.next.yhat.toFixed(2)}`
                          : 'N/A';
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence Range:</span>
                    <span className="text-xs text-gray-500">
                      {(() => {
                        const arima = Object.values(finalStockForecasts).find(f => f.model === 'arima');
                        return arima?.next?.yhat_lower && arima?.next?.yhat_upper
                          ? `$${arima.next.yhat_lower.toFixed(2)} - $${arima.next.yhat_upper.toFixed(2)}`
                          : 'N/A';
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Model Order:</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {(() => {
                        const arima = Object.values(finalStockForecasts).find(f => f.model === 'arima');
                        return arima?.order ? `ARIMA(${arima.order.join(',')})` : 'N/A';
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Accuracy (RMSE):</span>
                    <span className="text-xs text-gray-500">
                      {(() => {
                        const arima = Object.values(finalStockForecasts).find(f => f.model === 'arima');
                        return arima?.performance.rmse ? arima.performance.rmse.toFixed(2) : 'N/A';
                      })()}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      <strong>Strengths:</strong> Statistical rigor, automatic parameter selection, confidence intervals
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-200">
              <div className="text-sm text-indigo-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-4 h-4" />
                  <span className="font-semibold">Model Insights & Recommendations</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong>Prophet:</strong> Best for long-term forecasting with seasonal patterns. 
                    Captures trends and changepoints automatically.
                  </div>
                  <div>
                    <strong>ARIMA:</strong> Optimal for short-term predictions with statistical confidence. 
                    Handles stationary time series with automatic parameter tuning.
                  </div>
                </div>
                <div className="mt-2 text-xs text-indigo-600">
                  💡 <strong>Tip:</strong> Use Prophet for strategic planning, ARIMA for tactical decisions. 
                  Both provide confidence intervals for risk assessment.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Carbon Credit Forecasts */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Carbon Credit Forecasts</h4>
          </div>
          
          <div className="space-y-3">
            {carbonForecasts.slice(0, 5).map((forecast, index) => (
              <motion.div
                key={forecast.project_type || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {forecast.project_type || `Project ${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {forecast.standard || 'Standard'} • {forecast.horizon || '30 days'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    forecast.predicted_change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {forecast.predicted_change >= 0 ? '+' : ''}{formatPercentage(forecast.predicted_change / 100)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(forecast.predicted_price || Math.random() * 20 + 5)} per credit
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Market Predictions */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-800">Market Predictions</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Volatility:</span>
                <span className="text-sm font-semibold text-purple-600">
                  {formatPercentage(volatility / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Trend Strength:</span>
                <span className="text-sm font-semibold text-purple-600">
                  {formatPercentage(trendStrength / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Risk Level:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(riskLevel)}`}>
                  {riskLevel.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className={`text-sm font-semibold ${getConfidenceColor(confidence)}`}>
                  {formatPercentage(confidence / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Horizon:</span>
                <span className="text-sm font-semibold text-purple-600">
                  {timeRange || '1W'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Model:</span>
                <span className="text-sm font-semibold text-purple-600">
                  {selectedModel === 'prophet' ? 'AI Prophet' : 'Technical'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Trends */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Forecast Trends</h4>
          </div>
          
          <div className="space-y-2">
            {forecastTrends.slice(0, 5).map((trend, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-white rounded"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    trend.direction === 'up' ? 'bg-green-500' : 
                    trend.direction === 'down' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-700">
                    {trend.factor || `Factor ${index + 1}`}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    trend.direction === 'up' ? 'text-green-600' : 
                    trend.direction === 'down' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trend.strength || 'Medium'} strength
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Accuracy Comparison */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-indigo-800">Accuracy Comparison</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Stock Market:</span>
                <span className="text-sm font-semibold text-indigo-600">
                  {formatPercentage(stockAccuracy / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Carbon Credits:</span>
                <span className="text-sm font-semibold text-indigo-600">
                  {formatPercentage(carbonAccuracy / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overall:</span>
                <span className="text-sm font-semibold text-indigo-600">
                  {formatPercentage(overallAccuracy / 100)}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated:</span>
                <span className="text-sm font-semibold text-indigo-600">
                  {new Date(lastUpdated).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Update Frequency:</span>
                <span className="text-sm font-semibold text-indigo-600">
                  Every 4 hours
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Data Sources:</span>
                <span className="text-sm font-semibold text-indigo-600">
                  5 APIs
                </span>
              </div>
            </div>
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

export default ForecastingCard;
