import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { authAPI } from '../api/auth';
import { getAccessToken, clearTokens } from '../api/http';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setIsAuthenticated(true);
      // Try to fetch user profile
      fetchUserProfile();
    } else {
      setLoading(false);
    }
    
    // Listen for token refresh events
    const handleTokenRefresh = () => {
      console.log('Token refreshed, fetching updated user profile');
      // Only fetch profile if we're not currently loading to avoid conflicts
      if (!loading) {
        fetchUserProfile();
      }
    };
    
    const handleTokenExpired = () => {
      console.log('Token expired, clearing authentication state');
      // Use setTimeout to prevent navigation conflicts during render
      setTimeout(() => {
        setUser(null);
        setIsAuthenticated(false);
        queryClient.clear();
      }, 0);
    };
    
    window.addEventListener('tokenRefreshed', handleTokenRefresh);
    window.addEventListener('tokenExpired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh);
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, [loading, queryClient]);

  const fetchUserProfile = async () => {
    try {
      const userData = await authAPI.getProfile();
      setUser(userData.user || userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // If profile fetch fails, it usually means token is invalid
      // Clear authentication state and let token refresh mechanism handle it
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        setUser(null);
        clearTokens();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      setUser(response.user || response);
      setIsAuthenticated(true);
      
      // Invalidate all queries to refetch with new auth
      queryClient.invalidateQueries();
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      setUser(response.user || response);
      setIsAuthenticated(true);
      
      // Invalidate all queries to refetch with new auth
      queryClient.invalidateQueries();
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear all cached queries
      queryClient.clear();
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};