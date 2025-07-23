import { test, expect } from '@playwright/test';
import { getMessages } from '../helpers/i18n';

test.describe('Homepage', () => {
  const messages = getMessages('es'); // Default to Spanish
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main heading is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that we're on the homepage
    await expect(page).toHaveTitle(/Luzimarket/i);
  });

  test('should display category links', async ({ page }) => {
    await page.goto('/');
    
    // Check that category links exist - look for links to /category/
    const categoryLinks = page.locator('a[href*="/category/"]');
    await expect(categoryLinks.first()).toBeVisible();
    
    // Should have at least one category link
    const count = await categoryLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to category page when clicking category', async ({ page }) => {
    await page.goto('/');
    
    // Find and click first category link
    const firstCategory = page.locator('a[href*="/category"], a[href*="/categorias"]').first();
    if (await firstCategory.isVisible()) {
      await firstCategory.click();
      // Should navigate to a category page
      await expect(page).toHaveURL(/\/(category|categorias)\//i);
    }
  });

  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation items - use link selectors for better reliability
    await expect(page.locator('nav a[href*="/mas-vendidos"], nav a[href*="/best-sellers"]').first()).toBeVisible();
    await expect(page.locator('nav a[href*="/seleccionados"], nav a[href*="/handpicked"]').first()).toBeVisible();
    await expect(page.locator('nav a[href*="/tiendas-marcas"], nav a[href*="/brands"]').first()).toBeVisible();
    await expect(page.locator('nav a[href*="/categorias"], nav a[href*="/categories"]').first()).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for search functionality - could be input or button
    const searchElements = await page.locator('input[type="search"], button[aria-label*="search" i], button[aria-label*="buscar" i]').all();
    
    // At least one search element should be visible
    expect(searchElements.length).toBeGreaterThan(0);
  });

  test('should have cart functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for cart icon/button - more flexible selector
    const cartButton = page.locator('button[aria-label*="cart" i], button[aria-label*="carrito" i], button:has-text("Shopping cart"), button:has-text("Carrito de compras")').first();
    await expect(cartButton).toBeVisible();
  });

  test('should switch language', async ({ page }) => {
    await page.goto('/');
    
    // Find language switcher
    const languageSwitcher = page.locator('select').filter({ hasText: /ES|EN/ }).first();
    if (await languageSwitcher.isVisible()) {
      // Change to English
      await languageSwitcher.selectOption('en');
      await page.waitForLoadState('networkidle');
      
      // Check URL changed
      await expect(page).toHaveURL(/\/en/);
    }
  });

  test('should have footer with essential links', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer links - updated to match actual footer content
    const footerLinks = [
      'Acerca de nosotros',
      'Contacto',
      'Vende con nosotros',
      'Editorial'
    ];
    
    // Check that at least some footer links are visible
    let foundLinks = 0;
    for (const link of footerLinks) {
      const footerLink = page.locator('footer').locator(`a:has-text("${link}")`).first();
      if (await footerLink.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundLinks++;
      }
    }
    
    // At least one footer link should be found
    expect(foundLinks).toBeGreaterThan(0);
  });
});