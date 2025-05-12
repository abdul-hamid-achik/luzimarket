const { test, expect } = require('@playwright/test');

// UI Guest Cart Flow: as anonymous user, add product, view cart, then register & login to merge cart
test.describe('UI Guest Cart Flow', () => {
    test('guest can add item to cart and it persists after login', async ({ page }) => {
        // Guest: visit home and navigate to first product
        await page.goto('/');
        await page.locator('.cajaProductosMuestra a').first().click();
        // Wait for product detail page
        await page.waitForURL(/handpicked\/productos\/\d+$/);
        // Add to cart
        await page.click('button:has-text("Agregar a la bolsa")');

        // Go to cart page and verify item is present
        await page.goto('/carrito');
        await page.waitForURL(/\/carrito$/);
        const cartItems = page.locator('.tabla-carrito');
        await expect(cartItems).toHaveCount(1);

        // Prepare new user credentials
        const timestamp = Date.now();
        const email = `guestui${timestamp}@example.com`;
        const password = 'GuestUI123!';

        // Register new user
        await page.goto('/register');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await Promise.all([
            page.waitForURL(/\/login$/),
            page.click('button:has-text("Register")'),
        ]);

        // Perform login, which should merge the guest cart
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await Promise.all([
            page.waitForURL('/'),
            page.click('button:has-text("Login")'),
        ]);

        // After login, revisit cart and verify the previously added item remains
        await page.goto('/carrito');
        await page.waitForURL(/\/carrito$/);
        await expect(page.locator('.tabla-carrito')).toHaveCount(1);
    });
}); 