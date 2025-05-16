// e2e/cms-pages.spec.js
// E2E tests for CMS-powered pages: Editorial, Ocasiones, Tiendas + Marcas, Favoritos
const { test, expect } = require('@playwright/test');

test.describe('CMS-powered Pages', () => {
  test('should display brands on /tiendas-marcas', async ({ page }) => {
    await page.goto('/tiendas-marcas');
    await expect(page.locator('h1')).toHaveText(/Tiendas \+ Marcas/);
    await expect(page.getByText('Luzimarket Originals')).toBeVisible();
    await expect(page.getByText('ElectroMax')).toBeVisible();
    await expect(page.getByText('ModaPlus')).toBeVisible();
  });

  test('should display occasions (categories) on /ocasiones', async ({ page }) => {
    await page.goto('/ocasiones');
    await expect(page.locator('h1')).toHaveText(/Ocasiones/);
    await expect(page.getByText('Cumpleaños', { exact: true })).toBeVisible();
    await expect(page.getByText('Aniversario', { exact: true })).toBeVisible();
    await expect(page.getByText('Graduación', { exact: true })).toBeVisible();
    await expect(page.getByText('Navidad', { exact: true })).toBeVisible();
  });

  test('should display articles on /editorial', async ({ page }) => {
    await page.goto('/editorial');
    await expect(page.locator('h1')).toHaveText(/Editorial/);
    await expect(page.getByText('Tendencias de regalos 2025')).toBeVisible();
    await expect(page.getByText('Cómo elegir el regalo perfecto')).toBeVisible();
    await expect(page.getByText('Ideas para celebraciones inolvidables')).toBeVisible();
  });

  test('should display demo favorites on /favoritos', async ({ page }) => {
    await page.goto('/favoritos');
    await expect(page.locator('h1')).toHaveText(/Favoritos/);
    await expect(page.getByText('Camisa Luzimarket')).toBeVisible();
    await expect(page.getByText('Audífonos ElectroMax')).toBeVisible();
    await expect(page.getByText('Reloj ModaPlus')).toBeVisible();
  });
});
