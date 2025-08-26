import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDemoCredentialsForDisplay } from '../../config/demoUsers';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      // Always use real backend API for authentication
      await login({ email, password });
      
      // Navigate based on user role
      const userRole = localStorage.getItem('userRole') || 'investor';
      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/app/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const demoCredentials = getDemoCredentialsForDisplay();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="input-field mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                className="input-field mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="w-full btn-primary" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showDemoCredentials ? 'Hide Demo Credentials' : 'Show Demo Credentials'}
            </button>
            
            {showDemoCredentials && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-500 text-center">
                  Use these demo accounts to test different user roles
                </p>
                
                {demoCredentials.map((cred, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-gray-50 rounded-lg text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.password);
                    }}
                    title="Click to fill form with these credentials"
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {cred.role} Account
                    </div>
                    <div className="text-gray-600 space-y-1">
                      <div><span className="font-medium">Email:</span> {cred.email}</div>
                      <div><span className="font-medium">Password:</span> {cred.password}</div>
                    </div>
                    <div className="text-gray-500 mt-1 text-xs">
                      {cred.description}
                    </div>
                  </div>
                ))}
                
                <div className="text-center text-xs text-gray-400 mt-2">
                  Click on any credential to auto-fill the form
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
