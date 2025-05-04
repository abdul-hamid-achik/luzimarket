import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV
    ? import.meta.env.VITE_API_URL || 'http://localhost:6000/api'
    : '/api',
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