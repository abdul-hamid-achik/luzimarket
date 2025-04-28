const { test, expect } = require('@playwright/test');

test.describe('Customer Profile Page', () => {
  test('should display profile details after login', async ({ page }) => {
    // Register and login
    const ts = Date.now();
    const email = `testuser+profile${ts}@example.com`;
    const password = 'ProfilePass123!';
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
    // Submit login and wait for redirect to home
    await Promise.all([
      page.waitForURL(/\//),
      page.click('button:has-text("Login")'),
    ]);

    // Navigate to profile
    await page.goto('/perfil');
    await page.waitForURL('/perfil');

    // Wait for profile page elements
    await page.waitForSelector('h3:has-text("Detalles del Perfil")');
    await expect(page.locator('h3:has-text("Detalles del Perfil")')).toBeVisible();
    await page.waitForSelector('button:has-text("Guardar Cambios")');
    await expect(page.locator('button:has-text("Guardar Cambios")')).toBeVisible();
  });
});