import api from "@/api/client";

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

/**
 * Refresh the access token using refresh token
 */
export const refreshToken = ({ refreshToken }) =>
  api.post('/auth/refresh', { refreshToken }).then((res) => res.data);

/**
 * Update session with delivery zone selection
 */
export const updateSessionDeliveryZone = ({ deliveryZoneId }) =>
  api.patch('/auth/update-session', { deliveryZoneId }).then((res) => res.data);

/**
 * Restore user delivery preferences to session
 */
export const restoreUserPreferences = () =>
  api.post('/auth/restore-preferences').then((res) => res.data);

/**
 * Get guest token for anonymous users
 */
export const getGuestToken = () =>
  api.post('/auth/guest').then((res) => res.data);

/**
 * Create Stripe customer portal session
 */
export const createCustomerPortalSession = (payload = {}) =>
  api.post('/create-customer-portal-session', payload).then((res) => res.data);