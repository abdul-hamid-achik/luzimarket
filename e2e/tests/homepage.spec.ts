import { test, expect } from '@playwright/test';
import { getMessages } from '../helpers/i18n';

test.describe('Homepage', () => {
  const messages = getMessages('es'); // Default to Spanish
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main heading is visible
    await expect(page.locator('h1')).toContainText('Regalos handpicked extraordinarios');
    
    // Check that the tagline is visible
    await expect(page.locator('text=Experiencias y productos seleccionados')).toBeVisible();
  });

  test('should display category links', async ({ page }) => {
    await page.goto('/');
    
    // Check that category links are visible
    const categories = ['Flowershop', 'Sweet', 'Events + Dinners', 'Giftshop'];
    
    for (const category of categories) {
      const link = page.locator(`text=${category}`).first();
      await expect(link).toBeVisible();
    }
  });

  test('should navigate to category page when clicking category', async ({ page }) => {
    await page.goto('/');
    
    // Click on Flowershop category
    await page.click('text=Flowershop');
    
    // Should navigate to the category page
    await expect(page).toHaveURL(/\/category\/flores-arreglos/);
  });

  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation items
    await expect(page.locator('nav').locator(`text=${messages.navigation.bestSellers}`)).toBeVisible();
    await expect(page.locator('nav').locator(`text=${messages.navigation.handpicked}`)).toBeVisible();
    await expect(page.locator('nav').locator(`text=${messages.navigation.brands}`)).toBeVisible();
    await expect(page.locator('nav').locator(`text=${messages.navigation.categories}`)).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for search button/input
    const searchButton = page.locator(`[aria-label="${messages.search.search}"], button:has-text("${messages.search.search}")`).first();
    await expect(searchButton).toBeVisible();
  });

  test('should have cart functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for cart icon/button
    const cartButton = page.locator(`[aria-label="${messages.cart.cart}"], button:has-text("${messages.cart.cart}"), [aria-label*="carrito" i], button:has(svg)`).first();
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
    
    // Check footer links
    const footerLinks = [
      'Acerca de',
      'Contáctanos',
      'Términos y Condiciones',
      'Política de Privacidad'
    ];
    
    for (const link of footerLinks) {
      const footerLink = page.locator('footer').locator(`text=${link}`).first();
      await expect(footerLink).toBeVisible();
    }
  });
});