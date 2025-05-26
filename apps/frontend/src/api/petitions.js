import api from './client';

/**
 * Fetch petition summary cards
 * @returns Promise resolving to array of petitions
 */
export const getPetitions = () =>
  api.get('/petitions').then((res) => res.data);