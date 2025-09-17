import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from 'react-error-boundary';

// Components
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import StockView from './pages/StockView/StockView';
import CarbonView from './pages/CarbonView/CarbonView';
import CryptoView from './pages/CryptoView/CryptoView';
import ForecastView from './pages/ForecastView/ForecastView';
import Portfolio from './pages/Portfolio/Portfolio';
import Reports from './pages/Reports/Reports';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PlanSelection from './pages/Subscription/PlanSelection';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CompanyDashboard from './pages/Company/CompanyDashboard';
import RegulatorDashboard from './pages/Regulator/RegulatorDashboard';
import NGODashboard from './pages/NGO/NGODashboard';
import InvestorDashboard from './pages/Investor/InvestorDashboard';
import NotFound from './pages/NotFound/NotFound';

// Context and Hooks
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Utils
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Styles
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={
        !isAuthenticated ? <Login /> : 
        user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
        <Navigate to="/app/dashboard" replace />
      } />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/app/dashboard" replace />} />
      <Route path="/plans" element={!isAuthenticated ? <PlanSelection /> : <Navigate to="/app/dashboard" replace />} />

      {/* Admin routes - completely separate from public site */}
      <Route path="/admin/login" element={
        !isAuthenticated ? <AdminLogin /> : 
        user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : 
        <Navigate to="/login" replace />
      } />
      <Route path="/admin/dashboard" element={
        isAuthenticated && user?.role === 'admin' ? <AdminDashboard /> : 
        <Navigate to="/admin/login" replace />
      } />

      {/* Protected app routes */}
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={
          <ProtectedRoute allowedRoles={['public', 'company', 'regulator', 'ngo', 'investor']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="stocks" element={
          <ProtectedRoute allowedRoles={['public', 'company', 'regulator', 'ngo', 'investor']}>
            <StockView />
          </ProtectedRoute>
        } />
        <Route path="carbon" element={
          <ProtectedRoute allowedRoles={['public', 'company', 'regulator', 'ngo', 'investor']}>
            <CarbonView />
          </ProtectedRoute>
        } />
        <Route path="crypto" element={
          <ProtectedRoute allowedRoles={['public', 'company', 'regulator', 'ngo', 'investor']}>
            <CryptoView />
          </ProtectedRoute>
        } />
        <Route path="forecasts" element={
          <ProtectedRoute allowedRoles={['public', 'company', 'regulator', 'ngo', 'investor']}>
            <ForecastView />
          </ProtectedRoute>
        } />
        <Route path="portfolio" element={
          <ProtectedRoute allowedRoles={['public', 'company', 'regulator', 'ngo', 'investor']}>
            <Portfolio />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['public', 'company', 'regulator', 'ngo', 'investor']}>
            <Reports />
          </ProtectedRoute>
        } />
        
        {/* Role-based dashboards */}
        <Route path="company-dashboard" element={
          <ProtectedRoute allowedRoles={['company']}>
            <CompanyDashboard />
          </ProtectedRoute>
        } />
        <Route path="regulator-dashboard" element={
          <ProtectedRoute allowedRoles={['regulator']}>
            <RegulatorDashboard />
          </ProtectedRoute>
        } />
        <Route path="ngo-dashboard" element={
          <ProtectedRoute allowedRoles={['ngo']}>
            <NGODashboard />
          </ProtectedRoute>
        } />
        <Route path="investor-dashboard" element={
          <ProtectedRoute allowedRoles={['investor']}>
            <InvestorDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route for app paths */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're working on fixing the problem.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <Router basename="/">
                <AppRoutes />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </Router>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
