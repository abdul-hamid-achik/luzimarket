const { test, expect } = require('@playwright/test');
const axios = require('axios');

// Base URL for API endpoints
const API_URL = 'http://localhost:8000/api';

test.describe('API Guest Cart Flow', () => {
    // Wait until backend API is healthy before running tests
    test.beforeAll(async () => {
        const maxAttempts = 10;
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const res = await axios.get(`${API_URL}/health`, { validateStatus: () => true });
                if (res.status === 200) return;
            } catch {
                // ignore network errors
            }
            await new Promise((r) => setTimeout(r, 1000));
        }
        throw new Error('Backend API not healthy after waiting');
    });

    let guestToken;

    test('GET /cart without token returns 401', async () => {
        const res = await axios.get(`${API_URL}/cart`, { validateStatus: () => true });
        expect(res.status).toBe(401);
    });

    test('Issue guest token', async () => {
        const res = await axios.post(`${API_URL}/auth/guest`);
        expect(res.status).toBe(200);
        const body = res.data;
        expect(body.token).toBeTruthy();
        guestToken = body.token;
    });

    test('Add item to guest cart', async () => {
        // Add a default product to guest cart (assumes product with ID 1 exists)
        const addRes = await axios.post(
            `${API_URL}/cart`,
            { productId: 1, quantity: 2 },
            { headers: { Authorization: `Bearer ${guestToken}` }, validateStatus: () => true }
        );
        expect(addRes.status).toBe(201);
        const item = addRes.data;
        expect(item.productId).toBe(1);
        expect(item.quantity).toBe(2);
    });

    test('Get guest cart items', async () => {
        const getRes = await axios.get(`${API_URL}/cart`, {
            headers: { Authorization: `Bearer ${guestToken}` },
            validateStatus: () => true
        });
        expect(getRes.status).toBe(200);
        const cartBody = getRes.data;
        expect(Array.isArray(cartBody.items)).toBe(true);
        expect(cartBody.items.length).toBeGreaterThan(0);
    });

    test('Merge guest cart on login', async () => {
        const timestamp = Date.now();
        const email = `guestmerge${timestamp}@example.com`;
        const password = 'GuestPass123!';

        // Register a new user
        const regRes = await axios.post(
            `${API_URL}/auth/register`,
            { email, password },
            { validateStatus: () => true }
        );
        expect(regRes.status).toBe(201);

        // Login with guest token in header to merge carts
        const loginRes = await axios.post(
            `${API_URL}/auth/login`,
            { email, password },
            { headers: { Authorization: `Bearer ${guestToken}` }, validateStatus: () => true }
        );
        expect(loginRes.status).toBe(200);
        const loginBody = loginRes.data;
        expect(loginBody.token).toBeTruthy();
        const userToken = loginBody.token;

        // Ensure merged cart contains the previously added item
        const mergedRes = await axios.get(`${API_URL}/cart`, {
            headers: { Authorization: `Bearer ${userToken}` },
            validateStatus: () => true
        });
        expect(mergedRes.status).toBe(200);
        const mergedBody = mergedRes.data;
        expect(Array.isArray(mergedBody.items)).toBe(true);
        expect(mergedBody.items.length).toBeGreaterThan(0);
    });
}); 