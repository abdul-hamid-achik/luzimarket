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

  test('shows user email in navbar after registration/login', async ({ page }, testInfo) => {
    // Register a new user
    const ts = Date.now();
    const email = `testuser+navbar${ts}@example.com`;
    const password = 'TestNavbar123!';
    await page.goto('/register');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Register' }).click();
    // Wait up to 30s for redirect to home
    try {
      await page.waitForURL('/', { timeout: 30000 });
    } catch (e) {
      // Print debugging info if redirect fails
      const currentUrl = page.url();
      // If an error alert is present, capture its text
      let errorText = '';
      try {
        errorText = await page.locator('.alert-danger').textContent();
      } catch (e2) {
        // ignore if not present
      }
      console.log('Did not redirect to home. Current URL:', currentUrl);
      if (errorText) console.log('Visible error:', errorText);
      await page.screenshot({ path: `test-results/navbar-auth-fail-${ts}.png`, fullPage: true });
      throw e;
    }
    // Check that the user's email is now visible in the navbar
    await expect(page.locator(`text=${email}`)).toBeVisible();
  });
});
