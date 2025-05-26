const { test, expect } = require('@playwright/test');

test('renders NotFound on unknown routes', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');

  // Should display our improved 404 page content
  await expect(page.locator('body')).toContainText('404');
  await expect(page.locator('body')).toContainText('Página no encontrada');

  // Should also have navigation options
  await expect(page.locator('text=Ir al inicio')).toBeVisible();
  await expect(page.locator('text=Ver productos')).toBeVisible();
});