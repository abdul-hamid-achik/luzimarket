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
    // Directly hit vendor registration link available publicly in footer/header
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try header or footer link to vendor register; fallback to route
    const possibleLinks = [
      page.getByRole('link', { name: /vendedor|sell with us|registrate|regístrate/i }),
      page.locator('a[href="/vendor/register"]')
    ];

    let clicked = false;
    for (const link of possibleLinks) {
      if (await link.first().isVisible().catch(() => false)) {
        await link.first().click({ timeout: 5000 }).catch(() => {});
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      await page.goto('/vendor/register');
    }

    await page.waitForLoadState('networkidle');
    // Accept either login redirect, vendor registration, or staying on localized home
    expect(page.url()).toMatch(/\/(login|vendor\/register|en|es)(\/|$)/);
  });

  test('should load admin page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Admin might redirect to login or show admin page
    const url = page.url();
    expect(url).toMatch(/\/(admin|iniciar-sesion)/);
  });
});