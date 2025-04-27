const { test, expect } = require('@playwright/test');

test.describe('Product Listing & Detail Flow', () => {
  test('should list products and navigate to a product detail', async ({ page }) => {
    // Go to the full product listing page
    await page.goto('/handpicked/productos');
    await expect(page).toHaveURL(/\/handpicked\/productos$/);

    // Ensure at least one product card is visible
    const cards = page.locator('.cajaTodosLosProductos .card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Navigate to the first product's detail
    await cards.first().locator('a').click();
    await page.waitForURL(/\/handpicked\/productos\/\d+$/);

    // Check that the Add to Cart button is present
    const addButton = page.locator('button:has-text("Agregar a la bolsa")');
    await expect(addButton).toBeVisible();
  });
});