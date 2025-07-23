import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have search input visible', async ({ page }) => {
    // Search input should be visible in header
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await expect(searchInput).toBeVisible();
    
    // Click to focus
    await searchInput.click();
    await expect(searchInput).toBeFocused();
  });

  test('should search for products', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await searchInput.click();
    
    // Type search query
    await searchInput.fill('flores');
    await searchInput.press('Enter');
    
    // Should navigate to search results
    await expect(page).toHaveURL(/\/search\?q=flores/);
    
    // Results should be visible - use proper selector for heading or text
    await expect(page.locator('h1').or(page.locator('text=/productos encontrados|products found/i')).first()).toBeVisible();
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible();
  });

  test('should show search suggestions', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await searchInput.click();
    
    // Type to trigger suggestions
    await searchInput.fill('choc');
    
    // Wait for suggestions dropdown
    await page.waitForTimeout(800);
    
    // Should show suggestions dropdown - look for dropdown with suggestions
    const suggestions = page.locator('[role="listbox"], .search-dropdown, [data-testid="search-suggestions"]');
    const suggestionsWithContent = suggestions.or(page.locator('.absolute').filter({ hasText: /choc/i }));
    await expect(suggestionsWithContent.first()).toBeVisible();
  });

  test('should handle empty search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
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
    await page.waitForURL(/\/search/);
    
    // Should show no results message - be more specific
    await expect(page.locator('h2, p').filter({ hasText: /No se encontraron|No results|0 productos/i }).first()).toBeVisible();
  });

  test('should filter search results', async ({ page }) => {
    // Navigate to search results
    await page.goto('/search?q=regalo');
    
    // Apply category filter
    const categoryFilter = page.locator('text=/Categorías|Categories/i').first();
    if (await categoryFilter.isVisible()) {
      // Look for checkbox or radio button for category filter
      const filterCheckbox = page.locator('input[type="checkbox"], input[type="radio"]').filter({ has: page.locator('~ label:has-text("Regalos Personalizados")') });
      const filterLabel = page.locator('label').filter({ hasText: /Regalos Personalizados/i });
      
      if (await filterCheckbox.isVisible()) {
        await filterCheckbox.check();
      } else if (await filterLabel.isVisible()) {
        await filterLabel.click();
      }
      
      // Results should update
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
    }
  });

  test('should search by vendor', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await searchInput.click();
    
    // Search for a vendor name
    await searchInput.fill('Studio');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForURL(/\/search/);
    
    // Should show products from vendors with 'Studio' in name
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible();
  });

  test('should clear search', async ({ page }) => {
    await page.goto('/search?q=test');
    
    // Find clear button
    const clearButton = page.locator('button').filter({ hasText: /Clear|Limpiar|×/ }).first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      
      // Search should be cleared
      const searchInput = page.locator('input[type="search"]').first();
      await expect(searchInput).toHaveValue('');
    }
  });

  test('should search from product page', async ({ page }) => {
    // Go to a product page
    await page.goto('/products');
    const firstProductLink = page.locator('a[href*="/products/"]').first();
    await firstProductLink.click();
    
    // Wait for product page
    await page.waitForURL(/\/products\/[^\/]+$/);
    
    // Search input should still be visible in header
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await expect(searchInput).toBeVisible();
    
    // Can search from product page
    await searchInput.fill('test');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search/);
  });

  test('should handle special characters in search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await searchInput.click();
    
    // Search with special characters
    await searchInput.fill('café & chocolate');
    await searchInput.press('Enter');
    
    // Should navigate to search page
    await expect(page).toHaveURL(/search/);
    
    // URL should be properly encoded
    const url = page.url();
    expect(url).toMatch(/caf%C3%A9|cafe/);
  });
});