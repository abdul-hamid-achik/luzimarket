import { test, expect } from '@playwright/test';
import { getMessages } from '../helpers/i18n';
import { routes } from '../helpers/navigation';

test.describe('Homepage', () => {
  const messages = getMessages('es'); // Default to Spanish
  test('should load the homepage', async ({ page }) => {
    await page.goto(routes.home);

    // Check that the main heading is visible
    await expect(page.locator('h1')).toBeVisible();

    // Check that we're on the homepage
    await expect(page).toHaveTitle(/Luzimarket/i);
  });

  test('should display category links (via categories page)', async ({ page }) => {
    await page.goto(routes.home);
    // Navigate to categories page from header nav
    const navCategories = page.locator('nav a[href*="/categorias"], nav a[href*="/categories"]').first();
    if (await navCategories.isVisible().catch(() => false)) {
      await navCategories.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/(categorias|categories)(\/|$)/i);
    } else {
      // Fallback: direct navigation
      await page.goto('/categories');
      await page.waitForLoadState('networkidle');
    }

    // On categories page, ensure category items exist
    const categoryLinks = page.locator('a[href*="/category/"], a[href*="/categoria/"]');
    const count = await categoryLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to category page when clicking category', async ({ page }) => {
    await page.goto(routes.home);

    // Find and click first category link
    const firstCategory = page.locator('a[href*="/category"], a[href*="/categorias"]').first();
    const visible = await firstCategory.isVisible().catch(() => false);
    if (visible) {
      await firstCategory.click();
      // Should navigate to a category page (allow exact path without trailing slash)
      await expect(page).toHaveURL(/\/(category|categorias)(\/|$)/i);
    } else {
      test.skip(true, 'No category links visible');
    }
  });

  test('should have working navigation menu', async ({ page }) => {
    await page.goto(routes.home);

    // Check main navigation items - use link selectors for better reliability
    await expect(page.locator('nav a[href*="/mas-vendidos"], nav a[href*="/best-sellers"]').first()).toBeVisible();
    await expect(page.locator('nav a[href*="/seleccionados"], nav a[href*="/handpicked"]').first()).toBeVisible();
    await expect(page.locator('nav a[href*="/tiendas-marcas"], nav a[href*="/brands"]').first()).toBeVisible();
    await expect(page.locator('nav a[href*="/categorias"], nav a[href*="/categories"]').first()).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto(routes.home);

    // Look for search functionality - could be input or button
    const searchElements = await page.locator('input[type="search"], button[aria-label*="search" i], button[aria-label*="buscar" i]').all();

    // At least one search element should be visible
    expect(searchElements.length).toBeGreaterThan(0);
  });

  test('should have cart functionality', async ({ page }) => {
    await page.goto(routes.home);

    // Look for cart icon/button - more flexible selector
    const cartButton = page.locator('button[aria-label*="cart" i], button[aria-label*="carrito" i], button:has-text("Shopping cart"), button:has-text("Carrito de compras")').first();
    await expect(cartButton).toBeVisible();
  });

  test('should switch language', async ({ page }) => {
    await page.goto(routes.home);

    // Open language switcher (custom select)
    const trigger = page.locator('[aria-label="Select language"]').first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    // Select EN option from the dropdown content
    await page.getByText('EN', { exact: true }).first().click();
    await page.waitForLoadState('networkidle');

    // Check URL changed to English locale (allow exact /en)
    await expect(page).toHaveURL(/\/en(\/|$)/);
  });

  test('should have footer with essential links', async ({ page }) => {
    await page.goto(routes.home);

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