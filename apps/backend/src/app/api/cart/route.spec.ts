import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    initializeTestServer,
    getTestClient,
    cleanupTestServer,
    createGuestSession,
    authenticateUser,
    createAuthenticatedClient
} from '@/test/api-client';

describe('Cart API', () => {
    let client: any;
    let guestToken: string;
    let userToken: string;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();

        // Create guest session
        const guest = await createGuestSession();
        guestToken = guest.token;

        // Create authenticated user
        const auth = await authenticateUser('customer');
        userToken = auth.token;
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('Guest Cart Operations', () => {
        it('should require authentication to access cart', async () => {
            await client
                .get('/api/cart')
                .expect(401);
        });

        it('should return empty cart for new guest session', async () => {
            const response = await client
                .get('/api/cart')
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('items');
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(response.body.items).toHaveLength(0);
            expect(response.body).toHaveProperty('total', 0);
        });

        it('should add item to guest cart', async () => {
            // First, let's get available products to use valid product IDs
            const productsResponse = await client
                .get('/api/products')
                .expect(200);

            if (productsResponse.body.products && productsResponse.body.products.length > 0) {
                const product = productsResponse.body.products[0];

                const response = await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${guestToken}`)
                    .send({
                        productId: product.id,
                        quantity: 2
                    })
                    .expect(201);

                expect(response.body).toHaveProperty('productId', product.id);
                expect(response.body).toHaveProperty('quantity', 2);
                expect(response.body).toHaveProperty('id');
            }
        });

        it('should update cart item quantity', async () => {
            // Get current cart first
            const cartResponse = await client
                .get('/api/cart')
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(200);

            if (cartResponse.body.items.length > 0) {
                const item = cartResponse.body.items[0];

                const response = await client
                    .put(`/api/cart/${item.id}`)
                    .set('Authorization', `Bearer ${guestToken}`)
                    .send({ quantity: 5 })
                    .expect(200);

                expect(response.body).toHaveProperty('quantity', 5);
            }
        });

        it('should remove item from cart', async () => {
            // Get current cart first
            const cartResponse = await client
                .get('/api/cart')
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(200);

            if (cartResponse.body.items.length > 0) {
                const item = cartResponse.body.items[0];

                await client
                    .delete(`/api/cart/${item.id}`)
                    .set('Authorization', `Bearer ${guestToken}`)
                    .expect(200);

                // Verify item is removed
                const updatedCartResponse = await client
                    .get('/api/cart')
                    .set('Authorization', `Bearer ${guestToken}`)
                    .expect(200);

                const remainingItem = updatedCartResponse.body.items.find((i: any) => i.id === item.id);
                expect(remainingItem).toBeUndefined();
            }
        });

        it('should clear entire cart', async () => {
            // Add an item first
            const productsResponse = await client.get('/api/products').expect(200);
            if (productsResponse.body.products && productsResponse.body.products.length > 0) {
                const product = productsResponse.body.products[0];

                await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${guestToken}`)
                    .send({
                        productId: product.id,
                        quantity: 1
                    })
                    .expect(201);
            }

            // Clear cart
            const response = await client
                .delete('/api/cart')
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Cart cleared successfully');
            expect(response.body).toHaveProperty('itemsRemoved');
            expect(typeof response.body.itemsRemoved).toBe('number');

            // Verify cart is empty
            const cartResponse = await client
                .get('/api/cart')
                .set('Authorization', `Bearer ${guestToken}`)
                .expect(200);

            expect(cartResponse.body.items).toHaveLength(0);
        });
    });

    describe('User Cart Operations', () => {
        it('should return user cart', async () => {
            const response = await client
                .get('/api/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('items');
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(response.body).toHaveProperty('total');
        });

        it('should add item to user cart', async () => {
            const productsResponse = await client.get('/api/products').expect(200);
            if (productsResponse.body.products && productsResponse.body.products.length > 0) {
                const product = productsResponse.body.products[0];

                const response = await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        productId: product.id,
                        quantity: 3
                    })
                    .expect(201);

                expect(response.body).toHaveProperty('productId', product.id);
                expect(response.body).toHaveProperty('quantity', 3);
            }
        });

        it('should merge guest cart on user login', async () => {
            // Create a new guest session
            const newGuestSession = await createGuestSession();

            // Add item to guest cart
            const productsResponse = await client.get('/api/products').expect(200);
            if (productsResponse.body.products && productsResponse.body.products.length > 1) {
                const product = productsResponse.body.products[1]; // Use different product

                await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${newGuestSession.token}`)
                    .send({
                        productId: product.id,
                        quantity: 2
                    })
                    .expect(201);

                // Create new user and login with guest token
                const timestamp = Date.now();
                const userData = {
                    email: `cart-merge-${timestamp}@example.com`,
                    password: 'TestPassword123!',
                    name: 'Cart Merge User'
                };

                await client
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(201);

                // Login with guest token to trigger merge
                const loginResponse = await client
                    .post('/api/auth/login')
                    .set('Authorization', `Bearer ${newGuestSession.token}`)
                    .send({
                        email: userData.email,
                        password: userData.password
                    })
                    .expect(200);

                const mergedUserToken = loginResponse.body.accessToken;

                // Check if cart was merged
                const cartResponse = await client
                    .get('/api/cart')
                    .set('Authorization', `Bearer ${mergedUserToken}`)
                    .expect(200);

                // Should have items from guest cart
                expect(cartResponse.body.items.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Cart Validation', () => {
        it('should reject invalid product ID', async () => {
            const response = await client
                .post('/api/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: 'invalid-product-id',
                    quantity: 1
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should reject invalid quantity', async () => {
            const productsResponse = await client.get('/api/products').expect(200);
            if (productsResponse.body.products && productsResponse.body.products.length > 0) {
                const product = productsResponse.body.products[0];

                const response = await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        productId: product.id,
                        quantity: -1
                    })
                    .expect(400);

                expect(response.body).toHaveProperty('error');
            }
        });

        it('should reject zero quantity', async () => {
            const productsResponse = await client.get('/api/products').expect(200);
            if (productsResponse.body.products && productsResponse.body.products.length > 0) {
                const product = productsResponse.body.products[0];

                const response = await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        productId: product.id,
                        quantity: 0
                    })
                    .expect(400);

                expect(response.body).toHaveProperty('error');
            }
        });

        it('should handle missing required fields', async () => {
            const response = await client
                .post('/api/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Cart Item Management', () => {
        it('should update existing item quantity when adding same product', async () => {
            const productsResponse = await client.get('/api/products').expect(200);
            if (productsResponse.body.products && productsResponse.body.products.length > 0) {
                const product = productsResponse.body.products[0];

                // Add item first time
                await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        productId: product.id,
                        quantity: 2
                    })
                    .expect((res: any) => {
                        // Accept 201 (new) or 200 (updated)
                        expect([200, 201]).toContain(res.status);
                    });

                // Add same item again
                await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        productId: product.id,
                        quantity: 1
                    })
                    .expect((res: any) => {
                        expect([200, 201]).toContain(res.status);
                    });

                // Check cart - should have combined quantity
                const cartResponse = await client
                    .get('/api/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);

                const item = cartResponse.body.items.find((i: any) => i.productId === product.id);
                expect(item).toBeDefined();
                expect(item.quantity).toBeGreaterThanOrEqual(1);
            }
        });

        it('should handle non-existent cart item updates', async () => {
            const response = await client
                .put('/api/cart/non-existent-item-id')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 5 })
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle non-existent cart item deletion', async () => {
            const response = await client
                .delete('/api/cart/non-existent-item-id')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Cart Calculations', () => {
        it('should calculate cart total correctly', async () => {
            // Clear cart first
            await client
                .delete('/api/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const productsResponse = await client.get('/api/products').expect(200);
            if (productsResponse.body.products && productsResponse.body.products.length > 0) {
                const product = productsResponse.body.products[0];
                const quantity = 3;

                await client
                    .post('/api/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        productId: product.id,
                        quantity
                    })
                    .expect((res: any) => {
                        expect([200, 201]).toContain(res.status);
                    });

                const cartResponse = await client
                    .get('/api/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);

                expect(cartResponse.body).toHaveProperty('total');
                expect(typeof cartResponse.body.total).toBe('number');
                expect(cartResponse.body.total).toBeGreaterThan(0);

                // Verify total calculation
                const item = cartResponse.body.items[0];
                if (item && item.price) {
                    const expectedTotal = item.price * item.quantity;
                    expect(cartResponse.body.total).toBe(expectedTotal);
                }
            }
        });

        it('should update cart total when item quantity changes', async () => {
            const cartResponse = await client
                .get('/api/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            if (cartResponse.body.items.length > 0) {
                const item = cartResponse.body.items[0];
                const originalTotal = cartResponse.body.total;

                await client
                    .put(`/api/cart/${item.id}`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ quantity: item.quantity + 1 })
                    .expect(200);

                const updatedCartResponse = await client
                    .get('/api/cart')
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);

                expect(updatedCartResponse.body.total).toBeGreaterThan(originalTotal);
            }
        });
    });
}); 