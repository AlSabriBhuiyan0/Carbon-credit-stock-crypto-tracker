import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Eye,
  Download,
  Target,
  PieChart,
  LineChart,
  TreePine
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMockDataForUser } from '../../services/mockDataService';
import NotificationCenter from '../../components/Notifications/NotificationCenter';

const InvestorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investmentOpportunities, setInvestmentOpportunities] = useState([]);
  const [portfolioPerformance, setPortfolioPerformance] = useState({});
  const [marketInsights, setMarketInsights] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const markAlertAsRead = (alertId) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const loadInvestorData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get mock data for the user
      const mockData = getMockDataForUser(user?.id || 'demo_investor_001', 'investor');
      
      if (mockData && mockData.portfolio) {
        setInvestmentOpportunities(mockData.portfolio.stocks.slice(0, 3).map((stock, index) => ({
          id: index + 1,
          name: stock.name,
          type: stock.sector,
          expectedReturn: `${stock.changePercent}%`,
          risk: stock.changePercent > 10 ? 'High' : stock.changePercent > 5 ? 'Medium' : 'Low',
          minInvestment: `$${Math.round(stock.price * 100)}`,
          description: `Investment in ${stock.sector.toLowerCase()} sector with ${stock.changePercent}% return potential`
        })));

        setPortfolioPerformance(mockData.portfolio.summary);
        setMarketInsights(mockData.marketInsights || []);
        setAlerts(mockData.alerts || []);
      } else {
        // Fallback to default data if mock data is not available
        setInvestmentOpportunities([
          {
            id: 1,
            name: 'Green Energy Fund',
            type: 'Carbon Credits',
            expectedReturn: '12.5%',
            risk: 'Medium',
            minInvestment: '$5,000',
            description: 'Investment in renewable energy carbon credit projects'
          },
          {
            id: 2,
            name: 'Sustainable Forestry Project',
            type: 'ESG Investment',
            expectedReturn: '8.2%',
            risk: 'Low',
            minInvestment: '$2,500',
            description: 'Long-term investment in sustainable forestry management'
          },
          {
            id: 3,
            name: 'Clean Tech Venture',
            type: 'Venture Capital',
            expectedReturn: '25.0%',
            risk: 'High',
            minInvestment: '$10,000',
            description: 'Early-stage clean technology companies'
          }
        ]);

        setPortfolioPerformance({
          totalValue: 125000,
          totalReturn: 8.5,
          monthlyReturn: 2.1,
          carbonOffset: 45.2,
          esgScore: 92
        });

        setMarketInsights([
          {
            id: 1,
            title: 'Carbon Credit Prices Rising',
            summary: 'EU carbon prices hit new highs due to stricter regulations',
            impact: 'positive',
            date: '2024-01-20'
          },
          {
            id: 2,
            title: 'ESG Investment Surge',
            summary: 'Sustainable investments continue to outperform traditional assets',
            impact: 'positive',
            date: '2024-01-18'
          }
        ]);

        setAlerts([
          {
            id: 1,
            type: 'opportunity',
            message: 'New carbon credit project available for investment',
            read: false,
            date: '2024-01-20'
          },
          {
            id: 2,
            type: 'market',
            message: 'Carbon credit prices increased by 5% today',
            read: false,
            date: '2024-01-19'
          }
        ]);
      }

    } catch (error) {
      console.error('Error loading investor data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadInvestorData();
  }, [loadInvestorData]);

  const renderOverview = () => (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white rounded-lg shadow-md"
      >
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
            <p className="text-2xl font-semibold text-gray-900">${(portfolioPerformance.totalValue || 0).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 bg-white rounded-lg shadow-md"
      >
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Return</p>
            <p className="text-2xl font-semibold text-gray-900">${(portfolioPerformance.totalReturn || 0).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-white rounded-lg shadow-md"
      >
        <div className="flex items-center">
          <div className="p-3 bg-purple-100 rounded-full">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Return %</p>
            <p className="text-2xl font-semibold text-gray-900">{portfolioPerformance.returnPercentage || 0}%</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 bg-white rounded-lg shadow-md"
      >
        <div className="flex items-center">
          <div className="p-3 bg-orange-100 rounded-full">
            <TreePine className="w-6 h-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Carbon Offset</p>
            <p className="text-2xl font-semibold text-gray-900">{(portfolioPerformance.carbonOffset || 0).toLocaleString()} tons</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Alerts Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-white rounded-lg shadow-md col-span-full"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Alerts</h3>
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg ${
              !alert.read ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{alert.type}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {alert.priority}
                  </span>
                  {!alert.read && (
                    <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                <p className="mt-1 text-xs text-gray-500">{alert.date}</p>
              </div>
              {!alert.read && (
                <button 
                  onClick={() => markAlertAsRead(alert.id)}
                  className="px-3 py-1 ml-4 text-sm text-purple-600 border border-purple-300 rounded hover:text-purple-800 hover:bg-purple-50"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
        {alerts.length > 3 && (
          <div className="mt-4 text-center">
            <button 
              onClick={() => setActiveTab('alerts')}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View All Alerts ({alerts.length})
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderInvestmentOpportunities = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Investment Opportunities</h3>
        <button className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          <Eye className="w-4 h-4 mr-2" />
          View All
        </button>
      </div>

      <div className="space-y-4">
        {investmentOpportunities.map((opportunity) => (
          <div key={opportunity.id} className="p-4 transition-shadow border rounded-lg hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2 space-x-3">
                  <h4 className="font-medium text-gray-900">{opportunity.name}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    opportunity.status === 'Open' ? 'bg-green-100 text-green-800' :
                    opportunity.status === 'Coming Soon' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {opportunity.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    opportunity.risk === 'Low' ? 'bg-green-100 text-green-800' :
                    opportunity.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {opportunity.risk} Risk
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 md:grid-cols-4">
                  <div>
                    <span className="font-medium">Type:</span> {opportunity.type}
                  </div>
                  <div>
                    <span className="font-medium">Expected Return:</span> {opportunity.expectedReturn}
                  </div>
                  <div>
                    <span className="font-medium">Min Investment:</span> {opportunity.minInvestment}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {opportunity.location}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <span className="font-medium">Closing Date:</span> {opportunity.closingDate}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPortfolioPerformance = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">Portfolio Performance</h3>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-50">
            <h4 className="mb-2 font-medium text-gray-900">Portfolio Summary</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Total Investments:</span> {portfolioPerformance.investments}</p>
              <p><span className="font-medium">Active Opportunities:</span> {portfolioPerformance.activeOpportunities}</p>
              <p><span className="font-medium">Total Carbon Offset:</span> {portfolioPerformance.carbonOffset?.toLocaleString()} tons</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-50">
            <h4 className="mb-2 font-medium text-gray-900">Performance Metrics</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Total Return:</span> ${portfolioPerformance.totalReturn?.toLocaleString()}</p>
              <p><span className="font-medium">Return Percentage:</span> {portfolioPerformance.returnPercentage}%</p>
              <p><span className="font-medium">Portfolio Value:</span> ${portfolioPerformance.totalValue?.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-50">
            <h4 className="mb-2 font-medium text-gray-900">Asset Allocation</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Renewable Energy:</span> 45%</p>
              <p><span className="font-medium">Carbon Credits:</span> 30%</p>
              <p><span className="font-medium">Sustainable Tech:</span> 25%</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-50">
            <h4 className="mb-2 font-medium text-gray-900">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">
                Generate Report
              </button>
              <button className="w-full px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">
                Rebalance Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMarketInsights = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">Market Insights</h3>
      
      <div className="space-y-4">
        {marketInsights.map((insight) => (
          <div key={insight.id} className="p-4 transition-shadow border rounded-lg hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center mb-2 space-x-3">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    insight.impact === 'Positive' ? 'bg-green-100 text-green-800' :
                    insight.impact === 'Negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {insight.impact}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                    {insight.category}
                  </span>
                </div>
                <p className="mb-2 text-sm text-gray-600">{insight.summary}</p>
                <p className="text-xs text-gray-500">Date: {insight.date}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">Investment Alerts</h3>
      
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={`p-4 transition-shadow border rounded-lg hover:shadow-md ${
            !alert.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2 space-x-3">
                  <h4 className="font-medium text-gray-900">{alert.type}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {alert.priority} Priority
                  </span>
                  {!alert.read && (
                    <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="mb-2 text-sm text-gray-600">{alert.message}</p>
                <p className="text-xs text-gray-500">Date: {alert.date}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <Download className="w-4 h-4" />
                </button>
                {!alert.read && (
                  <button 
                    onClick={() => markAlertAsRead(alert.id)}
                    className="px-2 py-1 text-sm text-purple-600 border border-purple-300 rounded hover:text-purple-800 hover:bg-purple-50"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'opportunities':
        return renderInvestmentOpportunities();
      case 'portfolio':
        return renderPortfolioPerformance();
      case 'insights':
        return renderMarketInsights();
      case 'alerts':
        return renderAlerts();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading investor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Investor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <span className="text-sm text-gray-500">Role: Investor</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'opportunities', label: 'Investment Opportunities', icon: Target },
              { id: 'portfolio', label: 'Portfolio', icon: PieChart },
              { id: 'insights', label: 'Market Insights', icon: LineChart },
              { 
                id: 'alerts', 
                label: 'Alerts', 
                icon: LineChart,
                badge: alerts.filter(alert => !alert.read).length
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="inline w-4 h-4 mr-2" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 ml-2 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Notifications */}
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <NotificationCenter />
      </div>

      {/* Main Content */}
      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default InvestorDashboard;
