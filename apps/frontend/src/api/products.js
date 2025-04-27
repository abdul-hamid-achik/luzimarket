import api from "import./";

export const getProducts = () => api.get('/products').then(res => res.data);
export const getProduct = (id) => api.get(`/products/${id}`).then(res => res.data);