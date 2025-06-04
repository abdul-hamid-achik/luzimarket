import api from './client';

export const getCategories = () =>
    api.get('/categories').then(res => res.data);

export const getCategory = (id) =>
    api.get(`/categories/${id}`).then(res => res.data);

export const getCategoryBySlug = (slug) =>
    api.get(`/categories/${slug}`).then(res => res.data);

export const createCategory = (categoryData) =>
    api.post('/categories', categoryData).then(res => res.data);

export const updateCategory = ({ categoryId, ...categoryData }) =>
    api.put(`/categories/${categoryId}`, categoryData).then(res => res.data);

export const deleteCategory = (categoryId) =>
    api.delete(`/categories/${categoryId}`).then(res => res.data); 