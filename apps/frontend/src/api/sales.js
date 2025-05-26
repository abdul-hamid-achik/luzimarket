import api from "./client";

/**
 * Fetch sales data
 * @returns Promise resolving to array of sales objects
 */
export const getSales = () => api.get("/sales").then((res) => res.data);