import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('should load the homepage', async ({ page }) => {
    // Go to root
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check title
    await expect(page).toHaveTitle('LUZIMARKET - Handpicked extraordinary gifts');
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Regalos handpicked extraordinarios');
  });

  test('should navigate to vendor registration', async ({ page }) => {
    // According to routing config, vendor/register should redirect to /vendedor/registro
    await page.goto('/vendor/register');
    await page.waitForLoadState('networkidle');
    
    // Check we're on the vendor registration page by looking for the form
    // The page uses 'Bienvenidx, Family!' as heading
    const heading = page.locator('h2').filter({ hasText: 'Bienvenidx, Family!' });
    await expect(heading).toBeVisible();
    
    // Check for form elements
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
  });

  test('should load admin page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Admin might redirect to login or show admin page
    const url = page.url();
    expect(url).toMatch(/\/(admin|login)/);
  });
});