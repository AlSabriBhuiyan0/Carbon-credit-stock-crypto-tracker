import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Download,
  Upload,
  Settings,
  BarChart3,
  FileText,
  Bell,
  Star,
  RefreshCw,
  ExternalLink,
  Filter,
  Calendar,
  Target,
  Wallet,
  Shield,
  Globe,
  Database,
  Activity,
  Clock
} from 'lucide-react';

const QuickActionsCard = ({ data }) => {
  if (!data) {
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

  const {
    recentActions = [],
    quickAccess = []
  } = data;

  // Action category color mapping
  const getActionColor = (category) => {
    switch (category.toLowerCase()) {
      case 'trading':
        return 'text-blue-600 bg-blue-100 hover:bg-blue-200';
      case 'analysis':
        return 'text-purple-600 bg-purple-100 hover:bg-purple-200';
      case 'portfolio':
        return 'text-green-600 bg-green-100 hover:bg-green-200';
      case 'carbon':
        return 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200';
      case 'system':
        return 'text-gray-600 bg-gray-100 hover:bg-gray-200';
      case 'reports':
        return 'text-orange-600 bg-orange-100 hover:bg-orange-200';
      default:
        return 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200';
    }
  };

  // Action icon mapping
  const getActionIcon = (action) => {
    switch (action.toLowerCase()) {
      case 'buy':
      case 'purchase':
        return <Plus className="w-5 h-5" />;
      case 'sell':
        return <TrendingUp className="w-5 h-5" />;
      case 'search':
      case 'find':
        return <Search className="w-5 h-5" />;
      case 'download':
      case 'export':
        return <Download className="w-5 h-5" />;
      case 'upload':
      case 'import':
        return <Upload className="w-5 h-5" />;
      case 'settings':
      case 'configure':
        return <Settings className="w-5 h-5" />;
      case 'chart':
      case 'analyze':
        return <BarChart3 className="w-5 h-5" />;
      case 'report':
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'alert':
      case 'notify':
        return <Bell className="w-5 h-5" />;
      case 'favorite':
      case 'bookmark':
        return <Star className="w-5 h-5" />;
      case 'refresh':
      case 'update':
        return <RefreshCw className="w-5 h-5" />;
      case 'external':
      case 'link':
        return <ExternalLink className="w-5 h-5" />;
      case 'filter':
      case 'sort':
        return <Filter className="w-5 h-5" />;
      case 'schedule':
      case 'calendar':
        return <Calendar className="w-5 h-5" />;
      case 'target':
      case 'goal':
        return <Target className="w-5 h-5" />;
      case 'wallet':
      case 'portfolio':
        return <Wallet className="w-5 h-5" />;
      case 'security':
      case 'shield':
        return <Shield className="w-5 h-5" />;
      case 'network':
      case 'globe':
        return <Globe className="w-5 h-5" />;
      case 'database':
      case 'storage':
        return <Database className="w-5 h-5" />;
      case 'monitor':
      case 'activity':
        return <Activity className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <p className="text-pink-100 text-sm">
                Fast access to common tasks & features
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <button className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all">
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Primary Actions */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Primary Actions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickAccess.slice(0, 8).map((action, index) => (
              <motion.button
                key={action.id || index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 border-transparent hover:border-current transition-all duration-200 ${getActionColor(action.category)}`}
              >
                <div className="flex flex-col items-center space-y-2">
                  {getActionIcon(action.name)}
                  <span className="text-xs font-medium text-center">
                    {action.name || `Action ${index + 1}`}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Trading Actions */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Trading & Portfolio</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Buy Stock</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Sell Stock</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700 flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>Portfolio</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analysis</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700 flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Set Alerts</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </button>
          </div>
        </div>

        {/* Carbon Credit Actions */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Carbon Credits</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button className="p-3 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors text-sm font-medium text-green-700 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Buy Credits</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors text-sm font-medium text-green-700 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Sell Credits</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors text-sm font-medium text-green-700 flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Verify Project</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors text-sm font-medium text-green-700 flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Market Data</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors text-sm font-medium text-green-700 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Impact Report</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors text-sm font-medium text-green-700 flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Blockchain</span>
            </button>
          </div>
        </div>

        {/* Data & Reports */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-800">Data & Reports</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-sm font-medium text-purple-700 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-sm font-medium text-purple-700 flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-sm font-medium text-purple-700 flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors text-sm font-medium text-purple-700 flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* System & Settings */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">System & Settings</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Health</span>
            </button>
          </div>
        </div>

        {/* Recent Actions */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-orange-800">Recent Actions</h4>
          </div>
          
          <div className="space-y-2">
            {recentActions.slice(0, 4).map((action, index) => (
              <motion.div
                key={action.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-white rounded text-sm"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    action.category === 'trading' ? 'bg-blue-500' : 
                    action.category === 'carbon' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-gray-700">
                    {action.name || `Action ${index + 1}`}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {action.timestamp ? new Date(action.timestamp).toLocaleTimeString() : '2 min ago'}
                  </div>
                </div>
              </motion.div>
            ))}
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

export default QuickActionsCard;
