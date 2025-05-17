import api from "@/api/client";

/**
 * Fetch available delivery zones
 */
export const getDeliveryZones = () =>
    api.get('/delivery-zones').then(res => res.data); 