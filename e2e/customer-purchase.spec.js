const { test, expect } = require('@playwright/test');

test.describe('Customer End-to-End Purchase Flow', () => {
  test('user can register, login, browse products, add to cart, and checkout', async ({ page }) => {
    // Generate unique credentials
    const timestamp = Date.now();
    const email = `testuser+${timestamp}@example.com`;
    const password = 'Password123!';

    // Registration
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register$/);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Register")');
    // Redirect to login
    await page.waitForURL(/\/login$/);

    // Login
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Login")');
    await page.waitForURL('/');

    // Ensure token is stored
    const token = await page.evaluate(() => sessionStorage.getItem('token'));
    expect(token).toBeTruthy();

    // Navigate to full product listing
    await page.click('text=Ver Todos');
    await page.waitForURL(/\/handpicked\/productos$/);

    // Open first product detail
    const productLink = page.locator('.cajaTodosLosProductos a').first();
    await productLink.click();
    await page.waitForURL(/\/handpicked\/productos\/\d+$/);

    // Add to cart
    await page.click('button:has-text("Agregar a la bolsa")');

    // Go to cart
    await page.click('a[href="/carrito"]');
    await page.waitForURL(/\/carrito$/);

    // Verify one item in cart
    const cartItems = page.locator('div.tabla-carrito');
    await expect(cartItems).toHaveCount(1);

    // Checkout
    await page.click('button:has-text("Pagar")');
    await page.waitForURL(/\/order-confirmation\/\d+$/);

    // Verify confirmation details
    await expect(page.locator('h2')).toHaveText('Order Confirmation');
    const orderItems = page.locator('ul.list-group > li');
    await expect(orderItems).toHaveCount(1);
  });
});