import api from './client';

/**
 * Fetch admission (affiliate) petitions
 */
export const getAdmissionPetitions = () =>
  api.get('/petitions/admissions').then(res => res.data);