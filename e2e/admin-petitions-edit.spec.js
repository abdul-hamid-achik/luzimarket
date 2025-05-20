const { test, expect } = require('@playwright/test');
test.use({ storageState: 'tmp/authenticatedState.json' });

test.describe('Admin Petitions Edit Forms', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    await page.click('a.button:has-text("Entrar")');
    await page.waitForURL(/\/inicio\/dashboard$/);
  });

  test('Admission edit form and back navigation', async ({ page }) => {
    await page.goto('/inicio/peticiones/admisiones/editar');
    await page.waitForURL(/\/inicio\/peticiones\/admisiones\/editar$/);
    // Check key input placeholders
    await expect(page.locator('input[placeholder="Nombre de la marca / tienda / negocio"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder^="Describe brevemente" ]')).toBeVisible();
    // Click Regresar button
    await page.click('a.boton_linkP1');
    await page.waitForURL(/\/inicio\/peticiones\/admisiones$/);
  });

  test('Product edit form and back navigation', async ({ page }) => {
    await page.goto('/inicio/peticiones/productos/editar');
    await page.waitForURL(/\/inicio\/peticiones\/productos\/editar$/);
    // Check product form fields
    await expect(page.locator('input#campoProducto')).toBeVisible();
    await expect(page.locator('input#campoPrecio')).toBeVisible();
    // Click Regresar link
    await page.click('a.boton_linkP1');
    await page.waitForURL(/\/inicio\/peticiones\/productos$/);
  });

  test('Branch edit form and back navigation', async ({ page }) => {
    await page.goto('/inicio/peticiones/sucursales/editar');
    await page.waitForURL(/\/inicio\/peticiones\/sucursales\/editar$/);
    // Check sucursal form fields visible by ID
    const branchInputs = page.locator('input#text__Suc');
    await expect(branchInputs).toHaveCount(2);
    await expect(branchInputs.first()).toBeVisible();
    await expect(branchInputs.nth(1)).toBeVisible();
    // Check description textarea
    await expect(page.locator('textarea#descripcion__Suc')).toBeVisible();
    // Click Regresar button
    await page.click('a.boton_linkP1');
    await page.waitForURL(/\/inicio\/peticiones\/sucursales$/);
  });
});