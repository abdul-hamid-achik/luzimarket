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
    
    // Results should be visible
    await expect(page.locator('h1, text=/productos encontrados|products found/i')).toBeVisible();
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible();
  });

  test('should show search suggestions', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    await searchInput.click();
    
    // Type to trigger suggestions
    await searchInput.fill('choc');
    
    // Wait for suggestions dropdown
    await page.waitForTimeout(800);
    
    // Should show suggestions dropdown
    const suggestions = page.locator('[role="listbox"], .search-dropdown, .absolute').filter({ hasText: /chocolate|productos|categorías/i });
    await expect(suggestions.first()).toBeVisible();
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
    
    // Should show no results message
    await expect(page.locator('text=/No se encontraron|No results|0 productos/i')).toBeVisible();
  });

  test('should filter search results', async ({ page }) => {
    // Navigate to search results
    await page.goto('/search?q=regalo');
    
    // Apply category filter
    const categoryFilter = page.locator('text=/Categorías/').first();
    if (await categoryFilter.isVisible()) {
      await page.locator('label').filter({ hasText: 'Regalos Personalizados' }).click();
      
      // Results should update
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/category|categorías/);
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