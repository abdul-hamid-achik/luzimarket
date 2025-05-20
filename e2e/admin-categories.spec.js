const { test, expect } = require('@playwright/test');
test.use({ storageState: 'tmp/authenticatedState.json' });

test.describe('Admin Categories Page', () => {
  test('admin can login and view categories page', async ({ page }) => {
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

    // Verify basic page structure - should have some content in the body
    await expect(page.locator('body')).not.toBeEmpty();

    // Verify that the main container is present
    await expect(page.locator('.container')).toBeVisible();

    // Verify page title contains Categorias
    await expect(page.locator('h2')).toContainText('Categorias');
  });
});