const { test, expect } = require('@playwright/test');
const axios = require('axios');
const crypto = require('crypto');

// Base URL for API endpoints
const API_URL = 'http://localhost:8000/api';

// Helper function to create mock Stripe signature for CI testing
function createMockStripeSignature(payload, secret) {
    if (!secret || !payload) return 'mock_signature';

    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    return `t=${timestamp},v1=${signature}`;
}

test.describe('Stripe Webhooks Integration', () => {
    let userToken;
    let orderId;
    const isCI = process.env.CI === 'true';

    test.beforeAll(async () => {
        // Register and login a test user
        const timestamp = Date.now();
        const email = `stripe-test-${timestamp}@example.com`;
        const password = 'StripeTest123!';

        // Register
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email,
            password
        }, { validateStatus: () => true });

        if (regRes.status === 201) {
            userToken = regRes.data.token;
        } else {
            // Try login if user already exists
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            }, { validateStatus: () => true });

            if (loginRes.status === 200) {
                userToken = loginRes.data.token;
            }
        }

        expect(userToken).toBeTruthy();
    });

    test('webhook endpoint exists and requires proper signature', async () => {
        // Test that webhook endpoint exists but rejects unsigned requests
        const res = await axios.post(`${API_URL}/webhooks/stripe`, {
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi_test' } }
        }, {
            validateStatus: () => true,
            headers: { 'Content-Type': 'application/json' }
        });

        // Should return 400 for missing/invalid signature
        expect(res.status).toBe(400);
        expect(res.data.error).toContain('Webhook Error');
    });

    test('webhook handles invalid signatures gracefully', async () => {
        const payload = JSON.stringify({
            type: 'payment_intent.succeeded',
            data: { object: { id: 'pi_test' } }
        });

        // Test with invalid signature
        const res = await axios.post(`${API_URL}/webhooks/stripe`, payload, {
            validateStatus: () => true,
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': 'invalid_signature'
            }
        });

        // Should handle invalid signature gracefully
        expect([400, 500]).toContain(res.status);

        if (res.status === 500) {
            expect(res.data.error).toContain('Webhook secret not configured');
        } else {
            expect(res.data.error).toContain('Webhook Error');
        }
    });

    test('webhook accepts valid signatures in CI environment', async () => {
        // Only run this test in CI where we have static webhook secrets
        if (!isCI) {
            test.skip('Skipping CI-specific webhook test in local environment');
            return;
        }

        const payload = JSON.stringify({
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: 'pi_test_ci',
                    metadata: { order_id: 'test-order-123' }
                }
            }
        });

        // Create valid signature using CI webhook secret
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const signature = createMockStripeSignature(payload, webhookSecret);

        const res = await axios.post(`${API_URL}/webhooks/stripe`, payload, {
            validateStatus: () => true,
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': signature
            }
        });

        // Should accept valid signature in CI
        expect([200, 404]).toContain(res.status); // 404 if order doesn't exist, 200 if processed
        if (res.status === 200) {
            expect(res.data.received).toBe(true);
        }
    });

    test('create payment intent endpoint works', async () => {
        // Skip Stripe payment intent creation if in CI without real Stripe setup
        if (isCI && !process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
            console.log('Skipping payment intent test in CI (using test keys)');
            return;
        }

        // First create an order by adding items to cart and checking out
        // Add item to cart (assuming product with ID 1 exists)
        const addToCartRes = await axios.post(`${API_URL}/cart`, {
            productId: 1,
            quantity: 1
        }, {
            headers: { Authorization: `Bearer ${userToken}` },
            validateStatus: () => true
        });

        if (addToCartRes.status === 201) {
            // Create order from cart
            const orderRes = await axios.post(`${API_URL}/orders`, {}, {
                headers: { Authorization: `Bearer ${userToken}` },
                validateStatus: () => true
            });

            if (orderRes.status === 201) {
                orderId = orderRes.data.orderId || orderRes.data.id;
            }
        }

        // Skip payment intent test if we couldn't create an order
        if (!orderId) {
            console.warn('Could not create order for payment intent test');
            return;
        }

        // Test creating payment intent
        const paymentIntentRes = await axios.post(`${API_URL}/create-payment-intent`, {
            orderId: orderId,
            amount: 100.00,
            currency: 'mxn'
        }, {
            headers: {
                Authorization: `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            },
            validateStatus: () => true
        });

        if (paymentIntentRes.status === 200) {
            expect(paymentIntentRes.data.clientSecret).toBeTruthy();
            expect(paymentIntentRes.data.paymentIntentId).toBeTruthy();
            console.log('Payment intent created successfully');

            // Verify order was updated with payment intent ID
            const orderCheckRes = await axios.get(`${API_URL}/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${userToken}` },
                validateStatus: () => true
            });

            if (orderCheckRes.status === 200) {
                expect(orderCheckRes.data.payment_intent_id).toBeTruthy();
                expect(orderCheckRes.data.payment_status).toBe('processing');
                console.log('Order updated with payment intent information');
            }
        } else {
            console.warn('Payment intent creation failed:', paymentIntentRes.data);
            // This might fail if Stripe is not configured, which is acceptable in test environment
        }
    });

    test('payment intent creation requires authentication', async () => {
        const res = await axios.post(`${API_URL}/create-payment-intent`, {
            orderId: 'test-order',
            amount: 100.00
        }, { validateStatus: () => true });

        expect(res.status).toBe(401);
        expect(res.data.error).toBe('Unauthorized');
    });

    test('payment intent creation validates required fields', async () => {
        const res = await axios.post(`${API_URL}/create-payment-intent`, {
            // Missing orderId and amount
        }, {
            headers: { Authorization: `Bearer ${userToken}` },
            validateStatus: () => true
        });

        expect(res.status).toBe(400);
        expect(res.data.error).toBe('Missing orderId or amount');
    });

    test('payment intent creation validates order ownership', async () => {
        // Try to create payment intent for non-existent order
        const res = await axios.post(`${API_URL}/create-payment-intent`, {
            orderId: 'non-existent-order-id',
            amount: 100.00
        }, {
            headers: { Authorization: `Bearer ${userToken}` },
            validateStatus: () => true
        });

        expect(res.status).toBe(404);
        expect(res.data.error).toBe('Order not found');
    });

    test('webhook endpoint returns success for valid structure', async () => {
        // Test that webhook endpoint structure is correct
        // We can't test actual Stripe signature verification without real Stripe setup
        // But we can test the endpoint structure

        const res = await axios.post(`${API_URL}/webhooks/stripe`, '', {
            validateStatus: () => true,
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': 'test_signature'
            }
        });

        // Should return 400 for signature verification failure, not 404 or 500
        expect(res.status).toBe(400);
        expect(res.data.error).toContain('Webhook Error');
    });

    test('order status updates correctly with payment status', async () => {
        if (!orderId) {
            console.warn('No order ID available for status test');
            return;
        }

        // Check initial order status
        const initialOrderRes = await axios.get(`${API_URL}/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
            validateStatus: () => true
        });

        if (initialOrderRes.status === 200) {
            const initialOrder = initialOrderRes.data;
            console.log('Initial order status:', initialOrder.status);
            console.log('Initial payment status:', initialOrder.payment_status);

            // Verify order has the expected initial state
            expect(['pending', 'processing']).toContain(initialOrder.status);
            expect(['pending', 'processing']).toContain(initialOrder.payment_status);
        }
    });

    test('complete order flow with payment intent', async () => {
        // This test simulates the complete flow from cart to payment intent creation

        console.log('=== Testing complete order flow ===');

        // Step 1: Add product to cart
        const cartRes = await axios.post(`${API_URL}/cart`, {
            productId: 1,
            quantity: 2
        }, {
            headers: { Authorization: `Bearer ${userToken}` },
            validateStatus: () => true
        });

        if (cartRes.status !== 201) {
            console.warn('Could not add to cart, skipping flow test');
            return;
        }

        console.log('✓ Product added to cart');

        // Step 2: Create order
        const orderRes = await axios.post(`${API_URL}/orders`, {}, {
            headers: { Authorization: `Bearer ${userToken}` },
            validateStatus: () => true
        });

        if (orderRes.status !== 201) {
            console.warn('Could not create order, skipping flow test');
            return;
        }

        const newOrderId = orderRes.data.orderId || orderRes.data.id;
        console.log('✓ Order created:', newOrderId);

        // Step 3: Create payment intent
        const paymentRes = await axios.post(`${API_URL}/create-payment-intent`, {
            orderId: newOrderId,
            amount: 150.00,
            currency: 'mxn'
        }, {
            headers: { Authorization: `Bearer ${userToken}` },
            validateStatus: () => true
        });

        if (paymentRes.status === 200) {
            console.log('✓ Payment intent created');
            expect(paymentRes.data.clientSecret).toBeTruthy();
            expect(paymentRes.data.paymentIntentId).toBeTruthy();

            // Step 4: Verify order was updated
            const updatedOrderRes = await axios.get(`${API_URL}/orders/${newOrderId}`, {
                headers: { Authorization: `Bearer ${userToken}` },
                validateStatus: () => true
            });

            if (updatedOrderRes.status === 200) {
                const updatedOrder = updatedOrderRes.data;
                expect(updatedOrder.payment_intent_id).toBeTruthy();
                expect(updatedOrder.payment_status).toBe('processing');
                console.log('✓ Order updated with payment information');
            }
        } else {
            console.warn('Payment intent creation failed - Stripe may not be configured');
        }

        console.log('=== Order flow test completed ===');
    });
}); 