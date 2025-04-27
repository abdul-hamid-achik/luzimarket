const { test, expect } = require('@playwright/test');

test.describe('Homepage Public View', () => {
  test('should display banners and handpicked products', async ({ page }) => {
    await page.goto('/');

    // Check main banners are visible
    const mainBanner = page.locator('.Banners .BannerPrincipal img');
    await expect(mainBanner).toBeVisible();

    // Check Handpicked section title
    const handpickedTitle = page.locator('h5').first();
    await expect(handpickedTitle).toHaveText(/Handpicked/);

    // Ensure at least four products are shown in the preview
    const productCards = page.locator('.cajaProductosMuestra img');
    await expect(productCards).toHaveCount(4);
  });
});