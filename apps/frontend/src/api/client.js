import axios from 'axios';

// Force API calls through the Vite proxy in development (avoiding Chrome's restricted ports)
const api = axios.create({
  baseURL: '/api',
});
// Attach JWT token from sessionStorage to headers if present
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;