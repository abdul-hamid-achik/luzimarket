import api from "@/api/client";

export const getProductDetails = (productId) =>
  api
    .get(`/product-details?filters[productId][$eq]=${productId}`)
    .then((res) => res.data.data);
