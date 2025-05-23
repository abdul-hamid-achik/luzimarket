const API_BASE_URL = 'http://localhost:3000/api';

export const getBestSellers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/best-sellers`);

        if (!response.ok) {
            throw new Error(`Failed to fetch best sellers: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        throw error;
    }
}; 