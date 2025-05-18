import api from "@/api/client";

export const getCart = () => api.get('/cart').then(res => res.data);
export const addToCart = (payload) => api.post('/cart', payload).then(res => res.data);
export const updateCartItem = ({ itemId, quantity }) =>
  api.put('/cart', { itemId, quantity }).then(res => res.data);
export const removeCartItem = (itemId) =>
  api.delete('/cart', { data: { itemId } }).then(res => res.data);
export const clearCart = () => api.delete('/cart').then(res => res.data);