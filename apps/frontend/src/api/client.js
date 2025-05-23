import axios from 'axios';
import { secureStorage } from '@/utils/storage';

// Determine baseURL: proxy in dev, static backend URL in production
const isDev = import.meta.env.MODE === 'development';

// Use environment variable for backend URL in production
// Support both VITE_API_HOST (just the host) and VITE_API_URL (full URL)
const apiHost = import.meta.env.VITE_API_HOST;
const apiUrl = import.meta.env.VITE_API_URL;

// Determine baseURL: dev proxy or production backend URL
const baseURL = isDev
  ? '/api'
  : apiHost
    ? `https://${apiHost}/api`
    : apiUrl
      ? apiUrl
      : '/api';

// Log API configuration for debugging
console.log('API Configuration:', {
  isDev,
  apiHost,
  apiUrl,
  baseURL,
  mode: import.meta.env.MODE
});

// Create axios instance with dynamic baseURL
const api = axios.create({ baseURL });

// Track ongoing refresh request to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Process the queue of failed requests after token refresh
const processQueue = (error, accessToken = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(accessToken);
    }
  });

  failedQueue = [];
};

// Refresh token function
const refreshAuthToken = async () => {
  const refreshToken = secureStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(`${baseURL}/auth/refresh`, {
      refreshToken
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Store new tokens using secure storage
    secureStorage.setTokens({ accessToken, refreshToken: newRefreshToken });

    return accessToken;
  } catch (error) {
    // Clear tokens if refresh fails
    secureStorage.clearTokens();
    throw error;
  }
};

// Attach JWT token from secure storage to headers if present
api.interceptors.request.use((config) => {
  const accessToken = secureStorage.getAccessToken();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Add request logging
  if (typeof window !== 'undefined') {
    // Only log in browser
  }

  // Track request start time for duration logging
  config.metadata = { startTime: Date.now() };
  return config;
});

// Log responses and handle token expiration with automatic refresh
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const startTime = response.config.metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : undefined;

    if (typeof window !== 'undefined') {
      // Only log in browser
    }

    return response;
  },
  async (error) => {
    // Calculate request duration if possible
    const startTime = error.config?.metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : undefined;

    if (typeof window !== 'undefined') {
      // Only log in browser
      if (error.response) {
        console.error(
          `[API ERROR] ${error.config.method?.toUpperCase() || 'GET'} ${error.config.baseURL || ''}${error.config.url} - ${error.response.status} (${duration ? duration + 'ms' : 'unknown duration'})`,
          {
            data: error.response.data,
            headers: error.response.headers,
          }
        );
      } else {
        console.error(
          `[API ERROR] ${error.config?.method?.toUpperCase() || 'REQUEST'} ${error.config?.baseURL || ''}${error.config?.url || ''} - NO RESPONSE (${duration ? duration + 'ms' : 'unknown duration'})`,
          error.message
        );
      }
    }

    const originalRequest = error.config;

    // Handle token expiration (401 Unauthorized) with automatic refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(accessToken => {
          originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAuthToken();
        processQueue(null, newAccessToken);

        // Retry the original request with the new token
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Clear tokens and optionally redirect to login
        secureStorage.clearTokens();
        console.warn('Token refresh failed. User has been logged out.');

        // Optionally trigger logout event or redirect
        // window.location.href = '/login'; // Uncomment if you want to force redirect

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;