import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMockDataForUser } from '../../services/mockDataService';
import PortfolioService from '../../services/portfolioService';
import AddAssetModal from '../../components/Portfolio/AddAssetModal';
import { TrendingUp, DollarSign, BarChart3, Activity, Download, PieChart, Target, Shield, Leaf, Plus } from 'lucide-react';
import StockPriceChart from '../../components/Charts/StockPriceChart';

const Portfolio = () => {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAddCarbonModal, setShowAddCarbonModal] = useState(false);

  // Transform real portfolio data to match expected structure
  const transformRealPortfolioData = useCallback((realPortfolio) => {
    if (!realPortfolio) return generateFallbackPortfolioData();
    
    // Transform stocks
    const transformedStocks = (realPortfolio.stocks?.holdings || []).map((stock, index) => ({
      id: stock.id || index + 1,
      symbol: stock.stock_symbol,
      name: stock.stock_name || stock.stock_symbol,
      type: 'stock',
      shares: parseFloat(stock.quantity) || 0,
      avgPrice: parseFloat(stock.purchase_price) || 0,
      currentPrice: parseFloat(stock.current_price) || parseFloat(stock.purchase_price) || 0,
      currentValue: parseFloat(stock.current_value) || 0,
      totalCost: parseFloat(stock.quantity) * parseFloat(stock.purchase_price) || 0,
      gainLoss: parseFloat(stock.gain_loss) || 0,
      gainLossPercent: parseFloat(stock.gain_loss_percent) || 0,
      weight: 0, // Will be calculated
      sector: stock.sector?.toLowerCase() || 'technology',
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: parseFloat(stock.current_value) || 0,
        shares: parseFloat(stock.quantity) || 0
      }))
    }));

    // Transform carbon credits
    const transformedCarbonCredits = (realPortfolio.carbonCredits?.holdings || []).map((credit, index) => ({
      id: credit.id || index + 100,
      symbol: credit.credit_id,
      name: credit.project_name,
      type: 'carbon-credit',
      shares: parseFloat(credit.quantity) || 0,
      avgPrice: parseFloat(credit.purchase_price) || 0,
      currentPrice: parseFloat(credit.purchase_price) || 0, // Carbon credits don't have real-time pricing
      currentValue: parseFloat(credit.current_value) || 0,
      totalCost: parseFloat(credit.quantity) * parseFloat(credit.purchase_price) || 0,
      gainLoss: 0, // Carbon credits typically don't have price fluctuations like stocks
      gainLossPercent: 0,
      weight: 0, // Will be calculated
      sector: credit.project_type?.toLowerCase().replace(/\s+/g, '-') || 'renewable-energy',
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: parseFloat(credit.current_value) || 0,
        shares: parseFloat(credit.quantity) || 0
      }))
    }));

    // Combine all assets
    const allAssets = [...transformedStocks, ...transformedCarbonCredits];

    // Calculate weights
    const totalValue = allAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
    allAssets.forEach(asset => {
      asset.weight = totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0;
    });

    return {
      totalValue,
      totalCost: allAssets.reduce((sum, asset) => sum + asset.totalCost, 0),
      totalGainLoss: allAssets.reduce((sum, asset) => sum + asset.gainLoss, 0),
      totalGainLossPercent: totalValue > 0 ? (allAssets.reduce((sum, asset) => sum + asset.gainLoss, 0) / totalValue) * 100 : 0,
      assets: allAssets,
      allocation: {
        stocks: allAssets.filter(asset => asset.type === 'stock').reduce((sum, asset) => sum + asset.currentValue, 0),
        carbonCredits: allAssets.filter(asset => asset.type === 'carbon-credit').reduce((sum, asset) => sum + asset.currentValue, 0)
      }
    };
  }, []);

  // Transform mock portfolio data to match expected structure
  const transformMockPortfolioData = useCallback((mockData) => {
    if (!mockData || !mockData.portfolio) return generateFallbackPortfolioData();
    
    const portfolio = mockData.portfolio;
    const stocks = portfolio.stocks || [];
    const carbonCredits = portfolio.carbonCredits || [];
    
    // Transform stocks
    const transformedStocks = stocks.map((stock, index) => ({
      id: index + 1,
      symbol: stock.symbol,
      name: stock.name,
      type: 'stock',
      shares: stock.shares || 0,
      avgPrice: stock.avgPrice || 0,
      currentPrice: stock.currentPrice || stock.avgPrice || 0,
      currentValue: (stock.shares || 0) * (stock.currentPrice || stock.avgPrice || 0),
      totalCost: (stock.shares || 0) * (stock.avgPrice || 0),
      gainLoss: ((stock.currentPrice || stock.avgPrice || 0) - (stock.avgPrice || 0)) * (stock.shares || 0),
      gainLossPercent: stock.avgPrice > 0 ? ((stock.currentPrice || stock.avgPrice || 0) - stock.avgPrice) / stock.avgPrice * 100 : 0,
      weight: 0, // Will be calculated
      sector: stock.sector || 'technology',
      data: stock.data || Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: (stock.shares || 0) * (stock.currentPrice || stock.avgPrice || 0),
        shares: stock.shares || 0
      }))
    }));

    // Transform carbon credits
    const transformedCarbonCredits = carbonCredits.map((credit, index) => ({
      id: index + 100,
      symbol: credit.projectId,
      name: credit.name,
      type: 'carbon-credit',
      shares: credit.creditsIssued || 0,
      avgPrice: credit.price || 0,
      currentPrice: credit.price || 0,
      currentValue: (credit.creditsIssued || 0) * (credit.price || 0),
      totalCost: (credit.creditsIssued || 0) * (credit.price || 0),
      gainLoss: 0, // Carbon credits typically don't have price fluctuations
      gainLossPercent: 0,
      weight: 0, // Will be calculated
      sector: credit.type?.toLowerCase().replace(/\s+/g, '-') || 'renewable-energy',
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: (credit.creditsIssued || 0) * (credit.price || 0),
        shares: credit.creditsIssued || 0
      }))
    }));

    // Combine all assets
    const allAssets = [...transformedStocks, ...transformedCarbonCredits];

    // Calculate weights
    const totalValue = allAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
    allAssets.forEach(asset => {
      asset.weight = totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0;
    });

    return {
      totalValue,
      totalCost: allAssets.reduce((sum, asset) => sum + asset.totalCost, 0),
      totalGainLoss: allAssets.reduce((sum, asset) => sum + asset.gainLoss, 0),
      totalGainLossPercent: totalValue > 0 ? (allAssets.reduce((sum, asset) => sum + asset.gainLoss, 0) / totalValue) * 100 : 0,
      assets: allAssets,
      allocation: {
        stocks: allAssets.filter(asset => asset.type === 'stock').reduce((sum, asset) => sum + asset.currentValue, 0),
        carbonCredits: allAssets.filter(asset => asset.type === 'carbon-credit').reduce((sum, asset) => sum + asset.currentValue, 0)
      }
    };
  }, []);

  // Load real portfolio data from API
  const loadPortfolioData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to get real portfolio data first
      try {
        const realPortfolio = await PortfolioService.getPortfolioSummary();
        if (realPortfolio && (realPortfolio.stocks?.holdings?.length > 0 || realPortfolio.carbonCredits?.holdings?.length > 0)) {
          // Transform real data to match expected structure
          const transformedData = transformRealPortfolioData(realPortfolio);
          setPortfolioData(transformedData);
          return;
        }
      } catch (error) {
        console.log('Real portfolio data not available, using mock data');
      }
      
      // Fallback to mock data
      const mockPortfolio = getMockDataForUser(user?.role || 'investor');
      const transformedData = transformMockPortfolioData(mockPortfolio);
      setPortfolioData(transformedData);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      const fallbackData = generateFallbackPortfolioData();
      setPortfolioData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [user?.role, transformMockPortfolioData, transformRealPortfolioData]);





  useEffect(() => {
    loadPortfolioData();
  }, [loadPortfolioData]);

  // Handle asset added
  const handleAssetAdded = useCallback((result) => {
    // Reload portfolio data to show the new asset
    loadPortfolioData();
  }, [loadPortfolioData]);

  const generateFallbackPortfolioData = () => {
    return {
      totalValue: 125000,
      totalChange: 8750,
      totalChangePercent: 7.52,
      totalInvested: 100000,
      totalReturn: 25000,
      returnPercent: 25.0,
      assets: [
        {
          id: 1,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          type: 'stock',
          shares: 50,
          avgPrice: 150.00,
          currentPrice: 175.43,
          currentValue: 8771.50,
          totalCost: 7500.00,
          gainLoss: 1271.50,
          gainLossPercent: 16.95,
          weight: 7.02,
          sector: 'technology',
          data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: 7500 + Math.random() * 2000,
            shares: 50
          }))
        },
        {
          id: 2,
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          type: 'stock',
          shares: 30,
          avgPrice: 300.00,
          currentPrice: 338.11,
          currentValue: 10143.30,
          totalCost: 9000.00,
          gainLoss: 1143.30,
          gainLossPercent: 12.70,
          weight: 8.11,
          sector: 'technology',
          data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: 9000 + Math.random() * 1500,
            shares: 30
          }))
        },
        {
          id: 3,
          symbol: 'CC-001',
          name: 'Solar Farm Development - Texas',
          type: 'carbon-credit',
          credits: 1000,
          avgPrice: 12.00,
          currentPrice: 12.50,
          currentValue: 12500.00,
          totalCost: 12000.00,
          gainLoss: 500.00,
          gainLossPercent: 4.17,
          weight: 10.00,
          sector: 'renewable-energy',
          data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: 12000 + Math.random() * 1000,
            credits: 1000
          }))
        },
        {
          id: 4,
          symbol: 'JNJ',
          name: 'Johnson & Johnson',
          type: 'stock',
          shares: 40,
          avgPrice: 160.00,
          currentPrice: 167.89,
          currentValue: 6715.60,
          totalCost: 6400.00,
          gainLoss: 315.60,
          gainLossPercent: 4.93,
          weight: 5.37,
          sector: 'healthcare',
          data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: 6400 + Math.random() * 800,
            shares: 40
          }))
        },
        {
          id: 5,
          symbol: 'XOM',
          name: 'Exxon Mobil Corporation',
          type: 'stock',
          shares: 60,
          avgPrice: 95.00,
          currentPrice: 98.45,
          currentValue: 5907.00,
          totalCost: 5700.00,
          gainLoss: 207.00,
          gainLossPercent: 3.63,
          weight: 4.73,
          sector: 'energy',
          data: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: 5700 + Math.random() * 600,
            shares: 60
          }))
        }
      ],
      allocation: {
        stocks: 70.5,
        carbonCredits: 10.0,
        bonds: 15.0,
        cash: 4.5
      },
      performance: {
        daily: 0.85,
        weekly: 2.34,
        monthly: 7.52,
        yearly: 25.0
      }
    };
  };

  const getRoleSpecificFeatures = () => {
    switch (user?.role) {
      case 'investor':
        return {
          title: 'Investment Portfolio',
          subtitle: 'Track your investments across stocks, carbon credits, and other assets',
          features: ['Portfolio tracking', 'Performance analysis', 'Asset allocation', 'Risk management']
        };
      case 'company':
        return {
          title: 'Corporate Investment Portfolio',
          subtitle: 'Manage your company\'s investment portfolio and ESG assets',
          features: ['Corporate investments', 'ESG portfolio', 'Compliance tracking', 'Performance reporting']
        };
      case 'regulator':
        return {
          title: 'Regulatory Portfolio Overview',
          subtitle: 'Monitor portfolio compliance and regulatory requirements',
          features: ['Compliance monitoring', 'Risk assessment', 'Regulatory reporting', 'Portfolio oversight']
        };
      case 'ngo':
        return {
          title: 'ESG Investment Portfolio',
          subtitle: 'Track sustainable investments and impact metrics',
          features: ['ESG scoring', 'Impact measurement', 'Sustainability metrics', 'Green investments']
        };
      default:
        return {
          title: 'Portfolio',
          subtitle: 'View and manage your investment portfolio',
          features: ['Asset overview', 'Performance tracking', 'Allocation analysis', 'Investment management']
        };
    }
  };

  const roleFeatures = getRoleSpecificFeatures();

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };



  const getAssetTypeIcon = (type) => {
    switch (type) {
      case 'stock':
        return <BarChart3 className="w-4 h-4" />;
      case 'carbon-credit':
        return <Leaf className="w-4 h-4" />;
      case 'bond':
        return <Shield className="w-4 h-4" />;
      case 'cash':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
  };

  const handleExport = () => {
    if (!portfolioData) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Symbol,Name,Type,Shares/Credits,Avg Price,Current Price,Current Value,Total Cost,Gain/Loss,Gain/Loss%,Weight,Sector\n" +
      (portfolioData.assets || []).map(asset => 
        `${asset.symbol || ''},${asset.name || ''},${asset.type || ''},${asset.shares || asset.credits || 0},${asset.avgPrice || 0},${asset.currentPrice || 0},${asset.currentValue || 0},${asset.totalCost || 0},${asset.gainLoss || 0},${(asset.gainLossPercent || 0).toFixed(2)}%,${(asset.weight || 0).toFixed(2)}%,${asset.sector || ''}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "portfolio_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !portfolioData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-32 h-32 border-b-2 rounded-full animate-spin border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{roleFeatures.title}</h1>
              <p className="text-gray-600">{roleFeatures.subtitle}</p>
            </div>
            
            {/* Add Asset Buttons */}
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowAddStockModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus size={16} className="mr-2" />
                Add Stock
              </button>
              <button
                onClick={() => setShowAddCarbonModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-md hover:bg-green-700"
              >
                <Plus size={16} className="mr-2" />
                Add Carbon Credit
              </button>
            </div>
          </div>
          
          {/* Role-specific features */}
          <div className="flex flex-wrap gap-2 mt-4">
            {roleFeatures.features.map((feature, index) => (
              <span key={index} className="px-3 py-1 text-sm rounded-full bg-primary-100 text-primary-800">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolioData.totalValue)}</p>
              </div>
              <div className={`p-2 rounded-full ${(portfolioData.totalChange || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={`h-6 w-6 ${(portfolioData.totalChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <div className={`mt-2 text-sm ${(portfolioData.totalChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(portfolioData.totalChange || 0) >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalChange)} ({(portfolioData.totalChangePercent || 0).toFixed(2)}%)
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolioData.totalInvested)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Initial investment amount
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Return</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolioData.totalReturn)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600">
              +{(portfolioData.returnPercent || 0).toFixed(2)}% return
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assets</p>
                <p className="text-2xl font-bold text-gray-900">{portfolioData.assets?.length || 0}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Different asset types
            </div>
          </div>
        </div>

        {/* Asset Allocation Chart */}
        <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Asset Allocation</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Object.entries(portfolioData.allocation).map(([assetType, percentage]) => (
              <div key={assetType} className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-full bg-primary-100">
                  <span className="text-lg font-bold text-primary-600">{(percentage || 0).toFixed(1)}%</span>
                </div>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {assetType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {Object.entries(portfolioData.performance).map(([period, value]) => (
                  <div key={period} className="text-center">
                    <div className={`text-2xl font-bold ${(value || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(value || 0) >= 0 ? '+' : ''}{(value || 0).toFixed(2)}%
                    </div>
                    <p className="text-sm text-gray-600 capitalize">
                      {period === '1d' ? 'Daily' : period === '1w' ? 'Weekly' : period === '1m' ? 'Monthly' : 'Yearly'}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* Assets Table */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Assets</h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-1/4 px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Asset</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase w-1/8">Type</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase w-1/8">Quantity</th>
                  <th className="w-1/6 px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Current Value</th>
                  <th className="w-1/6 px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Gain/Loss</th>
                  <th className="w-1/12 px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Weight</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase w-1/8">Sector</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(portfolioData.assets || []).map((asset) => (
                  <tr 
                    key={asset.id} 
                    className="transition-colors cursor-pointer hover:bg-gray-50"
                    onClick={() => handleAssetSelect(asset)}
                  >
                    <td className="w-1/4 px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{asset.symbol}</div>
                        <div className="text-sm text-gray-500 truncate">{asset.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-1/8">
                      <div className="flex items-center gap-2">
                        {getAssetTypeIcon(asset.type)}
                        <span className="text-sm text-gray-900 capitalize truncate">
                          {asset.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap w-1/8">
                      {asset.shares || asset.credits}
                    </td>
                    <td className="w-1/6 px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(asset.currentValue)}</div>
                      <div className="text-xs text-gray-500">${asset.currentPrice.toFixed(2)} each</div>
                    </td>
                    <td className="w-1/6 px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${asset.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {asset.gainLoss >= 0 ? '+' : ''}{formatCurrency(asset.gainLoss)}
                      </div>
                      <div className={`text-xs ${asset.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {asset.gainLoss >= 0 ? '+' : ''}{(asset.gainLossPercent || 0).toFixed(2)}%
                      </div>
                    </td>
                    <td className="w-1/12 px-6 py-4 text-sm text-center text-gray-900 whitespace-nowrap">
                      {(asset.weight || 0).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-1/8">
                      <span className="px-2 py-1 text-xs font-medium text-gray-800 capitalize bg-gray-100 rounded-full">
                        {asset.sector.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Detail Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedAsset.symbol} - {selectedAsset.name}</h3>
                    <p className="text-gray-600">{selectedAsset.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                                 <div className="mb-6">
                   <StockPriceChart 
                     data={selectedAsset.data} 
                     symbol={selectedAsset.symbol}
                     timeRange="1y"
                   />
                 </div>
                
                                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <span className="text-gray-500">Current Value:</span>
                      <div className="font-medium">{formatCurrency(selectedAsset.currentValue)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Cost:</span>
                      <div className="font-medium">{formatCurrency(selectedAsset.totalCost)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Gain/Loss:</span>
                      <div className={`font-medium ${(selectedAsset.gainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(selectedAsset.gainLoss || 0) >= 0 ? '+' : ''}{formatCurrency(selectedAsset.gainLoss)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Weight:</span>
                      <div className="font-medium">{(selectedAsset.weight || 0).toFixed(2)}%</div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Asset Modals */}
        <AddAssetModal
          isOpen={showAddStockModal}
          onClose={() => setShowAddStockModal(false)}
          assetType="stock"
          onAssetAdded={handleAssetAdded}
          title="Add Stock to Portfolio"
        />

        <AddAssetModal
          isOpen={showAddCarbonModal}
          onClose={() => setShowAddCarbonModal(false)}
          assetType="carbon"
          onAssetAdded={handleAssetAdded}
          title="Add Carbon Credit to Portfolio"
        />
      </div>
    </div>
  );
};

export default Portfolio;
