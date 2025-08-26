import { http, setTokens, clearTokens } from './http';

export const authAPI = {
  // Register a new user
  register: async (userData) => {
    const response = await http.post('/api/auth/register', userData);
    if (response.data.token) {
      setTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken
      });
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await http.post('/api/auth/login', credentials);
    if (response.data.token) {
      setTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken
      });
    }
    return response.data;
  },

  // Logout user
  logout: async () => {
    try {
      await http.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      clearTokens();
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await http.post('/api/auth/refresh', { refreshToken });
    if (response.data.token) {
      setTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken
      });
    }
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await http.get('/api/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await http.put('/api/auth/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await http.put('/api/auth/change-password', passwordData);
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await http.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (resetData) => {
    const response = await http.post('/api/auth/reset-password', resetData);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await http.post('/api/auth/verify-email', { token });
    return response.data;
  }
};