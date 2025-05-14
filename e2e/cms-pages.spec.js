// e2e/cms-pages.spec.js
// E2E tests for CMS-powered pages: Editorial, Ocasiones, Tiendas + Marcas, Favoritos
const { test, expect } = require('@playwright/test');

test.describe('CMS-powered Pages', () => {
  test('should display brands on /tiendas-marcas', async ({ page }) => {
    await page.goto('/tiendas-marcas');
    await expect(page.locator('h1')).toHaveText(/Tiendas \+ Marcas/);
    await expect(page.locator('div')).toContainText('Luzimarket Originals');
    await expect(page.locator('div')).toContainText('ElectroMax');
    await expect(page.locator('div')).toContainText('ModaPlus');
  });

  test('should display occasions (categories) on /ocasiones', async ({ page }) => {
    await page.goto('/ocasiones');
    await expect(page.locator('h1')).toHaveText(/Ocasiones/);
    await expect(page.locator('div')).toContainText('Cumpleaños');
    await expect(page.locator('div')).toContainText('Aniversario');
    await expect(page.locator('div')).toContainText('Graduación');
    await expect(page.locator('div')).toContainText('Navidad');
  });

  test('should display articles on /editorial', async ({ page }) => {
    await page.goto('/editorial');
    await expect(page.locator('h1')).toHaveText(/Editorial/);
    await expect(page.locator('div')).toContainText('Tendencias de regalos 2025');
    await expect(page.locator('div')).toContainText('Cómo elegir el regalo perfecto');
    await expect(page.locator('div')).toContainText('Ideas para celebraciones inolvidables');
  });

  test('should display demo favorites on /favoritos', async ({ page }) => {
    await page.goto('/favoritos');
    await expect(page.locator('h1')).toHaveText(/Favoritos/);
    await expect(page.locator('div')).toContainText('Camisa Luzimarket');
    await expect(page.locator('div')).toContainText('Audífonos ElectroMax');
    await expect(page.locator('div')).toContainText('Reloj ModaPlus');
  });
});
