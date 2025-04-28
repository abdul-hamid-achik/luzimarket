const { test, expect } = require('@playwright/test');

test.describe('Homepage Public View', () => {
  test('should display banners and handpicked products', async ({ page }) => {
    await page.goto('/');

    // Check main banners are visible
    const mainBanner = page.locator('.Banners .BannerPrincipal img');
    await expect(mainBanner).toBeVisible();

    // Wait for Handpicked section to render and verify the title
    await page.waitForSelector('.titulosHandpicked h5');
    await expect(page.locator('.titulosHandpicked h5')).toHaveText(/Handpicked/);

    // Ensure at least four products are shown in the preview
    await page.waitForSelector('.cajaProductosMuestra img');
    const productCards = page.locator('.cajaProductosMuestra img');
    await expect(productCards).toHaveCount(4);
  });
});