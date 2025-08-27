import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CogIcon,
  LightBulbIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

import { 
  cryptoAPI, 
  DEFAULT_CRYPTO_SYMBOLS, 
  POPULAR_CRYPTO_SYMBOLS,
  getCryptoDisplayName,
  formatCryptoPrice,
  formatPercentageChange,
  getSentimentColor,
  getSentimentBgColor
} from '../../api/crypto';

import CryptoPriceCard from '../../components/Crypto/CryptoPriceCard';
import CryptoForecastChart from '../../components/Crypto/CryptoForecastChart';
import CryptoSentimentCard from '../../components/Crypto/CryptoSentimentCard';
import CryptoPortfolioOverview from '../../components/Crypto/CryptoPortfolioOverview';
import CryptoHistoricalChart from '../../components/Crypto/CryptoHistoricalChart';

const CryptoView = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [forecastHorizon, setForecastHorizon] = useState(7);
  const [showRealTime, setShowRealTime] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const queryClient = useQueryClient();

  // Fetch crypto service status
  const { data: serviceStatus, isLoading: statusLoading } = useQuery(
    'crypto-status',
    cryptoAPI.getStatus,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 10000,
    }
  );

  // Fetch real-time prices for all default symbols
  const { data: pricesData, isLoading: pricesLoading } = useQuery(
    ['crypto-prices', DEFAULT_CRYPTO_SYMBOLS],
    async () => {
      console.log('Fetching crypto prices for symbols:', DEFAULT_CRYPTO_SYMBOLS);
      const promises = DEFAULT_CRYPTO_SYMBOLS.map(symbol => 
        cryptoAPI.getPrice(symbol).catch((error) => {
          console.error(`Error fetching price for ${symbol}:`, error);
          return null;
        })
      );
      const results = await Promise.allSettled(promises);
      const filteredResults = results
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            console.log(`Price data for ${DEFAULT_CRYPTO_SYMBOLS[index]}:`, result.value);
            return result.value;
          } else {
            console.error(`Failed to fetch price for ${DEFAULT_CRYPTO_SYMBOLS[index]}:`, result.reason);
            return null;
          }
        })
        .filter(Boolean);
      
      console.log('Final filtered prices data:', filteredResults);
      return filteredResults;
    },
    {
      refetchInterval: showRealTime && autoRefresh ? 10000 : false, // Refresh every 10 seconds if enabled
      staleTime: 5000,
      enabled: true, // Always enabled for testing
    }
  );

  // Fetch unified forecast for selected symbol (using the same system as Forecasts page)
  const { data: unifiedForecast, isLoading: forecastLoading, error: forecastError, isError: forecastIsError } = useQuery(
    ['crypto-unified-forecast', selectedSymbol, forecastHorizon],
    async () => {
      try {
        console.log('🔄 Fetching unified forecast for:', selectedSymbol, 'horizon:', forecastHorizon);
        
        const response = await fetch(`http://localhost:5001/api/forecast/mixed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assets: [selectedSymbol],
            horizon: forecastHorizon,
            useRealData: true
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Unified forecast data received:', data);
        console.log('📊 Crypto forecasts available:', data?.forecasts?.crypto?.length || 0);
        
        return data;
      } catch (error) {
        console.error('❌ Error fetching unified forecast:', error);
        throw error;
      }
    },
    {
      enabled: !!selectedSymbol,
      staleTime: 2 * 60 * 1000, // 2 minutes for real-time data
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  );

  // Extract Prophet and ARIMA forecasts from unified data for backward compatibility
  const prophetForecast = (() => {
    try {
      console.log('🔍 Extracting Prophet forecast from unified data...');
      
      // Safety check: ensure unifiedForecast exists and has the expected structure
      if (!unifiedForecast || typeof unifiedForecast !== 'object') {
        console.log('⚠️  Unified forecast data is not available or invalid');
        return null;
      }
      
      console.log('📊 Unified forecast structure:', {
        hasForecasts: !!unifiedForecast?.forecasts,
        hasCrypto: !!unifiedForecast?.forecasts?.crypto,
        cryptoLength: unifiedForecast?.forecasts?.crypto?.length || 0,
        hasForecast: !!unifiedForecast?.forecasts?.crypto?.[0]?.forecast,
        hasProphet: !!unifiedForecast?.forecasts?.crypto?.[0]?.forecast?.prophet
      });
      
      // Check if we have the required nested structure
      if (!unifiedForecast?.forecasts?.crypto?.[0]?.forecast?.prophet) {
        console.log('⚠️  Prophet forecast data not available');
        return null;
      }
      
      const prophetData = unifiedForecast.forecasts.crypto[0].forecast.prophet;
      if (!Array.isArray(prophetData) || prophetData.length === 0) {
        console.log('⚠️  Prophet forecast data is empty or not an array');
        return null;
      }
      
      console.log('✅ Prophet forecast data extracted successfully:', prophetData.length, 'predictions');
      
      // Calculate trend and confidence from forecast data
      const firstPrice = prophetData[0]?.price || 0;
      const lastPrice = prophetData[prophetData.length - 1]?.price || 0;
      const priceChange = lastPrice - firstPrice;
      const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
      
      // Determine trend based on price change
      let forecastTrend = 'Neutral';
      if (priceChangePercent > 2) forecastTrend = 'Bullish';
      else if (priceChangePercent < -2) forecastTrend = 'Bearish';
      
      // Calculate average confidence from available confidence values
      const avgConfidence = prophetData.reduce((sum, pred) => sum + (pred.confidence || 0.85), 0) / prophetData.length;
      
      console.log('📈 Prophet trend calculation:', {
        firstPrice,
        lastPrice,
        priceChange,
        priceChangePercent: priceChangePercent.toFixed(2) + '%',
        forecastTrend,
        avgConfidence: (avgConfidence * 100).toFixed(1) + '%'
      });
      
      return {
        symbol: selectedSymbol,
        model: 'prophet',
        horizonDays: forecastHorizon,
        dataPoints: 100,
        next: {
          ds: prophetData[0]?.date || new Date().toISOString().split('T')[0],
          yhat: prophetData[0]?.price || 0,
          yhat_lower: (prophetData[0]?.price || 0) * 0.95,
          yhat_upper: (prophetData[0]?.price || 0) * 1.05
        },
        path: prophetData.map(pred => ({
          ds: pred.date || '',
          yhat: pred.price || 0,
          yhat_lower: (pred.price || 0) * 0.95,
          yhat_upper: (pred.price || 0) * 1.05
        })),
        summary: {
          forecastTrend,
          confidence: avgConfidence,
          priceChange,
          priceChangePercent
        }
      };
    } catch (error) {
      console.error('❌ Error extracting Prophet forecast:', error);
      return null;
    }
  })();

  const arimaForecast = (() => {
    try {
      console.log('🔍 Extracting ARIMA forecast from unified data...');
      
      // Safety check: ensure unifiedForecast exists and has the expected structure
      if (!unifiedForecast || typeof unifiedForecast !== 'object') {
        console.log('⚠️  Unified forecast data is not available or invalid');
        return null;
      }
      
      console.log('📊 ARIMA forecast structure:', {
        hasForecasts: !!unifiedForecast?.forecasts,
        hasCrypto: !!unifiedForecast?.forecasts?.crypto,
        cryptoLength: unifiedForecast?.forecasts?.crypto?.length || 0,
        hasForecast: !!unifiedForecast?.forecasts?.crypto?.[0]?.forecast,
        hasArima: !!unifiedForecast?.forecasts?.crypto?.[0]?.forecast?.arima
      });
      
      // Check if we have the required nested structure
      if (!unifiedForecast?.forecasts?.crypto?.[0]?.forecast?.arima) {
        console.log('⚠️  ARIMA forecast data not available');
        return null;
      }
      
      const arimaData = unifiedForecast.forecasts.crypto[0].forecast.arima;
      if (!Array.isArray(arimaData) || arimaData.length === 0) {
        console.log('⚠️  ARIMA forecast data is empty or not an array');
        return null;
      }
      
      console.log('✅ ARIMA forecast data extracted successfully:', arimaData.length, 'predictions');
      
      // Calculate trend and confidence from forecast data
      const firstPrice = arimaData[0]?.price || 0;
      const lastPrice = arimaData[arimaData.length - 1]?.price || 0;
      const priceChange = lastPrice - firstPrice;
      const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
      
      // Determine trend based on price change
      let forecastTrend = 'Neutral';
      if (priceChangePercent > 2) forecastTrend = 'Bullish';
      else if (priceChangePercent < -2) forecastTrend = 'Bearish';
      
      // Calculate average confidence from available confidence values
      const avgConfidence = arimaData.reduce((sum, pred) => sum + (pred.confidence || 0.80), 0) / arimaData.length;
      
      console.log('📈 ARIMA trend calculation:', {
        firstPrice,
        lastPrice,
        priceChange,
        priceChangePercent: priceChangePercent.toFixed(2) + '%',
        forecastTrend,
        avgConfidence: (avgConfidence * 100).toFixed(1) + '%'
      });
      
      return {
        symbol: selectedSymbol,
        model: 'arima',
        horizonDays: forecastHorizon,
        dataPoints: 100,
        next: {
          ds: arimaData[0]?.date || new Date().toISOString().split('T')[0],
          yhat: arimaData[0]?.price || 0,
          yhat_lower: (arimaData[0]?.price || 0) * 0.95,
          yhat_upper: (arimaData[0]?.price || 0) * 1.05
        },
        path: arimaData.map(pred => ({
          ds: pred.date || '',
          yhat: pred.price || 0,
          yhat_lower: (pred.price || 0) * 0.95,
          yhat_upper: (pred.price || 0) * 1.05
        })),
        summary: {
          forecastTrend,
          confidence: avgConfidence,
          priceChange,
          priceChangePercent
        }
      };
    } catch (error) {
      console.error('❌ Error extracting ARIMA forecast:', error);
      return null;
    }
  })();

  // Update loading states for backward compatibility
  const prophetLoading = forecastLoading;
  const arimaLoading = forecastLoading;
  const prophetError = forecastError;
  const arimaError = forecastError;
  const prophetIsError = forecastIsError;
  const arimaIsError = forecastIsError;

  // Fetch market sentiment for selected symbol
  const { data: sentiment, isLoading: sentimentLoading } = useQuery(
    ['crypto-sentiment', selectedSymbol],
    () => cryptoAPI.getSentiment(selectedSymbol, 7),
    {
      enabled: !!selectedSymbol,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch portfolio performance
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery(
    ['crypto-portfolio', DEFAULT_CRYPTO_SYMBOLS],
    () => cryptoAPI.getPortfolioPerformance(DEFAULT_CRYPTO_SYMBOLS, 7),
    {
      refetchInterval: 60000, // Refresh every minute
      staleTime: 30000,
    }
  );

  // Fetch historical data for charts
  const { data: historicalData, isLoading: historicalLoading, error: historicalError } = useQuery(
    ['crypto-historical', selectedSymbol, selectedTimeframe],
    () => cryptoAPI.getHistoricalData(selectedSymbol, selectedTimeframe, 100),
    {
      enabled: !!selectedSymbol,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      retryDelay: 1000,
    }
  );

  // WebSocket management
  const startWebSocketMutation = useMutation(cryptoAPI.startWebSocket, {
    onSuccess: () => {
      toast.success('Real-time updates started');
    },
    onError: (error) => {
      toast.error('Failed to start real-time updates');
      console.error('WebSocket error:', error);
    }
  });

  const stopWebSocketMutation = useMutation(cryptoAPI.stopWebSocket, {
    onSuccess: () => {
      toast.success('Real-time updates stopped');
    },
    onError: (error) => {
      toast.error('Failed to stop real-time updates');
      console.error('WebSocket error:', error);
    }
  });

  // Cache management
  const clearCacheMutation = useMutation(cryptoAPI.clearCache, {
    onSuccess: () => {
      toast.success('Forecast cache cleared');
      queryClient.invalidateQueries(['crypto-prophet', 'crypto-arima']);
    },
    onError: (error) => {
      toast.error('Failed to clear cache');
      console.error('Cache clear error:', error);
    }
  });

  // Start WebSocket on component mount
  useEffect(() => {
    if (showRealTime) {
      startWebSocketMutation.mutate(POPULAR_CRYPTO_SYMBOLS);
    }

    return () => {
      if (showRealTime) {
        stopWebSocketMutation.mutate();
      }
    };
  }, [showRealTime]);

  // Handle symbol selection
  const handleSymbolSelect = useCallback((symbol) => {
    setSelectedSymbol(symbol);
  }, []);

  // Handle forecast horizon change
  const handleHorizonChange = useCallback((horizon) => {
    setForecastHorizon(horizon);
  }, []);

  // Handle timeframe change
  const handleTimeframeChange = useCallback((timeframe) => {
    setSelectedTimeframe(timeframe);
    // Invalidate historical data query to refetch with new timeframe
    queryClient.invalidateQueries(['crypto-historical', selectedSymbol, timeframe]);
    
    // Map frontend timeframes to display names
    const timeframeNames = {
      '1d': '1 Day',
      '7d': '7 Days', 
      '30d': '30 Days',
      '3m': '3 Months',
      '6m': '6 Months',
      '1y': '1 Year'
    };
    
    toast.success(`Timeframe changed to ${timeframeNames[timeframe] || timeframe}`);
  }, [queryClient, selectedSymbol]);

  // Toggle real-time updates
  const toggleRealTime = useCallback(() => {
    setShowRealTime(prev => !prev);
  }, []);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Manual refresh
  const handleManualRefresh = useCallback(() => {
    queryClient.invalidateQueries(['crypto-prices', 'crypto-prophet', 'crypto-arima', 'crypto-sentiment', 'crypto-historical']);
    toast.success('Data refreshed');
  }, [queryClient]);

  const formatNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!serviceStatus?.available) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Crypto Service Unavailable</h1>
          <p className="text-gray-600 mb-4">The Binance crypto service is currently not available.</p>
          <p className="text-sm text-gray-500">Please check your connection and try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crypto Markets</h1>
            <p className="text-gray-600">Real-time cryptocurrency data and AI-powered forecasts</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Service Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${serviceStatus?.binanceConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {serviceStatus?.binanceConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleRealTime}
                className={`p-2 rounded-lg ${showRealTime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                title={showRealTime ? 'Disable real-time updates' : 'Enable real-time updates'}
              >
                {showRealTime ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={toggleAutoRefresh}
                className={`p-2 rounded-lg ${autoRefresh ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                <ArrowPathIcon className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleManualRefresh}
                className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Refresh data"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => clearCacheMutation.mutate()}
                className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Clear forecast cache"
              >
                <CogIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{DEFAULT_CRYPTO_SYMBOLS.length}</p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">WebSocket</p>
                <p className="text-2xl font-bold text-gray-900">
                  {serviceStatus?.websocketActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${serviceStatus?.websocketActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cached Forecasts</p>
                <p className="text-2xl font-bold text-gray-900">{serviceStatus?.cachedForecasts || 0}</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Update</p>
                <p className="text-2xl font-bold text-gray-900">
                  {serviceStatus?.serverTime ? new Date(serviceStatus.serverTime).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Price Cards and Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Cards */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Live Prices</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
                <span className="text-sm text-gray-500">Real-time: {showRealTime ? 'ON' : 'OFF'}</span>
                <button
                  onClick={async () => {
                    try {
                      console.log('Testing single price fetch...');
                      const testPrice = await cryptoAPI.getPrice('BTCUSDT');
                      console.log('Test price result:', testPrice);
                      toast.success('Test successful! Check console for details.');
                    } catch (error) {
                      console.error('Test failed:', error);
                      toast.error('Test failed! Check console for details.');
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test API
                </button>
              </div>
            </div>
            
            {pricesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pricesData?.length > 0 ? (
                  pricesData.map((priceData) => {
                    console.log('Rendering price data:', priceData);
                    return (
                      <CryptoPriceCard
                        key={priceData.symbol}
                        data={priceData}
                        isSelected={selectedSymbol === priceData.symbol}
                        onClick={() => handleSymbolSelect(priceData.symbol)}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No price data available</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {pricesLoading ? 'Loading...' : 'Try refreshing or check backend connection'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Portfolio Overview */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Overview</h2>
            {portfolioLoading ? (
              <div className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ) : (
              <CryptoPortfolioOverview data={portfolioData} />
            )}
          </div>
        </div>

        {/* Right Column - Selected Crypto Details */}
        <div className="space-y-6">
          {/* Symbol Selector */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Asset</h3>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_CRYPTO_SYMBOLS.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => handleSymbolSelect(symbol)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    selectedSymbol === symbol
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {getCryptoDisplayName(symbol)}
                </button>
              ))}
            </div>
          </div>

          {/* Market Sentiment */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Market Sentiment</h3>
            {sentimentLoading ? (
              <div className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            ) : (
              <CryptoSentimentCard data={sentiment} />
            )}
          </div>

          {/* Time Range Selector */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Time Range</h3>
            <div className="grid grid-cols-2 gap-2">
              {['1d', '7d', '30d', '3m', '6m', '1y'].map((range) => (
                <button
                  key={range}
                  onClick={() => handleTimeframeChange(range)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    selectedTimeframe === range
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {range === '1d' ? '1 Day' : 
                   range === '7d' ? '7 Days' : 
                   range === '30d' ? '30 Days' : 
                   range === '3m' ? '3 Months' : 
                   range === '6m' ? '6 Months' : '1 Year'}
                </button>
              ))}
            </div>
          </div>

          {/* Forecast Controls */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Forecast Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forecast Horizon
                </label>
                <select
                  value={forecastHorizon}
                  onChange={(e) => handleHorizonChange(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Charts and Forecasts */}
      <div className="mt-8 space-y-6">
        {/* Price Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Price Chart - {getCryptoDisplayName(selectedSymbol)}
          </h2>
                      {historicalLoading ? (
              <div className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            ) : historicalError ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-red-600 mb-2">Chart data failed to load</p>
                  <p className="text-sm text-gray-500 mb-3">Error: {historicalError?.message || 'Unknown error'}</p>
                  <button 
                    onClick={() => queryClient.invalidateQueries(['crypto-historical', selectedSymbol, selectedTimeframe])}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                {historicalData && Array.isArray(historicalData) && historicalData.length > 0 ? (
                  <div className="w-full h-full">
                    {/* Simple price line chart */}
                    <svg className="w-full h-full" viewBox="0 0 800 300">
                      <defs>
                        <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Chart area */}
                      <rect width="800" height="300" fill="none"/>
                      
                      {/* Price line */}
                      {historicalData.length > 1 && (
                        <g>
                          <path
                            d={historicalData.map((point, index) => {
                              const x = (index / (historicalData.length - 1)) * 800;
                              const y = 300 - ((point.close - Math.min(...historicalData.map(p => p.close))) / 
                                                 (Math.max(...historicalData.map(p => p.close)) - Math.min(...historicalData.map(p => p.close)))) * 300;
                              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            stroke="#3B82F6"
                            strokeWidth="2"
                            fill="none"
                          />
                          
                          {/* Area fill */}
                                                     <path
                             d={`M 0 300 ${historicalData.map((point, index) => {
                               const x = (index / (historicalData.length - 1)) * 800;
                               const y = 300 - ((point.close - Math.min(...historicalData.map(p => p.close))) / 
                                                  (Math.max(...historicalData.map(p => p.close)) - Math.min(...historicalData.map(p => p.close)))) * 300;
                               return `L ${x} ${y}`;
                             }).join(' ')} L 800 300 Z`}
                             fill="url(#priceGradient)"
                           />
                        </g>
                      )}
                      
                      {/* Price labels */}
                      {historicalData.length > 0 && (
                        <g>
                          <text x="10" y="20" fill="#374151" fontSize="12" fontWeight="500">
                            Current: ${historicalData[historicalData.length - 1]?.close?.toFixed(2)}
                          </text>
                          <text x="10" y="40" fill="#6B7280" fontSize="10">
                            {historicalData.length} data points • {selectedTimeframe} interval
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center">
                    <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No price data available</p>
                    <p className="text-sm text-gray-400 mt-2">Select a crypto asset to view charts</p>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Volume Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Volume Chart - {getCryptoDisplayName(selectedSymbol)}
          </h2>
                      {historicalLoading ? (
              <div className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            ) : historicalError ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-red-600 mb-2">Volume data failed to load</p>
                  <p className="text-sm text-gray-500 mb-3">Error: {historicalError?.message || 'Unknown error'}</p>
                  <button 
                    onClick={() => queryClient.invalidateQueries(['crypto-historical', selectedSymbol, selectedTimeframe])}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                {historicalData && Array.isArray(historicalData) && historicalData.length > 0 ? (
                  <div className="w-full h-full">
                    {/* Volume bars chart */}
                    <svg className="w-full h-full" viewBox="0 0 800 300">
                      {/* Chart area */}
                      <rect width="800" height="300" fill="none"/>
                      
                      {/* Volume bars */}
                      {historicalData.length > 0 && (
                        <g>
                          {historicalData.map((point, index) => {
                            const x = (index / (historicalData.length - 1)) * 800;
                            const barWidth = 800 / historicalData.length - 2;
                            const maxVolume = Math.max(...historicalData.map(p => p.volume || 0));
                            const barHeight = maxVolume > 0 ? ((point.volume || 0) / maxVolume) * 250 : 0;
                            const y = 300 - barHeight;
                            
                            return (
                              <rect
                                key={index}
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill="#10B981"
                                opacity="0.7"
                              />
                            );
                          })}
                        </g>
                      )}
                      
                      {/* Volume labels */}
                      {historicalData.length > 0 && (
                        <g>
                          <text x="10" y="20" fill="#374151" fontSize="12" fontWeight="500">
                            Total Volume: {formatNumber(historicalData.reduce((sum, point) => sum + (point.volume || 0), 0))}
                          </text>
                          <text x="10" y="40" fill="#6B7280" fontSize="10">
                            {historicalData.length} data points • {selectedTimeframe} interval
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center">
                    <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No volume data available</p>
                    <p className="text-sm text-gray-400 mt-2">Select a crypto asset to view volume charts</p>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Historical Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Historical Data - {getCryptoDisplayName(selectedSymbol)}
          </h2>
          {historicalLoading ? (
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          ) : historicalError ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-red-600 mb-2">Historical data failed to load</p>
                <p className="text-sm text-gray-500 mb-3">Error: {historicalError?.message || 'Unknown error'}</p>
                <button 
                  onClick={() => queryClient.invalidateQueries(['crypto-historical', selectedSymbol, selectedTimeframe])}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <CryptoHistoricalChart data={historicalData} symbol={selectedSymbol} />
          )}
        </div>

        {/* Crypto Analysis Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Crypto Analysis - {getCryptoDisplayName(selectedSymbol)}
          </h2>
          {historicalLoading ? (
            <div className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ) : historicalError ? (
            <div className="h-32 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-red-600 mb-2">Analysis failed to load</p>
                <p className="text-sm text-gray-500 mb-3">Error: {historicalError?.message || 'Unknown error'}</p>
              </div>
            </div>
          ) : historicalData && Array.isArray(historicalData) && historicalData.length > 0 ? (
            <div className="space-y-4">
              {/* Price Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Price Analysis</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Current Price:</span>
                      <span className="text-sm font-semibold text-blue-600">
                        ${historicalData[historicalData.length - 1]?.close?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">24h Change:</span>
                      <span className={`text-sm font-semibold ${historicalData[historicalData.length - 1]?.close > historicalData[0]?.close ? 'text-green-600' : 'text-red-600'}`}>
                        {historicalData[historicalData.length - 1]?.close > historicalData[0]?.close ? '+' : ''}
                        {((historicalData[historicalData.length - 1]?.close - historicalData[0]?.close) / historicalData[0]?.close * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">High:</span>
                      <span className="text-sm font-semibold text-green-600">
                        ${Math.max(...historicalData.map(d => d.high || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Low:</span>
                      <span className="text-sm font-semibold text-red-600">
                        ${Math.min(...historicalData.map(d => d.low || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Volume Analysis */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Volume Analysis</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Avg Volume:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatNumber((historicalData.reduce((sum, d) => sum + (d.volume || 0), 0) / historicalData.length).toFixed(0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Max Volume:</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatNumber(Math.max(...historicalData.map(d => d.volume || 0)).toFixed(0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Volume Trend:</span>
                      <span className={`text-sm font-semibold ${historicalData[historicalData.length - 1]?.volume > historicalData[0]?.volume ? 'text-green-600' : 'text-red-600'}`}>
                        {historicalData[historicalData.length - 1]?.volume > historicalData[0]?.volume ? '↗' : '↘'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Indicators */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-purple-800 mb-2">Technical Indicators</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Volatility:</span>
                      <span className="text-sm font-semibold text-purple-600">
                        {(() => {
                          const prices = historicalData.map(d => d.close);
                          const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
                          const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
                          const std = Math.sqrt(variance);
                          return ((std / mean * 100) || 0).toFixed(2);
                        })()}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Trend:</span>
                      <span className={`text-sm font-semibold ${historicalData[historicalData.length - 1]?.close > historicalData[0]?.close ? 'text-green-600' : 'text-red-600'}`}>
                        {historicalData[historicalData.length - 1]?.close > historicalData[0]?.close ? 'Bullish' : 'Bearish'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Data Points:</span>
                      <span className="text-sm font-semibold text-purple-600">
                        {historicalData.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Summary</h3>
                <p className="text-sm text-gray-600">
                  {getCryptoDisplayName(selectedSymbol)} shows a {historicalData[historicalData.length - 1]?.close > historicalData[0]?.close ? 'bullish' : 'bearish'} trend over the {selectedTimeframe} period with {historicalData.length} data points analyzed.
                  {historicalData[historicalData.length - 1]?.volume > historicalData[0]?.volume ? ' Volume is increasing, indicating strong market interest.' : ' Volume is decreasing, suggesting reduced market activity.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>No analysis data available</p>
              <p className="text-sm text-gray-400 mt-2">Select a crypto asset to view detailed analysis</p>
            </div>
          )}
        </div>

        {/* Forecast Error Handler */}
        {(prophetError || arimaError || prophetIsError || arimaIsError) && (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Forecasting Issues Detected</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Some forecast models failed to load. This may be due to authentication or service issues.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  queryClient.invalidateQueries(['crypto-unified-forecast', selectedSymbol, forecastHorizon]);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Refresh All
              </button>
            </div>
          </div>
        )}

        {/* Forecast Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prophet Forecast */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Prophet Forecast - {getCryptoDisplayName(selectedSymbol)}
            </h2>
            {prophetLoading ? (
              <div className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            ) : prophetError || prophetIsError ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-red-600 mb-2">Forecast failed</p>
                  <p className="text-sm text-gray-500 mb-3">Error: {prophetError?.message || 'Unknown error'}</p>
                  <button 
                    onClick={() => queryClient.invalidateQueries(['crypto-unified-forecast', selectedSymbol, forecastHorizon])}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : !prophetForecast ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-600 mb-2">No Prophet forecast available</p>
                  <p className="text-sm text-gray-400 mb-3">Forecast data is being processed</p>
                  <button 
                    onClick={() => queryClient.invalidateQueries(['crypto-unified-forecast', selectedSymbol, forecastHorizon])}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <CryptoForecastChart 
                data={prophetForecast} 
                type="prophet"
                symbol={selectedSymbol}
              />
            )}
          </div>

          {/* ARIMA Forecast */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ARIMA Forecast - {getCryptoDisplayName(selectedSymbol)}
            </h2>
            {arimaLoading ? (
              <div className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            ) : arimaError || arimaIsError ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p className="text-red-600 mb-2">Forecast failed</p>
                  <p className="text-sm text-gray-500 mb-3">Error: {arimaError?.message || 'Unknown error'}</p>
                  <button 
                    onClick={() => queryClient.invalidateQueries(['crypto-unified-forecast', selectedSymbol, forecastHorizon])}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : !arimaForecast ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-600 mb-2">No ARIMA forecast available</p>
                  <p className="text-sm text-gray-400 mb-3">Forecast data is being processed</p>
                  <button 
                    onClick={() => queryClient.invalidateQueries(['crypto-unified-forecast', selectedSymbol, forecastHorizon])}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <CryptoForecastChart 
                data={arimaForecast} 
                type="arima"
                symbol={selectedSymbol}
              />
            )}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <LightBulbIcon className="w-6 h-6 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Unified Forecast System</h3>
            <p className="text-sm text-blue-700 mt-1">
              All cryptocurrency forecasts now use the unified system with real-time Binance data. 
              This ensures consistency between Crypto and Forecasts pages. 
              Forecasts use advanced AI models (Prophet and ARIMA) with the same data sources and models across all pages.
            </p>
            {unifiedForecast?.useRealData && (
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ⚡ Real-time Data Active
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoView;
