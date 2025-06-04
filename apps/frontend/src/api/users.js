import api from './client';

export const getUsers = (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    return api.get(`/users?${params.toString()}`).then(res => res.data);
};

export const getUser = (userId) =>
    api.get(`/users/${userId}`).then(res => res.data);

export const createUser = (userData) =>
    api.post('/users', userData).then(res => res.data);

export const updateUser = ({ userId, ...userData }) =>
    api.put(`/users/${userId}`, userData).then(res => res.data);

export const deleteUser = (userId) =>
    api.delete(`/users/${userId}`).then(res => res.data);

export const updateUserStatus = ({ userId, status }) =>
    api.patch(`/users/${userId}/status`, { status }).then(res => res.data);

export const getUserOrders = (userId) =>
    api.get(`/users/${userId}/orders`).then(res => res.data);

export const getUserStats = (userId) =>
    api.get(`/users/${userId}/stats`).then(res => res.data); 