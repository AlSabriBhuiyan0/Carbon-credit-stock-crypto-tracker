// Demo Users Configuration
// This file contains the demo user accounts for testing different roles

export const DEMO_USERS = {
  // Demo Investor User
  investor: {
    id: 'demo_investor_001',
    username: 'demo_investor',
    email: 'investor@demo.com',
    password: 'Demo123!@#',
    role: 'investor',
    first_name: 'John',
    last_name: 'Greenfield',
    company_id: 'INV_001',
    account_status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    description: 'Demo investor account for testing portfolio and investment features'
  },

  // Demo Company User
  company: {
    id: 'demo_company_001',
    username: 'demo_company',
    email: 'company@demo.com',
    password: 'Demo123!@#',
    role: 'company',
    first_name: 'Sarah',
    last_name: 'Corporation',
    company_id: 'COMP_001',
    account_status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    description: 'Demo company account for testing ESG and sustainability features'
  },

  // Demo Regulator User
  regulator: {
    id: 'demo_regulator_001',
    username: 'demo_regulator',
    email: 'regulator@demo.com',
    password: 'Demo123!@#',
    role: 'regulator',
    first_name: 'Michael',
    last_name: 'Oversight',
    company_id: 'REG_001',
    account_status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    description: 'Demo regulator account for testing compliance and monitoring features'
  },

  // Demo NGO User
  ngo: {
    id: 'demo_ngo_001',
    username: 'demo_ngo',
    email: 'ngo@demo.com',
    password: 'Demo123!@#',
    role: 'ngo',
    first_name: 'Emma',
    last_name: 'Impact',
    company_id: 'NGO_001',
    account_status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    description: 'Demo NGO account for testing impact projects and sustainability features'
  }
};

// Demo Admin User
export const DEMO_ADMIN = {
  id: 'demo_admin_001',
  username: 'admin',
  email: 'admin@demo.com',
  password: 'Admin123!@#',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'User',
  company_id: 'ADMIN_001',
  account_status: 'active',
  created_at: '2024-01-01T00:00:00.000Z',
  description: 'Demo admin account for testing administrative features'
};

// Helper function to get demo user by role
export const getDemoUserByRole = (role) => {
  return DEMO_USERS[role] || null;
};

// Helper function to get all demo users
export const getAllDemoUsers = () => {
  return Object.values(DEMO_USERS);
};

// Helper function to get demo admin
export const getDemoAdmin = () => {
  return DEMO_ADMIN;
};

// Helper function to validate demo credentials
export const validateDemoCredentials = (username, password) => {
  // Check regular demo users
  for (const [role, user] of Object.entries(DEMO_USERS)) {
    if (user.username === username && user.password === password) {
      return { user, role };
    }
  }
  
  // Check admin user
  if (DEMO_ADMIN.username === username && DEMO_ADMIN.password === password) {
    return { user: DEMO_ADMIN, role: 'admin' };
  }
  
  return null;
};

// Helper function to get demo user credentials for display
export const getDemoCredentialsForDisplay = () => {
  const credentials = [];
  
  // Add regular demo users
  Object.entries(DEMO_USERS).forEach(([role, user]) => {
    credentials.push({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      username: user.username,
      password: user.password,
      description: user.description
    });
  });
  
  return credentials;
};

// Helper function to get admin credentials for display
export const getAdminCredentialsForDisplay = () => {
  return {
    username: DEMO_ADMIN.username,
    password: DEMO_ADMIN.password,
    description: DEMO_ADMIN.description
  };
};
