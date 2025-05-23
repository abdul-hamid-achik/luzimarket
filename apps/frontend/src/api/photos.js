import api from "./client";

/**
 * Upload photo with FormData
 */
export const uploadPhoto = (formData) => {
    return api.post('/api/upload/photos', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }).then(res => res.data);
};

/**
 * Get photos with optional filtering
 */
export const getPhotos = (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, value);
        }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `/api/upload/photos?${queryString}` : '/api/upload/photos';

    return api.get(url).then(res => res.data);
};

/**
 * Delete photo by ID
 */
export const deletePhoto = (photoId) => api.delete(`/api/upload/photos/${photoId}`).then(res => res.data); 