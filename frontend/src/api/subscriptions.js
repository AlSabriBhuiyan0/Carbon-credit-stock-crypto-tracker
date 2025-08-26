import { http } from './http';

const BASE_URL = '/api/subscriptions';

export const subscriptionsApi = {
  // Get all active subscription plans
  getPlans: async () => {
    try {
      const response = await http.get(`${BASE_URL}/plans`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  },

  // Get plan by slug
  getPlanBySlug: async (slug) => {
    try {
      const response = await http.get(`${BASE_URL}/plans/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      throw error;
    }
  },

  // Get user's current subscription
  getCurrentSubscription: async () => {
    try {
      const response = await http.get(`${BASE_URL}/user/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      throw error;
    }
  },

  // Get user's subscription history
  getSubscriptionHistory: async () => {
    try {
      const response = await http.get(`${BASE_URL}/user/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      throw error;
    }
  },

  // Cancel user's subscription
  cancelSubscription: async () => {
    try {
      const response = await http.post(`${BASE_URL}/user/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
};
