import { test, expect } from '@playwright/test';
import { getMessages } from '../helpers/i18n';

test.describe('Currency Switch', () => {
  const messages = getMessages('es');

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('preferred-currency'));
  });

  test('should display currency switch in header', async ({ page }) => {
    await page.goto('/es');

    // Check that currency switch is visible (desktop only)
    const currencySwitch = page.locator('[data-testid="currency-switch"], #currency-switch').first();
    await expect(currencySwitch).toBeVisible();

    // Check that MXN and USD labels are visible
    await expect(page.getByText('MXN').first()).toBeVisible();
    await expect(page.getByText('USD').first()).toBeVisible();
  });

  test('should default to MXN currency', async ({ page }) => {
    await page.goto('/es');

    // Check that switch is in MXN position (unchecked)
    const currencySwitch = page.locator('#currency-switch');
    await expect(currencySwitch).not.toBeChecked();

    // Check localStorage
    const savedCurrency = await page.evaluate(() => localStorage.getItem('preferred-currency'));
    expect(savedCurrency).toBeNull(); // Default doesn't save to localStorage
  });

  test('should switch to USD when toggled', async ({ page }) => {
    await page.goto('/es');

    // Click the currency switch
    const currencySwitch = page.locator('#currency-switch');
    await currencySwitch.click();

    // Check that switch is now checked (USD)
    await expect(currencySwitch).toBeChecked();

    // Check localStorage
    const savedCurrency = await page.evaluate(() => localStorage.getItem('preferred-currency'));
    expect(savedCurrency).toBe('USD');
  });

  test('should persist currency preference on page reload', async ({ page }) => {
    await page.goto('/es');

    // Switch to USD
    const currencySwitch = page.locator('#currency-switch');
    await currencySwitch.click();
    await expect(currencySwitch).toBeChecked();

    // Reload page
    await page.reload();

    // Check that USD is still selected
    await expect(currencySwitch).toBeChecked();

    // Check localStorage
    const savedCurrency = await page.evaluate(() => localStorage.getItem('preferred-currency'));
    expect(savedCurrency).toBe('USD');
  });

  test('should convert prices when switching currency', async ({ page }) => {
    // Navigate to products page to ensure prices are visible
    await page.goto('/es/productos');

    // Find a product price element
    const priceElement = page.locator('[data-testid="product-price"]').first();

    // Get initial price in MXN
    const mxnPrice = await priceElement.textContent();
    expect(mxnPrice).toContain('$'); // Should have currency symbol
    expect(mxnPrice).toMatch(/\$[\d,]+/); // Should match price format

    // Switch to USD
    const currencySwitch = page.locator('#currency-switch');
    await currencySwitch.click();

    // Wait for price update
    await page.waitForTimeout(500);

    // Get price in USD
    const usdPrice = await priceElement.textContent();
    expect(usdPrice).toContain('$'); // Should have currency symbol
    expect(usdPrice).not.toBe(mxnPrice); // Should be different from MXN price

    // Extract numeric values and verify conversion
    const mxnValue = parseFloat(mxnPrice.replace(/[^0-9.]/g, ''));
    const usdValue = parseFloat(usdPrice.replace(/[^0-9.]/g, ''));

    // USD should be less than MXN (approximate conversion rate)
    expect(usdValue).toBeLessThan(mxnValue);
    expect(usdValue).toBeGreaterThan(mxnValue * 0.04); // Rough validation of conversion
    expect(usdValue).toBeLessThan(mxnValue * 0.08); // Rough validation of conversion
  });

  test('should switch back to MXN when toggled again', async ({ page }) => {
    await page.goto('/es');

    const currencySwitch = page.locator('#currency-switch');

    // Switch to USD
    await currencySwitch.click();
    await expect(currencySwitch).toBeChecked();

    // Switch back to MXN
    await currencySwitch.click();
    await expect(currencySwitch).not.toBeChecked();

    // Check localStorage
    const savedCurrency = await page.evaluate(() => localStorage.getItem('preferred-currency'));
    expect(savedCurrency).toBe('MXN');
  });

  test('currency switch should be accessible', async ({ page }) => {
    await page.goto('/es');

    const currencySwitch = page.locator('#currency-switch');

    // Check ARIA label
    await expect(currencySwitch).toHaveAttribute('aria-label', 'Toggle between MXN and USD currency');

    // Check that it can be focused with keyboard
    await currencySwitch.focus();
    await expect(currencySwitch).toBeFocused();

    // Check that it can be toggled with keyboard (Space key)
    await page.keyboard.press('Space');
    await expect(currencySwitch).toBeChecked();
  });

  test('should handle currency switch on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/es');

    // Currency switch is desktop only, so it should not be visible on mobile
    const currencySwitch = page.locator('#currency-switch');
    await expect(currencySwitch).not.toBeVisible();
  });
});