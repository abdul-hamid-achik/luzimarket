import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  // The middleware redirects to locale, but pages are in (public) without locale
  // So we need to go directly to a page that exists
  await page.goto('/products');
  await expect(page).toHaveURL('/products');
  
  // Check that the page loads
  await expect(page.locator('h1, h2').first()).toBeVisible();
});