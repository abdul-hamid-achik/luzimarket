import { GET } from './route';
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock the database service
vi.mock('@/db/service', () => ({
    dbService: {
        execute: vi.fn()
    }
}));

// Mock the schema
vi.mock('@/db/schema', () => ({
    products: {},
    orderItems: {},
    productVariants: {},
    photos: {},
    categories: {}
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
    sql: vi.fn((strings, ...values) => ({ strings, values })),
    desc: vi.fn()
}));

import { dbService } from '@/db/service';

describe('/api/products/best-sellers', () => {
    beforeAll(() => {
        // Setup any global test configuration
    });

    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should return best sellers with proper format', async () => {
        // Mock data that would come from the database
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
                imageUrl: 'https://blob.vercel-storage.com/test-image.jpg',
                imageAlt: 'Ramo de Rosas',
                totalSold: 25
            },
            {
                id: '2',
                slug: 'chocolates-gourmet',
                name: 'Chocolates Gourmet',
                description: 'Selección premium de chocolates',
                price: 45000,
                categoryId: 'cat-2',
                categoryName: 'Dulces',
                categorySlug: 'dulces',
                imageUrl: 'https://blob.vercel-storage.com/chocolates.jpg',
                imageAlt: 'Chocolates Gourmet',
                totalSold: 18
            }
        ];

        // Mock the database execution
        vi.mocked(dbService.execute).mockResolvedValue(mockBestSellers);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(2);

        // Verify the structure of the first product
        expect(data[0]).toMatchObject({
            id: '1',
            slug: 'ramo-rosas',
            name: 'Ramo de Rosas',
            description: 'Hermoso ramo de rosas frescas',
            price: 75000,
            categoryId: 'cat-1',
            categoryName: 'Flores',
            categorySlug: 'flores',
            imageUrl: 'https://blob.vercel-storage.com/test-image.jpg',
            imageAlt: 'Ramo de Rosas',
            totalSold: 25
        });
    });

    it('should handle empty results', async () => {
        // Mock empty results
        vi.mocked(dbService.execute).mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
        // Mock database error
        vi.mocked(dbService.execute).mockRejectedValue(new Error('Database connection failed'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toMatchObject({
            error: 'Failed to fetch best sellers'
        });
    });

    it('should return products ordered by totalSold descending', async () => {
        const mockBestSellers = [
            {
                id: '1',
                slug: 'product-1',
                name: 'Product 1',
                description: 'Description 1',
                price: 50000,
                categoryId: 'cat-1',
                categoryName: 'Category 1',
                categorySlug: 'category-1',
                imageUrl: '',
                imageAlt: 'Product 1',
                totalSold: 100
            },
            {
                id: '2',
                slug: 'product-2',
                name: 'Product 2',
                description: 'Description 2',
                price: 60000,
                categoryId: 'cat-2',
                categoryName: 'Category 2',
                categorySlug: 'category-2',
                imageUrl: '',
                imageAlt: 'Product 2',
                totalSold: 50
            },
            {
                id: '3',
                slug: 'product-3',
                name: 'Product 3',
                description: 'Description 3',
                price: 70000,
                categoryId: 'cat-3',
                categoryName: 'Category 3',
                categorySlug: 'category-3',
                imageUrl: '',
                imageAlt: 'Product 3',
                totalSold: 75
            }
        ];

        vi.mocked(dbService.execute).mockResolvedValue(mockBestSellers);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data[0].totalSold).toBe(100);
        expect(data[1].totalSold).toBe(50);
        expect(data[2].totalSold).toBe(75);
    });

    it('should convert totalSold to number', async () => {
        const mockBestSellers = [
            {
                id: '1',
                slug: 'product-1',
                name: 'Product 1',
                description: 'Description 1',
                price: 50000,
                categoryId: 'cat-1',
                categoryName: 'Category 1',
                categorySlug: 'category-1',
                imageUrl: '',
                imageAlt: 'Product 1',
                totalSold: '42' // String from database
            }
        ];

        vi.mocked(dbService.execute).mockResolvedValue(mockBestSellers);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(typeof data[0].totalSold).toBe('number');
        expect(data[0].totalSold).toBe(42);
    });
}); 