import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Download, 
  Eye, 
  EyeOff,
  RotateCcw,
  Lightbulb,
  DollarSign
} from 'lucide-react';
import StockPriceChart from '../../components/Charts/StockPriceChart';
import { 
  stockAPI, 
  DEFAULT_STOCK_SYMBOLS,
  getStockDisplayName,
  formatStockPrice,
  formatPercentageChange,
  getSentimentColor
} from '../../api/stocks';
import AuthDebug from '../../components/Debug/AuthDebug';

const StockView = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [timeRange, setTimeRange] = useState('1d');
  const [selectedStock, setSelectedStock] = useState(null);
  const [showRealTime, setShowRealTime] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const sectors = ['all', 'technology', 'healthcare', 'finance', 'energy', 'consumer', 'industrial'];

  // Fetch stock service status
  const { data: serviceStatus, isLoading: statusLoading, error: statusError } = useQuery(
    'stock-status',
    async () => {
      console.log('🔍 Fetching stock service status...');
      try {
        const result = await stockAPI.getStatus();
        console.log('✅ Stock service status:', result);
        return result;
      } catch (error) {
        console.error('❌ Stock service status error:', error);
        console.error('Error details:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error config:', error.config);
        throw error;
      }
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 5000, // Reduced stale time
      retry: 1, // Reduce retries
      retryDelay: 1000,
      cacheTime: 0, // Disable caching to force fresh requests
    }
  );

  // Fetch real-time prices for all default symbols
  const { data: pricesData, isLoading: pricesLoading, error: pricesError } = useQuery(
    ['stock-prices', DEFAULT_STOCK_SYMBOLS],
    async () => {
      console.log('Fetching stock prices for symbols:', DEFAULT_STOCK_SYMBOLS);
      
      // Test with just one symbol first to debug
      try {
        console.log('Testing stock API with AAPL...');
        const testResult = await stockAPI.getPrice('AAPL');
        console.log('Stock API test successful:', testResult);
      } catch (error) {
        console.error('Stock API test failed:', error);
        throw new Error(`Stock API unavailable: ${error.message}`);
      }

      const promises = DEFAULT_STOCK_SYMBOLS.map(symbol => 
        stockAPI.getPrice(symbol).catch((error) => {
          console.error(`Error fetching price for ${symbol}:`, error);
          return null;
        })
      );
      const results = await Promise.allSettled(promises);
      const filteredResults = results
        .map((result, index) => {
          if (result.status === 'fulfilled') {
            console.log(`Price data for ${DEFAULT_STOCK_SYMBOLS[index]}:`, result.value);
            return result.value;
          } else {
            console.error(`Failed to fetch price for ${DEFAULT_STOCK_SYMBOLS[index]}:`, result.reason);
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
      enabled: true,
      retry: 1, // Reduce retries to fail faster
      retryDelay: 1000,
    }
  );

  // Fetch historical data for selected stock
  const { data: historicalData, isLoading: historicalLoading } = useQuery(
    ['stock-historical', selectedStock?.symbol, timeRange],
    () => stockAPI.getHistoricalData(selectedStock?.symbol, timeRange, 100),
    {
      enabled: !!selectedStock?.symbol,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch sentiment for selected stock
  const { data: sentiment, isLoading: sentimentLoading } = useQuery(
    ['stock-sentiment', selectedStock?.symbol],
    () => stockAPI.getSentiment(selectedStock?.symbol, 7),
    {
      enabled: !!selectedStock?.symbol,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // WebSocket management
  const startWebSocketMutation = useMutation(stockAPI.startWebSocket, {
    onSuccess: () => {
      toast.success('Real-time updates started');
    },
    onError: (error) => {
      toast.error('Failed to start real-time updates');
      console.error('WebSocket error:', error);
    }
  });

  const stopWebSocketMutation = useMutation(stockAPI.stopWebSocket, {
    onSuccess: () => {
      toast.success('Real-time updates stopped');
    },
    onError: (error) => {
      toast.error('Failed to stop real-time updates');
      console.error('WebSocket error:', error);
    }
  });

  // Filter stocks based on search and sector
  const filteredStocks = useMemo(() => {
    if (!pricesData) return [];
    
    let filtered = pricesData;
    
    if (searchTerm) {
      filtered = filtered.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStockDisplayName(stock.symbol).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Note: Sector filtering would require additional data from the API
    // For now, we'll show all stocks
    
    return filtered;
  }, [pricesData, searchTerm]);



  const getRoleSpecificFeatures = () => {
    switch (user?.role) {
      case 'investor':
        return {
          title: 'Stock Market Analysis',
          subtitle: 'Track your investments and discover new opportunities',
          features: ['Portfolio tracking', 'Risk analysis', 'Dividend tracking', 'Market alerts']
        };
      case 'company':
        return {
          title: 'Market Intelligence',
          subtitle: 'Monitor competitors and market trends',
          features: ['Competitor analysis', 'Market trends', 'Industry benchmarks', 'Performance metrics']
        };
      case 'regulator':
        return {
          title: 'Market Surveillance',
          subtitle: 'Monitor market activities and compliance',
          features: ['Market monitoring', 'Compliance tracking', 'Risk assessment', 'Regulatory reporting']
        };
      case 'ngo':
        return {
          title: 'ESG Investment Research',
          subtitle: 'Analyze sustainable investment opportunities',
          features: ['ESG scoring', 'Sustainability metrics', 'Impact assessment', 'Green investments']
        };
      default:
        return {
          title: 'Stock Market View',
          subtitle: 'Explore market opportunities and trends',
          features: ['Market overview', 'Stock analysis', 'Trend tracking', 'Investment research']
        };
    }
  };

  const roleFeatures = getRoleSpecificFeatures();

  const formatNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
  };

  const handleExport = () => {
    if (!filteredStocks || filteredStocks.length === 0) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Symbol,Name,Price,Change,Change%,Volume,Market Cap,Sector\n" +
      filteredStocks.map(stock => 
        `${stock?.symbol || 'N/A'},${stock?.name || 'N/A'},${stock?.price || 0},${stock?.change || 0},${stock?.changePercent || 0}%,${formatNumber(stock?.volume || 0)},${formatNumber(stock?.marketCap || 0)},${stock?.sector || 'N/A'}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stock_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleRealTime = useCallback(() => {
    setShowRealTime(prev => !prev);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Start WebSocket on component mount - only once
  useEffect(() => {
    if (showRealTime) {
      startWebSocketMutation.mutate(DEFAULT_STOCK_SYMBOLS);
    }

    return () => {
      stopWebSocketMutation.mutate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Handle WebSocket start/stop when showRealTime changes
  useEffect(() => {
    if (showRealTime && !startWebSocketMutation.isLoading) {
      startWebSocketMutation.mutate(DEFAULT_STOCK_SYMBOLS);
    } else if (!showRealTime && !stopWebSocketMutation.isLoading) {
      stopWebSocketMutation.mutate();
    }
  }, [showRealTime, startWebSocketMutation.isLoading, stopWebSocketMutation.isLoading, startWebSocketMutation, stopWebSocketMutation]);

  const handleManualRefresh = useCallback(() => {
    queryClient.invalidateQueries(['stock-prices', 'stock-historical', 'stock-sentiment']);
    toast.success('Data refreshed');
  }, [queryClient]);

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stock service...</p>
        </div>
      </div>
    );
  }

  if (statusError) {
    const isAuthError = statusError?.response?.status === 401;
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isAuthError ? 'Authentication Required' : 'Stock Service Error'}
          </h1>
          <p className="text-gray-600 mb-4">
            {isAuthError 
              ? 'You need to be logged in to access stock data.' 
              : 'Failed to connect to stock service.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Error: {statusError?.response?.data?.message || statusError.message}
          </p>
          {isAuthError ? (
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </button>
          ) : (
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!serviceStatus?.available) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Stock Service Unavailable</h1>
          <p className="text-gray-600 mb-4">The stock service is currently not available.</p>
          <p className="text-sm text-gray-500 mb-6">This might be due to authentication issues. Try logging out and back in.</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
              }}
              className="block w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Re-login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="block w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AuthDebug />
      
      {/* Debug Info */}
      <div className="fixed top-20 right-4 bg-blue-100 border border-blue-400 p-2 rounded text-xs z-40 max-w-xs">
        <h4 className="font-bold">🔧 Debug Status</h4>
        <p><strong>Status Loading:</strong> {statusLoading ? '⏳' : '✅'}</p>
        <p><strong>Status Error:</strong> {statusError ? '❌' : '✅'}</p>
        <p><strong>Service Available:</strong> {serviceStatus?.available ? '✅' : '❌'}</p>
        <p><strong>Service Data:</strong> {serviceStatus ? '✅' : '❌'}</p>
        {statusError && <p className="text-red-600 text-xs mt-1">{statusError.message}</p>}
        <button 
          onClick={() => {
            queryClient.invalidateQueries('stock-status');
            queryClient.clear();
          }}
          className="mt-2 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
        >
          🔄 Clear Cache
        </button>
      </div>
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{roleFeatures?.title || 'Stocks'}</h1>
              <p className="text-gray-600">{roleFeatures?.subtitle || 'Explore stock market opportunities'}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Controls */}
                             <div className="flex items-center space-x-2">
                 <button
                   onClick={toggleRealTime}
                   disabled={startWebSocketMutation.isLoading || stopWebSocketMutation.isLoading}
                   className={`p-2 rounded-lg ${showRealTime ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}
                   title={showRealTime ? 'Disable real-time updates' : 'Enable real-time updates'}
                 >
                   {showRealTime ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                 </button>
                 
                 <button
                   onClick={toggleAutoRefresh}
                   className={`p-2 rounded-lg ${autoRefresh ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                   title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                 >
                   <RotateCcw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
                 </button>
                 
                 <button
                   onClick={handleManualRefresh}
                   className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                   title="Refresh data"
                 >
                   <RotateCcw className="w-5 h-5" />
                 </button>

                 {serviceStatus?.connected && (
                   <button
                     onClick={() => stopWebSocketMutation.mutate()}
                     disabled={stopWebSocketMutation.isLoading}
                     className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                     title="Disconnect WebSocket"
                   >
                     {stopWebSocketMutation.isLoading ? (
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                     ) : (
                       <div className="w-5 h-5 bg-red-500 rounded-full"></div>
                     )}
                   </button>
                 )}
               </div>
            </div>
          </div>

          {/* Role-specific features */}
          <div className="mt-4 flex flex-wrap gap-2">
            {roleFeatures?.features && roleFeatures.features.map((feature, index) => (
              <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                {feature}
              </span>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredStocks.length}</p>
                </div>
                                 <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
                         <div className="bg-white p-4 rounded-lg shadow-sm border">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-gray-600">Real-time</p>
                   <p className="text-2xl font-bold text-gray-900">
                     {showRealTime ? 'Active' : 'Inactive'}
                   </p>
                 </div>
                 <div className="flex items-center space-x-2">
                   <div className={`w-3 h-3 rounded-full ${showRealTime ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                   {showRealTime && serviceStatus?.connected && (
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   )}
                 </div>
               </div>
             </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Auto-refresh</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {autoRefresh ? 'ON' : 'OFF'}
                  </p>
                </div>
                                 <RotateCcw className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
                         <div className="bg-white p-4 rounded-lg shadow-sm border">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-gray-600">WebSocket Status</p>
                   <p className="text-2xl font-bold text-gray-900">
                     {startWebSocketMutation.isLoading ? 'Starting...' : 
                      stopWebSocketMutation.isLoading ? 'Stopping...' :
                      serviceStatus?.connected ? 'Connected' : 'Disconnected'}
                   </p>
                 </div>
                 <div className={`w-3 h-3 rounded-full ${
                   startWebSocketMutation.isLoading || stopWebSocketMutation.isLoading ? 'bg-yellow-500' :
                   serviceStatus?.connected ? 'bg-green-500' : 'bg-red-400'
                 }`}></div>
               </div>
             </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Sector Filter */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sectors && sectors.map(sector => (
                  <option key={sector} value={sector}>
                    {sector === 'all' ? 'All Sectors' : sector.charAt(0).toUpperCase() + sector.slice(1)}
                  </option>
                ))}
              </select>

                             {/* Time Range */}
               <select
                 value={timeRange}
                 onChange={(e) => {
                   setTimeRange(e.target.value);
                   // Invalidate historical data when time range changes
                   if (selectedStock) {
                     queryClient.invalidateQueries(['stock-historical', selectedStock.symbol, e.target.value]);
                   }
                 }}
                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
               >
                <option value="1d">1 Day</option>
                <option value="1w">1 Week</option>
                <option value="1m">1 Month</option>
                <option value="3m">3 Months</option>
                <option value="1y">1 Year</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stock Price Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stock Price Cards */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                             <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold text-gray-900">Live Stock Prices</h2>
                 <div className="flex items-center space-x-2">
                   <span className="text-sm text-gray-500">Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
                   <span className="text-sm text-gray-500">Real-time: {showRealTime ? 'ON' : 'OFF'}</span>
                   {showRealTime && autoRefresh && (
                     <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                       <span className="text-xs text-green-600">Live</span>
                     </div>
                   )}
                 </div>
               </div>
              
                             {pricesError ? (
                 <div className="text-center py-8">
                   <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                     <div className="text-red-600 text-lg font-semibold mb-2">Stock Service Error</div>
                     <div className="text-red-700 text-sm mb-4">{pricesError.message}</div>
                     <button 
                       onClick={() => window.location.reload()} 
                       className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                     >
                       Retry
                     </button>
                   </div>
                 </div>
               ) : pricesLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {[...Array(6)].map((_, i) => (
                     <div key={i} className="animate-pulse">
                       <div className="h-24 bg-gray-200 rounded-lg"></div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {filteredStocks && filteredStocks.length > 0 ? (
                     filteredStocks.map((stock) => (
                       <div
                         key={stock?.symbol || 'unknown'}
                         className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                           selectedStock?.symbol === stock?.symbol 
                             ? 'border-primary-300 bg-primary-50' 
                             : 'border-gray-200 bg-white hover:border-gray-300'
                         }`}
                         onClick={() => handleStockSelect(stock)}
                       >
                         <div className="flex items-center justify-between mb-2">
                           <div>
                             <h3 className="font-semibold text-gray-900">{stock?.symbol || 'N/A'}</h3>
                             <p className="text-sm text-gray-600">{getStockDisplayName(stock?.symbol) || 'N/A'}</p>
                           </div>
                           {selectedStock?.symbol === stock?.symbol && (
                             <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                               Selected
                             </span>
                           )}
                         </div>
                         
                         <div className="space-y-2">
                           <div className="text-2xl font-bold text-gray-900">
                             ${formatStockPrice(stock?.price || 0)}
                           </div>
                           
                           <div className={`flex items-center gap-1 ${
                             (stock?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                           }`}>
                             {(stock?.change || 0) >= 0 ? (
                               <TrendingUp className="h-4 w-4" />
                             ) : (
                               <TrendingDown className="h-4 w-4" />
                             )}
                             <span className="text-sm font-medium">
                               {(stock?.change || 0) >= 0 ? '+' : ''}{formatStockPrice(stock?.change || 0)} ({formatPercentageChange(stock?.changePercent || 0)})
                             </span>
                           </div>
                           
                           <div className="text-sm text-gray-600">
                             Vol: {formatNumber(stock?.volume || 0)}
                           </div>
                           
                           <div className="text-xs">
                             <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full capitalize">
                               Real-time
                             </span>
                             {stock.timestamp && (
                               <div className="text-xs text-gray-500 mt-1">
                                 {new Date(stock.timestamp).toLocaleTimeString()}
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="col-span-full text-center py-8">
                       <p className="text-gray-500">No stocks found</p>
                     </div>
                   )}
                 </div>
               )}
            </div>
          </div>

          {/* Right Column - Stock Details */}
          <div className="space-y-6">
            {/* Stock Selector */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Stock</h3>
                             <div className="space-y-2">
                 {filteredStocks.slice(0, 5).map((stock) => (
                   <button
                     key={stock.symbol}
                     onClick={() => handleStockSelect(stock)}
                     className={`w-full p-2 text-sm rounded-lg border transition-colors ${
                       selectedStock?.symbol === stock.symbol
                         ? 'bg-primary-100 border-primary-300 text-primary-700'
                         : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                     }`}
                   >
                     {stock.symbol} - {getStockDisplayName(stock.symbol)}
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
               ) : sentiment ? (
                 <div className="text-center">
                   <div className={`text-2xl font-bold mb-2 ${getSentimentColor(sentiment.sentiment)}`}>
                     {sentiment.sentiment?.charAt(0).toUpperCase() + sentiment.sentiment?.slice(1)}
                   </div>
                   <div className="text-sm text-gray-600 mb-3">
                     Market sentiment is {sentiment.sentiment} with {Math.round(sentiment.confidence * 100)}% confidence
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2">
                     <div className={`h-2 rounded-full ${
                       sentiment.sentiment === 'bullish' ? 'bg-green-500' : 
                       sentiment.sentiment === 'bearish' ? 'bg-red-500' : 'bg-blue-500'
                     }`} style={{ width: `${sentiment.confidence * 100}%` }}></div>
                   </div>
                   <div className="text-xs text-gray-500 mt-2">{Math.round(sentiment.confidence * 100)}% confidence</div>
                 </div>
               ) : (
                 <div className="text-center text-gray-500">
                   <p>Select a stock to view sentiment</p>
                 </div>
               )}
             </div>

                         {/* Key Metrics */}
             <div className="bg-white rounded-lg shadow-sm border p-4">
               <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Metrics</h3>
               {selectedStock ? (
                 <div className="space-y-3">
                   <div className="flex justify-between">
                     <span className="text-sm text-gray-600">Current Price:</span>
                     <span className="text-sm font-medium">
                       ${formatStockPrice(selectedStock.price)}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-gray-600">24h Change:</span>
                     <span className={`text-sm font-medium ${
                       (selectedStock.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                     }`}>
                       {formatStockPrice(selectedStock.change || 0)} ({formatPercentageChange(selectedStock.changePercent || 0)})
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-gray-600">Volume:</span>
                     <span className="text-sm font-medium">
                       {formatNumber(selectedStock.volume || 0)}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-gray-600">Last Update:</span>
                     <span className="text-sm font-medium">
                       {selectedStock.timestamp ? new Date(selectedStock.timestamp).toLocaleTimeString() : 'N/A'}
                     </span>
                   </div>
                 </div>
               ) : (
                 <div className="text-center text-gray-500">
                   <p>Select a stock to view metrics</p>
                 </div>
               )}
               <div className="text-xs text-gray-500 mt-3 text-center">
                 Analysis based on {timeRange} data
               </div>
             </div>
          </div>
        </div>

        {/* Bottom Section - Charts and Analysis */}
        {selectedStock && (
          <div className="mt-8 space-y-6">
                         {/* Stock Chart */}
             <div className="bg-white rounded-lg shadow-sm border p-6">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">
                 Price Chart - {selectedStock.symbol} ({getStockDisplayName(selectedStock.symbol)})
               </h2>
               {historicalLoading ? (
                 <div className="animate-pulse">
                   <div className="h-64 bg-gray-200 rounded-lg"></div>
                 </div>
               ) : (
                 <div className="h-64">
                   {historicalData?.data ? (
                     <StockPriceChart 
                       data={historicalData.data} 
                       symbol={selectedStock.symbol}
                       timeRange={timeRange}
                     />
                   ) : (
                     <div className="h-64 flex items-center justify-center text-gray-500">
                       <p>No historical data available</p>
                     </div>
                   )}
                 </div>
               )}
             </div>

            {/* Stock Details Modal */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Detailed Analysis - {selectedStock.symbol}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Current Price:</span>
                  <div className="font-medium">${formatStockPrice(selectedStock.price)}</div>
                </div>
                <div>
                  <span className="text-gray-500">24h Change:</span>
                  <div className={`font-medium ${
                    (selectedStock.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatStockPrice(selectedStock.change || 0)} ({formatPercentageChange(selectedStock.changePercent || 0)})
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Volume:</span>
                  <div className="font-medium">{formatNumber(selectedStock.volume || 0)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Last Update:</span>
                  <div className="font-medium">
                    {selectedStock.timestamp ? new Date(selectedStock.timestamp).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

                 {/* Info Banner */}
         <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
           <div className="flex items-start space-x-3">
             <Lightbulb className="w-6 h-6 text-blue-500 mt-0.5" />
             <div className="flex-1">
               <h3 className="text-sm font-medium text-blue-800">Stock Market Data</h3>
               <p className="text-sm text-blue-700 mt-1">
                 All stock data is sourced from reliable market sources. 
                 Charts display historical price movements and volume data. 
                 Enable real-time updates for live market feeds and automatic data refresh.
               </p>
               
               {/* Connection Status */}
               <div className="mt-3 flex items-center space-x-4 text-xs">
                 <div className="flex items-center space-x-2">
                   <div className={`w-2 h-2 rounded-full ${serviceStatus?.connected ? 'bg-green-500' : 'bg-red-400'}`}></div>
                   <span className={serviceStatus?.connected ? 'text-green-700' : 'text-red-700'}>
                     WebSocket: {serviceStatus?.connected ? 'Connected' : 'Disconnected'}
                   </span>
                 </div>
                 
                 <div className="flex items-center space-x-2">
                   <div className={`w-2 h-2 rounded-full ${showRealTime ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                   <span className={showRealTime ? 'text-green-700' : 'text-gray-700'}>
                     Real-time: {showRealTime ? 'Active' : 'Inactive'}
                   </span>
                 </div>
                 
                 <div className="flex items-center space-x-2">
                   <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                   <span className={autoRefresh ? 'text-blue-700' : 'text-gray-700'}>
                     Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
                   </span>
                 </div>
               </div>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
};

export default StockView;
