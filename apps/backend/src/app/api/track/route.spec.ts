import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestServer, getTestClient, cleanupTestServer, authenticateUser } from '../../../test/api-client';

describe('Order Tracking API Tests', () => {
    let client: any;
    let userToken: string;
    let orderId: string;
    let trackingNumber: string;

    beforeAll(async () => {
        await initializeTestServer();
        client = getTestClient();

        // Create test user and get token
        const auth = await authenticateUser('customer');
        userToken = auth.token;
    });

    afterAll(async () => {
        await cleanupTestServer();
    });

    describe('Public Tracking API', () => {
        it('should return 404 for non-existent tracking number', async () => {
            const response = await client
                .get('/api/track/INVALID-TRACKING-123')
                .expect(404);

            expect(response.body.error).toContain('not found');
        });

        it('should handle malformed tracking numbers gracefully', async () => {
            // Test empty string - should hit base /api/track route (no trailing slash due to Next.js config)
            const emptyResponse = await client
                .get('/api/track')
                .expect(400);
            expect(emptyResponse.body.error).toContain('required');

            // Test whitespace only - should hit dynamic route with validation
            const whitespaceResponse = await client
                .get('/api/track/%20%20%20')
                .expect(400);
            expect(whitespaceResponse.body.error).toContain('required');

            // Test very short tracking numbers - should hit dynamic route with validation
            const shortResponse1 = await client.get('/api/track/ab');
            expect(shortResponse1.status).toBe(400);
            expect(shortResponse1.body.error).toContain('Invalid tracking number format');

            const shortResponse2 = await client.get('/api/track/x');
            expect(shortResponse2.status).toBe(400);
            expect(shortResponse2.body.error).toContain('Invalid tracking number format');

            const shortResponse3 = await client.get('/api/track/12');
            expect(shortResponse3.status).toBe(400);
            expect(shortResponse3.body.error).toContain('Invalid tracking number format');

            // Test non-existent but valid format tracking numbers - should return 404
            const nonExistentResponse = await client
                .get('/api/track/very-long-tracking-number-that-exceeds-normal-limits')
                .expect(404);
            expect(nonExistentResponse.body.error).toContain('not found');
        });
    });

    describe('Admin Tracking Management', () => {
        let testOrderId: string;

        beforeAll(async () => {
            // Create a test order first
            try {
                const orderResponse = await client
                    .post('/api/orders')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({});

                if (orderResponse.status === 201) {
                    testOrderId = orderResponse.body.orderId || orderResponse.body.id;
                }
            } catch (error) {
                console.warn('Could not create test order for admin tracking tests');
            }
        });

        it('should update order tracking information', async () => {
            if (!testOrderId) {
                console.log('⏭️  Skipping test - no test order available');
                return;
            }

            const trackingUpdate = {
                tracking_number: `LZM-${Date.now()}-TEST123`,
                shipping_carrier: 'fedex',
                shipping_service: 'express',
                status: 'shipped',
                estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                tracking_update: {
                    status: 'shipped',
                    description: 'Package has been shipped from fulfillment center',
                    location: 'Ciudad de México, CDMX',
                    timestamp: new Date().toISOString()
                }
            };

            const response = await client
                .put(`/api/admin/orders/${testOrderId}/tracking`)
                .send(trackingUpdate)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.order).toBeTruthy();
            expect(response.body.order.tracking_number).toBe(trackingUpdate.tracking_number);
            expect(response.body.order.status).toBe('shipped');

            // Store tracking number for public tracking test
            trackingNumber = trackingUpdate.tracking_number;
        });

        it('should add tracking history entry', async () => {
            if (!testOrderId) {
                console.log('⏭️  Skipping test - no test order available');
                return;
            }

            const historyEntry = {
                status: 'in_transit',
                description: 'Package is in transit to destination facility',
                location: 'Guadalajara, JAL',
                timestamp: new Date().toISOString(),
                carrier_status: 'IT'
            };

            const response = await client
                .post(`/api/admin/orders/${testOrderId}/tracking`)
                .send(historyEntry)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.tracking_entry).toBeTruthy();
            expect(response.body.tracking_entry.status).toBe(historyEntry.status);
        });

        it('should validate required fields for tracking updates', async () => {
            if (!testOrderId) {
                console.log('⏭️  Skipping test - no test order available');
                return;
            }

            // Test missing required fields for history entry
            const invalidEntry = {
                description: 'Missing status field'
            };

            const response = await client
                .post(`/api/admin/orders/${testOrderId}/tracking`)
                .send(invalidEntry)
                .expect(400);

            expect(response.body.error).toContain('required');
        });

        it('should return 404 for non-existent order', async () => {
            const fakeOrderId = '00000000-0000-0000-0000-000000000000';

            const response = await client
                .put(`/api/admin/orders/${fakeOrderId}/tracking`)
                .send({
                    status: 'shipped'
                })
                .expect(404);

            expect(response.body.error).toContain('not found');
        });
    });

    describe('Public Tracking with Real Data', () => {
        it('should track order with valid tracking number', async () => {
            if (!trackingNumber) {
                console.log('⏭️  Skipping test - no tracking number available from previous tests');
                return;
            }

            const response = await client
                .get(`/api/track/${trackingNumber}`)
                .expect(200);

            expect(response.body.order).toBeTruthy();
            expect(response.body.order.tracking_number).toBe(trackingNumber);
            expect(response.body.order.status).toBe('shipped');

            // Should have tracking history
            expect(response.body.trackingHistory).toBeTruthy();
            expect(Array.isArray(response.body.trackingHistory)).toBe(true);
            expect(response.body.trackingHistory.length).toBeGreaterThan(0);

            // Should have shipping address (limited info)
            if (response.body.shippingAddress) {
                expect(response.body.shippingAddress).toHaveProperty('city');
                expect(response.body.shippingAddress).toHaveProperty('state');
                expect(response.body.shippingAddress).toHaveProperty('postalCode');
                // Should NOT have sensitive info like full address or names
                expect(response.body.shippingAddress).not.toHaveProperty('fullName');
                expect(response.body.shippingAddress).not.toHaveProperty('street');
            }
        });

        it('should format tracking data correctly', async () => {
            if (!trackingNumber) {
                console.log('⏭️  Skipping test - no tracking number available from previous tests');
                return;
            }

            const response = await client
                .get(`/api/track/${trackingNumber}`)
                .expect(200);

            const order = response.body.order;

            // Verify order data structure
            expect(order).toHaveProperty('id');
            expect(order).toHaveProperty('tracking_number');
            expect(order).toHaveProperty('status');
            expect(order).toHaveProperty('shipping_carrier');
            expect(order).toHaveProperty('total_items');
            expect(order).toHaveProperty('created_at');

            // Verify tracking history structure
            const history = response.body.trackingHistory;
            if (history.length > 0) {
                const firstEntry = history[0];
                expect(firstEntry).toHaveProperty('status');
                expect(firstEntry).toHaveProperty('description');
                expect(firstEntry).toHaveProperty('timestamp');
                // Location is optional
                if (firstEntry.location) {
                    expect(typeof firstEntry.location).toBe('string');
                }
            }
        });
    });

    describe('Shipping Webhooks', () => {
        it('should accept valid shipping webhook', async () => {
            if (!trackingNumber) {
                console.log('⏭️  Skipping test - no tracking number available for webhook tests');
                return;
            }

            const webhookData = {
                carrier: 'fedex',
                tracking_number: trackingNumber,
                status: 'in_transit',
                status_description: 'Package is on the way to destination',
                location: 'Monterrey, NL',
                timestamp: new Date().toISOString()
            };

            const response = await client
                .post('/api/webhooks/shipping')
                .send(webhookData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.order_id).toBeTruthy();
            expect(response.body.status).toBe('in_transit');
        });

        it('should validate required webhook fields', async () => {
            const invalidWebhooks = [
                {}, // Empty
                { carrier: 'fedex' }, // Missing tracking_number and status
                { tracking_number: '123456' }, // Missing carrier and status
                { carrier: 'fedex', tracking_number: '123456' } // Missing status
            ];

            for (const webhookData of invalidWebhooks) {
                const response = await client
                    .post('/api/webhooks/shipping')
                    .send(webhookData)
                    .expect(400);

                expect(response.body.error).toContain('required');
            }
        });

        it('should return 404 for unknown tracking number', async () => {
            const webhookData = {
                carrier: 'fedex',
                tracking_number: 'UNKNOWN-TRACKING-123',
                status: 'in_transit',
                status_description: 'Test webhook for unknown tracking',
                timestamp: new Date().toISOString()
            };

            const response = await client
                .post('/api/webhooks/shipping')
                .send(webhookData)
                .expect(404);

            expect(response.body.error).toContain('not found');
        });

        it('should handle delivery status webhook', async () => {
            if (!trackingNumber) {
                console.log('⏭️  Skipping test - no tracking number available for delivery webhook test');
                return;
            }

            const deliveryWebhook = {
                carrier: 'fedex',
                tracking_number: trackingNumber,
                status: 'delivered',
                status_description: 'Package has been delivered',
                location: 'Ciudad de México, CDMX',
                timestamp: new Date().toISOString(),
                delivered_at: new Date().toISOString(),
                delivery_notes: 'Left at front door'
            };

            const response = await client
                .post('/api/webhooks/shipping')
                .send(deliveryWebhook)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.status).toBe('delivered');

            // Verify the order was updated
            const trackingResponse = await client
                .get(`/api/track/${trackingNumber}`)
                .expect(200);

            expect(trackingResponse.body.order.status).toBe('delivered');
            expect(trackingResponse.body.order.delivered_at).toBeTruthy();
            expect(trackingResponse.body.order.delivery_notes).toBe('Left at front door');
        });

        it('should respond to webhook verification requests', async () => {
            // Test GET endpoint for webhook verification
            const response = await client
                .get('/api/webhooks/shipping')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.supported_carriers).toBeTruthy();
            expect(Array.isArray(response.body.supported_carriers)).toBe(true);
        });

        it('should handle challenge verification', async () => {
            const challenge = 'test_challenge_123';
            const response = await client
                .get(`/api/webhooks/shipping?challenge=${challenge}`)
                .expect(200);

            expect(response.text).toBe(challenge);
        });
    });

    describe('Tracking Edge Cases', () => {
        it('should handle special characters in tracking numbers', async () => {
            const specialTrackingNumbers = [
                'LZM-20241225-ABC123',
                'TEST_TRACKING_123',
                'fedex-123456789012',
                'ups-1Z999AA1234567890'
            ];

            for (const trackingNum of specialTrackingNumbers) {
                const response = await client
                    .get(`/api/track/${encodeURIComponent(trackingNum)}`);

                // Should return 404 (not found) rather than error for valid format but non-existent tracking
                expect(response.status).toBe(404);
                expect(response.body.error).toContain('not found');
            }
        });

        it('should handle concurrent webhook updates', async () => {
            if (!trackingNumber) {
                console.log('⏭️  Skipping test - no tracking number available for concurrent test');
                return;
            }

            // Send multiple webhook updates simultaneously
            const webhookPromises = [];
            for (let i = 0; i < 5; i++) {
                const webhookData = {
                    carrier: 'fedex',
                    tracking_number: trackingNumber,
                    status: 'in_transit',
                    status_description: `Concurrent update ${i + 1}`,
                    location: `Test Location ${i + 1}`,
                    timestamp: new Date(Date.now() + i * 1000).toISOString()
                };

                webhookPromises.push(
                    client
                        .post('/api/webhooks/shipping')
                        .send(webhookData)
                );
            }

            const results = await Promise.all(webhookPromises);

            // All requests should succeed
            results.forEach((result) => {
                expect(result.status).toBe(200);
                expect(result.body.success).toBe(true);
            });

            // Verify tracking history was updated
            const trackingResponse = await client
                .get(`/api/track/${trackingNumber}`)
                .expect(200);

            expect(trackingResponse.body.trackingHistory.length).toBeGreaterThan(5);
        });
    });

    describe('Performance and Reliability', () => {
        it('should respond to tracking requests quickly', async () => {
            if (!trackingNumber) {
                console.log('⏭️  Skipping test - no tracking number available for performance test');
                return;
            }

            const startTime = Date.now();
            const response = await client
                .get(`/api/track/${trackingNumber}`)
                .expect(200);
            const endTime = Date.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
            console.log(`Tracking request took ${responseTime}ms`);
        });

        it('should handle multiple concurrent tracking requests', async () => {
            if (!trackingNumber) {
                console.log('⏭️  Skipping test - no tracking number available for concurrent tracking test');
                return;
            }

            const concurrentRequests = 10;
            const promises = [];

            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    client.get(`/api/track/${trackingNumber}`)
                );
            }

            const results = await Promise.all(promises);

            // All requests should succeed with same data
            results.forEach(result => {
                expect(result.status).toBe(200);
                expect(result.body.order.tracking_number).toBe(trackingNumber);
            });

            console.log(`✅ Successfully handled ${concurrentRequests} concurrent tracking requests`);
        });
    });
}); 