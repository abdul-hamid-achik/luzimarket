import api from '@/api/client';

/**
 * Fetch sales analytics data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date filter (ISO string)
 * @param {string} params.endDate - End date filter (ISO string)
 * @param {string} params.period - Period aggregation ('daily', 'weekly', 'monthly')
 */
export const getSalesAnalytics = (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
    });

    return api.get(`/analytics/sales?${searchParams.toString()}`).then((res) => res.data);
};

/**
 * Fetch order status analytics data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date filter (ISO string)
 * @param {string} params.endDate - End date filter (ISO string)
 * @param {string} params.period - Period aggregation ('daily', 'weekly', 'monthly')
 */
export const getOrderStatusAnalytics = (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
    });

    return api.get(`/analytics/order-status?${searchParams.toString()}`).then((res) => res.data);
};

/**
 * Fetch vendor performance analytics data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date filter (ISO string)
 * @param {string} params.endDate - End date filter (ISO string)
 * @param {number} params.limit - Limit number of results
 */
export const getVendorAnalytics = (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
    });

    return api.get(`/analytics/vendors?${searchParams.toString()}`).then((res) => res.data);
};

/**
 * Fetch category performance analytics data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date filter (ISO string)
 * @param {string} params.endDate - End date filter (ISO string)
 * @param {number} params.limit - Limit number of results
 */
export const getCategoryAnalytics = (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
    });

    return api.get(`/analytics/categories?${searchParams.toString()}`).then((res) => res.data);
};

/**
 * Fetch product performance analytics data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date filter (ISO string)
 * @param {string} params.endDate - End date filter (ISO string)
 * @param {number} params.limit - Limit number of results
 */
export const getProductAnalytics = (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
    });

    return api.get(`/analytics/products?${searchParams.toString()}`).then((res) => res.data);
};

/**
 * Fetch products analytics data (inventory and stats)
 * Alias for getProductAnalytics for clarity
 */
export const getProductsAnalytics = getProductAnalytics; 