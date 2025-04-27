import api from './client';

/**
 * Fetch branch/store petitions
 */
export const getBranchPetitions = () =>
  api.get('/petitions/branches').then(res => res.data);