const { test, expect } = require('@playwright/test');

test.describe('Full customer purchase flow', () => {
  const email = `testuser${Date.now()}@example.com`;
  const password = 'Password123!';

  test('registers a new user and completes a purchase', async ({ page }) => {
    // Register a new customer
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Register")');
    await expect(page).toHaveURL('/login');

    // Log in
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL('/');

    // Navigate to Handpicked products
    await page.click('text=Ver Handpicked');
    await expect(page).toHaveURL(/handpicked\/productos/);

    // Select the first product
    const productLink = page.locator('a[href^="/handpicked/productos/"]').first();
    await expect(productLink).toBeVisible();
    await productLink.click();
    await expect(page).toHaveURL(/handpicked\/productos\/\d+/);

    // Add product to cart
    await page.click('button:has-text("Agregar a la bolsa")');

    // Go to Cart page
    await page.click('text=Carrito');
    await expect(page).toHaveURL('/carrito');

    // Validate cart has one item
    const items = page.locator('.tabla-carrito');
    await expect(items).toHaveCount(1);

    // Proceed to checkout
    await page.click('button:has-text("Pagar")');

    // Confirm order
    await expect(page).toHaveURL(/order-confirmation\/\d+/);
    await expect(page.locator('h2')).toHaveText('Order Confirmation');
  });
});