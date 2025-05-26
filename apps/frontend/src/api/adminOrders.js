import api from "./client";

/**
 * Fetch mock orders for employees panel
 */
export const getAdminOrders = () => api.get('/admin/orders').then(res => res.data);