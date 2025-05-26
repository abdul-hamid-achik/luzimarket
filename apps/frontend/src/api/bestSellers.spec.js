import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBestSellers } from './bestSellers';

// Mock the API client
vi.mock('./client.js', () => ({
    default: {
        get: vi.fn()
    }
}));

import api from './client.js';

describe('bestSellers API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches best sellers successfully', async () => {
        const mockBestSellers = [
            {
                id: '1',
                slug: 'ramo-rosas',
                name: 'Ramo de Rosas',
                description: 'Hermoso ramo de rosas frescas',
                price: 75000,
                categoryId: 'cat-1',
                categoryName: 'Flores',
                categorySlug: 'flores',
                imageUrl: 'https://blob.vercel-storage.com/roses.jpg',
                imageAlt: 'Ramo de rosas',
                totalSold: 25
            },
            {
                id: '2',
                slug: 'chocolates-gourmet',
                name: 'Chocolates Gourmet',
                description: 'Deliciosos chocolates premium',
                price: 45000,
                categoryId: 'cat-2',
                categoryName: 'Dulces',
                categorySlug: 'dulces',
                imageUrl: 'https://blob.vercel-storage.com/chocolates.jpg',
                imageAlt: 'Chocolates',
                totalSold: 18
            }
        ];

        vi.mocked(api.get).mockResolvedValueOnce({
            data: mockBestSellers
        });

        const result = await getBestSellers();

        expect(api.get).toHaveBeenCalledWith('/products/best-sellers');
        expect(result).toEqual(mockBestSellers);
    });

    it('handles API errors', async () => {
        const error = new Error('API Error');
        vi.mocked(api.get).mockRejectedValueOnce(error);

        await expect(getBestSellers()).rejects.toThrow('API Error');
    });

    it('handles network errors', async () => {
        const networkError = new Error('Network error');
        vi.mocked(api.get).mockRejectedValueOnce(networkError);

        await expect(getBestSellers()).rejects.toThrow('Network error');
    });

    it('handles empty response', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({
            data: []
        });

        const result = await getBestSellers();

        expect(result).toEqual([]);
    });

    it('makes request to correct endpoint', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({
            data: []
        });

        await getBestSellers();

        expect(api.get).toHaveBeenCalledWith('/products/best-sellers');
        expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('handles axios response structure correctly', async () => {
        const mockData = [
            {
                id: '1',
                name: 'Test Product',
                price: 50000
            }
        ];

        vi.mocked(api.get).mockResolvedValueOnce({
            data: mockData,
            status: 200,
            statusText: 'OK'
        });

        const result = await getBestSellers();

        expect(result).toEqual(mockData);
    });

    it('handles API timeout errors', async () => {
        const timeoutError = new Error('Request timeout');
        timeoutError.code = 'ECONNABORTED';
        vi.mocked(api.get).mockRejectedValueOnce(timeoutError);

        await expect(getBestSellers()).rejects.toThrow('Request timeout');
    });

    it('propagates API client errors correctly', async () => {
        const apiError = {
            message: 'Server Error',
            response: {
                status: 500,
                data: { error: 'Internal Server Error' }
            }
        };
        vi.mocked(api.get).mockRejectedValueOnce(apiError);

        await expect(getBestSellers()).rejects.toMatchObject({
            message: 'Server Error',
            response: {
                status: 500,
                data: { error: 'Internal Server Error' }
            }
        });
    });
}); 