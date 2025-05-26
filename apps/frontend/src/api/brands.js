import api from './client';

export const getBrands = () =>
    api.get('/brands').then(res => res.data); 