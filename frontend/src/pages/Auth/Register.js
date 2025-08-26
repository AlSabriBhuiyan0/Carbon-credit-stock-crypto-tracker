import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'investor',
    company_id: ''
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.fromPlanSelection && location.state?.selectedPlan) {
      setSelectedPlan(location.state.selectedPlan);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData, selectedPlan: selectedPlan?.id || 'starter' };
      await register(payload);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlanChange = () => navigate('/plans');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          {selectedPlan && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {selectedPlan.name} Plan Selected
              </span>
              <button onClick={handlePlanChange} className="ml-2 text-primary-600 hover:text-primary-700 text-sm underline">
                Change Plan
              </button>
            </div>
          )}
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input type="text" name="first_name" className="input-field mt-1" value={formData.first_name} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input type="text" name="last_name" className="input-field mt-1" value={formData.last_name} onChange={handleInputChange} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" name="username" className="input-field mt-1" value={formData.username} onChange={handleInputChange} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" className="input-field mt-1" value={formData.email} onChange={handleInputChange} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select name="role" className="input-field mt-1" value={formData.role} onChange={handleInputChange} required>
                <option value="investor">Investor</option>
                <option value="company">Company</option>
                <option value="regulator">Regulator</option>
                <option value="ngo">NGO</option>
                <option value="public">Public User</option>
              </select>
            </div>

            {(formData.role === 'investor' || formData.role === 'company') && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Company ID <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="company_id" 
                  className="input-field mt-1" 
                  value={formData.company_id} 
                  onChange={handleInputChange} 
                  placeholder="e.g., INV001, COMP123"
                  required={formData.role === 'investor' || formData.role === 'company'} 
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" name="password" className="input-field mt-1" value={formData.password} onChange={handleInputChange} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input type="password" name="confirmPassword" className="input-field mt-1" value={formData.confirmPassword} onChange={handleInputChange} required />
            </div>

            <button type="submit" className="w-full btn-primary" disabled={submitting}>{submitting ? 'Creating account...' : 'Create Account'}</button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-primary-600 hover:text-primary-700 font-medium">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
