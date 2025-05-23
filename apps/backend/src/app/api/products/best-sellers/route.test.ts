import { GET } from './route';
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock the database service
vi.mock('@/db/service', () => ({
    dbService: {
        selectFields: vi.fn(),
        select: vi.fn(),
        execute: vi.fn()
    }
}));

// Mock the schema
vi.mock('@/db/schema', () => ({
    products: {
        id: 'products.id',
        slug: 'products.slug',
        name: 'products.name',
        description: 'products.description',
        price: 'products.price',
        categoryId: 'products.categoryId',
        createdAt: 'products.createdAt'
    },
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
        // Mock products data
        const mockProducts = [
            {
                id: '1',
                slug: 'ramo-rosas',
                name: 'Ramo de Rosas',
                description: 'Hermoso ramo de rosas frescas',
                price: 75000,
                categoryId: 'cat-1',
                createdAt: new Date('2024-01-01')
            },
            {
                id: '2',
                slug: 'chocolates-gourmet',
                name: 'Chocolates Gourmet',
                description: 'Selección premium de chocolates',
                price: 45000,
                categoryId: 'cat-2',
                createdAt: new Date('2024-01-02')
            }
        ];

        // Mock categories data
        const mockCategories = [
            { id: 'cat-1', name: 'Flores', slug: 'flores' },
            { id: 'cat-2', name: 'Dulces', slug: 'dulces' }
        ];

        // Mock photos data
        const mockPhotos = [
            { id: '1', productId: '1', url: 'https://blob.vercel-storage.com/test-image.jpg', alt: 'Ramo de Rosas', sortOrder: 0 },
            { id: '2', productId: '2', url: 'https://blob.vercel-storage.com/chocolates.jpg', alt: 'Chocolates Gourmet', sortOrder: 0 }
        ];

        // Mock variants data
        const mockVariants = [
            { id: 'var-1', productId: '1' },
            { id: 'var-2', productId: '2' }
        ];

        // Mock order items data
        const mockOrderItems = [
            { id: '1', variantId: 'var-1', quantity: 25 },
            { id: '2', variantId: 'var-2', quantity: 18 }
        ];

        // Setup the mocks
        vi.mocked(dbService.selectFields).mockResolvedValue(mockProducts);
        vi.mocked(dbService.select)
            .mockResolvedValueOnce(mockCategories)  // categories call
            .mockResolvedValueOnce(mockPhotos)      // photos call
            .mockResolvedValueOnce(mockOrderItems)  // orderItems call
            .mockResolvedValueOnce(mockVariants);   // productVariants call

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
        // Mock empty results for all tables
        vi.mocked(dbService.selectFields).mockResolvedValue([]);
        vi.mocked(dbService.select)
            .mockResolvedValueOnce([])  // categories
            .mockResolvedValueOnce([])  // photos
            .mockResolvedValueOnce([])  // orderItems
            .mockResolvedValueOnce([]); // productVariants

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
        // Mock database error
        vi.mocked(dbService.selectFields).mockRejectedValue(new Error('Database connection failed'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toMatchObject({
            error: 'Failed to fetch best sellers'
        });
    });

    it('should return products ordered by totalSold descending', async () => {
        const mockProducts = [
            {
                id: '1',
                slug: 'product-1',
                name: 'Product 1',
                description: 'Description 1',
                price: 50000,
                categoryId: 'cat-1',
                createdAt: new Date('2024-01-01')
            },
            {
                id: '2',
                slug: 'product-2',
                name: 'Product 2',
                description: 'Description 2',
                price: 60000,
                categoryId: 'cat-2',
                createdAt: new Date('2024-01-02')
            },
            {
                id: '3',
                slug: 'product-3',
                name: 'Product 3',
                description: 'Description 3',
                price: 70000,
                categoryId: 'cat-3',
                createdAt: new Date('2024-01-03')
            }
        ];

        const mockCategories = [
            { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
            { id: 'cat-2', name: 'Category 2', slug: 'category-2' },
            { id: 'cat-3', name: 'Category 3', slug: 'category-3' }
        ];

        const mockPhotos = [
            { id: '1', productId: '1', url: '', alt: 'Product 1', sortOrder: 0 },
            { id: '2', productId: '2', url: '', alt: 'Product 2', sortOrder: 0 },
            { id: '3', productId: '3', url: '', alt: 'Product 3', sortOrder: 0 }
        ];

        const mockVariants = [
            { id: 'var-1', productId: '1' },
            { id: 'var-2', productId: '2' },
            { id: 'var-3', productId: '3' }
        ];

        const mockOrderItems = [
            { id: '1', variantId: 'var-1', quantity: 100 },
            { id: '2', variantId: 'var-2', quantity: 50 },
            { id: '3', variantId: 'var-3', quantity: 75 }
        ];

        vi.mocked(dbService.selectFields).mockResolvedValue(mockProducts);
        vi.mocked(dbService.select)
            .mockResolvedValueOnce(mockCategories)
            .mockResolvedValueOnce(mockPhotos)
            .mockResolvedValueOnce(mockOrderItems)
            .mockResolvedValueOnce(mockVariants);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data[0].totalSold).toBe(100);
        expect(data[1].totalSold).toBe(75);
        expect(data[2].totalSold).toBe(50);
    });

    it('should convert totalSold to number', async () => {
        const mockProducts = [
            {
                id: '1',
                slug: 'product-1',
                name: 'Product 1',
                description: 'Description 1',
                price: 50000,
                categoryId: 'cat-1',
                createdAt: new Date('2024-01-01')
            }
        ];

        const mockCategories = [
            { id: 'cat-1', name: 'Category 1', slug: 'category-1' }
        ];

        const mockPhotos = [
            { id: '1', productId: '1', url: '', alt: 'Product 1', sortOrder: 0 }
        ];

        const mockVariants = [
            { id: 'var-1', productId: '1' }
        ];

        const mockOrderItems = [
            { id: '1', variantId: 'var-1', quantity: 42 }
        ];

        vi.mocked(dbService.selectFields).mockResolvedValue(mockProducts);
        vi.mocked(dbService.select)
            .mockResolvedValueOnce(mockCategories)
            .mockResolvedValueOnce(mockPhotos)
            .mockResolvedValueOnce(mockOrderItems)
            .mockResolvedValueOnce(mockVariants);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(typeof data[0].totalSold).toBe('number');
        expect(data[0].totalSold).toBe(42);
    });
}); 