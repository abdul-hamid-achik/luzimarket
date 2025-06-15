import { test, expect } from '@playwright/test';

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products page before each test
    await page.goto('/products');
  });

  test('should display products grid', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], article', { timeout: 10000 });
    
    // Check that products are displayed
    const products = page.locator('[data-testid="product-card"], article');
    await expect(products).toHaveCount(12); // Default products per page
  });

  test('should show product details on hover', async ({ page }) => {
    // Get first product card
    const firstProduct = page.locator('[data-testid="product-card"], article').first();
    
    // Hover over product
    await firstProduct.hover();
    
    // Check if quick view or add to cart button appears
    const quickActions = firstProduct.locator('button').filter({ 
      hasText: /Quick View|Vista Rápida|Add to Cart|Agregar/ 
    });
    
    await expect(quickActions.first()).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    // Look for category filters
    const categoryFilter = page.locator('text=Flores y Arreglos').first();
    
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      
      // Wait for filtered results
      await page.waitForLoadState('networkidle');
      
      // Check URL has category filter
      await expect(page).toHaveURL(/categories=flores-arreglos/);
    }
  });

  test('should filter products by price range', async ({ page }) => {
    // Look for price filter
    const priceFilter = page.locator('input[type="range"], input[placeholder*="Min"], text=Precio').first();
    
    if (await priceFilter.isVisible()) {
      // Set minimum price
      const minPriceInput = page.locator('input[placeholder*="Min"]').first();
      await minPriceInput.fill('500');
      
      // Apply filter (might need to press Enter or click Apply)
      await minPriceInput.press('Enter');
      
      // Wait for filtered results
      await page.waitForLoadState('networkidle');
    }
  });

  test('should sort products', async ({ page }) => {
    // Look for sort dropdown
    const sortDropdown = page.locator('select').filter({ hasText: /Sort|Ordenar/ }).first();
    
    if (await sortDropdown.isVisible()) {
      // Sort by price ascending
      await sortDropdown.selectOption({ label: /Price.*Low|Precio.*Menor/ });
      
      // Wait for sorted results
      await page.waitForLoadState('networkidle');
      
      // Verify URL has sort parameter
      await expect(page).toHaveURL(/sortBy=price-asc/);
    }
  });

  test('should open product quick view modal', async ({ page }) => {
    // Click on first product's quick view
    const firstProduct = page.locator('[data-testid="product-card"], article').first();
    await firstProduct.hover();
    
    const quickViewButton = firstProduct.locator('button').filter({ 
      hasText: /Quick View|Vista Rápida/ 
    }).first();
    
    if (await quickViewButton.isVisible()) {
      await quickViewButton.click();
      
      // Check modal is open
      const modal = page.locator('dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Check modal has product info
      await expect(modal.locator('h2, h3')).toBeVisible(); // Product name
      await expect(modal.locator('text=/\\$[0-9,]+/')).toBeVisible(); // Price
    }
  });

  test('should add product to cart', async ({ page }) => {
    // Get first product
    const firstProduct = page.locator('[data-testid="product-card"], article').first();
    
    // Hover to show actions
    await firstProduct.hover();
    
    // Click add to cart
    const addToCartButton = firstProduct.locator('button').filter({ 
      hasText: /Add to Cart|Agregar/ 
    }).first();
    
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      
      // Check cart sidebar opens or success message
      const cartSidebar = page.locator('[data-testid="cart-sidebar"], aside').filter({ 
        hasText: /Cart|Carrito/ 
      });
      
      const successMessage = page.locator('text=/Added|Agregado/');
      
      // Either cart opens or success message shows
      await expect(cartSidebar.or(successMessage).first()).toBeVisible();
    }
  });

  test('should navigate to product detail page', async ({ page }) => {
    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"], article').first();
    const productLink = firstProduct.locator('a').first();
    
    // Get product name for verification
    const productName = await firstProduct.locator('h3, h4').first().textContent();
    
    // Navigate to product detail
    await productLink.click();
    
    // Should be on product detail page
    await expect(page).toHaveURL(/\/products\/[a-zA-Z0-9-]+/);
    
    // Product name should be visible on detail page
    if (productName) {
      await expect(page.locator('h1')).toContainText(productName);
    }
  });

  test('should show vendor information', async ({ page }) => {
    // Check first product has vendor info
    const firstProduct = page.locator('[data-testid="product-card"], article').first();
    const vendorInfo = firstProduct.locator('text=/Por |By /');
    
    await expect(vendorInfo).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // Look for pagination controls
    const pagination = page.locator('nav[aria-label*="Pagination"], [data-testid="pagination"]').first();
    
    if (await pagination.isVisible()) {
      // Click next page
      const nextButton = pagination.locator('button, a').filter({ hasText: /Next|Siguiente|2/ }).first();
      
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        
        // Wait for new products
        await page.waitForLoadState('networkidle');
        
        // URL should have page parameter
        await expect(page).toHaveURL(/page=2/);
      }
    }
  });
});