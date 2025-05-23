import api from "./client";

/**
 * Get all vendors for admin
 */
export const getVendors = () => api.get('/api/admin/vendors').then(res => res.data);

/**
 * Get vendor by ID
 */
export const getVendor = (vendorId) => api.get(`/api/admin/vendors/${vendorId}`).then(res => res.data);

/**
 * Create new vendor
 */
export const createVendor = (vendorData) => api.post('/api/admin/vendors', vendorData).then(res => res.data);

/**
 * Update vendor
 */
export const updateVendor = ({ vendorId, ...vendorData }) =>
    api.put(`/api/admin/vendors/${vendorId}`, vendorData).then(res => res.data);

/**
 * Delete vendor
 */
export const deleteVendor = (vendorId) => api.delete(`/api/admin/vendors/${vendorId}`).then(res => res.data); 