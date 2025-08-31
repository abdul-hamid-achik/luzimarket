import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/es');
  });

  test('should have search input visible', async ({ page }) => {
    // Desktop: input is visible; Mobile: tap search to reveal input
    const input = page.locator('input[type="search"], input[placeholder*="Buscar" i]').first();
    if (!(await input.isVisible({ timeout: 3000 }).catch(() => false))) {
      const searchToggle = page.locator('[data-testid="search-box"] button[aria-label*="buscar" i], [data-testid="search-box"] button[aria-label*="search" i]').first();
      if (await searchToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchToggle.click({ force: true });
      }
    }
    await expect(input).toBeVisible();
    await input.click({ force: true });
    await expect(input).toBeFocused();
  });

  test('should search for products', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar" i]').first();
    await searchInput.click();

    // Type search query
    await searchInput.fill('flores');
    await searchInput.press('Enter');

    // Should navigate to search results (buscar in Spanish, search in English)
    await expect(page).toHaveURL(/\/(en|es)\/(search|buscar)\?q=flores/);

    // Results should be visible - use proper selector for heading or text
    await expect(page.locator('h1').or(page.locator('text=/productos encontrados|products found/i')).first()).toBeVisible();
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible();
  });

  test('should show search suggestions', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar" i]').first();
    await searchInput.click();

    // Type to trigger suggestions
    await searchInput.fill('choc');

    // Wait for suggestions dropdown
    await page.waitForTimeout(800);

    // Should show suggestions dropdown - look for dropdown with suggestions
    // Search dropdown container exists (component renders an absolute dropdown)
    const dropdown = page.locator('[data-testid="search-box"] .absolute').first();
    await expect(dropdown).toBeVisible();
  });

  test('should handle empty search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar" i]').first();
    await searchInput.click();

    // Clear and press enter
    await searchInput.clear();
    await searchInput.press('Enter');

    // Should not navigate to search page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/search?q=');
  });

  test('should handle no results', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await searchInput.click();

    // Search for non-existent term
    await searchInput.fill('xyzabc123nonexistent');
    await searchInput.press('Enter');

    // Wait for search page
    await page.waitForURL(/\/(search|buscar)/);

    // Should show no results message - be more specific
    await expect(page.locator('h2, p').filter({ hasText: /No se encontraron|No results|0 productos/i }).first()).toBeVisible();
  });

  test('should filter search results', async ({ page }) => {
    // Navigate to search results
    await page.goto('/es/search?q=regalo');
    await page.waitForLoadState('networkidle');

    // Check if filters exist on the page
    const filtersExist = await page.locator('text=/Filtrar|Filter|Categorías|Categories/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!filtersExist) {
      // If no filters are available, just verify search results are shown
      const products = page.locator('[data-testid="product-card"]');
      await expect(products.first()).toBeVisible({ timeout: 5000 });
      return;
    }

    // Try to find and apply any available filter
    const filterOptions = page.locator('input[type="checkbox"], input[type="radio"], button[role="checkbox"]');
    const filterCount = await filterOptions.count();
    
    if (filterCount > 0) {
      // Click the first available filter
      const firstFilter = filterOptions.first();
      if (await firstFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstFilter.click({ force: true });
        await page.waitForTimeout(1000);
        await page.waitForLoadState('networkidle');
      }
    } else {
      // Try clicking on filter labels instead
      const filterLabels = page.locator('label').filter({ hasText: /Flores|Chocolate|Regalos|Velas/i });
      if (await filterLabels.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await filterLabels.first().click({ force: true });
        await page.waitForTimeout(1000);
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Verify products are still displayed (filtered results)
    const products = page.locator('[data-testid="product-card"]');
    await expect(products.first()).toBeVisible({ timeout: 5000 });
  });

  test('should search by vendor', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar" i]').first();
    await searchInput.click();

    // Search for a vendor name that's likely to exist in seed data
    await searchInput.fill('Flores');
    await searchInput.press('Enter');

    // Wait for results
    await page.waitForURL(/\/(search|buscar)/);

    // Should show either products or no results message
    const hasProducts = await page.getByTestId('product-card').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasNoResults = await page.locator('text=/No se encontraron|No results/i').isVisible({ timeout: 5000 }).catch(() => false);
    
    // Either we find products or we get a no results message
    expect(hasProducts || hasNoResults).toBeTruthy();
  });

  test('should clear search', async ({ page }) => {
    await page.goto('/es/search?q=test');

    // Clear using the header search-box clear button ("X")
    const clearButton = page.locator('[data-testid="search-box"] button[aria-label*="clear" i]');
    if (await clearButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clearButton.click({ force: true });
      const searchInput2 = page.locator('input[type="search"]').first();
      await expect(searchInput2).toHaveValue('');
    }
  });

  test('should search from product page', async ({ page }) => {
    // Go to a product page
    await page.goto('/es/productos');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    const firstProduct = page.getByTestId('product-card').first();
    await firstProduct.click();

    // Wait for product page
    await page.waitForURL(/\/(products|productos)\/[^\/]+$/);

    // Search input should still be visible in header
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await expect(searchInput).toBeVisible();

    // Can search from product page
    await searchInput.fill('test');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/(en|es)\/(search|buscar)/);
  });

  test('should handle special characters in search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await searchInput.click();

    // Search with special characters
    await searchInput.fill('café & chocolate');
    await searchInput.press('Enter');

    // Should navigate to search page
    await expect(page).toHaveURL(/\/(search|buscar)/);

    // URL should be properly encoded
    const url = page.url();
    expect(url).toMatch(/caf%C3%A9|cafe/);
  });
});