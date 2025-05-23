import api from "./client";

/**
 * Upload a photo for a product
 */
export const uploadPhoto = (formData) => {
    return api.post('/upload/photos', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }).then(res => res.data);
};

/**
 * Get photos for a product or all photos
 */
export const getPhotos = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.productId) {
        params.append('productId', filters.productId);
    }
    const url = `/upload/photos${params.toString() ? '?' + params.toString() : ''}`;
    return api.get(url).then(res => res.data);
};

/**
 * Delete photo by ID
 */
export const deletePhoto = (photoId) => api.delete(`/upload/photos/${photoId}`).then(res => res.data); 