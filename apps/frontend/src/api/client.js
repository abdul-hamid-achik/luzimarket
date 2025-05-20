import axios from 'axios';
import { relatedProjects } from '@vercel/related-projects';

// Determine baseURL: proxy in dev, relatedProjects URL in production
const isDev = process.env.NODE_ENV === 'development';
let baseURL = '/api';
if (!isDev) {
  const projects = relatedProjects({ noThrow: true });
  const backend = projects.find(p => p.project.name === 'luzimarket-backend');
  const host = backend?.production.url || backend?.production.alias;
  if (host) {
    // Ensure HTTPS and prepend /api
    baseURL = `https://${host}/api`;
  }
}

// Create axios instance with dynamic baseURL
const api = axios.create({ baseURL });

// Attach JWT token from sessionStorage to headers if present
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;