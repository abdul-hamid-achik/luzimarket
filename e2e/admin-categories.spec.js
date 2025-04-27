const { test, expect } = require('@playwright/test');

test.describe('Admin Categories Page', () => {
  test('admin can login and view categories slider', async ({ page }) => {
    // Login via admin UI
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin$/);
    // Click the Entrar link (fake login)
    await page.click('a.button:has-text("Entrar")');
    // Should navigate to dashboard
    await page.waitForURL(/\/inicio\/dashboard$/);

    // Navigate to Categories
    await page.click('a:has-text("Categorias")');
    await page.waitForURL(/\/inicio\/categorias$/);

    // Category slider should display items
    const sliderItems = page.locator('.catSliderSection .item');
    const count = await sliderItems.count();
    expect(count).toBeGreaterThan(0);
  });
});