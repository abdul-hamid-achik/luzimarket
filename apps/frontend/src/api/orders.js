import api from "./client";

/**
 * Create a new order
 * @param {{ stripePaymentMethodId?: string, couponCode?: string }} payload
 */
export const createOrder = (payload) =>
  api.post('/orders', payload).then((res) => res.data);

/**
 * Fetch all orders for the user
 */
export const getOrders = () => api.get('/orders').then((res) => res.data);

/**
 * Fetch a single order by ID
 */
export const getOrder = (id) => api.get(`/orders/${id}`).then((res) => res.data);

/**
 * Update an order
 * @param {{ orderId: string, status?: string, shipping_status?: string }} payload
 */
export const updateOrder = ({ orderId, ...data }) =>
  api.put(`/orders/${orderId}`, data).then((res) => res.data);