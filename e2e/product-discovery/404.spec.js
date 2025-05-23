const { test, expect } = require('@playwright/test');

test('renders NotFound on unknown routes', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
  // Should display 'NotFound'
  await expect(page.locator('body')).toContainText('NotFound');
});