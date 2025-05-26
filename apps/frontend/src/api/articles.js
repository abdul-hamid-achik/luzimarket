import api from './client';

export const getArticles = () =>
    api.get('/articles').then(res => res.data);

export const getArticle = (id) =>
    api.get(`/articles/${id}`).then(res => res.data); 