const { test, expect } = require('@playwright/test');

test.describe('Homepage Public View', () => {
  test('should display banners and handpicked products', async ({ page }) => {
    await page.goto('/');

    // Check main banners are visible (updated selector for actual homepage structure)
    const mainBanner = page.locator('.cajaTitulo .ImagenBanner');
    await expect(mainBanner.first()).toBeVisible();

    // Check that we have multiple banners
    await expect(mainBanner).toHaveCount(2); // Should have 2 banner images

    // Wait for and check best sellers section
    await page.waitForSelector('.best-sellers-section', { timeout: 10000 });
    await expect(page.locator('.best-sellers-section')).toBeVisible();

    // Check that at least some product cards are visible
    const productCards = page.locator('.best-seller-card');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
  });
});