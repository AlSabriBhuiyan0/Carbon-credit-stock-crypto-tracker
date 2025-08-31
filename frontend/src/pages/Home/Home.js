import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  const features = [
    { title: 'AI-Powered Forecasting', description: 'Prophet and ARIMA models for stocks and carbon credits', icon: '📊', color: 'from-blue-500 to-blue-600' },
    { title: 'Real Data Sources', description: 'Yahoo Finance and UNFCCC DI API integration', icon: '⚡', color: 'from-green-500 to-green-600' },
    { title: 'Portfolio Management', description: 'Track stocks and carbon credits together', icon: '💼', color: 'from-purple-500 to-purple-600' },
    { title: 'Smart Notifications', description: 'Market and compliance alerts you control', icon: '🔔', color: 'from-orange-500 to-orange-600' }
  ];

  const plans = [
    { name: 'Starter', price: '$29', period: '/month', features: ['Basic forecasting', 'Portfolio tracking', 'Market sentiment', 'Email notifications'], popular: false, color: 'border-gray-200' },
    { name: 'Professional', price: '$79', period: '/month', features: ['Prophet & ARIMA', 'Real-time alerts', 'Advanced analytics', 'Custom reports'], popular: true, color: 'border-primary-500' },
    { name: 'Enterprise', price: '$199', period: '/month', features: ['Custom models', 'API access', 'Dedicated support', 'White-label'], popular: false, color: 'border-gray-200' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <motion.h1 className="text-5xl md:text-6xl font-bold mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            Carbon credit tracker and stock,crypto asset prediction platform
          </motion.h1>
          <motion.p className="text-xl md:text-2xl mb-8 text-primary-100" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            AI-powered insights for sustainable investing
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
            <Link to="/plans" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Get Started</Link>
            <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors">Sign In</Link>
          </motion.div>
          <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}>
            <Link to="/admin/login" className="text-primary-100 hover:text-white text-sm underline transition-colors">
              Admin Portal →
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need for stocks and carbon credits</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div key={f.title} className="text-center p-6 rounded-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.1 }}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${f.color} flex items-center justify-center text-2xl`}>{f.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-600">Start now and upgrade anytime</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((p, i) => (
              <motion.div key={p.name} className={`bg-white rounded-lg shadow-lg p-8 border-2 ${p.color} relative`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.1 }}>
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold">Most Popular</span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{p.name}</h3>
                  <div className="mb-6"><span className="text-4xl font-bold text-primary-600">{p.price}</span><span className="text-gray-600">{p.period}</span></div>
                  <ul className="text-left space-y-3 mb-8">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>{feat}</li>
                    ))}
                  </ul>
                  <Link to="/plans" className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${p.popular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>Choose Plan</Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to start?</h2>
          <p className="text-xl text-primary-100 mb-8">Join investors using real data and AI to decide</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/plans" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Create Free Account</Link>
            <Link to="/login" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors">Sign In</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;


