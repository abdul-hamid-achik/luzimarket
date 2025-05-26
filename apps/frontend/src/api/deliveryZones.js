import api from "@/api/client";

/**
 * Fetch available delivery zones
 * @param {Object} params - Query parameters
 * @param {string} params.state - State to filter zones by
 * @param {boolean} params.active - Filter by active status
 * @param {string} params.sort - Sort parameter
 */
export const getDeliveryZones = (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.state) {
        queryParams.append('state', params.state);
    }
    if (params.active !== undefined) {
        queryParams.append('active', params.active.toString());
    }
    if (params.sort) {
        queryParams.append('sort', params.sort);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/delivery-zones?${queryString}` : '/delivery-zones';

    return api.get(url).then(res => res.data);
}; 