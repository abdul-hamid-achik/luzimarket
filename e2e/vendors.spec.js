const { test, expect } = require('@playwright/test');

test.describe('Employee (Vendor) Flows', () => {
  test('Vendor can login and view dashboard cards', async ({ page }) => {
    // Navigate to vendor login
    await page.goto('/empleados');
    // Use the Entrar link to login (fake login)
    await page.click('a.button:has-text("Entrar")');
    // Should be on dashboard
    await page.waitForURL(/\/InicioEmpleados\/DashboardEmpleados$/);
    // Check key dashboard cards
    await expect(page.locator('h4.card-title:has-text("Annual Target")')).toBeVisible();
    await expect(page.locator('h4.card-title:has-text("Earnings")')).toBeVisible();
    await expect(page.locator('h4.card-title:has-text("Overview")')).toBeVisible();
  });

  test('Vendor can view alerts page', async ({ page }) => {
    await page.goto('/empleados');
    await page.click('a.button:has-text("Entrar")');
    await page.goto('/InicioEmpleados/AlertasEmpleados');
    // Breadcrumb should be visible
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible();
    // Alert components count
    await expect(page.locator('.alert-success')).toHaveCount(2);
    await expect(page.locator('.alert-danger')).toHaveCount(2);
  });

  test('Vendor can access orders (envios) page', async ({ page }) => {
    await page.goto('/empleados');
    await page.click('a.button:has-text("Entrar")');
    // Directly navigate to orders route
    await page.goto('/InicioEmpleados/Envios');
    // Check heading
    await page.waitForSelector('h1');
    await expect(page.locator('h1')).toHaveText('Ordenes');
    // Search input present
    await page.waitForSelector('input.search-input');
    await expect(page.locator('input.search-input')).toBeVisible();
  });

  test('Vendor can view and update schedule', async ({ page }) => {
    await page.goto('/empleados');
    await page.click('a.button:has-text("Entrar")');
    await page.goto('/InicioEmpleados/Horarios');
    // Breadcrumb present
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible();
    // State & city selectors
    await expect(page.locator('select.form-select')).toHaveCount(2);
    // Update button
    await expect(page.locator('button:has-text("Actualizar")')).toBeVisible();
  });
});