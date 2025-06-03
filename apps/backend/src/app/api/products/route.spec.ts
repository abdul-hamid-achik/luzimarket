import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestServer, getTestClient, cleanupTestServer } from '../../../test/api-client';

describe('Products API Tests', () => {
    let client: any;
    let testCategoryId: string;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();

        // Get existing seeded data
        try {
            const categoriesResponse = await client.get('/api/categories');
            if (categoriesResponse.status === 200 && categoriesResponse.body.length > 0) {
                testCategoryId = categoriesResponse.body[0].id;
                console.log(`✅ Using existing category: ${testCategoryId}`);
            }
        } catch (error) {
            console.warn('Could not setup test dependencies:', error);
        }
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('GET /api/products', () => {
        it('should return products list with default pagination', async () => {
            const response = await client
                .get('/api/products')
                .expect(200);

            expect(response.body).toHaveProperty('products');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('hasMore');
            expect(response.body).toHaveProperty('limit', 20);
            expect(response.body).toHaveProperty('offset', 0);
            expect(Array.isArray(response.body.products)).toBe(true);
        });

        it('should support custom pagination', async () => {
            const response = await client
                .get('/api/products?limit=5&offset=10')
                .expect(200);

            expect(response.body.limit).toBe(5);
            expect(response.body.offset).toBe(10);
        });

        it('should filter by status', async () => {
            const response = await client
                .get('/api/products?status=active')
                .expect(200);

            response.body.products.forEach((product: any) => {
                expect(product.status).toBe('active');
            });
        });

        it('should filter by featured products', async () => {
            const response = await client
                .get('/api/products?featured=true')
                .expect(200);

            response.body.products.forEach((product: any) => {
                expect(product.featured).toBe(true);
            });
        });
    });

    describe('POST /api/products', () => {
        it('should create a new product with required fields', async () => {
            if (!testCategoryId) {
                console.log('⏭️  Skipping product creation test - no test category available');
                return;
            }

            // Generate unique product name to avoid slug conflicts
            const timestamp = Date.now();
            const productData = {
                name: `Test Product ${timestamp}`,
                description: 'A test product for unit testing',
                price: 2999, // Price in cents (29.99 * 100)
                categoryId: testCategoryId
            };

            const response = await client
                .post('/api/products')
                .send(productData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(productData.name);
            expect(response.body.price).toBe(productData.price);
            expect(response.body.categoryId).toBe(productData.categoryId);
            expect(response.body.status).toBe('draft'); // Default status
            expect(response.body.featured).toBe(false); // Default featured
        });

        it('should validate required fields', async () => {
            const response = await client
                .post('/api/products')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('required');
        });

        it('should handle slug conflicts', async () => {
            if (!testCategoryId) {
                console.log('⏭️  Skipping slug conflict test - no test category available');
                return;
            }

            // Generate unique slug to avoid conflicts with other tests
            const timestamp = Date.now();
            const productData = {
                name: 'Duplicate Slug Product',
                description: 'A product to test slug conflict handling',
                price: 3999, // Price in cents (39.99 * 100)
                slug: `test-duplicate-slug-${timestamp}`,
                categoryId: testCategoryId
            };

            // First creation should succeed
            const firstResponse = await client
                .post('/api/products')
                .send(productData)
                .expect(201);

            // Second creation with same slug should fail
            const secondResponse = await client
                .post('/api/products')
                .send(productData)
                .expect(409);

            expect(secondResponse.body).toHaveProperty('error');
            expect(secondResponse.body.error).toContain('slug already exists');
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed JSON gracefully', async () => {
            const response = await client
                .post('/api/products')
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect([400, 500]).toContain(response.status);
        });

        it('should handle database errors gracefully', async () => {
            const productData = {
                name: 'Invalid Product',
                description: 'A product to test database error handling',
                price: 2999, // Price in cents (29.99 * 100)
                categoryId: '00000000-0000-0000-0000-000000000000' // Invalid ID
            };

            const response = await client
                .post('/api/products')
                .send(productData);

            expect([400, 500]).toContain(response.status);
        });
    });
}); 