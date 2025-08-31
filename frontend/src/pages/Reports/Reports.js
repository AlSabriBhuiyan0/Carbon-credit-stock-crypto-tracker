import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMockDataForUser } from '../../services/mockDataService';
import { TrendingUp, FileText, BarChart3, Globe, Search, Download, Target, Shield, Leaf, Eye, Download as DownloadIcon } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  const [reportsData, setReportsData] = useState(null);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    type: '',
    description: '',
    parameters: {}
  });
  const [loading, setLoading] = useState(true);

  const reportTypes = ['all', 'portfolio-analysis', 'esg-report', 'compliance-report', 'performance-report', 'risk-assessment', 'market-analysis'];
  const reportStatuses = ['all', 'draft', 'generating', 'completed', 'archived'];

  const generateFallbackReportsData = useCallback(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      title: `Report ${i + 1}`,
      type: ['portfolio-analysis', 'esg-report', 'compliance-report', 'performance-report'][i % 4],
      status: ['published', 'draft', 'under-review'][i % 3],
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      downloads: Math.floor(Math.random() * 100),
      description: `This is a sample report for demonstration purposes.`
    }));
  }, []);

  const loadReportsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get mock data for the current user (with safety check)
      let mockData = null;
      if (user && user.id) {
        mockData = getMockDataForUser(user.id, user.role);
      }
      
      if (mockData && mockData.reports) {
        setReportsData(mockData.reports);
        setFilteredReports(mockData.reports);
      } else {
        // Fallback mock data
        const fallbackReports = generateFallbackReportsData();
        setReportsData(fallbackReports);
        setFilteredReports(fallbackReports);
      }
    } catch (error) {
      console.error('Error loading reports data:', error);
      // Use fallback data
      const fallbackReports = generateFallbackReportsData();
      setReportsData(fallbackReports);
      setFilteredReports(fallbackReports);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, generateFallbackReportsData]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  // Filter reports based on search and filters
  useEffect(() => {
    if (!reportsData) return;
    
    let filtered = reportsData;
    
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedReportType !== 'all') {
      filtered = filtered.filter(report => report.type === selectedReportType);
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(report => report.status === selectedStatus);
    }
    
    setFilteredReports(filtered);
  }, [reportsData, searchTerm, selectedReportType, selectedStatus]);



  const getRoleSpecificFeatures = () => {
    // Ensure user exists before accessing role
    if (!user) {
      return {
        title: 'Reports & Analytics',
        subtitle: 'Generate and view comprehensive reports and analytics',
        features: ['Report generation', 'Data analytics', 'Performance tracking', 'Compliance monitoring']
      };
    }
    
    switch (user.role) {
      case 'investor':
        return {
          title: 'Investment Reports & Analytics',
          subtitle: 'Generate and view comprehensive reports on your investment portfolio and performance',
          features: ['Portfolio reports', 'Performance analytics', 'Risk assessment', 'ESG reporting']
        };
      case 'company':
        return {
          title: 'Corporate Reporting & Compliance',
          subtitle: 'Generate reports for corporate governance, compliance, and stakeholder communication',
          features: ['Compliance reports', 'ESG reporting', 'Performance metrics', 'Stakeholder reports']
        };
      case 'regulator':
        return {
          title: 'Regulatory Reports & Oversight',
          subtitle: 'Generate and review regulatory reports for compliance monitoring and enforcement',
          features: ['Compliance reports', 'Regulatory filings', 'Audit reports', 'Enforcement data']
        };
      case 'ngo':
        return {
          title: 'Impact Reports & Sustainability Metrics',
          subtitle: 'Generate reports on environmental impact, sustainability metrics, and ESG performance',
          features: ['Impact reports', 'ESG metrics', 'Sustainability data', 'Progress tracking']
        };
      default:
        return {
          title: 'Reports & Analytics',
          subtitle: 'Generate and view comprehensive reports and analytics',
          features: ['Report generation', 'Data analytics', 'Performance tracking', 'Compliance monitoring']
        };
    }
  };

  const roleFeatures = getRoleSpecificFeatures();

  const formatFileSize = (size) => {
    if (size === 'N/A') return 'N/A';
    if (typeof size === 'number') {
      if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
      if (size >= 1024) return (size / 1024).toFixed(1) + ' KB';
      return size + ' B';
    }
    return size;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'portfolio-analysis':
        return <BarChart3 className="w-4 h-4" />;
      case 'esg-report':
        return <Leaf className="w-4 h-4" />;
      case 'compliance-report':
        return <Shield className="w-4 h-4" />;
      case 'performance-report':
        return <TrendingUp className="w-4 h-4" />;
      case 'risk-assessment':
        return <Target className="w-4 h-4" />;
      case 'market-analysis':
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleReportSelect = (report) => {
    setSelectedReport(report);
  };

  const handleCreateReport = () => {
    setShowCreateModal(true);
  };

  const handleGenerateReport = () => {
    if (!newReport.title || !newReport.type) return;
    
    const report = {
      id: Date.now(),
      ...newReport,
      status: 'generating',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      generatedBy: user?.username || 'System',
      downloadCount: 0,
      fileSize: 'N/A',
      summary: {},
      parameters: newReport.parameters || {}
    };
    
    setReportsData([report, ...reportsData]);
    setFilteredReports([report, ...filteredReports]);
    setNewReport({ title: '', type: '', description: '', parameters: {} });
    setShowCreateModal(false);
  };

  const handleDownload = (report) => {
    // Simulate download
    console.log(`Downloading report: ${report.title}`);
    // In a real app, this would trigger an actual download
  };

  const handleExport = () => {
    if (!filteredReports || filteredReports.length === 0) {
      console.warn('No reports to export');
      return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Title,Type,Status,Created,Generated By,Downloads,File Size\n" +
      filteredReports.map(report => 
        `${report.title || 'N/A'},${report.type || 'N/A'},${report.status || 'N/A'},${report.createdAt || 'N/A'},${report.generatedBy || 'N/A'},${report.downloadCount || 0},${report.fileSize || 'N/A'}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reports_summary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{roleFeatures?.title || 'Reports & Analytics'}</h1>
          <p className="text-gray-600">{roleFeatures?.subtitle || 'Generate and view comprehensive reports and analytics'}</p>
          
          {/* Role-specific features */}
          <div className="flex flex-wrap gap-2 mt-4">
            {roleFeatures?.features && roleFeatures.features.length > 0 ? (
              roleFeatures.features.map((feature, index) => (
                <span key={index} className="px-3 py-1 text-sm rounded-full bg-primary-100 text-primary-800">
                  {feature}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 text-sm rounded-full bg-primary-100 text-primary-800">
                Report generation
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col flex-1 gap-4 sm:flex-row">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Report Type Filter */}
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {reportTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {reportStatuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              {/* Create Report Button */}
              <button
                onClick={handleCreateReport}
                className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
              >
                <FileText className="w-4 h-4" />
                Create Report
              </button>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Report</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Downloads</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">File Size</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports && filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr 
                      key={report.id} 
                      className="transition-colors cursor-pointer hover:bg-gray-50"
                      onClick={() => handleReportSelect(report)}
                    >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.title}</div>
                        <div className="text-sm text-gray-500">{report.description}</div>
                        <div className="text-xs text-gray-400">By {report.generatedBy}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getReportTypeIcon(report.type)}
                        <span className="text-sm text-gray-900 capitalize">
                          {report.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.createdAt}</div>
                      <div className="text-xs text-gray-500">Updated: {report.updatedAt}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {report.downloadCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatFileSize(report.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(report);
                          }}
                          disabled={report.status !== 'completed'}
                          className="p-1 text-gray-400 transition-colors rounded hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download Report"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReportSelect(report);
                          }}
                          className="p-1 text-gray-400 transition-colors rounded hover:text-gray-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Report Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-md bg-white rounded-lg">
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Create New Report</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Report Title</label>
                    <input
                      type="text"
                      value={newReport.title}
                      onChange={(e) => setNewReport({...newReport, title: e.target.value})}
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter report title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Report Type</label>
                    <select
                      value={newReport.type}
                      onChange={(e) => setNewReport({...newReport, type: e.target.value})}
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select report type</option>
                      {reportTypes.filter(type => type !== 'all').map(type => (
                        <option key={type} value={type}>
                          {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={newReport.description}
                      onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter report description"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={!newReport.title || !newReport.type}
                    className="flex-1 px-4 py-2 text-white transition-colors rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedReport.title}</h3>
                    <p className="text-gray-600">{selectedReport.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-gray-400 transition-colors hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <h4 className="mb-2 font-medium text-gray-900">Report Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">Type:</span> {selectedReport.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
                      <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReport.status)}`}>{selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}</span></div>
                      <div><span className="text-gray-500">Created:</span> {selectedReport.createdAt}</div>
                      <div><span className="text-gray-500">Updated:</span> {selectedReport.updatedAt}</div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <h4 className="mb-2 font-medium text-gray-900">File Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">File Size:</span> {formatFileSize(selectedReport.fileSize)}</div>
                      <div><span className="text-gray-500">Downloads:</span> {selectedReport.downloadCount}</div>
                      <div><span className="text-gray-500">Generated By:</span> {selectedReport.generatedBy}</div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <h4 className="mb-2 font-medium text-gray-900">Parameters</h4>
                    <div className="space-y-2 text-sm">
                      {selectedReport.parameters && Object.keys(selectedReport.parameters).length > 0 ? (
                        Object.entries(selectedReport.parameters).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-500">{key}:</span> {Array.isArray(value) ? value.join(', ') : value.toString()}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">No parameters specified</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <h4 className="mb-2 font-medium text-gray-900">Summary</h4>
                    <div className="space-y-2 text-sm">
                      {selectedReport.summary && Object.keys(selectedReport.summary).length > 0 ? (
                        Object.entries(selectedReport.summary).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-500">{key}:</span> {typeof value === 'number' ? value.toFixed(2) : value}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">No summary available</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => handleDownload(selectedReport)}
                    disabled={selectedReport.status !== 'completed'}
                    className="flex items-center gap-2 px-4 py-2 text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    Download Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
