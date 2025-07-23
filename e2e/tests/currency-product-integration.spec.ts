import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('Currency Integration with Products', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('preferred-currency'));
  });

  test('should display correct currency on product listing page', async ({ page }) => {
    await page.goto(routes.products);
    
    // Wait for products to load
    await page.waitForSelector('a[href*="/products/"]', { timeout: 10000 });
    
    // Get all price elements
    const prices = page.locator('[data-testid*="price"], .price, [class*="price"]');
    const priceCount = await prices.count();
    expect(priceCount).toBeGreaterThan(0);
    
    // Check all prices are in MXN format
    for (let i = 0; i < Math.min(priceCount, 5); i++) {
      const priceText = await prices.nth(i).textContent();
      expect(priceText).toMatch(/\$[\d,]+(\.\d{2})?(\s*MXN)?/); // Mexican peso format
    }
    
    // Switch to USD
    const currencySwitch = page.locator('#currency-switch');
    await currencySwitch.click();
    await page.waitForTimeout(500); // Wait for prices to update
    
    // Check prices are now in USD format
    for (let i = 0; i < Math.min(priceCount, 5); i++) {
      const priceText = await prices.nth(i).textContent();
      expect(priceText).toMatch(/\$[\d,]+(\.\d{2})?/); // USD format
    }
  });

  test('should maintain currency selection when navigating to product detail', async ({ page }) => {
    await page.goto(routes.products);
    
    // Switch to USD
    const currencySwitch = page.locator('#currency-switch');
    await currencySwitch.click();
    await page.waitForTimeout(500);
    
    // Click on first product
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    await firstProduct.click();
    
    // Wait for product detail page
    await page.waitForURL(/\/products\/.+/);
    
    // Check that currency switch is still on USD
    await expect(page.locator('#currency-switch')).toBeChecked();
    
    // Check that price on detail page is in USD
    const productPrice = page.locator('[data-testid="product-price"], h2:has-text("$"), p:has-text("$")').first();
    const priceText = await productPrice.textContent();
    
    // Verify it's a reasonable USD price (should be less than MXN equivalent)
    const priceValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    expect(priceValue).toBeGreaterThan(0);
    expect(priceValue).toBeLessThan(1000); // Reasonable USD price range
  });

  test('should update cart prices when currency is changed', async ({ page }) => {
    // Go to products page
    await page.goto(routes.products);
    
    // Add a product to cart (click on first product)
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    await firstProduct.click();
    
    // Wait for product detail page and add to cart
    await page.waitForURL(/\/products\/.+/);
    const addToCartButton = page.getByRole('button', { name: /agregar al carrito|add to cart/i });
    await addToCartButton.click();
    
    // Open cart
    const cartButton = page.locator('[data-testid="cart-button"]');
    await cartButton.click();
    
    // Get price in MXN
    const cartPrice = page.locator('[data-testid="cart-item-price"], [class*="price"]').first();
    const mxnPrice = await cartPrice.textContent();
    
    // Switch to USD
    const currencySwitch = page.locator('#currency-switch');
    await currencySwitch.click();
    await page.waitForTimeout(500);
    
    // Get price in USD
    const usdPrice = await cartPrice.textContent();
    
    // Verify conversion
    expect(usdPrice).not.toBe(mxnPrice);
    const mxnValue = parseFloat(mxnPrice.replace(/[^0-9.]/g, ''));
    const usdValue = parseFloat(usdPrice.replace(/[^0-9.]/g, ''));
    expect(usdValue).toBeLessThan(mxnValue); // USD should be less than MXN
  });

  test('should show currency consistently across checkout flow', async ({ page }) => {
    // Set currency to USD first
    await page.goto('/');
    const currencySwitch = page.locator('#currency-switch');
    await currencySwitch.click();
    
    // Go to products and add item to cart
    await page.goto(routes.products);
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    await firstProduct.click();
    
    await page.waitForURL(/\/products\/.+/);
    const addToCartButton = page.getByRole('button', { name: /agregar al carrito|add to cart/i });
    await addToCartButton.click();
    
    // Go to checkout
    await page.goto('/checkout');
    
    // Check that all prices in checkout are in USD
    const checkoutPrices = page.locator('[data-testid*="price"], [class*="price"], :text("$")');
    const priceCount = await checkoutPrices.count();
    
    for (let i = 0; i < Math.min(priceCount, 3); i++) {
      const priceText = await checkoutPrices.nth(i).textContent();
      if (priceText && priceText.includes('$')) {
        const priceValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        expect(priceValue).toBeGreaterThan(0);
        expect(priceValue).toBeLessThan(1000); // Reasonable USD range
      }
    }
  });

  test('should handle rapid currency switching', async ({ page }) => {
    await page.goto(routes.products);
    
    const currencySwitch = page.locator('#currency-switch');
    const firstPrice = page.locator('[data-testid*="price"], .price').first();
    
    // Get initial price
    const initialPrice = await firstPrice.textContent();
    
    // Rapidly toggle currency multiple times
    for (let i = 0; i < 5; i++) {
      await currencySwitch.click();
      await page.waitForTimeout(100);
    }
    
    // Final state should be USD (odd number of clicks)
    await expect(currencySwitch).toBeChecked();
    
    // Price should be updated and different from initial
    const finalPrice = await firstPrice.textContent();
    expect(finalPrice).not.toBe(initialPrice);
  });
});