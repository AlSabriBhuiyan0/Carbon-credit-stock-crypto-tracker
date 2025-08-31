import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  UserPlus,
  Package,
  Cog,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllDemoUsers, getDemoAdmin } from '../../config/demoUsers';
import { http } from '../../api/http';
import reportService from '../../services/reportService';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for data
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  // State for reports
  const [reports, setReports] = useState([]);
  const [reportStats, setReportStats] = useState({});
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    type: 'system',
    description: '',
    format: 'pdf'
  });
  
  // State for forms and modals
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  
  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'public',
    first_name: '',
    last_name: '',
    company_id: ''
  });
  
  const [planForm, setPlanForm] = useState({
    name: '',
    slug: '',
    price: '',
    interval: 'monthly',
    features: '',
    max_users: '',
    is_active: true
  });
  
  const [settingsForm, setSettingsForm] = useState({
            site_name: 'Carbon credit tracker and stock,crypto asset prediction platform',
    maintenance_mode: false,
    max_file_size: '10MB',
    email_notifications: true,
    auto_backup: true
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load users
      try {
        const usersResponse = await http.get('/api/admin/users');
        const apiUsers = usersResponse.data.users || [];
        setUsers(apiUsers);
        
        addNotification('Users loaded successfully', 'success');
      } catch (error) {
        console.error('Error loading users:', error);
        // If API fails, still show demo users
        const demoUsers = getAllDemoUsers();
        const demoAdmin = getDemoAdmin();
        setUsers([...demoUsers, demoAdmin]);
        addNotification('Using demo users (API unavailable)', 'warning');
      }
      
      // Load plans
      try {
        const plansResponse = await http.get('/api/admin/plans');
        setPlans(plansResponse.data.plans || []);
        addNotification('Plans loaded successfully', 'success');
      } catch (error) {
        console.error('Error loading plans:', error);
        setPlans([]);
        addNotification('Failed to load plans', 'error');
      }
      
      // Load stats
      try {
        const statsResponse = await http.get('/api/admin/stats');
        setStats(statsResponse.data.data || {});
        addNotification('Stats loaded successfully', 'success');
      } catch (error) {
        console.error('Error loading stats:', error);
        // Generate mock stats from demo users
        const demoUsers = getAllDemoUsers();
        const mockStats = {
          users: {
            total: demoUsers.length + 1, // +1 for admin
            active: demoUsers.length + 1,
            suspended: 0,
            pending: 0
          },
          plans: {
            total: 0,
            active: 0
          },
          subscriptions: {
            total: 0,
            active: 0
          },
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            platform: process.platform
          }
        };
        setStats(mockStats);
        addNotification('Using mock stats (API unavailable)', 'warning');
      }
      
      // Load reports
      try {
        const reportsResponse = await http.get('/api/admin/reports');
        setReports(reportsResponse.data.reports || []);
        addNotification('Reports loaded successfully', 'success');
      } catch (error) {
        console.error('Error loading reports:', error);
        // Use mock reports if API fails
        const mockReports = reportService.getMockReports();
        setReports(mockReports);
        addNotification('Using mock reports (API unavailable)', 'warning');
      }
      
      // Load report stats
      try {
        const reportStatsResponse = await http.get('/api/admin/reports/stats/overview');
        setReportStats(reportStatsResponse.data.data || {});
      } catch (error) {
        console.error('Error loading report stats:', error);
        // Use mock report stats if API fails
        const mockReportStats = reportService.getMockReportStats();
        setReportStats(mockReportStats);
      }
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep only last 5 notifications
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // User management functions
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (userForm.password !== userForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {

      const response = await http.post('/api/admin/users', userForm);
      
      // Check if response has the expected structure
      if (response.data && response.data.user) {
        addNotification('User created successfully', 'success');
        setShowUserForm(false);
        setUserForm({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'public',
          first_name: '',
          last_name: '',
          company_id: ''
        });
        loadData();
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create user';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    // Check if editingUser and editingUser.id exist
    if (!editingUser || !editingUser.id) {
      alert('Error: Cannot edit user - user ID is missing');
      return;
    }
    
    try {

      const response = await http.put(`/api/admin/users/${editingUser.id}`, userForm);
      
      // Check if response has the expected structure
      if (response.data && response.data.user) {
        addNotification('User updated successfully', 'success');
        setShowUserForm(false);
        setEditingUser(null);
        setUserForm({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'public',
          first_name: '',
          last_name: '',
          company_id: ''
        });
        loadData();
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update user';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await http.delete(`/api/admin/users/${userId}`);
      
      alert('User deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete user';
      alert(`Error: ${errorMessage}`);
    }
  };

  const openEditUser = (user) => {
    // Validate that user object has required fields
    if (!user || !user.id) {
      alert('Error: Invalid user data for editing');
      return;
    }
    
    console.log('Opening edit user:', user); // Debug log
    
    setEditingUser({
      id: user.id,
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'public',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      company_id: user.company_id || ''
    });
    
    setUserForm({
      username: user.username || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'public',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      company_id: user.company_id || ''
    });
    
    setShowUserForm(true);
  };

  // Report management functions
  const handleAddReport = async (e) => {
    e.preventDefault();
    
    try {

      const response = await http.post('/api/admin/reports', reportForm);
      
      if (response.data && response.data.report) {
        addNotification('Report created successfully', 'success');
        setShowReportForm(false);
        setReportForm({
          title: '',
          type: 'system',
          description: '',
          format: 'pdf'
        });
        loadData();
      } else {
        throw new Error('Invalid response structure from server');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create report';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {

      await http.delete(`/api/admin/reports/${reportId}`);
      
      addNotification('Report deleted successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error deleting report:', error);
      addNotification(`Error: ${error.response?.data?.message || 'Failed to delete report'}`, 'error');
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {

      const response = await http.get(`/api/admin/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addNotification('Report downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading report:', error);
      addNotification(`Error: ${error.response?.data?.message || 'Failed to download report'}`, 'error');
    }
  };

  // Plan management functions
  const handleAddPlan = async (e) => {
    e.preventDefault();
    
    try {

      await http.post('/api/admin/plans', planForm);
      
      addNotification('Plan created successfully', 'success');
      setShowPlanForm(false);
      setPlanForm({
        name: '',
        slug: '',
        price: '',
        interval: 'monthly',
        features: '',
        max_users: '',
        is_active: true
      });
      loadData();
    } catch (error) {
      console.error('Error creating plan:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to create plan'}`);
    }
  };

  const handleEditPlan = async (e) => {
    e.preventDefault();
    
    try {

      await http.put(`/api/admin/plans/${editingPlan.id}`, planForm);
      
      alert('Plan updated successfully');
      setShowPlanForm(false);
      setEditingPlan(null);
      setPlanForm({
        name: '',
        slug: '',
        price: '',
        interval: 'monthly',
        features: '',
        max_users: '',
        is_active: true
      });
      loadData();
    } catch (error) {
      console.error('Error updating plan:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to update plan'}`);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        alert('Plan deleted successfully');
        loadData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Error deleting plan');
    }
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || '',
      slug: plan.slug || '',
      price: plan.price || '',
      interval: plan.interval || 'monthly',
      features: plan.features || '',
      max_users: plan.max_users || '',
      is_active: plan.is_active !== undefined ? plan.is_active : true
    });
    setShowPlanForm(true);
  };

  // Settings management
  const handleUpdateSettings = async (key, value) => {
    try {

      await http.put('/api/admin/settings', { [key]: value });
      
      alert('Setting updated successfully');
      setSettingsForm(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to update setting'}`);
    }
  };

  // Form input handlers
  const handleUserFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePlanFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlanForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSettingsFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettingsForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Render functions
  const renderOverview = () => (
    <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white rounded-lg shadow-md"
      >
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers || 0}</p>
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
          <div className="p-3 bg-green-100 rounded-full">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Plans</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.activePlans || 0}</p>
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
            <Package className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Plans</p>
            <p className="text-2xl font-semibold text-gray-900">{plans.length}</p>
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
             <Cog className="w-6 h-6 text-orange-600" />
           </div>
           <div className="ml-4">
             <p className="text-sm font-medium text-gray-600">System Status</p>
             <p className="text-2xl font-semibold text-green-600">Online</p>
             <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
           </div>
         </div>
             </motion.div>

       {/* Quick Actions */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.4 }}
         className="col-span-full p-6 bg-white rounded-lg shadow-md"
       >
         <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
         <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
           <button
             onClick={() => {
               setEditingUser(null);
               setUserForm({
                 username: '',
                 email: '',
                 password: '',
                 confirmPassword: '',
                 role: 'public',
                 first_name: '',
                 last_name: '',
                 company_id: ''
               });
               setShowUserForm(true);
             }}
             className="flex items-center p-4 transition-colors border rounded-lg hover:bg-blue-50 hover:border-blue-300"
           >
             <UserPlus className="w-6 h-6 mr-3 text-blue-600" />
             <div className="text-left">
               <h4 className="font-medium text-gray-900">Add New User</h4>
               <p className="text-sm text-gray-600">Create a new user account</p>
             </div>
           </button>
           
           <button
             onClick={() => {
               setEditingPlan(null);
               setPlanForm({
                 name: '',
                 slug: '',
                 price: '',
                 interval: 'monthly',
                 features: '',
                 max_users: '',
                 is_active: true
               });
               setShowPlanForm(true);
             }}
             className="flex items-center p-4 transition-colors border rounded-lg hover:bg-green-50 hover:border-green-300"
           >
             <Plus className="w-6 h-6 mr-3 text-green-600" />
             <div className="text-left">
               <h4 className="font-medium text-gray-900">Add New Plan</h4>
               <p className="text-sm text-gray-600">Create a new subscription plan</p>
             </div>
           </button>
           
           <button
             onClick={() => setShowSettingsForm(true)}
             className="flex items-center p-4 transition-colors border rounded-lg hover:bg-purple-50 hover:border-purple-300"
           >
             <Settings className="w-6 h-6 mr-3 text-purple-600" />
             <div className="text-left">
               <h4 className="font-medium text-gray-900">System Settings</h4>
               <p className="text-sm text-gray-600">Update system configuration</p>
             </div>
           </button>
         </div>
       </motion.div>

       {/* System Health Monitoring */}
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.5 }}
         className="col-span-full p-6 bg-white rounded-lg shadow-md"
       >
         <h3 className="mb-4 text-lg font-semibold text-gray-900">System Health</h3>
         <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
           <div className="flex items-center p-3 bg-green-50 rounded-lg">
             <Package className="w-5 h-5 mr-2 text-green-600" />
             <div>
               <p className="text-sm font-medium text-green-800">Database</p>
               <p className="text-xs text-green-600">Connected</p>
             </div>
           </div>
           <div className="flex items-center p-3 bg-blue-50 rounded-lg">
             <Cog className="w-5 h-5 mr-2 text-blue-600" />
             <div>
               <p className="text-sm font-medium text-blue-800">API Server</p>
               <p className="text-xs text-blue-600">Running</p>
             </div>
           </div>
           <div className="flex items-center p-3 bg-purple-50 rounded-lg">
             <Users className="w-5 h-5 mr-2 text-purple-600" />
             <div>
               <p className="text-sm font-medium text-purple-800">User Sessions</p>
               <p className="text-xs text-purple-600">{users.length} Active</p>
             </div>
           </div>
           <div className="flex items-center p-3 bg-orange-50 rounded-lg">
             <CreditCard className="w-5 h-5 mr-2 text-orange-600" />
             <div>
               <p className="text-sm font-medium text-orange-800">Subscriptions</p>
               <p className="text-xs text-orange-600">{plans.length} Plans</p>
             </div>
           </div>
         </div>
       </motion.div>
     </div>
   );

  const renderUsers = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <button
          onClick={() => {
            setEditingUser(null);
            setUserForm({
              username: '',
              email: '',
              password: '',
              confirmPassword: '',
              role: 'public',
              first_name: '',
              last_name: '',
              company_id: ''
            });
            setShowUserForm(true);
          }}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => {
                  // Add search functionality here
                  console.log('Search:', e.target.value);
                }}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Roles</option>
              <option value="public">Public</option>
              <option value="investor">Investor</option>
              <option value="company">Company</option>
              <option value="regulator">Regulator</option>
              <option value="ngo">NGO</option>
              <option value="admin">Admin</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-300 rounded-full">
                        <span className="text-sm font-medium text-gray-700">
                          {user.first_name?.[0] || user.username?.[0] || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'company' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'regulator' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'ngo' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                    Active
                  </span>
                </td>
                                 <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                   <button
                     onClick={() => {
                       // View user details
                       alert(`User Details:\nName: ${user.first_name} ${user.last_name}\nUsername: ${user.username}\nEmail: ${user.email}\nRole: ${user.role}\nCompany ID: ${user.company_id || 'N/A'}`);
                     }}
                     className="mr-3 text-blue-600 hover:text-blue-900"
                     title="View Details"
                   >
                     <Eye className="w-4 h-4" />
                   </button>
                   <button
                     onClick={() => openEditUser(user)}
                     className="mr-3 text-indigo-600 hover:text-indigo-900"
                     title="Edit User"
                   >
                     <Edit className="w-4 h-4" />
                   </button>
                   <button
                     onClick={() => handleDeleteUser(user.id)}
                     className="text-red-600 hover:text-red-900"
                     title="Delete User"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSubscriptionPlans = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
        <button
          onClick={() => {
            setEditingPlan(null);
            setPlanForm({
              name: '',
              slug: '',
              price: '',
              interval: 'monthly',
              features: '',
              max_users: '',
              is_active: true
            });
            setShowPlanForm(true);
          }}
          className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="p-6 transition-shadow border rounded-lg hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {plan.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mb-2 text-3xl font-bold text-gray-900">
              ${plan.price}
              <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
            </p>
            <p className="mb-4 text-gray-600">{plan.features}</p>
                         <div className="flex justify-between">
               <button
                 onClick={() => {
                   // View plan details
                   alert(`Plan Details:\nName: ${plan.name}\nSlug: ${plan.slug}\nPrice: $${plan.price}/${plan.interval}\nFeatures: ${plan.features}\nMax Users: ${plan.max_users || 'Unlimited'}\nStatus: ${plan.is_active ? 'Active' : 'Inactive'}`);
                 }}
                 className="text-sm font-medium text-green-600 hover:text-green-800"
                 title="View Details"
               >
                 <Eye className="inline w-4 h-4 mr-1" />
                 View
               </button>
               <button
                 onClick={() => openEditPlan(plan)}
                 className="text-sm font-medium text-blue-600 hover:text-blue-800"
                 title="Edit Plan"
               >
                 <Edit className="inline w-4 h-4 mr-1" />
                 Edit
               </button>
               <button
                 onClick={() => handleDeletePlan(plan.id)}
                 className="text-sm font-medium text-red-600 hover:text-red-800"
                 title="Delete Plan"
               >
                 <Trash2 className="inline w-4 h-4 mr-1" />
                 Delete
               </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="p-6 bg-white rounded-lg shadow-md">
             <div className="flex items-center justify-between mb-6">
         <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
         <div className="flex space-x-2">
           <button
             onClick={() => {
               // Refresh system status
               loadData();
               alert('System status refreshed!');
             }}
             className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
           >
             <Cog className="w-4 h-4 mr-2" />
             Refresh Status
           </button>
           <button
             onClick={() => setShowSettingsForm(true)}
             className="flex items-center px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
           >
             <Settings className="w-4 h-4 mr-2" />
             Update Settings
           </button>
         </div>
       </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Site Name</label>
            <p className="mt-1 text-sm text-gray-900">{settingsForm.site_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Maintenance Mode</label>
            <p className="mt-1 text-sm text-gray-900">{settingsForm.maintenance_mode ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max File Size</label>
            <p className="mt-1 text-sm text-gray-900">{settingsForm.max_file_size}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Notifications</label>
            <p className="mt-1 text-sm text-gray-900">{settingsForm.email_notifications ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Auto Backup</label>
            <p className="mt-1 text-sm text-gray-900">{settingsForm.auto_backup ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Reports Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">{reportStats.monthlyCount || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Downloads</p>
              <p className="text-2xl font-semibold text-gray-900">{reportStats.totalDownloads || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Popular Type</p>
              <p className="text-2xl font-semibold text-gray-900">{reportStats.popularType || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Reports Management</h3>
          <button
            onClick={() => setShowReportForm(true)}
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </button>
        </div>

        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{report.title}</h4>
                  <p className="text-sm text-gray-600">{report.type} • {report.description}</p>
                  <p className="text-sm text-gray-500">Created: {new Date(report.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    report.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status}
                  </span>
                  <button
                    onClick={() => handleDownloadReport(report.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Download Report"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'plans':
        return renderSubscriptionPlans();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSystemSettings();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    // Toggle notifications panel
                    const hasNotifications = notifications.length > 0;
                    if (hasNotifications) {
                      alert(`Recent Notifications:\n${notifications.map(n => `[${n.timestamp}] ${n.message}`).join('\n')}`);
                    } else {
                      alert('No recent notifications');
                    }
                  }}
                  className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
                  title="View Notifications"
                >
                  <Eye className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {user?.username?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user?.username || 'Admin'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
                  </div>
                </div>
                
                {/* Prominent Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
                  title="Logout from Admin Panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'plans', label: 'Plans', icon: CreditCard },
                { id: 'reports', label: 'Reports', icon: FileText },
                { id: 'settings', label: 'Settings', icon: Settings }
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
            
            {/* Secondary Logout Button */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Quick Actions:</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 hover:border-red-400 transition-colors duration-200"
                title="Quick Logout"
              >
                <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {renderContent()}
      </main>

      {/* Floating Logout Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleLogout}
          className="p-4 text-white bg-red-600 rounded-full shadow-lg hover:bg-red-700 hover:shadow-xl transition-all duration-200 transform hover:scale-110"
          title="Quick Logout (Floating)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={editingUser ? handleEditUser : handleAddUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={userForm.username}
                      onChange={handleUserFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={userForm.email}
                      onChange={handleUserFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={userForm.password}
                      onChange={handleUserFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required={!editingUser}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={userForm.confirmPassword}
                      onChange={handleUserFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required={!editingUser}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      value={userForm.role}
                      onChange={handleUserFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    >
                      <option value="public">Public</option>
                      <option value="investor">Investor</option>
                      <option value="company">Company</option>
                      <option value="regulator">Regulator</option>
                      <option value="ngo">NGO</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={userForm.first_name}
                      onChange={handleUserFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={userForm.last_name}
                      onChange={handleUserFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company ID</label>
                    <input
                      type="text"
                      name="company_id"
                      value={userForm.company_id}
                      onChange={handleUserFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUserForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Plan Form Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
              </h3>
              <form onSubmit={editingPlan ? handleEditPlan : handleAddPlan}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                    <input
                      type="text"
                      name="name"
                      value={planForm.name}
                      onChange={handlePlanFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                    <input
                      type="text"
                      name="slug"
                      value={planForm.slug}
                      onChange={handlePlanFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      name="price"
                      value={planForm.price}
                      onChange={handlePlanFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interval</label>
                    <select
                      name="interval"
                      value={planForm.interval}
                      onChange={handlePlanFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Features</label>
                    <textarea
                      name="features"
                      value={planForm.features}
                      onChange={handlePlanFormChange}
                      rows="3"
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Users</label>
                    <input
                      type="number"
                      name="max_users"
                      value={planForm.max_users}
                      onChange={handlePlanFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={planForm.is_active}
                      onChange={handlePlanFormChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="block ml-2 text-sm text-gray-900">Active</label>
                  </div>
                </div>
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPlanForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form Modal */}
      {showSettingsForm && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Update System Settings</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                // Update all settings
                Object.entries(settingsForm).forEach(([key, value]) => {
                  handleUpdateSettings(key, value);
                });
                setShowSettingsForm(false);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site Name</label>
                    <input
                      type="text"
                      name="site_name"
                      value={settingsForm.site_name}
                      onChange={handleSettingsFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="maintenance_mode"
                      checked={settingsForm.maintenance_mode}
                      onChange={handleSettingsFormChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="block ml-2 text-sm text-gray-900">Maintenance Mode</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max File Size</label>
                    <input
                      type="text"
                      name="max_file_size"
                      value={settingsForm.max_file_size}
                      onChange={handleSettingsFormChange}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="email_notifications"
                      checked={settingsForm.email_notifications}
                      onChange={handleSettingsFormChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="block ml-2 text-sm text-gray-900">Email Notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="auto_backup"
                      checked={settingsForm.auto_backup}
                      onChange={handleSettingsFormChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="block ml-2 text-sm text-gray-900">Auto Backup</label>
                  </div>
                </div>
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSettingsForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    Update Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Create New Report</h3>
              <form onSubmit={handleAddReport}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Report Title</label>
                    <input
                      type="text"
                      name="title"
                      value={reportForm.title}
                      onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Report Type</label>
                    <select
                      name="type"
                      value={reportForm.type}
                      onChange={(e) => setReportForm({...reportForm, type: e.target.value})}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="system">System Report</option>
                      <option value="user">User Report</option>
                      <option value="financial">Financial Report</option>
                      <option value="compliance">Compliance Report</option>
                      <option value="analytics">Analytics Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={reportForm.description}
                      onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      rows="3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Format</label>
                    <select
                      name="format"
                      value={reportForm.format}
                      onChange={(e) => setReportForm({...reportForm, format: e.target.value})}
                      className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Create Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
