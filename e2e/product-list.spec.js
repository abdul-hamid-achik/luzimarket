const { test, expect } = require('@playwright/test');

test.describe('Product Listing & Detail Flow', () => {
  test('should list products and navigate to a product detail', async ({ page }) => {
    // Go to the full product listing page
    await page.goto('/handpicked/productos');
    await expect(page).toHaveURL(/\/handpicked\/productos$/);

    // Wait for the product cards container to appear
    await page.waitForSelector('.cajaTodosLosProductos');
    const cards = page.locator('.cajaTodosLosProductos .card');
    await expect(cards.first()).toBeVisible();

    // Navigate to the first product's detail
    await cards.first().locator('a').click();
    await page.waitForURL(/\/handpicked\/productos\/\d+$/);

    // Check that the Add to Cart button is present
    const addButton = page.locator('button:has-text("Agregar a la bolsa")');
    await expect(addButton).toBeVisible();
  });

  test('should display accordion sections with correct content on product detail', async ({ page }) => {
    // Directly visit the detail page for product ID 1
    await page.goto('/handpicked/productos/1');
    await expect(page).toHaveURL(/\/handpicked\/productos\/1$/);

    // Accordion container should exist
    await page.waitForSelector('.accordion-flush');
    // Verify first section title is 'Características'
    const firstSectionButton = page.locator('#accordion-1 button:has-text("Características")');
    await expect(firstSectionButton).toBeVisible();

    // Expand the first section
    await firstSectionButton.click();
    // Verify the content in the accordion body
    const firstBody = page.locator('#collapse-1-0 .accordion-body');
    await expect(firstBody).toContainText('Hermoso ramo de rosas frescas');
  });
});