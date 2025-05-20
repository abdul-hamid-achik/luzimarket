import axios from 'axios';
import { withRelatedProject } from '@vercel/related-projects';

// Determine baseURL: proxy in dev, relatedProjects URL in production
const isDev = import.meta.env.MODE === 'development';
console.log('[API CLIENT] MODE:', import.meta.env.MODE, 'isDev:', isDev);

// In production, link to your backend via withRelatedProject
// Uses VERCEL_RELATED_PROJECTS under the hood; fallback to VITE_API_HOST
const projectName = 'luzimarket-backend';
const defaultHost = import.meta.env.VITE_API_HOST;
const host = isDev
  ? null
  : withRelatedProject({ projectName, defaultHost, noThrow: true });
console.log('[API CLIENT] withRelatedProject host:', host);

// Determine baseURL: dev proxy or production backend URL
const baseURL = isDev
  ? '/api'
  : host
    ? `https://${host}/api`
    : '/api';
console.log('[API CLIENT] baseURL:', baseURL);

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
    console.log(
      `[API REQUEST] ${config.method?.toUpperCase() || 'GET'} ${config.baseURL || ''}${config.url}`,
      {
        headers: config.headers,
        params: config.params,
        data: config.data,
      }
    );
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
      console.log(
        `[API RESPONSE] ${response.config.method?.toUpperCase() || 'GET'} ${response.config.baseURL || ''}${response.config.url} - ${response.status} (${duration ? duration + 'ms' : 'unknown duration'})`,
        {
          data: response.data,
          headers: response.headers,
        }
      );
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