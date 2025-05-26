import api from './client';

export const getFavorites = () =>
    api.get('/favorites').then(res => res.data);

export const addToFavorites = ({ variantId, productId }) =>
    api.post('/favorites', { variantId, productId }).then(res => res.data);

export const removeFromFavorites = ({ variantId }) =>
    api.delete('/favorites', { data: { variantId } }).then(res => res.data);

export const getFavoritesAnalytics = (limit = 10) =>
    api.get(`/analytics/favorites?limit=${limit}`).then(res => res.data); 