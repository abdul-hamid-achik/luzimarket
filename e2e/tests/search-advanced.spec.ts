import { test, expect } from '../fixtures/test';
import { routes, uiText } from '../helpers/navigation';

test.describe('Advanced Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.home);
    await page.waitForLoadState('networkidle');
  });

  test('should search with multiple filters applied', async ({ page }) => {
    // Go to products page to access filters
    await page.goto(routes.products);
    
    // Open search
    await page.getByRole('button', { name: /buscar|search/i }).click();
    await page.waitForSelector('input[placeholder*="Buscar"]');
    
    // Search for a term
    await page.fill('input[placeholder*="Buscar"]', 'flor');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/search**');
    
    // Apply category filter
    const categoryFilter = page.locator('select[name="category"], [data-testid="category-filter"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption({ index: 1 }); // Select first category
      await page.waitForTimeout(500);
    }
    
    // Apply price range filter
    await page.fill('input[name="minPrice"]', '100');
    await page.fill('input[name="maxPrice"]', '500');
    await page.getByRole('button', { name: /aplicar|apply/i }).click();
    await page.waitForTimeout(500);
    
    // Apply vendor/brand filter if available
    const vendorFilter = page.locator('select[name="vendor"], [data-testid="vendor-filter"]');
    if (await vendorFilter.isVisible()) {
      const vendorOptions = await vendorFilter.locator('option').allTextContents();
      if (vendorOptions.length > 1) {
        await vendorFilter.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    }
    
    // Verify filters are applied in URL
    const url = page.url();
    expect(url).toContain('minPrice=100');
    expect(url).toContain('maxPrice=500');
    
    // Verify products match filters
    const products = await page.getByTestId('product-card').all();
    for (const product of products) {
      const priceText = await product.getByTestId('product-price').textContent() || '';
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      expect(price).toBeGreaterThanOrEqual(100);
      expect(price).toBeLessThanOrEqual(500);
    }
  });

  test('should handle search with special characters', async ({ page }) => {
    const specialSearchTerms = [
      'café & chocolate',
      'niño/niña',
      '50% descuento',
      'producto #1',
      'email@example.com',
      'precio: $100'
    ];
    
    for (const term of specialSearchTerms) {
      // Open search
      await page.getByRole('button', { name: /buscar|search/i }).click();
      await page.waitForSelector('input[placeholder*="Buscar"]');
      
      // Search with special characters
      await page.fill('input[placeholder*="Buscar"]', term);
      await page.keyboard.press('Enter');
      
      // Should not error out
      await page.waitForLoadState('networkidle');
      
      // Should show results or no results message
      const hasResults = await page.getByTestId('product-card').count() > 0;
      const hasNoResultsMessage = await page.getByText(/no se encontraron|no results/i).isVisible();
      expect(hasResults || hasNoResultsMessage).toBe(true);
      
      // Clear search for next iteration
      await page.goto(routes.products);
    }
  });

  test('should show search suggestions and autocomplete', async ({ page }) => {
    // Mock search suggestions API
    await page.route('**/api/search/suggestions**', async route => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q') || '';
      
      let suggestions = [];
      if (query.startsWith('fl')) {
        suggestions = [
          { text: 'flores', category: 'Flores' },
          { text: 'flores rojas', category: 'Flores' },
          { text: 'flores blancas', category: 'Flores' }
        ];
      } else if (query.startsWith('ch')) {
        suggestions = [
          { text: 'chocolate', category: 'Dulces' },
          { text: 'chocolates artesanales', category: 'Dulces' }
        ];
      }
      
      await route.fulfill({ json: { suggestions } });
    });
    
    // Open search
    await page.getByRole('button', { name: /buscar|search/i }).click();
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    
    // Type to trigger suggestions
    await searchInput.fill('fl');
    await page.waitForTimeout(300); // Debounce delay
    
    // Should show suggestions
    await expect(page.getByTestId('search-suggestion')).toHaveCount(3);
    await expect(page.getByText('flores rojas')).toBeVisible();
    
    // Click on a suggestion
    await page.getByText('flores rojas').click();
    
    // Should search with selected term
    await page.waitForURL('**/search**');
    expect(page.url()).toContain('q=flores+rojas');
  });

  test('should save and manage search history', async ({ page }) => {
    // Perform several searches
    const searches = ['rosas', 'chocolate', 'velas aromáticas'];
    
    for (const term of searches) {
      await page.getByRole('button', { name: /buscar|search/i }).click();
      await page.fill('input[placeholder*="Buscar"]', term);
      await page.keyboard.press('Enter');
      await page.waitForURL('**/search**');
      await page.goto(routes.home); // Go back for next search
    }
    
    // Open search again
    await page.getByRole('button', { name: /buscar|search/i }).click();
    
    // Click on search input to show history
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.click();
    
    // Should show recent searches
    await expect(page.getByTestId('search-history-item')).toBeVisible();
    
    // Recent searches should be in reverse order (most recent first)
    const historyItems = await page.getByTestId('search-history-item').allTextContents();
    expect(historyItems[0]).toContain('velas aromáticas');
    expect(historyItems[1]).toContain('chocolate');
    expect(historyItems[2]).toContain('rosas');
    
    // Click on history item
    await page.getByTestId('search-history-item').first().click();
    await page.waitForURL('**/search**');
    expect(page.url()).toContain('velas');
  });

  test('should handle no results with suggestions', async ({ page }) => {
    // Search for something that returns no results
    await page.getByRole('button', { name: /buscar|search/i }).click();
    await page.fill('input[placeholder*="Buscar"]', 'xyzabc123nonexistent');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/search**');
    
    // Should show no results message
    await expect(page.getByText(/no se encontraron resultados|no results found/i)).toBeVisible();
    
    // Should show search suggestions
    await expect(page.getByText(/intenta buscar|try searching/i)).toBeVisible();
    
    // Should show suggested searches
    const suggestions = page.getByTestId('suggested-search');
    await expect(suggestions).toHaveCount(3);
    
    // Click on a suggestion
    await suggestions.first().click();
    await page.waitForLoadState('networkidle');
    
    // Should have results now
    await expect(page.getByTestId('product-card')).toBeVisible();
  });

  test('should search within category pages', async ({ page }) => {
    // Go to a specific category
    await page.goto(routes.categories);
    await page.getByTestId('category-card').first().click();
    await page.waitForLoadState('networkidle');
    
    // Store category name
    const categoryName = await page.getByTestId('category-title').textContent();
    
    // Search within category
    await page.getByRole('button', { name: /buscar|search/i }).click();
    await page.fill('input[placeholder*="Buscar"]', 'premium');
    await page.keyboard.press('Enter');
    
    // Should maintain category context
    await page.waitForURL('**/search**');
    expect(page.url()).toContain('category=');
    
    // Results should be from the same category
    await expect(page.getByText(new RegExp(`resultados.*${categoryName}`, 'i'))).toBeVisible();
  });

  test('should clear all filters and reset search', async ({ page }) => {
    // Perform search with multiple filters
    await page.goto(`${routes.products}?q=flower&minPrice=100&maxPrice=500&category=flores`);
    await page.waitForLoadState('networkidle');
    
    // Verify filters are applied
    await expect(page.getByText(/100.*500/)).toBeVisible(); // Price range
    await expect(page.getByText('flores')).toBeVisible(); // Category
    
    // Click clear all filters
    await page.getByRole('button', { name: /limpiar.*filtros|clear.*filters/i }).click();
    await page.waitForTimeout(500);
    
    // Should reset to default view
    const url = page.url();
    expect(url).not.toContain('minPrice');
    expect(url).not.toContain('maxPrice');
    expect(url).not.toContain('category');
    expect(url).not.toContain('q=');
    
    // Should show all products
    const productCount = await page.getByTestId('product-card').count();
    expect(productCount).toBeGreaterThan(0);
  });

  test('should save search preferences for logged-in users', async ({ page }) => {
    // Create and login user
    const email = `search-pref-${Date.now()}@example.com`;
    await page.goto(routes.register);
    await page.fill('input[name="name"]', 'Search Test');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.locator('label[for="acceptTerms"]').click();
    
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({ json: { success: true } });
    });
    await page.getByRole('button', { name: /registrarse/i }).click();
    
    // Login
    await page.goto(routes.login);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL('**/');
    
    // Set search preferences
    await page.goto(routes.products);
    
    // Apply filters
    await page.selectOption('select[name="sortBy"]', 'price-high-low');
    await page.fill('input[name="minPrice"]', '200');
    
    // Save preferences (if available)
    const savePrefsButton = page.getByRole('button', { name: /guardar preferencias|save preferences/i });
    if (await savePrefsButton.isVisible()) {
      await savePrefsButton.click();
      await expect(page.getByText(/preferencias guardadas|preferences saved/i)).toBeVisible();
    }
    
    // Navigate away and come back
    await page.goto(routes.home);
    await page.goto(routes.products);
    
    // Preferences should be applied
    await expect(page.locator('select[name="sortBy"]')).toHaveValue('price-high-low');
    await expect(page.locator('input[name="minPrice"]')).toHaveValue('200');
  });

  test('should handle search with pagination', async ({ page }) => {
    // Search for common term that returns many results
    await page.getByRole('button', { name: /buscar|search/i }).click();
    await page.fill('input[placeholder*="Buscar"]', 'a'); // Broad search
    await page.keyboard.press('Enter');
    await page.waitForURL('**/search**');
    
    // Check if pagination exists
    const pagination = page.getByTestId('pagination');
    if (await pagination.isVisible()) {
      // Get total pages
      const pageNumbers = await page.getByTestId('page-number').allTextContents();
      const lastPage = Math.max(...pageNumbers.map(n => parseInt(n)));
      
      // Go to page 2
      await page.getByTestId('page-number').filter({ hasText: '2' }).click();
      await page.waitForTimeout(500);
      
      // URL should update
      expect(page.url()).toContain('page=2');
      
      // Products should be different
      const page2Products = await page.getByTestId('product-card').first().textContent();
      
      // Go back to page 1
      await page.getByTestId('page-number').filter({ hasText: '1' }).click();
      await page.waitForTimeout(500);
      
      const page1Products = await page.getByTestId('product-card').first().textContent();
      expect(page1Products).not.toBe(page2Products);
    }
  });

  test('should export search results', async ({ page }) => {
    // Perform search
    await page.getByRole('button', { name: /buscar|search/i }).click();
    await page.fill('input[placeholder*="Buscar"]', 'chocolate');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/search**');
    
    // Look for export button
    const exportButton = page.getByRole('button', { name: /exportar|export/i });
    if (await exportButton.isVisible()) {
      // Set up download promise
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      // Choose format if prompted
      const csvOption = page.getByRole('button', { name: /csv/i });
      if (await csvOption.isVisible()) {
        await csvOption.click();
      }
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/search.*\.csv$/i);
    }
  });
});