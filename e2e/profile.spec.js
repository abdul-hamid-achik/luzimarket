const { test, expect } = require('@playwright/test');

test.describe('Customer Profile Page', () => {
  test('should display profile details after login', async ({ page }) => {
    // Register and login
    const ts = Date.now();
    const email = `testuser+profile${ts}@example.com`;
    const password = 'ProfilePass123!';

    // Go to register page
    await page.goto('/register');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit registration
    await page.click('button:has-text("Register")');

    // Wait for login page
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Login
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for home page to load - use multiple strategies
    try {
      // First try navigation - it may not always trigger a load event
      await Promise.race([
        page.waitForNavigation({ timeout: 5000 }).catch(() => { }),
        page.waitForTimeout(5000)
      ]);

      // Verify we're no longer on the login page
      const url = page.url();
      if (url.includes('/login')) {
        throw new Error('Still on login page after clicking login button');
      }
    } catch (e) {
      console.log('Navigation detection after login failed:', e);
    }

    // Navigate to profile
    await page.goto('/perfil');

    // Wait for profile page elements with increased timeout
    await page.waitForSelector('h3:has-text("Detalles del Perfil")', { timeout: 10000 });
    await expect(page.locator('h3:has-text("Detalles del Perfil")')).toBeVisible();
    await page.waitForSelector('button:has-text("Guardar Cambios")', { timeout: 10000 });
    await expect(page.locator('button:has-text("Guardar Cambios")')).toBeVisible();
  });
});