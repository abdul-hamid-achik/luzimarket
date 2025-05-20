const { test, expect } = require('@playwright/test');
test.use({ storageState: 'tmp/authenticatedState.json' });

test.describe('Admin Sales Page', () => {
  test('admin can view sales metrics and charts', async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    await page.click('a.button:has-text("Entrar")');
    await page.waitForURL(/\/inicio\/dashboard$/);

    // Navigate to Sales
    await page.click('a:has-text("Ventas")');
    await page.waitForURL(/\/inicio\/ventas$/);
    // Wait for status cards to render
    await page.waitForSelector('.ContainerOrderStatus .card');

    // Verify status cards count
    const statusCards = page.locator('.ContainerOrderStatus .card');
    await expect(statusCards).toHaveCount(3);

    // Verify chart area visible
    // Wait for chart svg to load
    await page.waitForSelector('.ContainerChartsVentas svg');
    const chart = page.locator('.ContainerChartsVentas svg');
    await expect(chart).toBeVisible();
  });
});