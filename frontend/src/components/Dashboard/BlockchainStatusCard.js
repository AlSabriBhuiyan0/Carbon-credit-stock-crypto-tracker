import React from 'react';
import { motion } from 'framer-motion';
import { 
  Link, 
  Shield, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Network, 
  Wallet 
} from 'lucide-react';
import { formatCurrency, formatNumberWithUnit } from '../../utils/formatters';

const BlockchainStatusCard = ({ data }) => {
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
    health = {},
    marketData = [],
    recentTransactions = [],
    networkStats = {},
    verificationHistory = [],
    mode = 'mock'
  } = data;

  const {
    status = 'healthy',
    network = 'testnet',
    latestBlock = 0
  } = health;

  const {
    totalBlocks = 0,
    averageBlockTime = 0,
    networkUtilization = 0,
    activeAddresses = 0
  } = networkStats;

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5" />;
      case 'down':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getNetworkColor = (network) => {
    switch (network.toLowerCase()) {
      case 'mainnet':
        return 'text-blue-600 bg-blue-100';
      case 'testnet':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Link className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Blockchain Status</h3>
              <p className="text-indigo-100 text-sm">
                Carbon credit verification & network health
              </p>
              <div className="text-xs text-indigo-200 mt-1">
                Mode: {mode === 'real' ? 'Real Blockchain' : 'Mock Mode'} • Network: {network}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(status)}
                <span className="capitalize">{status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Network Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {latestBlock.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Latest Block</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalBlocks.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Blocks</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {activeAddresses}
            </div>
            <div className="text-sm text-gray-600">Active Addresses</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {averageBlockTime.toFixed(1)}s
            </div>
            <div className="text-sm text-gray-600">Avg Block Time</div>
          </div>
        </div>

        {/* Network Status */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Network className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Network Performance</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Network:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getNetworkColor(network)}`}>
                  {network.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hashrate:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {formatNumberWithUnit(networkUtilization, ' H/s')}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Block Time:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {averageBlockTime.toFixed(1)} seconds
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                  {status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Uptime:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {status === 'healthy' ? '99.9%' : '95.2%'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Latency:</span>
                <span className="text-sm font-semibold text-blue-600">
                  {status === 'healthy' ? '<50ms' : '150ms'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carbon Credit Assets */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Carbon Credit Assets</h4>
          </div>
          
          <div className="space-y-3">
            {marketData.slice(0, 5).map((asset, index) => (
              <motion.div
                key={asset.asset_id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {asset.name || `Asset ${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {asset.standard || 'Standard'} • {asset.location || 'Location'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatNumberWithUnit(asset.total_supply || Math.random() * 1000000, 'K')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(asset.current_price || Math.random() * 20 + 5)} per credit
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-purple-800">Verification Status</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {verificationHistory.filter(v => v.status === 'verified').length}
              </div>
              <div className="text-xs text-gray-600">Verified</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {verificationHistory.filter(v => v.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {verificationHistory.filter(v => v.status === 'failed').length}
              </div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Recent Transactions</h4>
          </div>
          
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((tx, index) => (
              <motion.div
                key={tx.tx_hash || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-white rounded text-sm"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 font-mono">
                    {tx.tx_hash ? `${tx.tx_hash.slice(0, 8)}...${tx.tx_hash.slice(-6)}` : `Tx ${index + 1}`}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-gray-900 font-medium">
                    {formatNumberWithUnit(tx.amount || Math.random() * 10000, 'K')} credits
                  </div>
                  <div className="text-xs text-gray-500">
                    {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : '2 min ago'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Verification History */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Recent Verifications</h4>
          </div>
          
          <div className="space-y-2">
            {verificationHistory.slice(0, 5).map((verification, index) => (
              <motion.div
                key={verification.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 bg-white rounded text-sm"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    verification.status === 'verified' ? 'bg-green-500' :
                    verification.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-700">
                    {verification.projectId}
                  </span>
                  <span className="text-xs text-gray-500">
                    {verification.standard}
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-gray-900 font-medium">
                    {formatNumberWithUnit(verification.amount, 'K')} credits
                  </div>
                  <div className="text-xs text-gray-500">
                    {verification.verifier} • {(verification.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Carbon Balances */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Wallet className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Carbon Credit Balances</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketData.slice(0, 4).map((balance, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {balance.standard || `Standard ${index + 1}`}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumberWithUnit(balance.balance || Math.random() * 100000, 'K')}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatNumberWithUnit(balance.value || Math.random() * 10000, 'K')} total value
                </div>
              </div>
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

export default BlockchainStatusCard;
