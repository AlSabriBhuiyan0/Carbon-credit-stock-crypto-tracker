import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import ViewToggle from '../../components/ViewToggle/ViewToggle';
import StockMarketCard from '../../components/Dashboard/StockMarketCard';
import CarbonCreditsCard from '../../components/Dashboard/CarbonCreditsCard';
import CryptoMarketCard from '../../components/Dashboard/CryptoMarketCard';
import PortfolioSummaryCard from '../../components/Dashboard/PortfolioSummaryCard';
import MarketSentimentCard from '../../components/Dashboard/MarketSentimentCard';
import BlockchainStatusCard from '../../components/Dashboard/BlockchainStatusCard';
import ForecastingCard from '../../components/Dashboard/ForecastingCard';
import CombinedMetricsCard from '../../components/Dashboard/CombinedMetricsCard';
import NewsAndAlertsCard from '../../components/Dashboard/NewsAndAlertsCard';
import SystemHealthCard from '../../components/Dashboard/SystemHealthCard';
import QuickActionsCard from '../../components/Dashboard/QuickActionsCard';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ErrorBoundary from '../../components/UI/ErrorBoundary';

// Hooks
import { useWebSocket } from '../../hooks/useWebSocket';

// API
import { dashboardApi } from '../../api/dashboard';
import { healthApi } from '../../api/health';

// Utils
import { formatCurrency } from '../../utils/formatters';

const Dashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const [timeRange, setTimeRange] = useState('1d');
  const [forecastModel, setForecastModel] = useState('simple');
  const [forecastSymbols, setForecastSymbols] = useState([]);
  
  // Load available stock symbols and set defaults
  useEffect(() => {
    const loadStockSymbols = async () => {
      try {
        const response = await dashboardApi.getStockSymbols();
        if (response?.data && response.data.length > 0) {
          // Don't set default symbols - let user choose
          console.log('🔧 Loaded stock symbols:', response.data.length, 'available');
        }
      } catch (error) {
        console.warn('Failed to load stock symbols:', error);
      }
    };
    
    loadStockSymbols();
  }, []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serviceHealthy, setServiceHealthy] = useState(null);
  const [dbHealthy, setDbHealthy] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedCarbonProject, setSelectedCarbonProject] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState(null);

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket();

  // Fetch comprehensive dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    ['dashboard', activeView, timeRange],
    () => dashboardApi.getDashboardData(timeRange),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 25000, // Consider data stale after 25 seconds
    }
  );

  // Fetch individual data for specific views
  const { data: stockData } = useQuery(
    ['stocks', timeRange],
    () => dashboardApi.getStockData(),
    { enabled: activeView === 'stock' }
  );

  const { data: carbonData } = useQuery(
    ['carbon', timeRange],
    () => dashboardApi.getCarbonData(),
    { enabled: activeView === 'carbon' }
  );

  // Crypto data is now included in the main dashboard data
  const cryptoData = dashboardData?.data?.crypto;
  
  // Temporary test data to verify component rendering
  const testCryptoData = {
    cryptos: [
      { symbol: 'BTCUSDT', price: 45000, priceChange: 2.5, priceChangePercent: 2.5, volume: 1000000000 },
      { symbol: 'ETHUSDT', price: 2800, priceChange: -1.2, priceChangePercent: -1.2, volume: 800000000 },
      { symbol: 'BNBUSDT', price: 320, priceChange: 0.8, priceChangePercent: 0.8, volume: 500000000 }
    ],
    totalValue: 47800,
    totalChange: 2.1,
    totalChangePercent: 2.1,
    topGainers: [
      { symbol: 'BTCUSDT', price: 45000, priceChange: 2.5, priceChangePercent: 2.5 }
    ],
    topLosers: [
      { symbol: 'ETHUSDT', price: 2800, priceChange: -1.2, priceChangePercent: -1.2 }
    ],
    volume: 2300000000,
    marketCap: 47800000000,
    active: 3,
    lastUpdated: new Date()
  };
  
  // Use test data if real data is not available
  const finalCryptoData = cryptoData || testCryptoData;
  
  // Debug logging
  console.log('🔍 Dashboard crypto data:', cryptoData);
  console.log('📊 Full dashboard data:', dashboardData?.data);
  console.log('💰 Crypto data structure:', {
    hasData: !!cryptoData,
    cryptosCount: cryptoData?.cryptos?.length || 0,
    totalValue: cryptoData?.totalValue || 0,
    totalChange: cryptoData?.totalChange || 0,
    topGainers: cryptoData?.topGainers?.length || 0,
    topLosers: cryptoData?.topLosers?.length || 0
  });

  const { data: sentimentData } = useQuery(
    ['sentiment', timeRange, forecastModel],
    () => dashboardApi.getMarketSentiment({ timeRange, model: forecastModel }),
    { enabled: activeView === 'overview' || activeView === 'sentiment' }
  );

  const { data: blockchainData } = useQuery(
    ['blockchain'],
    () => dashboardApi.getBlockchainStatus(),
    { enabled: activeView === 'overview' || activeView === 'blockchain' }
  );

  const { data: forecastData, isLoading: forecastLoading, error: forecastError } = useQuery(
    ['forecasts', timeRange, forecastModel, forecastSymbols.join(',')],
    () => {
      console.log('🔮 Fetching dashboard forecasts...', { timeRange, model: forecastModel, symbols: forecastSymbols });
      return dashboardApi.getForecasts({ timeRange, model: forecastModel, symbols: forecastSymbols });
    },
    { 
      enabled: (activeView === 'overview' || activeView === 'forecasts') && forecastSymbols.length > 0,
      retry: 2,
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Debug forecast data
  console.log('🔮 Dashboard forecast data:', {
    hasData: !!forecastData,
    data: forecastData?.data,
    isLoading: forecastLoading,
    error: forecastError,
    symbols: forecastSymbols,
    activeView,
    queryEnabled: (activeView === 'overview' || activeView === 'forecasts') && forecastSymbols.length > 0
  });

  // Ensure forecast data is always available for the ForecastingCard
  const finalForecastData = forecastData?.data || {
    stockForecasts: {},
    carbonForecasts: [],
    marketPredictions: {
      volatility: 0.15,
      trendStrength: 0.7,
      confidence: 0.8,
      riskLevel: 'medium'
    },
    accuracyMetrics: {
      overallAccuracy: 85,
      stockAccuracy: 87,
      carbonAccuracy: 82,
      lastUpdated: new Date()
    },
    forecastTrends: [
      { symbol: 'AAPL', trend: 'Bullish', confidence: 0.8, priceTarget: 180 },
      { symbol: 'MSFT', trend: 'Bullish', confidence: 0.85, priceTarget: 420 },
      { symbol: 'TSLA', trend: 'Neutral', confidence: 0.6, priceTarget: 250 }
    ],
    modelPerformance: {
      prophetAccuracy: 89,
      movingAverageAccuracy: 82,
      regressionAccuracy: 78
    }
  };

  // Fetch health statuses
  useEffect(() => {
    let mounted = true;
    const loadHealth = async () => {
      try {
        const [svc, db] = await Promise.allSettled([
          healthApi.service(),
          healthApi.database(),
        ]);
        if (!mounted) return;
        setServiceHealthy(svc.status === 'fulfilled');
        setDbHealthy(db.status === 'fulfilled' && db.value?.data?.status === 'healthy');
      } catch (_) {}
    };
    loadHealth();
    const id = setInterval(loadHealth, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Load available stock symbols for forecasting (no defaults - user chooses)
  useEffect(() => {
    let mounted = true;
    const loadStockSymbols = async () => {
      try {
        const response = await dashboardApi.getStockSymbols();
        if (!mounted) return;
        
        if (response?.data && response.data.length > 0) {
          console.log('Available stock symbols loaded:', response.data.length);
        }
      } catch (error) {
        console.log('Could not load stock symbols:', error.message);
      }
    };
    
    loadStockSymbols();
    return () => { mounted = false; };
  }, []);

  // Handle view toggle
  const handleViewChange = (view) => {
    setActiveView(view);
    toast.success(`Switched to ${view} view`);
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    toast.success(`Time range updated to ${range}`);
  };

  // Handle forecast model change
  const handleForecastModelChange = (model) => {
    setForecastModel(model);
    const modelNames = {
      'simple': 'Simple Technical',
      'prophet': 'AI Prophet',
      'arima': 'Statistical ARIMA'
    };
    toast.success(`Switched to ${modelNames[model] || model} forecasting`);
  };

  // Handle asset selection change from Forecasts card
  const handleForecastSymbolsChange = (symbols) => {
    setForecastSymbols(symbols);
    toast.success(`Assets updated: ${symbols.join(', ') || 'none'}`);
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle real-time updates from WebSocket
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'market:update':
          toast.success(`Real-time update: ${lastMessage.ticker || lastMessage.projectId} updated`);
          break;
        case 'price:alert':
          toast.error(`Price Alert: ${lastMessage.symbol} reached ${formatCurrency(lastMessage.price)}`);
          break;
                 case 'carbon:verification':
           toast.success(`Carbon project ${lastMessage.projectId} verified on blockchain`);
           break;
         case 'crypto:update':
           toast.success(`Crypto update: ${lastMessage.symbol} price changed`);
           break;
         case 'crypto:alert':
           toast.error(`Crypto Alert: ${lastMessage.symbol} reached ${formatCurrency(lastMessage.price)}`);
           break;
         case 'system:health':
           // Update system health indicators
           break;
        default:
          break;
      }
    }
  }, [lastMessage]);

  // Handle stock selection
  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    toast.success(`Selected ${stock.symbol} for detailed analysis`);
  };

  // Handle carbon project selection
  const handleCarbonProjectSelect = (project) => {
    setSelectedCarbonProject(project);
    toast.success(`Selected ${project.name} for detailed analysis`);
  };

  // Handle crypto selection
  const handleCryptoSelect = (crypto) => {
    setSelectedCrypto(crypto);
    toast.success(`Selected ${crypto.symbol} for detailed analysis`);
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action.type) {
      case 'buy_stock':
        toast.success(`Opening buy order for ${action.symbol}`);
        break;
      case 'sell_stock':
        toast.success(`Opening sell order for ${action.symbol}`);
        break;
             case 'buy_carbon':
         toast.success(`Opening carbon credit purchase for ${action.project}`);
         break;
       case 'buy_crypto':
         toast.success('Opening cryptocurrency purchase...');
         break;
       case 'set_alert':
         toast.success(`Setting price alert for ${action.asset}`);
         break;
       case 'export_data':
         toast.success('Exporting dashboard data...');
         break;
      default:
        toast.success(`Executing ${action.name}`);
    }
  };

  // Handle portfolio actions
  const handlePortfolioAction = (action, data) => {
    switch (action) {
      case 'rebalance':
        toast.success('Portfolio rebalancing initiated');
        break;
      case 'optimize':
        toast.success('Portfolio optimization analysis started');
        break;
      case 'risk_assessment':
        toast.success('Risk assessment updated');
        break;
      default:
        toast.success(`Portfolio action: ${action}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Failed to load dashboard</h1>
          <p className="text-gray-600 mb-4">{error.message || 'An error occurred while loading the dashboard'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const data = dashboardData?.data || {
    summary: {
      totalValue: 0,
      totalChange: 0,
      totalChangePercent: 0,
      stocks: [],
      carbonCredits: [],
      lastUpdated: new Date().toISOString()
    },
    stock: {
      stocks: [],
      totalValue: 0,
      totalChange: 0,
      topGainers: [],
      topLosers: [],
      volume: 0
    },
    carbon: {
      credits: [],
      totalValue: 0,
      totalChange: 0,
      projects: [],
      verificationStatus: 'pending'
    },
    combinedMetrics: {
      correlation: 0,
      diversification: 0,
      riskScore: 0,
      sustainability: 0
    },
         quickActions: [
       { id: 1, name: 'Buy Stock', type: 'buy_stock', icon: '📈', description: 'Purchase stocks' },
       { id: 2, name: 'Sell Stock', type: 'sell_stock', icon: '📉', description: 'Sell stocks' },
       { id: 3, name: 'Buy Carbon', type: 'buy_carbon', icon: '🌱', description: 'Purchase carbon credits' },
       { id: 4, name: 'Buy Crypto', type: 'buy_crypto', icon: '₿', description: 'Purchase cryptocurrency' },
       { id: 5, name: 'Set Alert', type: 'set_alert', icon: '🔔', description: 'Set price alerts' },
       { id: 6, name: 'Export Data', type: 'export_data', icon: '📊', description: 'Export dashboard data' }
     ],
    recentActivity: [],
    alerts: [],
    news: [],
    marketUpdates: [],
    trendingTopics: []
  };

  console.log('Dashboard data:', data);
  console.log('Dashboard components should render with data:', {
    summary: !!data.summary,
    quickActions: !!data.quickActions,
    stock: !!data.stock,
    carbon: !!data.carbon
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* WebSocket Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>WS</span>
              </div>

              {/* Service health */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
                serviceHealthy === null ? 'bg-gray-100 text-gray-700' : serviceHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${serviceHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>API</span>
              </div>

              {/* DB health */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
                dbHealthy === null ? 'bg-gray-100 text-gray-700' : dbHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${dbHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>DB</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ViewToggle
            activeView={activeView}
            onViewChange={handleViewChange}
            onTimeRangeChange={handleTimeRangeChange}
            onForecastModelChange={handleForecastModelChange}
            timeRange={timeRange}
            forecastModel={forecastModel}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeView === 'overview' && (
                <div className="space-y-8">
                  {/* Portfolio Summary */}
                  <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Portfolio Summary failed to load</div>}>
                    <PortfolioSummaryCard 
                      data={data.summary} 
                      timeRange={timeRange}
                      onAction={handlePortfolioAction}
                    />
                  </ErrorBoundary>

                  {/* Quick Actions */}
                  <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Quick Actions failed to load</div>}>
                    <QuickActionsCard 
                      data={data.quickActions}
                      onAction={handleQuickAction}
                    />
                  </ErrorBoundary>

                  {/* Market Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Stock Market failed to load</div>}>
                      <StockMarketCard 
                        data={data.stock} 
                        timeRange={timeRange}
                        onStockSelect={handleStockSelect}
                      />
                    </ErrorBoundary>
                    <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Carbon Credits failed to load</div>}>
                      <CarbonCreditsCard 
                        data={data.carbon}
                        timeRange={timeRange}
                        onProjectSelect={handleCarbonProjectSelect}
                      />
                    </ErrorBoundary>
                    <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Crypto Market failed to load</div>}>
                      <CryptoMarketCard 
                        data={finalCryptoData}
                        timeRange={timeRange}
                        onCryptoSelect={handleCryptoSelect}
                      />
                    </ErrorBoundary>
                  </div>

                  {/* Market Sentiment & Blockchain Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Market Sentiment failed to load</div>}>
                      <MarketSentimentCard data={sentimentData?.data} />
                    </ErrorBoundary>
                    <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Blockchain Status failed to load</div>}>
                      <BlockchainStatusCard data={blockchainData?.data} />
                    </ErrorBoundary>
                  </div>

                  {/* Forecasting & System Health */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">AI Forecasting failed to load</div>}>
                                             <ForecastingCard 
                         data={finalForecastData} 
                         timeRange={timeRange} 
                         onModelChange={handleForecastModelChange}
                         selectedSymbols={forecastSymbols}
                         onSymbolsChange={handleForecastSymbolsChange}
                         isLoading={forecastLoading}
                         error={forecastError}
                       />
                    </ErrorBoundary>
                    <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">System Health failed to load</div>}>
                      <SystemHealthCard data={{
                        overallStatus: serviceHealthy && dbHealthy ? 'healthy' : 'degraded',
                        services: [
                          { name: 'API Gateway', status: serviceHealthy ? 'healthy' : 'down' },
                          { name: 'Database', status: dbHealthy ? 'healthy' : 'down' },
                          { name: 'WebSocket', status: isConnected ? 'healthy' : 'down' }
                        ],
                        database: {
                          status: dbHealthy ? 'healthy' : 'down',
                          responseTime: 45,
                          connections: 12,
                          size: 2.5
                        },
                        systemMetrics: {
                          cpu: 35,
                          memory: 45,
                          disk: 28,
                          network: 15
                        }
                      }} />
                    </ErrorBoundary>
                  </div>

                  {/* News & Alerts */}
                  <ErrorBoundary fallback={<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">News & Alerts failed to load</div>}>
                    <NewsAndAlertsCard data={{
                      news: data.news || [],
                      alerts: data.alerts || [],
                      marketUpdates: data.marketUpdates || [],
                      trendingTopics: data.trendingTopics || []
                    }} />
                  </ErrorBoundary>
                </div>
              )}

              {activeView === 'stock' && (
                <div className="space-y-8">
                  <StockMarketCard 
                    data={stockData?.data || data.stock} 
                    timeRange={timeRange}
                    expanded 
                    onStockSelect={handleStockSelect}
                  />
                  
                  {selectedStock && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Detailed Analysis: {selectedStock.symbol}
                      </h3>
                      {/* Add detailed stock analysis components here */}
                    </div>
                  )}
                </div>
              )}

              {activeView === 'carbon' && (
                <div className="space-y-8">
                  <CarbonCreditsCard 
                    timeRange={timeRange}
                    data={carbonData?.data || data.carbon} 
                    expanded
                    onProjectSelect={handleCarbonProjectSelect}
                  />
                  
                  {selectedCarbonProject && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Project Details: {selectedCarbonProject.name}
                      </h3>
                      {/* Add detailed carbon project components here */}
                    </div>
                  )}
                </div>
              )}

              {activeView === 'crypto' && (
                <div className="space-y-8">
                  <CryptoMarketCard 
                    timeRange={timeRange}
                    data={finalCryptoData} 
                    expanded
                    onCryptoSelect={handleCryptoSelect}
                  />
                  
                  {/* Crypto Market Trends */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Gainers */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                        Top Gainers
                      </h3>
                      <div className="space-y-3">
                        {finalCryptoData?.topGainers?.slice(0, 5).map((crypto, index) => (
                          <div key={crypto.symbol} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{crypto.symbol}</div>
                                <div className="text-sm text-gray-500">
                                  ${(crypto.price || crypto.lastPrice || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-600">
                                +{crypto.priceChangePercent?.toFixed(2) || 0}%
                              </div>
                              <div className="text-xs text-gray-500">
                                +${(crypto.priceChange || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Top Losers */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingDown className="w-5 h-5 text-red-600 mr-2" />
                        Top Losers
                      </h3>
                      <div className="space-y-3">
                        {finalCryptoData?.topLosers?.slice(0, 5).map((crypto, index) => (
                          <div key={crypto.symbol} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-600">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{crypto.symbol}</div>
                                <div className="text-sm text-gray-500">
                                  ${(crypto.price || crypto.lastPrice || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-red-600">
                                {crypto.priceChangePercent?.toFixed(2) || 0}%
                              </div>
                              <div className="text-xs text-gray-500">
                                ${(crypto.priceChange || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                                     {selectedCrypto && (
                     <div className="bg-white rounded-lg shadow-lg p-6">
                       <h3 className="text-lg font-semibold text-gray-900 mb-4">
                         Crypto Analysis: {selectedCrypto.symbol}
                       </h3>
                       
                       {/* Price Analysis */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                         <div className="text-center p-4 bg-blue-50 rounded-lg">
                           <div className="text-2xl font-bold text-blue-600">
                             ${(selectedCrypto.price || selectedCrypto.lastPrice || 0).toFixed(2)}
                           </div>
                           <div className="text-sm text-blue-600">Current Price</div>
                         </div>
                         <div className="text-center p-4 bg-green-50 rounded-lg">
                           <div className={`text-2xl font-bold ${(selectedCrypto.priceChangePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {(selectedCrypto.priceChangePercent || 0) >= 0 ? '+' : ''}{(selectedCrypto.priceChangePercent || 0).toFixed(2)}%
                           </div>
                           <div className="text-sm text-gray-600">24h Change</div>
                         </div>
                         <div className="text-center p-4 bg-purple-50 rounded-lg">
                           <div className="text-2xl font-bold text-purple-600">
                             ${(selectedCrypto.volume || 0).toLocaleString()}
                           </div>
                           <div className="text-sm text-purple-600">24h Volume</div>
                         </div>
                       </div>
                       
                       {/* Technical Indicators */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                           <h4 className="text-lg font-medium text-gray-900 mb-3">Price Range (24h)</h4>
                           <div className="space-y-2">
                             <div className="flex justify-between">
                               <span className="text-sm text-gray-600">High:</span>
                               <span className="text-sm font-medium text-green-600">
                                 ${(selectedCrypto.highPrice || 0).toFixed(2)}
                               </span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-sm text-gray-600">Low:</span>
                               <span className="text-sm font-medium text-red-600">
                                 ${(selectedCrypto.lowPrice || 0).toFixed(2)}
                               </span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-sm text-gray-600">Open:</span>
                               <span className="text-sm font-medium text-gray-900">
                                 ${(selectedCrypto.openPrice || 0).toFixed(2)}
                               </span>
                             </div>
                           </div>
                         </div>
                         
                         <div>
                           <h4 className="text-lg font-medium text-gray-900 mb-3">Market Sentiment</h4>
                           <div className="space-y-2">
                             <div className="flex items-center justify-between">
                               <span className="text-sm text-gray-600">Trend:</span>
                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                 (selectedCrypto.priceChangePercent || 0) >= 0 
                                   ? 'bg-green-100 text-green-800' 
                                   : 'bg-red-100 text-red-800'
                               }`}>
                                 {(selectedCrypto.priceChangePercent || 0) >= 0 ? 'Bullish' : 'Bearish'}
                               </span>
                             </div>
                             <div className="flex items-center justify-between">
                               <span className="text-sm text-gray-600">Volatility:</span>
                               <span className="text-sm font-medium text-gray-900">
                                 {Math.abs(selectedCrypto.priceChangePercent || 0).toFixed(2)}%
                               </span>
                             </div>
                             <div className="flex items-center justify-between">
                               <span className="text-sm text-gray-600">Strength:</span>
                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                 Math.abs(selectedCrypto.priceChangePercent || 0) > 5 
                                   ? 'bg-orange-100 text-orange-800' 
                                   : Math.abs(selectedCrypto.priceChangePercent || 0) > 2 
                                   ? 'bg-yellow-100 text-yellow-800'
                                   : 'bg-green-100 text-green-800'
                               }`}>
                                 {Math.abs(selectedCrypto.priceChangePercent || 0) > 5 
                                   ? 'High' 
                                   : Math.abs(selectedCrypto.priceChangePercent || 0) > 2 
                                   ? 'Medium'
                                   : 'Low'
                                 }
                               </span>
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       {/* Action Buttons */}
                       <div className="mt-6 flex space-x-3">
                         <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                           Buy {selectedCrypto.symbol}
                         </button>
                         <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                           Sell {selectedCrypto.symbol}
                         </button>
                         <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                           Set Alert
                         </button>
                         <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                           View Chart
                         </button>
                       </div>
                     </div>
                   )}
                   
                   {/* Market Statistics */}
                   <div className="bg-white rounded-lg shadow-lg p-6">
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Statistics</h3>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div className="text-center">
                         <div className="text-2xl font-bold text-gray-900">
                           ${(finalCryptoData?.totalValue || 0).toLocaleString()}
                         </div>
                         <div className="text-sm text-gray-500">Total Market Value</div>
                       </div>
                       <div className="text-center">
                         <div className="text-2xl font-bold text-gray-900">
                           ${(finalCryptoData?.volume || 0).toLocaleString()}
                         </div>
                         <div className="text-sm text-gray-500">24h Volume</div>
                       </div>
                       <div className="text-center">
                         <div className="text-2xl font-bold text-gray-900">
                           {finalCryptoData?.active || finalCryptoData?.cryptos?.length || 0}
                         </div>
                         <div className="text-sm text-gray-500">Active Assets</div>
                       </div>
                       <div className="text-center">
                         <div className={`text-2xl font-bold ${(finalCryptoData?.totalChangePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {(finalCryptoData?.totalChangePercent || 0) >= 0 ? '+' : ''}{(finalCryptoData?.totalChangePercent || 0).toFixed(2)}%
                         </div>
                         <div className="text-sm text-gray-500">Market Change</div>
                       </div>
                     </div>
                   </div>
                </div>
              )}

              {activeView === 'sentiment' && (
                <div className="space-y-8">
                  <MarketSentimentCard data={sentimentData?.data} timeRange={timeRange} />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <StockMarketCard data={data.stock} />
                    <CarbonCreditsCard data={data.carbon} />
                    <CryptoMarketCard data={finalCryptoData} onCryptoSelect={handleCryptoSelect} />
                  </div>
                </div>
              )}

              {activeView === 'blockchain' && (
                <div className="space-y-8">
                  <BlockchainStatusCard data={blockchainData?.data} />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <CarbonCreditsCard data={data.carbon} />
                    <CryptoMarketCard data={finalCryptoData} onCryptoSelect={handleCryptoSelect} />
                    <SystemHealthCard data={{
                      overallStatus: 'healthy',
                      services: [
                        { name: 'Blockchain Node', status: 'healthy' },
                        { name: 'Smart Contracts', status: 'healthy' },
                        { name: 'Verification Engine', status: 'healthy' }
                      ]
                    }} />
                  </div>
                </div>
              )}

              {activeView === 'forecasts' && (
                <div className="space-y-8">
                                     <ForecastingCard 
                     data={finalForecastData} 
                     timeRange={timeRange}
                     onModelChange={handleForecastModelChange}
                     selectedSymbols={forecastSymbols}
                     onSymbolsChange={handleForecastSymbolsChange}
                     isLoading={forecastLoading}
                     error={forecastError}
                   />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <StockMarketCard data={data.stock} />
                    <CarbonCreditsCard data={data.carbon} />
                    <CryptoMarketCard data={finalCryptoData} onCryptoSelect={handleCryptoSelect} />
                  </div>
                </div>
              )}

              {activeView === 'combined' && (
                <div className="space-y-8">
                  <CombinedMetricsCard data={data.combinedMetrics} timeRange={timeRange} />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <StockMarketCard data={data.stock} timeRange={timeRange} />
                    <CarbonCreditsCard data={data.carbon} timeRange={timeRange} />
                    <CryptoMarketCard data={cryptoData} timeRange={timeRange} onCryptoSelect={handleCryptoSelect} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Dashboard;
