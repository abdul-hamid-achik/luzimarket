// console.log('ACTUAL PRODUCTS API:', __filename);
import api from "@/api/client";

export const getProducts = (filters = {}) => api.get('/products', { params: filters }).then(res => res.data);
export const getProduct = (id) => api.get(`/products/${id}`).then(res => res.data);

/**
 * Create new product (CMS)
 */
export const createProduct = (productData) => api.post('/products', productData).then(res => res.data);

/**
 * Update product (CMS)
 */
export const updateProduct = ({ productId, ...productData }) =>
    api.put(`/products/${productId}`, productData).then(res => res.data);

/**
 * Delete product (CMS)
 */
export const deleteProduct = (productId) => api.delete(`/products/${productId}`).then(res => res.data);

/**
 * Get delivery zones for a product (CMS)
 */
export const getProductDeliveryZones = (productId) =>
    api.get(`/products/${productId}/delivery-zones`).then(res => res.data);

/**
 * Update delivery zones for a product (CMS)
 */
export const updateProductDeliveryZones = ({ productId, delivery_zones }) =>
    api.put(`/products/${productId}/delivery-zones`, { delivery_zones }).then(res => res.data);