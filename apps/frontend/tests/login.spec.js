import { test, expect } from '@playwright/test';

test.describe('Admin Login Page', () => {
  test('should load the login page and display the form', async ({ page }) => {
    // Navigate to the admin login page
    await page.goto('/admin');

    // Check page title
    await expect(page).toHaveTitle(/LUZIMARKET/);

    // Verify form elements
    const usernameInput = page.locator('#txtUser');
    const passwordInput = page.locator('#txtPass');
    const loginButton = page.locator('a.button');
    const heading = page.locator('h1.titulo__login');

    await expect(heading).toHaveText(/Bienvenidx/);
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toHaveText('Entrar');
  });
});