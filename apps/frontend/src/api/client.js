import axios from 'axios';

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

// Attach JWT token from sessionStorage to headers if present
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add request logging
  if (typeof window !== 'undefined') {
    // Only log in browser
  }

  // Track request start time for duration logging
  config.metadata = { startTime: Date.now() };
  return config;
});

// Log responses and handle token expiration
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
  (error) => {
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

    // Handle token expiration (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      // Optionally clear token and redirect to login, or emit an event
      sessionStorage.removeItem('token');
      // Optionally, you could dispatch a logout event or redirect here
      // window.location.href = '/login'; // Uncomment if you want to force redirect
      console.warn('JWT token expired or invalid. User has been logged out.');
    }

    return Promise.reject(error);
  }
);

export default api;