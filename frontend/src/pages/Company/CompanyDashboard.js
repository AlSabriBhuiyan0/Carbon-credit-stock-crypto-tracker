import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  MessageSquare,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMockDataForUser } from '../../services/mockDataService';
import NotificationCenter from '../../components/Notifications/NotificationCenter';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState({});
  const [reports, setReports] = useState([]);
  const [investorMessages, setInvestorMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const loadCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get mock data for the user
      const mockData = getMockDataForUser(user?.id || 'demo_company_001', 'company');
      
      if (mockData && mockData.esg) {
        // Calculate total carbon footprint
        const totalFootprint = mockData.esg.carbonFootprint.scope1 + 
                             mockData.esg.carbonFootprint.scope2 + 
                             mockData.esg.carbonFootprint.scope3;
        
        setComplianceData({
          status: mockData.esg.compliance.status.toLowerCase(),
          lastAudit: mockData.esg.compliance.lastAudit.split('T')[0],
          nextAudit: mockData.esg.compliance.nextAudit.split('T')[0],
          complianceScore: mockData.esg.esgScore,
          pendingActions: mockData.esg.compliance.pendingActions,
          completedActions: mockData.esg.compliance.completedActions,
          carbonFootprint: totalFootprint
        });

        setReports(mockData.esg.reports || []);
        setInvestorMessages(mockData.investorMessages || []);
      } else {
        // Fallback to default data if mock data is not available
        setComplianceData({
          status: 'compliant',
          lastAudit: '2024-01-15',
          nextAudit: '2024-07-15',
          complianceScore: 95,
          pendingActions: 2,
          completedActions: 15,
          carbonFootprint: 75000
        });

        setReports([
          {
            id: 1,
            title: 'Q4 2024 ESG Report',
            type: 'ESG',
            status: 'published',
            date: '2024-01-10',
            downloads: 45
          },
          {
            id: 2,
            title: 'Carbon Footprint Analysis',
            type: 'Environmental',
            status: 'draft',
            date: '2024-01-20',
            downloads: 0
          }
        ]);

        setInvestorMessages([
          {
            id: 1,
            from: 'Green Investment Fund',
            subject: 'ESG Performance Review',
            message: 'We would like to discuss your recent ESG initiatives...',
            date: '2024-01-18',
            read: false
          },
          {
            id: 2,
            from: 'Sustainable Capital Partners',
            subject: 'Carbon Credit Partnership',
            message: 'Interested in exploring carbon credit opportunities...',
            date: '2024-01-15',
            read: true
          }
        ]);
      }

    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Compliance Score</p>
            <p className="text-2xl font-semibold text-gray-900">{complianceData.complianceScore || 0}%</p>
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
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Published Reports</p>
            <p className="text-2xl font-semibold text-gray-900">{reports.filter(r => r.status === 'published').length}</p>
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
          <div className="p-3 bg-orange-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pending Actions</p>
            <p className="text-2xl font-semibold text-gray-900">{complianceData.pendingActions || 0}</p>
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
          <div className="p-3 bg-purple-100 rounded-full">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Investor Messages</p>
            <p className="text-2xl font-semibold text-gray-900">{investorMessages.length}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderCompliance = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Compliance Management</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Compliance Status</h4>
            <div className="flex items-center">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                complianceData.status === 'compliant' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {complianceData.status || 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Audit Schedule</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Last Audit:</span> {complianceData.lastAudit || 'N/A'}</p>
              <p><span className="font-medium">Next Audit:</span> {complianceData.nextAudit || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Action Items</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Completed:</span> {complianceData.completedActions || 0}</p>
              <p><span className="font-medium">Pending:</span> {complianceData.pendingActions || 0}</p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Schedule Audit
              </button>
              <button className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                Update Compliance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Reports & Analytics</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Create Report
        </button>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{report.title}</h4>
                <p className="text-sm text-gray-600">{report.type} • {report.date}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  report.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.status}
                </span>
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="text-green-600 hover:text-green-800">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInvestorCommunications = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Investor Communications</h3>
      
      <div className="space-y-4">
        {investorMessages.map((message) => (
          <div key={message.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{message.subject}</h4>
                <p className="text-sm text-gray-600">From: {message.from}</p>
                <p className="text-sm text-gray-600">Date: {message.date}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  message.read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {message.read ? 'Read' : 'Unread'}
                </span>
                <button className="text-blue-600 hover:text-blue-800">
                  <MessageSquare className="h-4 w-4" />
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
      case 'compliance':
        return renderCompliance();
      case 'reports':
        return renderReports();
      case 'communications':
        return renderInvestorCommunications();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <span className="text-sm text-gray-500">Role: Company</span>
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
              { id: 'compliance', label: 'Compliance', icon: CheckCircle },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'communications', label: 'Communications', icon: MessageSquare }
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

export default CompanyDashboard;
