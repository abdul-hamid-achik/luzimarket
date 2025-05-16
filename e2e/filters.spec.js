const { test, expect } = require('@playwright/test');

test.describe('Handpicked Filters Accordion', () => {
  test('should expand and collapse filter sections', async ({ page }) => {
    await page.goto('/handpicked/productos');

    // Wait for filters section
    const accordionHeaders = page.locator('button.accordion-button');
    await expect(accordionHeaders).toHaveCount(3);

    // Collapse second section
    const secondHeader = accordionHeaders.nth(1);
    await secondHeader.click();
    // Verify second body is visible
    const secondBody = page.locator('#collapsePrice .accordion-body');
    await expect(secondBody).toBeVisible();

    // Collapse third section
    const thirdHeader = accordionHeaders.nth(2);
    await thirdHeader.click();
    const thirdBody = page.locator('#collapseColor .accordion-body');
    await expect(thirdBody).toBeVisible();
  });
});