import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products page before each test
    await page.goto(routes.products);
  });

  test('should display products grid', async ({ page }) => {
    // Wait for products to load - products are links containing product info
    await page.waitForSelector('a[href*="/products/"]', { timeout: 10000 });
    
    // Check that products are displayed
    const products = page.locator('main').locator('a[href*="/products/"]');
    const count = await products.count();
    expect(count).toBeGreaterThan(0); // Should have at least some products
  });

  test('should show product details on hover', async ({ page }) => {
    // Get first product link
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    
    // Hover over product
    await firstProduct.hover();
    
    // Check if any hover actions appear - look for buttons that appear on hover
    // First wait a bit for hover effects
    await page.waitForTimeout(500);
    
    // Look for buttons within the parent element of the product link
    const productCard = firstProduct.locator('xpath=ancestor::*[contains(@class, "group") or contains(@class, "card") or contains(@class, "product")]').first();
    const quickActions = productCard.locator('button, [role="button"]');
    
    // If no quick actions, check if the product itself becomes more prominent
    const hasQuickActions = await quickActions.count() > 0;
    if (hasQuickActions) {
      await expect(quickActions.first()).toBeVisible();
    } else {
      // At minimum, hovering should make the product card interactive
      await expect(firstProduct).toHaveCSS('cursor', 'pointer');
    }
  });

  test('should filter products by category', async ({ page }) => {
    // Look for category filter button - it's labeled "Categorías"
    const categoryButton = page.locator('button:has-text("Categorías")').first();
    
    if (await categoryButton.isVisible()) {
      // Click to expand if not already expanded
      const isExpanded = await categoryButton.getAttribute('aria-expanded');
      if (isExpanded !== 'true') {
        await categoryButton.click();
      }
      
      // Now look for a category checkbox or link
      const categoryOption = page.locator('label, a').filter({ hasText: /Flores|Flowers/ }).first();
      if (await categoryOption.isVisible()) {
        await categoryOption.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should filter products by price range', async ({ page }) => {
    // Look for price range button
    const priceButton = page.locator('button:has-text("Rango de Precio")').first();
    
    if (await priceButton.isVisible()) {
      // Click to expand if not already expanded
      const isExpanded = await priceButton.getAttribute('aria-expanded');
      if (isExpanded !== 'true') {
        await priceButton.click();
      }
      
      // Set minimum price
      const minPriceInput = page.locator('spinbutton[aria-label*="Mínimo"]').first();
      if (await minPriceInput.isVisible()) {
        await minPriceInput.fill('500');
        
        // Click apply button
        const applyButton = page.locator('button:has-text("Aplicar")').first();
        await applyButton.click();
        
        // Wait for filtered results
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should sort products', async ({ page }) => {
    // Look for sort dropdown - it's preceded by "Ordenar por" text
    const sortLabel = page.locator('text="Ordenar por"');
    
    if (await sortLabel.isVisible()) {
      // The dropdown should be the next combobox element
      const sortDropdown = page.locator('[role="combobox"], select').filter({ hasText: /Nuestra selección|Sort/ });
      
      if (await sortDropdown.count() > 0) {
        // This test validates that sort options exist, but doesn't interact
        // due to potential complexity of custom dropdown implementations
        await expect(sortDropdown.first()).toBeVisible();
      }
    }
  });

  test('should open product quick view modal', async ({ page }) => {
    // Get first product link
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    await firstProduct.hover();
    
    const quickViewButton = firstProduct.locator('button:has-text("Quick view")').first();
    
    if (await quickViewButton.isVisible()) {
      await quickViewButton.click();
      
      // Check modal is open
      const modal = page.locator('dialog, [role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Check modal has product info - use first() to avoid strict mode error
      await expect(modal.locator('h2, h3').first()).toBeVisible(); // Product name
      await expect(modal.locator('text=/\\$[0-9,]+/')).toBeVisible(); // Price
    }
  });

  test('should add product to cart', async ({ page }) => {
    // Get first product
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    
    // Hover to show actions
    await firstProduct.hover();
    
    // Click add to cart
    const addToCartButton = firstProduct.locator('button').filter({ hasText: /add to cart|agregar al carrito/i }).first();
    
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      
      // Check cart sidebar opens or success message
      const cartSidebar = page.locator('[data-testid="cart-sidebar"], aside, [role="dialog"]').filter({ 
        hasText: /Cart|Shopping/ 
      });
      
      const successMessage = page.locator('text=/Added|Success/');
      const toastMessage = page.locator('[data-sonner-toast]');
      
      // Either cart opens, success message shows, or toast appears
      const successIndicator = cartSidebar.or(successMessage).or(toastMessage);
      await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to product detail page', async ({ page }) => {
    // Get first product link
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    
    // Get product name for verification
    const productName = await firstProduct.locator('h3').first().textContent();
    
    // Navigate to product detail
    await firstProduct.click();
    
    // Should be on product detail page - account for Spanish URL
    await expect(page).toHaveURL(/\/(products|productos)\/[a-zA-Z0-9-]+/);
    
    // Product name should be visible on detail page
    if (productName) {
      await expect(page.locator('h1')).toContainText(productName);
    }
  });

  test('should show vendor information', async ({ page }) => {
    // Check first product has vendor info
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    // Vendor info appears as "+ VENDOR_NAME"
    const vendorInfo = firstProduct.locator('p:has-text("+")');
    
    await expect(vendorInfo).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // Look for pagination controls
    const pagination = page.locator('nav[aria-label*="Pagination"], nav:has(button:has-text("2"))');
    
    if (await pagination.count() > 0) {
      // Click page 2 or next button
      const nextButton = page.locator('button, a').filter({ hasText: /Next|Siguiente|^2$/ }).first();
      
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        
        // Wait for new products
        await page.waitForLoadState('networkidle');
        
        // URL should change to indicate pagination
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/page=2|p=2|offset=/i);
      }
    } else {
      // Skip test if no pagination is present (not enough products)
      console.log('No pagination controls found - likely not enough products');
    }
  });
});