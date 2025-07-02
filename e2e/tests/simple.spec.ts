import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test('basic test', async ({ page }) => {
  // The middleware redirects to locale, but pages are in (public) without locale
  // So we need to go directly to a page that exists
  await page.goto(routes.products);
  // Accept both Spanish (no prefix) and English (/en) URLs
  await expect(page).toHaveURL(/\/(en\/)?productos|\/(en\/)?products/);
  
  // Check that the page loads
  await expect(page.locator('h1, h2').first()).toBeVisible();
});