import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const newsApi = {
  getLatest: async (params = {}) => {
    const { data } = await axios.get(`${API_BASE}/news/latest`, { params });
    return data;
  },
  getTrending: async (params = {}) => {
    const { data } = await axios.get(`${API_BASE}/news/trending`, { params });
    return data;
  }
};


