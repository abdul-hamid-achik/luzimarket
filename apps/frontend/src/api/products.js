// console.log('ACTUAL PRODUCTS API:', __filename);
import api from "@/api/client";

export const getProducts = (filters = {}) => api.get('/products', { params: filters }).then(res => res.data);
export const getProduct = (id) => api.get(`/products/${id}`).then(res => res.data);