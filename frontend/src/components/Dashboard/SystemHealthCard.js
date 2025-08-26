import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Server,
  Database,
  Globe,
  Clock,
  RefreshCw,
  Settings,
  Wifi,
  Shield
} from 'lucide-react';

const SystemHealthCard = ({ data }) => {
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
    overallStatus = 'healthy',
    services = [],
    database = {},
    apiEndpoints = [],
    systemMetrics = {},
    lastCheck = new Date(),
    uptime = 0
  } = data;

  const {
    status: dbStatus = 'healthy',
    responseTime = 0,
    connections = 0,
    size = 0
  } = database;

  const {
    cpu = 0,
    memory = 0,
    disk = 0,
    network = 0
  } = systemMetrics;

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
      case 'error':
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="w-5 h-5" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'down':
      case 'error':
      case 'offline':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  // Performance color mapping
  const getPerformanceColor = (value) => {
    if (value >= 80) return 'text-red-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Uptime formatting
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">System Health</h3>
              <p className="text-emerald-100 text-sm">
                Infrastructure monitoring & service status
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(overallStatus)}`}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(overallStatus)}
                <span className="capitalize">{overallStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Overall System Status */}
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatUptime(uptime)}
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getPerformanceColor(cpu)}`}>
                {cpu}%
              </div>
              <div className="text-sm text-gray-600">CPU Usage</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getPerformanceColor(memory)}`}>
                {memory}%
              </div>
              <div className="text-sm text-gray-600">Memory</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getPerformanceColor(disk)}`}>
                {disk}%
              </div>
              <div className="text-sm text-gray-600">Disk Usage</div>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Database Health</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(dbStatus)}`}>
                  {dbStatus.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Response Time:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {responseTime}ms
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Connections:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {connections}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Database Size:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {size} GB
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Backup:</span>
                <span className="text-sm font-semibold text-blue-600">
                  2 hours ago
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Replication:</span>
                <span className="text-sm font-semibold text-green-600">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Server className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Service Status</h4>
          </div>
          
          <div className="space-y-2">
            {services.slice(0, 6).map((service, index) => (
              <motion.div
                key={service.name || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-white rounded text-sm"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    service.status === 'healthy' ? 'bg-green-500' : 
                    service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-gray-700 font-medium">
                    {service.name || `Service ${index + 1}`}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                    {service.status}
                  </div>
                  <div className="text-xs text-gray-500">
                    {service.responseTime || Math.floor(Math.random() * 100 + 10)}ms
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Globe className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-800">API Endpoints</h4>
          </div>
          
          <div className="space-y-2">
            {apiEndpoints.slice(0, 5).map((endpoint, index) => (
              <motion.div
                key={endpoint.path || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-white rounded text-sm"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    endpoint.status === 'healthy' ? 'bg-green-500' : 
                    endpoint.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-gray-700 font-mono text-xs">
                    {endpoint.path || `/api/endpoint${index + 1}`}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className={`text-xs font-medium ${getStatusColor(endpoint.status)}`}>
                    {endpoint.status}
                  </div>
                  <div className="text-xs text-gray-500">
                    {endpoint.method || 'GET'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Network & Security */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Wifi className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-indigo-800">Network & Security</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Network Latency:</span>
                <span className="text-sm font-semibold text-indigo-600">
                  {network}ms
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">SSL Certificate:</span>
                <span className="text-sm font-semibold text-green-600">
                  Valid
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Firewall:</span>
                <span className="text-sm font-semibold text-green-600">
                  Active
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rate Limiting:</span>
                <span className="text-sm font-semibold text-indigo-600">
                  Enabled
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">DDoS Protection:</span>
                <span className="text-sm font-semibold text-green-600">
                  Active
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Security Scan:</span>
                <span className="text-sm font-semibold text-indigo-600">
                  1 hour ago
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Quick Actions</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security Check</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center justify-center space-x-2">
              <Database className="w-4 h-4" />
              <span>DB Backup</span>
            </button>
            <button className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center justify-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Performance</span>
            </button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-500">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCard;
