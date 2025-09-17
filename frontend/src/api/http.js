import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Token helpers
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = ({ token, refreshToken }) => {
  if (token) localStorage.setItem('access_token', token);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
  // Notify AuthContext about successful token refresh
  if (token) {
    window.dispatchEvent(new Event('tokenRefreshed'));
  }
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('userRole');
  
  // Trigger a custom event to notify AuthContext
  window.dispatchEvent(new CustomEvent('tokenExpired'));
};

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 10000, // Reduced timeout to 10 seconds
});

// Attach Authorization header
http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests = [];
let refreshPromise = null;

const processQueue = (error, token = null) => {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  pendingRequests = [];
  refreshPromise = null;
};

// Event to notify AuthContext about token refresh
const notifyTokenRefresh = () => {
  window.dispatchEvent(new CustomEvent('tokenRefreshed'));
};

const notifyTokenExpired = () => {
  window.dispatchEvent(new CustomEvent('tokenExpired'));
};

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized and we have a refresh token, try to refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(http(originalRequest));
            },
            reject,
          });
        });
      }

      // If there's already a refresh in progress, wait for it
      if (refreshPromise) {
        try {
          const newToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return http(originalRequest);
        } catch (error) {
          return Promise.reject(error);
        }
      }

      isRefreshing = true;

      refreshPromise = (async () => {
        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) throw new Error('No refresh token');

          const resp = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
          const { token: newToken, refreshToken: newRefresh } = resp.data;
          setTokens({ token: newToken, refreshToken: newRefresh });

          // Notify AuthContext about successful token refresh
          notifyTokenRefresh();

          processQueue(null, newToken);
          return newToken;
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr);
          processQueue(refreshErr, null);
          clearTokens();
          
          // Notify AuthContext about token expiration with a slight delay
          setTimeout(() => notifyTokenExpired(), 100);
          
          throw refreshErr;
        } finally {
          isRefreshing = false;
        }
      })();

      try {
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return http(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export { http, setTokens, clearTokens, getAccessToken, getRefreshToken, notifyTokenRefresh, notifyTokenExpired };
