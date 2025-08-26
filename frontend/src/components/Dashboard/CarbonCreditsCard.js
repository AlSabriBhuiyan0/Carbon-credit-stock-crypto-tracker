import React from 'react';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  Globe, 
  Activity,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatCarbonCredits } from '../../utils/formatters';
import { CarbonCreditChart, PortfolioChart } from '../Charts';
import { generateCarbonCreditData } from '../../utils/timeSeriesData';

const CarbonCreditsCard = ({ data, timeRange = '1W' }) => {
  // Utility function to validate and sanitize carbon credit data
  const sanitizeCarbonData = (rawData) => {
    if (!rawData) return rawData;
    
    // Deep clone the data to avoid mutating the original
    const sanitized = JSON.parse(JSON.stringify(rawData));
    
    // Sanitize market overview
    if (sanitized.marketOverview) {
      const mo = sanitized.marketOverview;
      mo.totalCreditsIssued = Math.min(mo.totalCreditsIssued || 0, 100000000);
      mo.totalCreditsRetired = Math.min(mo.totalCreditsRetired || 0, 100000000);
      mo.availableCredits = Math.min(mo.availableCredits || 0, 100000000);
      mo.averagePrice = Math.min(mo.averagePrice || 0, 1000);
    }
    
    // Sanitize project data
    if (sanitized.topProjects) {
      sanitized.topProjects.forEach(project => {
        if (project.current_credits_issued) {
          project.current_credits_issued = Math.min(project.current_credits_issued, 1000000);
        }
        if (project.current_price) {
          project.current_price = Math.min(project.current_price, 1000);
        }
      });
    }
    
    // Sanitize grouped data
    if (sanitized.byType) {
      sanitized.byType.forEach(type => {
        if (type.totalCredits) {
          type.totalCredits = Math.min(type.totalCredits, 10000000);
        }
      });
    }
    
    if (sanitized.byStandard) {
      sanitized.byStandard.forEach(standard => {
        if (standard.totalCredits) {
          standard.totalCredits = Math.min(standard.totalCredits, 10000000);
        }
      });
    }
    
    return sanitized;
  };

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Sanitize the data before processing
  const sanitizedData = sanitizeCarbonData(data);

  const {
    totalProjects = 0,
    marketOverview = {},
    topProjects = [],
    byType = [],
    byStandard = []
  } = sanitizedData;

  const {
    totalCreditsIssued = 0,
    averagePrice = 0,
    availableCredits = 0,
    activeProjects = 0
  } = marketOverview;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Carbon Credits Overview</h3>
              <p className="text-green-100 text-sm">
                {totalProjects} projects • {activeProjects} active
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatCarbonCredits(availableCredits)}
            </div>
            <div className="text-green-100 text-sm">Available Credits</div>
          </div>
        </div>
      </div>

      {/* Market Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCarbonCredits(totalCreditsIssued)}
            </div>
            <div className="text-sm text-gray-600">Total Issued</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCarbonCredits(availableCredits)}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(averagePrice)}
            </div>
            <div className="text-sm text-gray-600">Avg Price</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {totalProjects}
            </div>
            <div className="text-sm text-gray-600">Projects</div>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* By Type */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">By Project Type</h4>
            </div>
            <div className="space-y-2">
              {byType.slice(0, 5).map((type, index) => (
                <motion.div
                  key={type.type || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">
                    {type.type || `Type ${index + 1}`}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">
                      {type.count || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCarbonCredits(type.totalCredits || 0)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* By Standard */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-800">By Standard</h4>
            </div>
            <div className="space-y-2">
              {byStandard.slice(0, 5).map((standard, index) => (
                <motion.div
                  key={standard.standard || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">
                    {standard.standard || `Standard ${index + 1}`}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-purple-600">
                      {standard.count || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCarbonCredits(standard.totalCredits || 0)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Projects */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Top Projects</h4>
          </div>
          <div className="space-y-3">
            {topProjects.slice(0, 5).map((project, index) => (
              <motion.div
                key={project.project_id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {project.name || `Project ${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {project.location || 'Location'} • {project.standard || 'Standard'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(project.current_price || Math.random() * 20 + 5)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCarbonCredits(project.current_credits_issued || Math.random() * 100000)} credits
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Carbon Credit Charts */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Trends Chart */}
            <div className="h-64">
              <CarbonCreditChart 
                data={generateCarbonCreditData(
                  timeRange,
                  topProjects[0]?.current_price || 15,
                  topProjects[0]?.current_credits_issued || 50000
                )}
                title={`Credit Price Trends (${timeRange})`}
                height={250}
                chartType="line"
              />
            </div>
            
            {/* Project Distribution Chart */}
            <div className="h-64">
              <PortfolioChart 
                data={byType.map(type => ({
                  label: type.type || `Type ${type.type}`,
                  value: type.count || 0
                }))}
                title="Project Distribution"
                height={250}
                chartType="doughnut"
              />
            </div>
          </div>
        </div>

        {/* Market Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Market Active</span>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonCreditsCard;
