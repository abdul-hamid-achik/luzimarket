const { test, expect } = require('@playwright/test');

// Base URL for API endpoints
const API_URL = 'http://localhost:5000/api';

test.describe('API Guest Cart Flow', () => {
    let guestToken;

    test('GET /cart without token returns 401', async ({ request }) => {
        const res = await request.get(`${API_URL}/cart`);
        expect(res.status()).toBe(401);
    });

    test('Issue guest token', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/guest`);
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.token).toBeTruthy();
        guestToken = body.token;
    });

    test('Add item to guest cart', async ({ request }) => {
        // Fetch a product to add
        const productsRes = await request.get(`${API_URL}/products`);
        expect(productsRes.ok()).toBeTruthy();
        const products = await productsRes.json();
        expect(Array.isArray(products)).toBe(true);
        const product = products[0];
        const addRes = await request.post(`${API_URL}/cart`, {
            headers: { Authorization: `Bearer ${guestToken}` },
            data: { productId: product.id, quantity: 2 },
        });
        expect(addRes.status()).toBe(201);
        const item = await addRes.json();
        expect(item.productId).toBe(product.id);
        expect(item.quantity).toBe(2);
    });

    test('Get guest cart items', async ({ request }) => {
        const getRes = await request.get(`${API_URL}/cart`, {
            headers: { Authorization: `Bearer ${guestToken}` },
        });
        expect(getRes.ok()).toBeTruthy();
        const cartBody = await getRes.json();
        expect(Array.isArray(cartBody.items)).toBe(true);
        expect(cartBody.items.length).toBeGreaterThan(0);
    });

    test('Merge guest cart on login', async ({ request }) => {
        const timestamp = Date.now();
        const email = `guestmerge${timestamp}@example.com`;
        const password = 'GuestPass123!';

        // Register a new user
        const regRes = await request.post(`${API_URL}/auth/register`, {
            data: { email, password },
        });
        expect(regRes.status()).toBe(201);

        // Login with guest token in header to merge carts
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            headers: { Authorization: `Bearer ${guestToken}` },
            data: { email, password },
        });
        expect(loginRes.ok()).toBeTruthy();
        const loginBody = await loginRes.json();
        expect(loginBody.token).toBeTruthy();
        const userToken = loginBody.token;

        // Ensure merged cart contains the previously added item
        const mergedRes = await request.get(`${API_URL}/cart`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        expect(mergedRes.ok()).toBeTruthy();
        const mergedBody = await mergedRes.json();
        expect(Array.isArray(mergedBody.items)).toBe(true);
        expect(mergedBody.items.length).toBeGreaterThan(0);
    });
}); 