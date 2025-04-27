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
    await page.click('button:has-text("Register")');
    await page.waitForURL(/\/login$/);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Login")');
    await page.waitForURL('/');

    // Navigate to profile
    await page.goto('/perfil');
    await page.waitForURL('/perfil');

    // Check profile heading and save button
    const heading = page.locator('h3:has-text("Detalles del Perfil")');
    await expect(heading).toBeVisible();
    const saveBtn = page.locator('button:has-text("Guardar Cambios")');
    await expect(saveBtn).toBeVisible();
  });
});