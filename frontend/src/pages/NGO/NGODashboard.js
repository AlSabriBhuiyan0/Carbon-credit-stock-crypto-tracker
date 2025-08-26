import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  TreePine, 
  Users, 
  BarChart3, 
  FileText,
  Eye,
  Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMockDataForUser } from '../../services/mockDataService';
import NotificationCenter from '../../components/Notifications/NotificationCenter';

const NGODashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [impactProjects, setImpactProjects] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState([]);
  const [socialMetrics, setSocialMetrics] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  const loadNGOData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get mock data for the user
      const mockData = getMockDataForUser(user?.id || 'demo_ngo_001', 'ngo');
      
      if (mockData && mockData.ngo) {
        // Calculate achieved values based on progress
        const projectsWithAchieved = mockData.ngo.impactProjects.map(project => ({
          ...project,
          achieved: Math.round((project.progress / 100) * project.target)
        }));
        
        setImpactProjects(projectsWithAchieved || []);
        setEnvironmentalData(mockData.ngo.environmentalData || []);
        setSocialMetrics(mockData.ngo.socialMetrics || {});
      } else {
        // Fallback to default data if mock data is not available
        setImpactProjects([
          {
            id: 1,
            name: 'Urban Tree Planting Initiative',
            location: 'New York City',
            status: 'active',
            progress: 75,
            target: 1000,
            achieved: 750,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            description: 'Planting 1000 trees in urban areas to improve air quality'
          },
          {
            id: 2,
            name: 'Community Solar Program',
            location: 'Los Angeles',
            status: 'planning',
            progress: 25,
            target: 500,
            achieved: 125,
            startDate: '2024-03-01',
            endDate: '2025-02-28',
            description: 'Installing solar panels in low-income communities'
          }
        ]);

        setEnvironmentalData([
          {
            id: 1,
            metric: 'CO2 Reduction',
            value: '2,450',
            unit: 'tons',
            change: '+15%',
            trend: 'up'
          },
          {
            id: 2,
            metric: 'Trees Planted',
            value: '15,230',
            unit: 'trees',
            change: '+8%',
            trend: 'up'
          },
          {
            id: 3,
            metric: 'Energy Saved',
            value: '45,600',
            unit: 'kWh',
            change: '+12%',
            trend: 'up'
          }
        ]);

        setSocialMetrics({
          communitiesReached: 25,
          volunteersEngaged: 450,
          partnerships: 12,
          fundingSecured: 250000
        });
      }

    } catch (error) {
      console.error('Error loading NGO data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNGOData();
  }, [loadNGOData]);

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <TreePine className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Projects</p>
            <p className="text-2xl font-semibold text-gray-900">{socialMetrics.activeProjects || 0}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Beneficiaries</p>
            <p className="text-2xl font-semibold text-gray-900">{(socialMetrics.totalBeneficiaries || 0).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center">
          <div className="p-3 bg-purple-100 rounded-full">
            <Globe className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Carbon Offset</p>
            <p className="text-2xl font-semibold text-gray-900">23.5K tons</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center">
          <div className="p-3 bg-orange-100 rounded-full">
            <Target className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Investment</p>
            <p className="text-2xl font-semibold text-gray-900">${(socialMetrics.totalInvestment || 0).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderImpactProjects = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Impact Projects</h3>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
          <TreePine className="h-4 w-4 mr-2" />
          New Project
        </button>
      </div>

      <div className="space-y-4">
        {impactProjects.map((project) => (
          <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    project.type === 'Environmental' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {project.type}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Location:</span> {project.location}
                  </div>
                  <div>
                    <span className="font-medium">Carbon Offset:</span> {project.carbonOffset}
                  </div>
                  <div>
                    <span className="font-medium">Beneficiaries:</span> {project.beneficiaries.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Budget:</span> {project.budget}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEnvironmentalMetrics = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Environmental Impact Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {environmentalData.map((metric) => (
          <div key={metric.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">{metric.metric}</h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                metric.trend === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {metric.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
            <p className="text-sm text-gray-600">{metric.period}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSocialImpact = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Social Impact Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Community Engagement</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Community Partners:</span> {socialMetrics.communityPartners}</p>
              <p><span className="font-medium">Volunteer Hours:</span> {socialMetrics.volunteerHours?.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Project Status</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Active Projects:</span> {socialMetrics.activeProjects}</p>
              <p><span className="font-medium">Completed Projects:</span> {socialMetrics.completedProjects}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Financial Overview</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Total Investment:</span> ${socialMetrics.totalInvestment?.toLocaleString()}</p>
              <p><span className="font-medium">Average per Project:</span> ${(socialMetrics.totalInvestment / (socialMetrics.activeProjects + socialMetrics.completedProjects))?.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Generate Impact Report
              </button>
              <button className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                Schedule Site Visit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'projects':
        return renderImpactProjects();
      case 'environmental':
        return renderEnvironmentalMetrics();
      case 'social':
        return renderSocialImpact();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading NGO dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">NGO Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <span className="text-sm text-gray-500">Role: NGO</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'projects', label: 'Impact Projects', icon: TreePine },
              { id: 'environmental', label: 'Environmental', icon: Globe },
              { id: 'social', label: 'Social Impact', icon: Users }
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
                <tab.icon className="h-4 w-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Notifications */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationCenter />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default NGODashboard;
