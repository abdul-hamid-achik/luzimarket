import api from './client';

/**
 * Get all vendors
 */
export const getVendors = () => api.get('/admin/vendors').then(res => res.data);

/**
 * Get vendor by ID
 */
export const getVendor = (id) => api.get(`/admin/vendors/${id}`).then(res => res.data);

/**
 * Create new vendor
 */
export const createVendor = (vendorData) => api.post('/admin/vendors', vendorData).then(res => res.data);

/**
 * Update vendor
 */
export const updateVendor = ({ vendorId, ...vendorData }) =>
    api.put(`/admin/vendors/${vendorId}`, vendorData).then(res => res.data);

/**
 * Delete vendor
 */
export const deleteVendor = (vendorId) => api.delete(`/admin/vendors/${vendorId}`).then(res => res.data); 