import api from '@/api/client';

// Get all active homepage slides
export const getHomepageSlides = () => api.get('/homepage-slides').then(res => res.data);

// Get all homepage slides (including inactive ones for admin)
export const getAllHomepageSlides = () => api.get('/homepage-slides?includeInactive=true').then(res => res.data);

// Get single homepage slide
export const getHomepageSlide = (slideId) => api.get(`/homepage-slides/${slideId}`).then(res => res.data);

// Create new homepage slide
export const createHomepageSlide = (slideData) => api.post('/homepage-slides', slideData).then(res => res.data);

// Update homepage slide
export const updateHomepageSlide = ({ slideId, slideData }) => api.put(`/homepage-slides/${slideId}`, slideData).then(res => res.data);

// Delete homepage slide
export const deleteHomepageSlide = (slideId) => api.delete(`/homepage-slides/${slideId}`).then(res => res.data); 