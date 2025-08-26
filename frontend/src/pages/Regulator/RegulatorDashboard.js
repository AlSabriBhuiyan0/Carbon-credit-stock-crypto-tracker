import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  BarChart3, 
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Building
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMockDataForUser } from '../../services/mockDataService';
import NotificationCenter from '../../components/Notifications/NotificationCenter';

const RegulatorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complianceEvents, setComplianceEvents] = useState([]);
  const [regulatoryReports, setRegulatoryReports] = useState([]);
  const [monitoredEntities, setMonitoredEntities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const loadRegulatorData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get mock data for the user
      const mockData = getMockDataForUser(user?.id || 'demo_regulator_001', 'regulator');
      
      if (mockData && mockData.regulatory) {
        setComplianceEvents(mockData.regulatory.complianceEvents || []);
        setRegulatoryReports(mockData.regulatory.regulatoryReports || []);
        setMonitoredEntities(mockData.regulatory.monitoredEntities || []);
      } else {
        // Fallback to default data if mock data is not available
        setComplianceEvents([
          {
            id: 1,
            entity: 'TechCorp Inc.',
            event: 'Carbon Credit Verification Required',
            severity: 'high',
            date: '2024-01-20',
            status: 'pending',
            deadline: '2024-02-20'
          },
          {
            id: 2,
            entity: 'GreenEnergy Ltd.',
            event: 'ESG Report Overdue',
            severity: 'medium',
            date: '2024-01-18',
            status: 'investigating',
            deadline: '2024-01-25'
          },
          {
            id: 3,
            entity: 'EcoSolutions Corp.',
            event: 'Compliance Audit Passed',
            severity: 'low',
            date: '2024-01-15',
            status: 'resolved',
            deadline: 'N/A'
          }
        ]);

        setRegulatoryReports([
          {
            id: 1,
            title: 'Q4 2024 Compliance Summary',
            type: 'Quarterly',
            status: 'published',
            date: '2024-01-10',
            entitiesCovered: 45
          },
          {
            id: 2,
            title: 'Carbon Market Regulation Analysis',
            type: 'Special',
            status: 'draft',
            date: '2024-01-20',
            entitiesCovered: 0
          }
        ]);

        setMonitoredEntities([
          {
            id: 1,
            name: 'TechCorp Inc.',
            type: 'Technology',
            complianceScore: 78,
            lastAudit: '2024-01-15',
            status: 'monitored'
          },
          {
            id: 2,
            name: 'GreenEnergy Ltd.',
            type: 'Energy',
            complianceScore: 65,
            lastAudit: '2024-01-10',
            status: 'warning'
          },
          {
            id: 3,
            name: 'EcoSolutions Corp.',
            type: 'Environmental',
            complianceScore: 92,
            lastAudit: '2024-01-20',
            status: 'compliant'
          }
        ]);
      }

    } catch (error) {
      console.error('Error loading regulator data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRegulatorData();
  }, [loadRegulatorData]);

  const renderOverview = () => (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white rounded-lg shadow-md"
      >
        <div className="flex items-center">
          <div className="p-3 bg-red-100 rounded-full">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Events</p>
            <p className="text-2xl font-semibold text-gray-900">
              {complianceEvents.filter(e => e.status !== 'resolved').length}
            </p>
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
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Monitored Entities</p>
            <p className="text-2xl font-semibold text-gray-900">{monitoredEntities.length}</p>
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
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Compliant Entities</p>
            <p className="text-2xl font-semibold text-gray-900">
              {monitoredEntities.filter(e => e.status === 'compliant').length}
            </p>
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
          <div className="p-3 bg-purple-100 rounded-full">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Published Reports</p>
            <p className="text-2xl font-semibold text-gray-900">
              {regulatoryReports.filter(r => r.status === 'published').length}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-white rounded-lg shadow-md"
      >
        <div className="flex items-center">
          <div className="p-3 bg-orange-100 rounded-full">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Compliance Trend</p>
            <p className="text-2xl font-semibold text-gray-900">
              {monitoredEntities.length > 0 
                ? Math.round(monitoredEntities.reduce((acc, entity) => acc + entity.complianceScore, 0) / monitoredEntities.length)
                : 0}%
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-white rounded-lg shadow-md col-span-full lg:col-span-1"
      >
        <div className="flex items-center">
          <div className="p-3 bg-indigo-100 rounded-full">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-2xl font-semibold text-gray-900">
              {monitoredEntities.length + complianceEvents.length}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 bg-white rounded-lg shadow-md col-span-full lg:col-span-1"
      >
        <div className="flex items-center">
          <div className="p-3 bg-red-100 rounded-full">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Failed Compliance</p>
            <p className="text-2xl font-semibold text-gray-900">
              {monitoredEntities.filter(e => e.status === 'warning').length}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderComplianceEvents = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">Compliance Events</h3>
      
      <div className="space-y-4">
        {complianceEvents.map((event) => (
          <div key={event.id} className="p-4 transition-shadow border rounded-lg hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2 space-x-3">
                  <h4 className="font-medium text-gray-900">{event.entity}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    event.severity === 'high' ? 'bg-red-100 text-red-800' :
                    event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {event.severity}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    event.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                    event.status === 'investigating' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
                <p className="mb-2 text-sm text-gray-600">{event.event}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Date: {event.date}</span>
                  {event.deadline !== 'N/A' && (
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Deadline: {event.deadline}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonitoredEntities = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">Monitored Entities</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Entity</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Compliance Score</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Last Audit</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {monitoredEntities.map((entity) => (
              <tr key={entity.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{entity.type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 h-2 mr-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          entity.complianceScore >= 80 ? 'bg-green-600' :
                          entity.complianceScore >= 60 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${entity.complianceScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{entity.complianceScore}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{entity.lastAudit}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    entity.status === 'compliant' ? 'bg-green-100 text-green-800' :
                    entity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {entity.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                  <button className="mr-3 text-blue-600 hover:text-blue-900">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRegulatoryReports = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Regulatory Reports</h3>
        <button className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </button>
      </div>

      <div className="space-y-4">
        {regulatoryReports.map((report) => (
          <div key={report.id} className="p-4 transition-shadow border rounded-lg hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{report.title}</h4>
                <p className="text-sm text-gray-600">{report.type} • {report.date}</p>
                <p className="text-sm text-gray-600">Entities Covered: {report.entitiesCovered}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  report.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.status}
                </span>
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'events':
        return renderComplianceEvents();
      case 'entities':
        return renderMonitoredEntities();
      case 'reports':
        return renderRegulatoryReports();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading regulator dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Regulator Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <span className="text-sm text-gray-500">Role: Regulator</span>
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
              { id: 'events', label: 'Compliance Events', icon: AlertTriangle },
              { id: 'entities', label: 'Monitored Entities', icon: Building },
              { id: 'reports', label: 'Reports', icon: FileText }
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

export default RegulatorDashboard;
