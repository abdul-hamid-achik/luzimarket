const { test, expect } = require('@playwright/test');

test.describe('Cart Management Flow', () => {
  test('user can update quantity and remove item from cart', async ({ page }) => {
    // Register and login new user
    const timestamp = Date.now();
    const email = `testuser+cart${timestamp}@example.com`;
    const password = 'CartPass123!';
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    // Submit registration and wait for redirect to login
    await Promise.all([
      page.waitForURL(/\/login$/),
      page.click('button:has-text("Register")'),
    ]);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Login")');
    await page.waitForURL('/');

    // Add first product to cart
    await page.goto('/handpicked/productos');
    await page.locator('.cajaTodosLosProductos a').first().click();
    await page.waitForURL(/\/handpicked\/productos\/\d+$/);
    await page.click('button:has-text("Agregar a la bolsa")');

    // Go to cart
    await page.goto('/carrito');
    await page.waitForURL(/\/carrito$/);
    await page.waitForSelector('.quantity-display');

    // Verify single cart item
    const cartRow = page.locator('.tabla-carrito').first();
    const quantityDisplay = cartRow.locator('.quantity-display');
    await expect(quantityDisplay).toHaveText('1');

    // Increase quantity
    const plusBtn = cartRow.locator('button.quantity-button').filter({ hasText: '+' });
    await plusBtn.click();
    await expect(quantityDisplay).toHaveText('2');

    // Decrease quantity
    const minusBtn = cartRow.locator('button.quantity-button').filter({ hasText: '-' });
    await minusBtn.click();
    await expect(quantityDisplay).toHaveText('1');

    // Remove item
    await cartRow.locator('button.remove-button').click();
    await expect(page.locator('.tabla-carrito')).toHaveCount(0);
  });
});