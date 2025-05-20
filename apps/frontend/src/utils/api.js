import { relatedProjects } from '@vercel/related-projects';

const isDev = process.env.NODE_ENV === 'development';

let API_BASE;

if (isDev) {
    // In development, Vite proxy will forward /api to http://localhost:8000
    API_BASE = '';
} else {
    // In production, use the related backend project URL
    const projects = relatedProjects();
    const backendProject = projects.find((p) => p.projectName === 'backend');
    API_BASE = backendProject?.url ?? '';
}

/**
 * Fetch helper that prefixes the path with the backend URL or uses proxy in dev.
 * @param path - API path starting with '/api'
 * @param options - fetch options
 */
export function apiFetch(path, options) {
    const url = `${API_BASE}${path}`;
    return fetch(url, options);
} 