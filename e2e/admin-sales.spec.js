const { test, expect } = require('@playwright/test');

test.describe('Admin Sales Page', () => {
  test('admin can view sales metrics and charts', async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    await page.click('a.button:has-text("Entrar")');
    await page.waitForURL(/\/inicio\/dashboard$/);

    // Navigate to Sales
    await page.click('a:has-text("Ventas")');
    await page.waitForURL(/\/inicio\/ventas$/);

    // Verify status cards count
    const statusCards = page.locator('.ContainerOrderStatus .card');
    await expect(statusCards).toHaveCount(3);

    // Verify chart area visible
    const chart = page.locator('.ContainerChartsVentas svg');
    await expect(chart).toBeVisible();
  });
});