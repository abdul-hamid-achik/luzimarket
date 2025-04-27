const { test, expect } = require('@playwright/test');

test.describe('Admin Petitions Subpages', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    await page.click('a.button:has-text("Entrar")');
    await page.waitForURL(/\/inicio\/dashboard$/);
  });

  test('Admission petitions page shows empty state', async ({ page }) => {
    await page.goto('/inicio/peticiones/admisiones');
    await page.waitForURL(/\/inicio\/peticiones\/admisiones$/);
    // Breadcrumb should show current page label 'Afiliado'
    const activeLabel = page.locator('li[aria-current="page"] span');
    await expect(activeLabel).toHaveText('Afiliado');
    // No data message
    const emptyMsg = page.locator('td.text-center');
    await expect(emptyMsg).toHaveText('No hay peticiones de admisión.');
  });

  test('Product petitions page shows form inputs', async ({ page }) => {
    await page.goto('/inicio/peticiones/productos');
    await page.waitForURL(/\/inicio\/peticiones\/productos$/);
    // Active breadcrumb item should be 'Productos'
    const activeCrumb = page.locator('li.breadcrumb-item.active h2');
    await expect(activeCrumb).toHaveText('Productos');
    // Check product name input has expected default value
    const nameInput = page.locator('input#nombre');
    await expect(nameInput).toHaveValue('Tetera Sowden');
    // Check price input has expected default value
    const priceInput = page.locator('input#Precio').first();
    await expect(priceInput).toHaveValue('$1,000 (MXN)');
  });

  test('Branch petitions page shows sucursales view', async ({ page }) => {
    await page.goto('/inicio/peticiones/sucursales');
    await page.waitForURL(/\/inicio\/peticiones\/sucursales$/);
    // Breadcrumb should show current page label 'Sucursales'
    const activeLabel = page.locator('li.breadcrumb-item.active h2');
    await expect(activeLabel).toHaveText('Sucursales');
    // Underlying admissions table should show empty state
    const emptyMsg = page.locator('td.text-center');
    await expect(emptyMsg).toHaveText('No hay peticiones de admisión.');
  });
});