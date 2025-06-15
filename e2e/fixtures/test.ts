import { test as base } from '@playwright/test';

// Define custom fixtures here if needed
export const test = base.extend({
  // Example: Add a logged-in page fixture
  // authenticatedPage: async ({ page }, use) => {
  //   // Perform login
  //   await page.goto('/login');
  //   await page.fill('[name="email"]', 'test@example.com');
  //   await page.fill('[name="password"]', 'password');
  //   await page.click('button[type="submit"]');
  //   await page.waitForURL('/dashboard');
  //   await use(page);
  // },
});

export { expect } from '@playwright/test';