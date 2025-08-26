import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { subscriptionsApi } from '../../api/subscriptions';

const PlanSelection = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch subscription plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await subscriptionsApi.getPlans();
        
        if (response.success) {
          // Transform API data to include UI properties
          const transformedPlans = response.data.map(plan => ({
            ...plan,
            id: plan.slug,
            period: plan.billing_cycle || 'month',
            color: plan.is_popular ? 'border-primary-500' : 'border-gray-200',
            bgColor: plan.is_popular ? 'bg-primary-50' : 'bg-gray-50'
          }));
          setPlans(transformedPlans);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleContinue = () => {
    if (!selectedPlan) return;
    navigate('/register', { state: { selectedPlan, fromPlanSelection: true } });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h1 className="text-4xl font-bold text-gray-900 mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>Choose Your Plan</motion.h1>
          <motion.p className="text-xl text-gray-600" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>Select a plan to continue to signup</motion.p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading subscription plans...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-red-600 hover:text-red-700 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan, index) => (
            <motion.div key={plan.id} className={`rounded-lg border-2 p-8 cursor-pointer transition-all duration-300 ${selectedPlan?.id === plan.id ? `${plan.color} ${plan.bgColor} shadow-lg scale-105` : 'border-gray-200 bg-white hover:shadow-md'}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} onClick={() => setSelectedPlan(plan)}>
              {selectedPlan?.id === plan.id && (
                <div className="text-center mb-4">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-4"><span className="text-4xl font-bold text-primary-600">${plan.price}</span><span className="text-gray-600">/{plan.period}</span></div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start"><svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg><span className="text-gray-700">{feature}</span></li>
                ))}
              </ul>
              <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${selectedPlan?.id === plan.id ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setSelectedPlan(plan)}>
                {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </motion.div>
                      ))}
          </div>
        )}

        {!loading && !error && (
          <div className="text-center">
            <motion.button className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${selectedPlan ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} onClick={handleContinue} disabled={!selectedPlan} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
              {selectedPlan ? `Continue with ${selectedPlan.name}` : 'Please select a plan'}
            </motion.button>
          </div>
        )}

        <div className="text-center mt-8">
          <button onClick={() => navigate('/')} className="text-primary-600 hover:text-primary-700 font-medium">← Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;


