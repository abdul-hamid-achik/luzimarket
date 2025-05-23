import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBestSellers } from './bestSellers';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('bestSellers API', () => {
    beforeEach(() => {
        mockFetch.mockClear();
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

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockBestSellers,
        });

        const result = await getBestSellers();

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/products/best-sellers');
        expect(result).toEqual(mockBestSellers);
    });

    it('handles HTTP errors', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        await expect(getBestSellers()).rejects.toThrow('Failed to fetch best sellers: 500');
    });

    it('handles network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(getBestSellers()).rejects.toThrow('Network error');
    });

    it('handles empty response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        const result = await getBestSellers();

        expect(result).toEqual([]);
    });

    it('makes request to correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        await getBestSellers();

        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/products/best-sellers');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('handles malformed JSON response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => {
                throw new Error('Invalid JSON');
            },
        });

        await expect(getBestSellers()).rejects.toThrow('Invalid JSON');
    });

    it('handles 404 not found error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
        });

        await expect(getBestSellers()).rejects.toThrow('Failed to fetch best sellers: 404');
    });

    it('handles timeout errors', async () => {
        mockFetch.mockImplementationOnce(() =>
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 100)
            )
        );

        await expect(getBestSellers()).rejects.toThrow('Request timeout');
    });
}); 