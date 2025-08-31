import { test as base, expect, BrowserContext, Page } from '@playwright/test';

/**
 * Creates an isolated test with its own browser context
 * This ensures complete isolation of cookies, localStorage, and session state
 */
export const isolatedTest = base.extend<{
  isolatedPage: Page;
  isolatedContext: BrowserContext;
}>({
  isolatedContext: async ({ browser }, use) => {
    // Create a new browser context for this test
    const context = await browser.newContext({
      // Each test gets its own storage state
      storageState: undefined,
    });
    
    await use(context);
    
    // Cleanup
    await context.close();
  },
  
  isolatedPage: async ({ isolatedContext }, use) => {
    // Create a new page in the isolated context
    const page = await isolatedContext.newPage();
    
    await use(page);
    
    // Cleanup is handled by context close
  },
});

/**
 * Helper to add a product to cart in an isolated context
 * This ensures the cart state doesn't leak between tests
 */
export async function addProductToCart(page: Page) {
  // Navigate to products page
  await page.goto('/products');
  
  // Wait for products to load
  await page.waitForSelector('[data-testid="product-card"], a[href*="/products/"], a[href*="/productos/"]', { timeout: 10000 });
  
  // Try to add from listing first
  const addButton = page.locator('button').filter({
    hasText: /add to cart|agregar al carrito/i
  }).filter({ hasNot: page.locator(':disabled') }).first();
  
  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForTimeout(1500);
  } else {
    // Navigate to product detail
    const firstProduct = page.locator('[data-testid="product-card"], a[href*="/productos/"]').first();
    await firstProduct.click();
    await page.waitForURL(/\/(products|productos)\/[^\/]+$/);
    
    // Wait for add to cart button to be ready
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn =>
        (btn.textContent?.toLowerCase().includes('agregar al carrito') ||
          btn.textContent?.toLowerCase().includes('add to cart')) &&
        !btn.disabled
      );
    }, { timeout: 15000 });
    
    // Click add to cart
    const detailAddButton = page.locator('button').filter({
      hasText: /add to cart|agregar al carrito/i
    }).filter({ hasNot: page.locator(':disabled') }).first();
    
    await detailAddButton.click();
    await page.waitForTimeout(1500);
  }
  
  // Verify cart has items
  const cartItems = await page.evaluate(() => {
    const cart = localStorage.getItem('luzimarket-cart');
    return cart ? JSON.parse(cart) : [];
  });
  
  if (cartItems.length === 0) {
    throw new Error('Failed to add product to cart');
  }
  
  // Reload to ensure React hydrates with cart state
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to login in an isolated context
 */
export async function loginAsCustomer(page: Page, email: string = 'customer1@example.com', password: string = 'password123') {
  await page.goto('/login');
  
  // Customer tab is usually default, but click it to be sure
  const customerTab = page.getByRole('tab', { name: /Cliente|Customer/i });
  if (await customerTab.isVisible()) {
    await customerTab.click();
  }
  
  // Fill credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  
  // Submit
  await page.getByRole('button', { name: /iniciar sesión|sign in|login/i }).click();
  
  // Wait for navigation
  await page.waitForTimeout(1000);
  await page.waitForFunction(() => {
    return !window.location.pathname.includes('/login');
  }, { timeout: 10000 });
}

export { expect };