const { test, expect } = require('@playwright/test');

test.describe('Protected Route Redirects (Customer)', () => {
  test('redirects /carrito to login when unauthenticated', async ({ page }) => {
    await page.goto('/carrito');
    await page.waitForURL(/\/login$/);
    // Should show customer login form
    const heading = page.locator('h2');
    await expect(heading).toHaveText('Login');
  });

  test('redirects /order-confirmation/:id to login when unauthenticated', async ({ page }) => {
    await page.goto('/order-confirmation/12345');
    await page.waitForURL(/\/login$/);
    const heading = page.locator('h2');
    await expect(heading).toHaveText('Login');
  });

  test('redirects /perfil to login when unauthenticated', async ({ page }) => {
    await page.goto('/perfil');
    await page.waitForURL(/\/login$/);
    const heading = page.locator('h2');
    await expect(heading).toHaveText('Login');
  });
});