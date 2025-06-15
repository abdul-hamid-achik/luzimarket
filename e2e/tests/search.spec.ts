import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open search modal/overlay', async ({ page }) => {
    const searchButton = page.locator('[aria-label="Search"], button:has-text("Buscar")').first();
    await searchButton.click();
    
    // Search input should be visible
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first();
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
  });

  test('should search for products', async ({ page }) => {
    // Open search
    const searchButton = page.locator('[aria-label="Search"], button:has-text("Buscar")').first();
    await searchButton.click();
    
    // Type search query
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first();
    await searchInput.fill('flores');
    await searchInput.press('Enter');
    
    // Should navigate to search results
    await expect(page).toHaveURL(/\/search\?q=flores/);
    
    // Results should be visible
    await expect(page.locator('text=/resultados.*flores/i')).toBeVisible();
    await expect(page.locator('[data-testid="product-card"], article').first()).toBeVisible();
  });

  test('should show search suggestions', async ({ page }) => {
    const searchButton = page.locator('[aria-label="Search"], button:has-text("Buscar")').first();
    await searchButton.click();
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first();
    await searchInput.fill('choc');
    
    // Wait for suggestions
    await page.waitForTimeout(500);
    
    // Should show suggestions
    const suggestions = page.locator('[role="listbox"], .search-suggestions');
    await expect(suggestions).toBeVisible();
    
    // Should have chocolate-related suggestions
    await expect(suggestions.locator('text=/chocolate/i').first()).toBeVisible();
  });

  test('should handle empty search', async ({ page }) => {
    const searchButton = page.locator('[aria-label="Search"], button:has-text("Buscar")').first();
    await searchButton.click();
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first();
    await searchInput.press('Enter');
    
    // Should show error or not navigate
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/search?q=');
  });

  test('should handle no results', async ({ page }) => {
    const searchButton = page.locator('[aria-label="Search"], button:has-text("Buscar")').first();
    await searchButton.click();
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first();
    await searchInput.fill('xyzabc123nonexistent');
    await searchInput.press('Enter');
    
    // Should show no results message
    await expect(page.locator('text=/No se encontraron|No results|Sin resultados/i')).toBeVisible();
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
    const searchButton = page.locator('[aria-label="Search"], button:has-text("Buscar")').first();
    await searchButton.click();
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"]').first();
    await searchInput.fill('Flores del Valle');
    await searchInput.press('Enter');
    
    // Should show vendor products
    await expect(page.locator('text=/Flores del Valle/')).toBeVisible();
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
    await page.locator('[data-testid="product-card"], article').first().click();
    
    // Should still be able to search
    const searchButton = page.locator('[aria-label="Search"], button:has-text("Buscar")').first();
    await expect(searchButton).toBeVisible();
    await searchButton.click();
    
    const searchInput = page.locator('input[type="search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should handle special characters in search', async ({ page }) => {
    const searchButton = page.locator('[aria-label="Search"], button:has-text("Buscar")').first();
    await searchButton.click();
    
    const searchInput = page.locator('input[type="search"]').first();
    await searchInput.fill('café & chocolate');
    await searchInput.press('Enter');
    
    // Should handle special characters
    await expect(page).toHaveURL(/search/);
    // URL should be properly encoded
    expect(page.url()).toMatch(/caf%C3%A9|cafe/);
  });
});