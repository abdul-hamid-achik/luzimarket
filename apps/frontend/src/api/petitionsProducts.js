import api from './client';

/**
 * Fetch product addition petitions
 */
export const getProductPetitions = () =>
  api.get('/petitions/products').then(res => res.data);