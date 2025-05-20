const { test, expect } = require('@playwright/test');
test.use({ storageState: 'tmp/authenticatedState.json' });

test.describe('Admin Petitions Page', () => {
  test('admin can view petitions list', async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    await page.click('a.button:has-text("Entrar")');
    await page.waitForURL(/\/inicio\/dashboard$/);

    // Navigate to Peticiones
    await page.click('a:has-text("Peticiones")');
    await page.waitForURL(/\/inicio\/peticiones$/);

    // Breadcrumb visible
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // Check petitions container renders (even if empty)
    const container = page.locator('.container.p-5');
    await expect(container).toBeVisible();
  });
});