const { test, expect } = require('@playwright/test');

test.describe('Admin Dashboard Page', () => {
  test('admin sees key dashboard cards', async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    await page.click('a.button:has-text("Entrar")');
    await page.waitForURL(/\/inicio\/dashboard$/);

    // Verify Annual Target card
    const annualCard = page.locator('h4.card-title:has-text("Annual Target")');
    await expect(annualCard).toBeVisible();

    // Verify Earnings card
    const earningsCard = page.locator('h4.card-title:has-text("Earnings")');
    await expect(earningsCard).toBeVisible();

    // Verify Overview card
    const overviewCard = page.locator('h4.card-title:has-text("Overview")');
    await expect(overviewCard).toBeVisible();
  });
});