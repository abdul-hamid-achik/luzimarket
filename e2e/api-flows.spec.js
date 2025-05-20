const { test, expect } = require('@playwright/test');
const axios = require('axios');

// Base URL for API endpoints (adjust if needed)
const API_URL = process.env.API_URL || 'http://localhost:8000/api';

test.describe('API Integration Tests', () => {
    let guestToken;
    let userToken;
    let email;
    const password = 'TestPass123!';

    // Ensure the API is healthy before running tests
    test.beforeAll(async () => {
        const res = await axios.get(`${API_URL}/health`, { validateStatus: () => true });
        expect(res.status).toBe(200);
    });

    test('Guest token issuance and guest cart flow', async () => {
        // Issue guest token
        const guestRes = await axios.post(
            `${API_URL}/auth/guest`,
            {},
            { validateStatus: () => true }
        );
        expect(guestRes.status).toBe(200);
        guestToken = guestRes.data.token;
        expect(guestToken).toBeTruthy();

        // Unauthorized cart access
        const unauthorized = await axios.get(
            `${API_URL}/cart`,
            { validateStatus: () => true }
        );
        expect(unauthorized.status).toBe(401);

        // Add item to guest cart
        const addRes = await axios.post(
            `${API_URL}/cart`,
            { productId: 1, quantity: 1 },
            { headers: { Authorization: `Bearer ${guestToken}` }, validateStatus: () => true }
        );
        expect(addRes.status).toBe(201);
        expect(addRes.data.productId).toBe(1);
        expect(addRes.data.quantity).toBe(1);
    });

    test('User registration, login with merge, and merged cart', async () => {
        // Register new user
        email = `api-test-${Date.now()}@example.com`;
        const regRes = await axios.post(
            `${API_URL}/auth/register`,
            { email, password },
            { validateStatus: () => true }
        );
        expect(regRes.status).toBe(201);

        // Login (merge guest cart)
        const loginRes = await axios.post(
            `${API_URL}/auth/login`,
            { email, password },
            { headers: { Authorization: `Bearer ${guestToken}` }, validateStatus: () => true }
        );
        expect(loginRes.status).toBe(200);
        userToken = loginRes.data.token;
        expect(userToken).toBeTruthy();

        // Verify merged cart contains items
        const mergedRes = await axios.get(
            `${API_URL}/cart`,
            { headers: { Authorization: `Bearer ${userToken}` }, validateStatus: () => true }
        );
        expect(mergedRes.status).toBe(200);
        expect(Array.isArray(mergedRes.data.items)).toBe(true);
        expect(mergedRes.data.items.length).toBeGreaterThan(0);
    });

    test('Articles endpoints (list and get)', async () => {
        const listRes = await axios.get(
            `${API_URL}/articles`,
            { validateStatus: () => true }
        );
        expect(listRes.status).toBe(200);
        expect(Array.isArray(listRes.data)).toBe(true);

        if (listRes.data.length > 0) {
            const id = listRes.data[0].id;
            const getRes = await axios.get(
                `${API_URL}/articles/${id}`,
                { validateStatus: () => true }
            );
            expect(getRes.status).toBe(200);
            expect(getRes.data.id).toBe(id);
        }
    });

    test('Categories endpoint (list)', async () => {
        const res = await axios.get(
            `${API_URL}/categories`,
            { validateStatus: () => true }
        );
        expect(res.status).toBe(200);
        expect(Array.isArray(res.data)).toBe(true);
    });

    test('Products endpoints (list and get)', async () => {
        const listRes = await axios.get(
            `${API_URL}/products`,
            { validateStatus: () => true }
        );
        expect(listRes.status).toBe(200);
        expect(Array.isArray(listRes.data)).toBe(true);

        if (listRes.data.length > 0) {
            const id = listRes.data[0].id;
            const getRes = await axios.get(
                `${API_URL}/products/${id}`,
                { validateStatus: () => true }
            );
            expect(getRes.status).toBe(200);
            expect(getRes.data.id).toBe(id);
        }
    });

    test('Orders endpoints (create and retrieve)', async () => {
        // Create order with one item
        const orderRes = await axios.post(
            `${API_URL}/orders`,
            { items: [{ productId: 1, quantity: 1 }] },
            { headers: { Authorization: `Bearer ${userToken}` }, validateStatus: () => true }
        );
        expect(orderRes.status).toBe(201);
        const orderId = orderRes.data.id;
        expect(orderId).toBeTruthy();

        // Retrieve created order
        const getOrderRes = await axios.get(
            `${API_URL}/orders/${orderId}`,
            { headers: { Authorization: `Bearer ${userToken}` }, validateStatus: () => true }
        );
        expect(getOrderRes.status).toBe(200);
        expect(getOrderRes.data.id).toBe(orderId);
    });
}); 