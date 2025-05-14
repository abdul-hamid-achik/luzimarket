import api from './client';

export const getFavorites = () =>
    api.get('/favorites').then(res => res.data); 