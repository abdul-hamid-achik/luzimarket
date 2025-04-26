import api from './client';

/**
 * Register a new user
 * @param {{ email: string, password: string }} payload
 */
export const registerUser = (payload) =>
  api.post('/auth/register', payload).then((res) => res.data);

/**
 * Login an existing user
 * @param {{ email: string, password: string }} payload
 * @returns {{ token: string }}
 */
export const loginUser = (payload) =>
  api.post('/auth/login', payload).then((res) => res.data);