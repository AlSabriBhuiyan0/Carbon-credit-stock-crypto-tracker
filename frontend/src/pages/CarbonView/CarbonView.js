import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMockDataForUser } from '../../services/mockDataService';
import { TrendingUp, DollarSign, BarChart3, Globe, Search, Download, Target, Shield, Leaf } from 'lucide-react';
import CarbonCreditChart from '../../components/Charts/CarbonCreditChart';

const CarbonView = () => {
  const { user } = useAuth();
  const [carbonData, setCarbonData] = useState(null);
  const [filteredCredits, setFilteredCredits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [timeRange] = useState('1y');
  const [loading, setLoading] = useState(true);

  const projectTypes = ['all', 'renewable-energy', 'forest-conservation', 'methane-capture', 'energy-efficiency', 'ocean-conservation'];
  const regions = ['all', 'north-america', 'europe', 'asia-pacific', 'latin-america', 'africa'];

  const loadCarbonData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get mock data for the current user
      const mockData = getMockDataForUser(user?.id, user?.role);
      
      if (mockData && mockData.carbonCredits && Array.isArray(mockData.carbonCredits)) {
        setCarbonData(mockData.carbonCredits);
      } else {
        // Fallback mock data
        const fallbackCredits = generateFallbackCarbonData();
        setCarbonData(fallbackCredits);
      }
    } catch (error) {
      console.error('Error loading carbon data:', error);
      // Use fallback data
      const fallbackCredits = generateFallbackCarbonData();
      setCarbonData(fallbackCredits);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadCarbonData();
  }, [loadCarbonData]);

  // Filter carbon credits based on search and filters
  useEffect(() => {
    if (!carbonData || !Array.isArray(carbonData)) {
      setFilteredCredits([]);
      return;
    }
    
    let filtered = carbonData;
    
    if (searchTerm) {
      filtered = filtered.filter(credit => 
        credit?.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit?.projectId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit?.developer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedProjectType !== 'all') {
      filtered = filtered.filter(credit => credit?.projectType === selectedProjectType);
    }
    
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(credit => credit?.region === selectedRegion);
    }
    
    setFilteredCredits(filtered || []);
  }, [carbonData, searchTerm, selectedProjectType, selectedRegion]);

  const generateFallbackCarbonData = () => {
    return [
      {
        projectId: 'CC-001',
        projectName: 'Solar Farm Development - Texas',
        developer: 'Green Energy Corp',
        projectType: 'renewable-energy',
        region: 'north-america',
        totalCredits: 50000,
        issuedCredits: 35000,
        price: 12.50,
        change: 0.75,
        changePercent: 6.38,
        verificationStatus: 'verified',
        issuanceDate: '2024-01-15',
        expiryDate: '2034-01-15',
        esgScore: 92,
        co2Reduction: 45000,
        data: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          credits: 2500 + Math.random() * 2000,
          price: 11 + Math.random() * 3
        }))
      },
      {
        projectId: 'CC-002',
        projectName: 'Amazon Rainforest Conservation',
        developer: 'EcoConservation Ltd',
        projectType: 'forest-conservation',
        region: 'latin-america',
        totalCredits: 75000,
        issuedCredits: 60000,
        price: 18.75,
        change: -0.50,
        changePercent: -2.60,
        verificationStatus: 'verified',
        issuanceDate: '2023-11-20',
        expiryDate: '2033-11-20',
        esgScore: 95,
        co2Reduction: 68000,
        data: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          credits: 4000 + Math.random() * 3000,
          price: 17 + Math.random() * 4
        }))
      },
      {
        projectId: 'CC-003',
        projectName: 'Landfill Methane Capture - California',
        developer: 'CleanTech Solutions',
        projectType: 'methane-capture',
        region: 'north-america',
        totalCredits: 30000,
        issuedCredits: 25000,
        price: 15.20,
        change: 1.20,
        changePercent: 8.57,
        verificationStatus: 'pending',
        issuanceDate: '2024-03-10',
        expiryDate: '2034-03-10',
        esgScore: 88,
        co2Reduction: 22000,
        data: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          credits: 1500 + Math.random() * 1500,
          price: 14 + Math.random() * 3
        }))
      },
      {
        projectId: 'CC-004',
        projectName: 'Wind Energy Farm - Scotland',
        developer: 'Renewable Scotland Ltd',
        projectType: 'renewable-energy',
        region: 'europe',
        totalCredits: 60000,
        issuedCredits: 45000,
        price: 14.80,
        change: 0.30,
        changePercent: 2.07,
        verificationStatus: 'verified',
        issuanceDate: '2023-09-05',
        expiryDate: '2033-09-05',
        esgScore: 90,
        co2Reduction: 52000,
        data: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          credits: 3000 + Math.random() * 2500,
          price: 13 + Math.random() * 4
        }))
      },
      {
        projectId: 'CC-005',
        projectName: 'Ocean Plastic Cleanup Initiative',
        developer: 'Ocean Guardians',
        projectType: 'ocean-conservation',
        region: 'asia-pacific',
        totalCredits: 25000,
        issuedCredits: 18000,
        price: 22.50,
        change: 2.50,
        changePercent: 12.50,
        verificationStatus: 'verified',
        issuanceDate: '2024-02-28',
        expiryDate: '2034-02-28',
        esgScore: 96,
        co2Reduction: 15000,
        data: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          credits: 1200 + Math.random() * 1000,
          price: 20 + Math.random() * 5
        }))
      }
    ];
  };

  const getRoleSpecificFeatures = () => {
    switch (user?.role) {
      case 'investor':
        return {
          title: 'Carbon Credit Investment Portfolio',
          subtitle: 'Track your carbon credit investments and ESG performance',
          features: ['Portfolio tracking', 'ESG scoring', 'Risk assessment', 'Investment returns']
        };
      case 'company':
        return {
          title: 'Carbon Credit Procurement',
          subtitle: 'Source and manage carbon credits for your sustainability goals',
          features: ['Credit sourcing', 'Compliance tracking', 'ESG reporting', 'Cost optimization']
        };
      case 'regulator':
        return {
          title: 'Carbon Market Oversight',
          subtitle: 'Monitor carbon credit projects and market compliance',
          features: ['Project verification', 'Market monitoring', 'Compliance tracking', 'Regulatory reporting']
        };
      case 'ngo':
        return {
          title: 'Carbon Project Impact Assessment',
          subtitle: 'Evaluate environmental and social impact of carbon projects',
          features: ['Impact measurement', 'ESG evaluation', 'Sustainability metrics', 'Project assessment']
        };
      default:
        return {
          title: 'Carbon Credits View',
          subtitle: 'Explore carbon credit projects and market opportunities',
          features: ['Project overview', 'Market analysis', 'ESG metrics', 'Investment research']
        };
    }
  };

  const roleFeatures = getRoleSpecificFeatures();

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectTypeIcon = (type) => {
    if (!type) return <BarChart3 className="w-4 h-4" />;
    
    switch (type) {
      case 'renewable-energy':
        return <Leaf className="w-4 h-4" />;
      case 'forest-conservation':
        return <Shield className="w-4 h-4" />;
      case 'methane-capture':
        return <DollarSign className="w-4 h-4" />;
      case 'energy-efficiency':
        return <Target className="w-4 h-4" />;
      case 'ocean-conservation':
        return <Globe className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const handleProjectSelect = (project) => {
    if (project && typeof project === 'object') {
      setSelectedProject(project);
    }
  };

  const handleExport = () => {
    if (!filteredCredits || filteredCredits.length === 0) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Project ID,Project Name,Developer,Type,Region,Total Credits,Issued Credits,Price,Status,ESG Score\n" +
      filteredCredits.map(credit => 
        `${credit.projectId},${credit.projectName},${credit.developer},${credit.projectType},${credit.region},${credit.totalCredits},${credit.issuedCredits},${credit.price},${credit.verificationStatus},${credit.esgScore}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "carbon_credits.csv");
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{roleFeatures?.title || 'Carbon Credits'}</h1>
          <p className="text-gray-600">{roleFeatures?.subtitle || 'Explore carbon credit projects and market opportunities'}</p>
          
          {/* Role-specific features */}
          <div className="flex flex-wrap gap-2 mt-4">
            {roleFeatures?.features && roleFeatures.features.map((feature, index) => (
              <span key={index} className="px-3 py-1 text-sm rounded-full bg-primary-100 text-primary-800">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
            <div className="flex flex-col flex-1 gap-4 sm:flex-row">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Project Type Filter */}
              <select
                value={selectedProjectType}
                onChange={(e) => setSelectedProjectType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {projectTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>

              {/* Region Filter */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region === 'all' ? 'All Regions' : region.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

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

        {/* Carbon Credits List */}
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Credits</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ESG Score</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Region</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCredits && filteredCredits.length > 0 ? (
                  filteredCredits.map((credit) => (
                    <tr 
                      key={credit.projectId} 
                      className="transition-colors cursor-pointer hover:bg-gray-50"
                      onClick={() => handleProjectSelect(credit)}
                    >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{credit?.projectId || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{credit?.projectName || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{credit?.developer || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getProjectTypeIcon(credit?.projectType)}
                        <span className="text-sm text-gray-900 capitalize">
                          {credit?.projectType ? credit.projectType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatNumber(credit?.issuedCredits)}</div>
                        <div className="text-xs text-gray-500">of {formatNumber(credit?.totalCredits)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">${(credit?.price || 0).toFixed(2)}</div>
                        <div className={`flex items-center gap-1 text-xs ${
                          (credit?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(credit?.change || 0) >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          {(credit?.change || 0) >= 0 ? '+' : ''}{(credit?.change || 0).toFixed(2)} ({(credit?.changePercent || 0).toFixed(2)}%)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(credit?.verificationStatus)}`}>
                        {credit?.verificationStatus ? credit.verificationStatus.charAt(0).toUpperCase() + credit.verificationStatus.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">{credit?.esgScore || 0}</div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-green-600 rounded-full" 
                            style={{ width: `${credit?.esgScore || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium text-gray-800 capitalize bg-gray-100 rounded-full">
                        {credit?.region ? credit.region.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No carbon credits found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedProject?.projectId || 'N/A'} - {selectedProject?.projectName || 'N/A'}</h3>
                    <p className="text-gray-600">${(selectedProject?.price || 0).toFixed(2)} per credit</p>
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-6">
                  <CarbonCreditChart 
                    data={selectedProject?.data || []} 
                    projectId={selectedProject?.projectId || 'N/A'}
                    timeRange={timeRange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-gray-50">
                    <h4 className="mb-2 font-medium text-gray-900">Project Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">Developer:</span> {selectedProject?.developer || 'N/A'}</div>
                      <div><span className="text-gray-500">Type:</span> {selectedProject?.projectType ? selectedProject.projectType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'N/A'}</div>
                      <div><span className="text-gray-500">Region:</span> {selectedProject?.region ? selectedProject.region.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'N/A'}</div>
                      <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedProject?.verificationStatus || 'unknown')}`}>{selectedProject?.verificationStatus ? selectedProject.verificationStatus.charAt(0).toUpperCase() + selectedProject.verificationStatus.slice(1) : 'Unknown'}</span></div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <h4 className="mb-2 font-medium text-gray-900">Credit Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">Total Credits:</span> {formatNumber(selectedProject?.totalCredits || 0)}</div>
                      <div><span className="text-gray-500">Issued Credits:</span> {formatNumber(selectedProject?.issuedCredits || 0)}</div>
                      <div><span className="text-gray-500">Issuance Date:</span> {selectedProject?.issuanceDate || 'N/A'}</div>
                      <div><span className="text-gray-500">Expiry Date:</span> {selectedProject?.expiryDate || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gray-50">
                    <h4 className="mb-2 font-medium text-gray-900">Performance Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">ESG Score:</span> <span className="font-medium">{selectedProject?.esgScore || 0}/100</span></div>
                      <div><span className="text-gray-500">CO2 Reduction:</span> {formatNumber(selectedProject?.co2Reduction || 0)} tons</div>
                      <div><span className="text-gray-500">Price Change:</span> <span className={selectedProject?.change >= 0 ? 'text-green-600' : 'text-red-600'}>{selectedProject?.change >= 0 ? '+' : ''}{(selectedProject?.changePercent || 0).toFixed(2)}%</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarbonView;
