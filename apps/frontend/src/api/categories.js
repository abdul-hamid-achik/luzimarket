import api from './client';

export const getCategories = () =>
    api.get('/categories').then(res => res.data);

export const getCategory = (id) =>
    api.get(`/categories/${id}`).then(res => res.data);

export const getCategoryBySlug = (slug) =>
    api.get(`/categories/${slug}`).then(res => res.data); 