import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect while still loading authentication state
    if (loading) return;

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      // Redirect admin routes to admin login
      if (location.pathname.startsWith('/admin')) {
        navigate('/admin/login', { state: { from: location }, replace: true });
      } else {
        navigate('/login', { state: { from: location }, replace: true });
      }
      return;
    }

    // Prevent admin users from accessing regular user routes
    // Admin users should only access admin routes
    if (user.role === 'admin' && location.pathname.startsWith('/app')) {
      console.log('Admin user trying to access user route, redirecting to admin dashboard');
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    // Check role-based access if specified
    if (requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate page based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'company') {
        navigate('/app/company-dashboard', { replace: true });
      } else if (user.role === 'regulator') {
        navigate('/app/regulator-dashboard', { replace: true });
      } else if (user.role === 'ngo') {
        navigate('/app/ngo-dashboard', { replace: true });
      } else {
        navigate('/app/dashboard', { replace: true });
      }
      return;
    }

    // Check if user has any of the allowed roles
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate page based on user role
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/app/dashboard', { replace: true });
      }
      return;
    }
  }, [isAuthenticated, user, loading, location.pathname, navigate, requiredRole, allowedRoles]);

  // Show loading while authentication is being checked or redirects are happening
  if (loading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If user doesn't have proper access, show loading while redirect happens
  const hasProperAccess = (() => {
    if (user.role === 'admin' && location.pathname.startsWith('/app')) return false;
    if (requiredRole && user.role !== requiredRole) return false;
    if (allowedRoles && !allowedRoles.includes(user.role)) return false;
    return true;
  })();

  if (!hasProperAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
