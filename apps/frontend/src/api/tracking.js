import api from "@/api/client";

/**
 * Track an order by tracking number
 * @param {string} trackingNumber
 */
export const trackOrder = (trackingNumber) =>
  api.get(`/track/${trackingNumber.trim()}`).then((res) => res.data);