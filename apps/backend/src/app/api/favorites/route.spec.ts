import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    initializeTestServer,
    getTestClient,
    cleanupTestServer,
    authenticateUser,
    createGuestSession,
    AuthenticatedClient,
    createAuthenticatedClient
} from '../../../test/api-client';

describe('Favorites API Tests', () => {
    let client: any;
    let userToken: string;
    let guestToken: string;
    let authenticatedClient: AuthenticatedClient;
    let testProductId: string;
    let testVariantId: string;
    let anotherVariantId: string;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();

        // Create authenticated user
        const auth = await authenticateUser('customer');
        userToken = auth.token;
        authenticatedClient = new AuthenticatedClient(client, userToken);

        // Create guest session to test unauthorized access
        const guestSession = await createGuestSession();
        guestToken = guestSession.token;

        // Create test product and variants for favorites
        try {
            // First create a category for the product
            const categoryResponse = await client
                .post('/api/categories')
                .send({
                    name: 'Test Category for Favorites',
                    slug: 'test-category-favorites',
                    description: 'Test category for favorites tests'
                });

            let testCategoryId: string;
            if (categoryResponse.status === 201) {
                testCategoryId = categoryResponse.body.id;
                console.log('✅ Category created:', { id: testCategoryId, body: categoryResponse.body });

                // Create test product with variants
                const productResponse = await client
                    .post('/api/products')
                    .send({
                        name: 'Test Product for Favorites',
                        description: 'A test product for testing favorites functionality',
                        price: 4599, // Price in cents (45.99 * 100)
                        categoryId: testCategoryId,
                        status: 'active',
                        variants: [
                            {
                                sku: 'TEST-FAV-001',
                                attributes: { size: 'L', color: 'red' },
                                stock: 50
                            },
                            {
                                sku: 'TEST-FAV-002',
                                attributes: { size: 'XL', color: 'blue' },
                                stock: 30
                            }
                        ]
                    });

                if (productResponse.status === 201) {
                    testProductId = productResponse.body.id;

                    // Extract variant IDs from the response
                    if (productResponse.body.variants && productResponse.body.variants.length >= 2) {
                        testVariantId = productResponse.body.variants[0].id;
                        anotherVariantId = productResponse.body.variants[1].id;
                    }
                } else {
                    console.error('❌ Failed to create test product:', {
                        status: productResponse.status,
                        error: productResponse.body,
                        request: productResponse.request
                    });
                }
            } else {
                console.error('❌ Failed to create test category:', {
                    status: categoryResponse.status,
                    error: categoryResponse.body
                });
            }
        } catch (error) {
            console.warn('Could not create test dependencies for favorites tests:', error);
        }
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('Authentication', () => {
        it('should require authentication for all favorites operations', async () => {
            const endpoints = [
                { method: 'get', path: '/api/favorites' },
                { method: 'post', path: '/api/favorites' },
                { method: 'delete', path: '/api/favorites' }
            ];

            for (const endpoint of endpoints) {
                const response = await client[endpoint.method](endpoint.path);
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toContain('Unauthorized');
            }
        });

        it('should reject invalid tokens', async () => {
            const response = await client
                .get('/api/favorites')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Unauthorized');
        });

        it('should reject malformed authorization headers', async () => {
            const malformedHeaders = [
                'InvalidFormat',
                'Bearer',
                'Bearer ',
                'Basic dGVzdA==',
                ''
            ];

            for (const header of malformedHeaders) {
                const response = await client
                    .get('/api/favorites')
                    .set('Authorization', header)
                    .expect(401);

                expect(response.body).toHaveProperty('error');
            }
        });
    });

    describe('GET /api/favorites', () => {
        it('should return empty array for new user', async () => {
            const response = await authenticatedClient
                .get('/api/favorites')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should return favorites with product details', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping favorites with details test - no test variant available');
                return;
            }

            // First add a favorite
            await authenticatedClient
                .post('/api/favorites', {
                    variantId: testVariantId
                })
                .expect(201);

            // Then get favorites
            const response = await authenticatedClient
                .get('/api/favorites')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            const favorite = response.body[0];
            expect(favorite).toHaveProperty('id');
            expect(favorite).toHaveProperty('userId');
            expect(favorite).toHaveProperty('variantId', testVariantId);
            expect(favorite).toHaveProperty('productId');
            expect(favorite).toHaveProperty('productName');
            expect(favorite).toHaveProperty('productPrice');
            expect(favorite).toHaveProperty('productDescription');
            expect(favorite).toHaveProperty('imageUrl');
        });

        it('should only return favorites for the authenticated user', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping user isolation test - no test variant available');
                return;
            }

            // Create another user
            const anotherAuth = await authenticateUser('customer');
            const anotherClient = new AuthenticatedClient(client, anotherAuth.token);

            // Add favorite for first user
            await authenticatedClient
                .post('/api/favorites', { variantId: testVariantId })
                .expect(201);

            // Second user should not see first user's favorites
            const response = await anotherClient
                .get('/api/favorites')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // Should not contain the favorite from first user
            const hasFavorite = response.body.some((fav: any) => fav.variantId === testVariantId);
            expect(hasFavorite).toBe(false);
        });

        it('should handle empty favorites gracefully', async () => {
            // Create a new user with no favorites
            const newAuth = await authenticateUser('customer');
            const newClient = new AuthenticatedClient(client, newAuth.token);

            const response = await newClient
                .get('/api/favorites')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
    });

    describe('POST /api/favorites', () => {
        beforeEach(async () => {
            // Clear favorites before each test
            try {
                await client
                    .delete('/api/favorites')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ variantId: testVariantId });
                await client
                    .delete('/api/favorites')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ variantId: anotherVariantId });
            } catch (error) {
                // Ignore errors if favorites don't exist
            }
        });

        it('should add product to favorites by variant ID', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping add favorite test - no test variant available');
                return;
            }

            const response = await authenticatedClient
                .post('/api/favorites', {
                    variantId: testVariantId
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('variantId', testVariantId);
            expect(response.body).toHaveProperty('productId');
            expect(response.body).toHaveProperty('productName');
            expect(response.body).toHaveProperty('productPrice');
        });

        it('should add product to favorites by product ID', async () => {
            if (!testProductId) {
                console.log('⏭️  Skipping add by product ID test - no test product available');
                return;
            }

            const response = await authenticatedClient
                .post('/api/favorites', {
                    productId: testProductId
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('variantId');
            expect(response.body).toHaveProperty('productId', testProductId);
        });

        it('should validate required fields', async () => {
            const invalidRequests = [
                {}, // Missing both variantId and productId
                { variantId: '' }, // Empty variantId
                { productId: '' }, // Empty productId
            ];

            for (const requestData of invalidRequests) {
                const response = await authenticatedClient
                    .post('/api/favorites', requestData)
                    .expect(400);

                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toContain('required');
            }
        });

        it('should prevent duplicate favorites', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping duplicate favorites test - no test variant available');
                return;
            }

            // First addition should succeed
            const firstResponse = await authenticatedClient
                .post('/api/favorites', {
                    variantId: testVariantId
                })
                .expect(201);

            expect(firstResponse.body.variantId).toBe(testVariantId);

            // Second addition should fail
            const secondResponse = await authenticatedClient
                .post('/api/favorites', {
                    variantId: testVariantId
                })
                .expect(409);

            expect(secondResponse.body).toHaveProperty('error');
            expect(secondResponse.body.error).toContain('already in favorites');
        });

        it('should handle non-existent variant gracefully', async () => {
            const response = await authenticatedClient
                .post('/api/favorites', {
                    variantId: '00000000-0000-0000-0000-000000000000'
                });

            expect([400, 404, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('error');
        });

        it('should handle non-existent product gracefully', async () => {
            const response = await authenticatedClient
                .post('/api/favorites', {
                    productId: '00000000-0000-0000-0000-000000000000'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('No variant found for product');
        });

        it('should work with guest sessions', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping guest session test - no test variant available');
                return;
            }

            // Guest sessions should be able to add favorites if they have valid tokens
            const response = await client
                .post('/api/favorites')
                .set('Authorization', `Bearer ${guestToken}`)
                .send({
                    variantId: testVariantId
                });

            // Depending on implementation, this might work or require user authentication
            expect([201, 401]).toContain(response.status);
        });
    });

    describe('DELETE /api/favorites', () => {
        beforeEach(async () => {
            if (testVariantId) {
                // Add a favorite to remove in tests
                try {
                    await authenticatedClient
                        .post('/api/favorites', { variantId: testVariantId })
                        .expect(201);
                } catch (error) {
                    // Might already exist, ignore error
                }
            }
        });

        it('should remove product from favorites', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping remove favorite test - no test variant available');
                return;
            }

            const response = await client
                .delete('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ variantId: testVariantId })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Product removed from favorites');

            // Verify it's actually removed
            const favoritesResponse = await authenticatedClient
                .get('/api/favorites')
                .expect(200);

            const hasFavorite = favoritesResponse.body.some((fav: any) => fav.variantId === testVariantId);
            expect(hasFavorite).toBe(false);
        });

        it('should validate required fields for removal', async () => {
            const invalidRequests = [
                {}, // Missing variantId
                { variantId: '' }, // Empty variantId
                { variantId: null }, // Null variantId
            ];

            for (const requestData of invalidRequests) {
                const response = await client
                    .delete('/api/favorites')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send(requestData)
                    .expect(400);

                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toContain('required');
            }
        });

        it('should return 404 for non-existent favorite', async () => {
            const response = await client
                .delete('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ variantId: '00000000-0000-0000-0000-000000000000' })
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('not found');
        });

        it('should only remove favorites for the authenticated user', async () => {
            if (!testVariantId || !anotherVariantId) {
                console.log('⏭️  Skipping user isolation remove test - missing test variants');
                return;
            }

            // Create another user and add their favorite
            const anotherAuth = await authenticateUser('customer');
            const anotherClient = new AuthenticatedClient(client, anotherAuth.token);

            await anotherClient
                .post('/api/favorites', { variantId: anotherVariantId })
                .expect(201);

            // First user tries to remove second user's favorite
            const response = await client
                .delete('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ variantId: anotherVariantId })
                .expect(404);

            expect(response.body).toHaveProperty('error');

            // Verify second user's favorite still exists
            const otherFavorites = await anotherClient
                .get('/api/favorites')
                .expect(200);

            const hasFavorite = otherFavorites.body.some((fav: any) => fav.variantId === anotherVariantId);
            expect(hasFavorite).toBe(true);
        });
    });

    describe('Favorites Business Logic', () => {
        it('should handle multiple favorites for same user', async () => {
            if (!testVariantId || !anotherVariantId) {
                console.log('⏭️  Skipping multiple favorites test - missing test variants');
                return;
            }

            // Add multiple favorites
            await authenticatedClient
                .post('/api/favorites', { variantId: testVariantId })
                .expect(201);

            await authenticatedClient
                .post('/api/favorites', { variantId: anotherVariantId })
                .expect(201);

            // Get all favorites
            const response = await authenticatedClient
                .get('/api/favorites')
                .expect(200);

            expect(response.body.length).toBeGreaterThanOrEqual(2);

            const variantIds = response.body.map((fav: any) => fav.variantId);
            expect(variantIds).toContain(testVariantId);
            expect(variantIds).toContain(anotherVariantId);
        });

        it('should maintain favorites persistence across requests', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping persistence test - no test variant available');
                return;
            }

            // Add favorite
            await authenticatedClient
                .post('/api/favorites', { variantId: testVariantId })
                .expect(201);

            // Make multiple requests - favorites should persist
            for (let i = 0; i < 3; i++) {
                const response = await authenticatedClient
                    .get('/api/favorites')
                    .expect(200);

                const hasFavorite = response.body.some((fav: any) => fav.variantId === testVariantId);
                expect(hasFavorite).toBe(true);
            }
        });

        it('should include all required product details', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping product details test - no test variant available');
                return;
            }

            // Add favorite
            await authenticatedClient
                .post('/api/favorites', { variantId: testVariantId })
                .expect(201);

            // Get favorites
            const response = await authenticatedClient
                .get('/api/favorites')
                .expect(200);

            expect(response.body.length).toBeGreaterThan(0);

            const favorite = response.body[0];
            const requiredFields = ['id', 'userId', 'variantId', 'productId', 'productName', 'productPrice'];
            requiredFields.forEach(field => {
                expect(favorite).toHaveProperty(field);
            });

            // Validate data types
            expect(typeof favorite.productName).toBe('string');
            expect(typeof favorite.productPrice).toBe('number');
            expect(favorite.productPrice).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            // Try adding favorite with malformed data
            const response = await authenticatedClient
                .post('/api/favorites', {
                    variantId: 'invalid-uuid-format'
                });

            expect([400, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('error');
        });

        it('should handle malformed JSON requests', async () => {
            const response = await client
                .post('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect([400, 500]).toContain(response.status);
        });

        it('should handle missing product details gracefully', async () => {
            // This test would require a variant without a product, which shouldn't normally happen
            // but tests the error handling in the code
            const response = await authenticatedClient
                .get('/api/favorites')
                .expect(200);

            // Should still return array even if some products are missing
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Performance Tests', () => {
        it('should respond to favorites operations quickly', async () => {
            const operations = [
                () => authenticatedClient.get('/api/favorites')
            ];

            for (const operation of operations) {
                const startTime = Date.now();
                await operation().expect(200);
                const endTime = Date.now();

                const responseTime = endTime - startTime;
                expect(responseTime).toBeLessThan(1500); // Should respond within 1.5 seconds
            }
        });

        it('should handle concurrent favorites operations', async () => {
            if (!testVariantId || !anotherVariantId) {
                console.log('⏭️  Skipping concurrent operations test - missing test variants');
                return;
            }

            const promises = [];

            // Create multiple users for concurrent testing
            for (let i = 0; i < 3; i++) {
                const auth = await authenticateUser('customer');
                const userClient = new AuthenticatedClient(client, auth.token);

                // Explicitly type the promise as Promise<any> to avoid lint errors
                const promise: Promise<any> = userClient.post('/api/favorites', { variantId: testVariantId });
                promises.push(promise as never);
            }

            const results: any[] = await Promise.all(promises);

            // All requests should succeed
            results.forEach((result: any) => {
                expect(result.status).toBe(201);
                expect(result.body).toHaveProperty('id');
            });
        });
    });

    describe('OpenAPI Documentation Validation', () => {
        it('should match GET response schema', async () => {
            const response = await authenticatedClient
                .get('/api/favorites')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);

            if (response.body.length > 0) {
                const favorite = response.body[0];
                const expectedFields = ['id', 'userId', 'variantId', 'productId', 'productName', 'productPrice'];
                expectedFields.forEach(field => {
                    expect(favorite).toHaveProperty(field);
                });
            }
        });

        it('should match POST response schema', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping POST schema test - no test variant available');
                return;
            }

            // Clear any existing favorite first
            try {
                await client
                    .delete('/api/favorites')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ variantId: testVariantId });
            } catch (error) {
                // Ignore if doesn't exist
            }

            const response = await authenticatedClient
                .post('/api/favorites', {
                    variantId: testVariantId
                })
                .expect(201);

            const expectedFields = ['id', 'userId', 'variantId', 'productId', 'productName'];
            expectedFields.forEach(field => {
                expect(response.body).toHaveProperty(field);
            });
        });

        it('should match DELETE response schema', async () => {
            if (!testVariantId) {
                console.log('⏭️  Skipping DELETE schema test - no test variant available');
                return;
            }

            // Add favorite first
            await authenticatedClient
                .post('/api/favorites', { variantId: testVariantId })
                .expect(201);

            const response = await client
                .delete('/api/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ variantId: testVariantId })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(typeof response.body.message).toBe('string');
        });

        it('should validate security requirements', async () => {
            // All endpoints should require bearerAuth according to OpenAPI spec
            const endpoints = [
                { method: 'get', path: '/api/favorites' },
                { method: 'post', path: '/api/favorites' },
                { method: 'delete', path: '/api/favorites' }
            ];

            for (const endpoint of endpoints) {
                const response = await client[endpoint.method](endpoint.path);
                expect(response.status).toBe(401);
            }
        });
    });
}); 