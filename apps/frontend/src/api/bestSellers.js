import api from './client.js';

export const getBestSellers = async () => {
    try {
        const response = await api.get('/products/best-sellers');
        return response.data;
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        throw error;
    }
}; 