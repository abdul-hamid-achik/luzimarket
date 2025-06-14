import api from "@/api/client";

export const getProfile = () => api.get('/profile').then(res => res.data);

export const updateProfile = (profileData) => api.put('/profile', profileData).then(res => res.data);