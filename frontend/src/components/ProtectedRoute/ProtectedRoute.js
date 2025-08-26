import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Prevent admin users from accessing regular user routes
  // Admin users should only access admin routes
  if (user.role === 'admin' && location.pathname.startsWith('/app')) {
    console.log('Admin user trying to access user route, redirecting to admin dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Check role-based access if specified
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate page based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'company') {
      return <Navigate to="/app/company-dashboard" replace />;
    } else if (user.role === 'regulator') {
      return <Navigate to="/app/regulator-dashboard" replace />;
    } else if (user.role === 'ngo') {
      return <Navigate to="/app/ngo-dashboard" replace />;
    } else {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  // Check if user has any of the allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate page based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
