import api from './client';

/**
 * Fetch available payment methods for the logged in user
 */
export const getPaymentMethods = () =>
  api.get('/payment-methods').then(res => res.data);
