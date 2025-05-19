// @ts-check
const { test, expect } = require('@playwright/test');

// E2E tests for navbar user info, login, and register links

test.describe('Navbar Authentication Display', () => {
  test('shows Invitado and login/register links when not logged in', async ({ page }) => {
    await page.goto('/');
    // Check for Invitado
    await expect(page.locator('text=Invitado')).toBeVisible();
    // Check for Login and Register links
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('can navigate to registration page', async ({ page }) => {
    // Just verify we can navigate to the register page and see the form
    await page.goto('/register');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Check for form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Fill out the form but don't submit to avoid requiring backend integration
    const timestamp = Date.now();
    const email = `testuser+navbar${timestamp}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'TestPass123!');
  });
});
