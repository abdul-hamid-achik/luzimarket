import api from "./client";

/**
 * Fetch all delivery states
 */
export const getStates = () => api.get('/states').then(res => res.data);