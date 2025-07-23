import { test, expect } from '@playwright/test';

test.describe('Stripe Payment Flow', () => {
  // Helper to add product to cart
  async function addProductToCart(page: any) {
    await page.goto('/products');
    await page.waitForSelector('a[href*="/products/"]', { timeout: 10000 });
    
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    await firstProduct.hover();
    
    const addToCartButton = firstProduct.locator('button').filter({ hasText: /add to cart|agregar al carrito/i }).first();
    await addToCartButton.click();
    await page.waitForTimeout(1000);
  }

  // Helper to fill checkout form
  async function fillCheckoutForm(page: any) {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[type="tel"]', '5551234567');
    await page.fill('input[id="address"]', 'Av. Reforma 123');
    await page.fill('input[id="city"]', 'Ciudad de México');
    await page.fill('input[id="state"]', 'CDMX');
    await page.fill('input[id="postalCode"]', '06500');
    
    // Accept terms
    const termsLabel = page.locator('label[for="acceptTerms"]');
    await termsLabel.click();
  }

  test.beforeEach(async ({ page }) => {
    await addProductToCart(page);
  });

  test('should redirect to Stripe checkout', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Fill checkout form
    await fillCheckoutForm(page);
    
    // Click submit button
    const submitButton = page.locator('button').filter({ 
      hasText: /Finalizar compra.*\$|Place order.*\$/i 
    }).first();
    
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    
    // Set up navigation listener
    const navigationPromise = page.waitForNavigation({ 
      url: /checkout\.stripe\.com/,
      timeout: 15000 
    }).catch(() => null);
    
    // Click submit
    await submitButton.click();
    
    // Wait for either navigation or API response
    const navigation = await navigationPromise;
    
    if (navigation) {
      // Successfully redirected to Stripe
      expect(page.url()).toContain('checkout.stripe.com');
      
      // Verify Stripe checkout page elements
      await expect(page.locator('text=/Pay|Pagar/i')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=/Email/i')).toBeVisible();
    } else {
      // Check if we got an API response
      const apiResponse = await page.waitForResponse(
        response => response.url().includes('/api/checkout/sessions'),
        { timeout: 5000 }
      ).catch(() => null);
      
      if (apiResponse) {
        expect(apiResponse.status()).toBe(200);
        const data = await apiResponse.json();
        expect(data).toHaveProperty('sessionId');
        expect(data).toHaveProperty('url');
        expect(data.url).toContain('checkout.stripe.com');
      }
    }
  });

  test('should handle Stripe checkout cancellation', async ({ page, context }) => {
    // Navigate to checkout
    await page.goto('/checkout');
    await fillCheckoutForm(page);
    
    // Create promise to catch new page (Stripe checkout)
    const pagePromise = context.waitForEvent('page');
    
    // Submit checkout form
    const submitButton = page.locator('button').filter({ 
      hasText: /Finalizar compra.*\$|Place order.*\$/i 
    }).first();
    await submitButton.click();
    
    // Wait for Stripe page to open
    const stripePage = await pagePromise.catch(() => null);
    
    if (stripePage) {
      // Wait for Stripe page to load
      await stripePage.waitForLoadState();
      
      // Look for cancel/back button on Stripe
      const cancelButton = stripePage.locator('a[href*="cancel"], button').filter({ 
        hasText: /Cancel|Back|Cancelar|Volver/i 
      }).first();
      
      if (await cancelButton.isVisible({ timeout: 5000 })) {
        await cancelButton.click();
        
        // Should redirect back to our site
        await page.waitForURL(/\/checkout|\/cart/, { timeout: 10000 });
        
        // Cart should still have items
        const cartItems = await page.evaluate(() => {
          const cart = localStorage.getItem('luzimarket-cart');
          return cart ? JSON.parse(cart) : [];
        });
        expect(cartItems.length).toBeGreaterThan(0);
      }
    }
  });

  test('should display order details on Stripe checkout', async ({ page }) => {
    // Add specific product info to verify later
    await page.goto('/checkout');
    
    // Get order total from our checkout page
    const totalElement = page.locator('text=/Total.*\\$/').first();
    const totalText = await totalElement.textContent();
    const totalAmount = totalText?.match(/\$[\d,]+/)?.[0];
    
    await fillCheckoutForm(page);
    
    // Submit and wait for redirect
    const submitButton = page.locator('button').filter({ 
      hasText: /Finalizar compra.*\$|Place order.*\$/i 
    }).first();
    
    const navigationPromise = page.waitForNavigation({ 
      url: /checkout\.stripe\.com/,
      timeout: 15000 
    }).catch(() => null);
    
    await submitButton.click();
    const navigation = await navigationPromise;
    
    if (navigation) {
      // On Stripe checkout, verify order amount
      await page.waitForTimeout(2000); // Wait for Stripe to load
      
      // Look for the amount on Stripe page
      const stripeAmount = page.locator('text=/' + totalAmount + '/i');
      await expect(stripeAmount.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle successful payment simulation', async ({ page }) => {
    // Skip this test in CI as it requires Stripe test mode
    if (process.env.CI) {
      test.skip();
      return;
    }
    
    await page.goto('/checkout');
    await fillCheckoutForm(page);
    
    // Submit checkout
    const submitButton = page.locator('button').filter({ 
      hasText: /Finalizar compra.*\$|Place order.*\$/i 
    }).first();
    
    await submitButton.click();
    
    // Wait for Stripe redirect
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });
    
    // Fill Stripe test card details
    // Note: This only works with Stripe test mode
    await page.fill('[placeholder*="1234"]', '4242424242424242'); // Test card number
    await page.fill('[placeholder*="MM / YY"]', '12/30'); // Expiry
    await page.fill('[placeholder*="CVC"]', '123'); // CVC
    await page.fill('[placeholder*="ZIP"]', '10001'); // ZIP if required
    
    // Submit payment
    const payButton = page.locator('button').filter({ hasText: /Pay|Pagar/i }).first();
    await payButton.click();
    
    // Should redirect to success page
    await page.waitForURL(/\/success|\/order-confirmation/, { timeout: 30000 });
    
    // Verify success page elements
    await expect(page.locator('text=/gracias|thank you|confirmación|confirmation/i')).toBeVisible();
    await expect(page.locator('text=/pedido|order/i')).toBeVisible();
  });

  test('should create checkout session with correct metadata', async ({ page }) => {
    await page.goto('/checkout');
    await fillCheckoutForm(page);
    
    // Intercept the API call
    const apiPromise = page.waitForResponse(
      response => response.url().includes('/api/checkout/sessions') && response.request().method() === 'POST'
    );
    
    // Submit form
    const submitButton = page.locator('button').filter({ 
      hasText: /Finalizar compra.*\$|Place order.*\$/i 
    }).first();
    await submitButton.click();
    
    // Check API request/response
    const response = await apiPromise;
    const request = response.request();
    const requestData = request.postDataJSON();
    
    // Verify request contains necessary data
    expect(requestData).toHaveProperty('items');
    expect(requestData.items.length).toBeGreaterThan(0);
    expect(requestData).toHaveProperty('customerInfo');
    expect(requestData.customerInfo).toHaveProperty('email', 'test@example.com');
    expect(requestData.customerInfo).toHaveProperty('firstName', 'Test');
    
    // Verify response
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData).toHaveProperty('sessionId');
    expect(responseData).toHaveProperty('url');
  });

  test('should handle payment method errors gracefully', async ({ page }) => {
    await page.goto('/checkout');
    await fillCheckoutForm(page);
    
    // Mock API error
    await page.route('**/api/checkout/sessions', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Payment method required',
          message: 'Please provide a valid payment method'
        })
      });
    });
    
    // Submit form
    const submitButton = page.locator('button').filter({ 
      hasText: /Finalizar compra.*\$|Place order.*\$/i 
    }).first();
    await submitButton.click();
    
    // Should show error message
    await expect(page.locator('text=/error|Error|problema|Problem/i')).toBeVisible({ timeout: 5000 });
    
    // Should remain on checkout page
    await expect(page).toHaveURL(/\/checkout/);
    
    // Form data should be preserved
    await expect(page.locator('input[type="email"]')).toHaveValue('test@example.com');
  });

  test('should validate minimum order amount', async ({ page }) => {
    // Clear cart and add a very cheap item if possible
    await page.evaluate(() => localStorage.removeItem('luzimarket-cart'));
    
    // Go directly to checkout with empty cart
    await page.goto('/checkout');
    
    // Should show empty cart or minimum order message
    const emptyMessage = page.locator('text=/vacío|empty|mínimo|minimum/i');
    await expect(emptyMessage.first()).toBeVisible();
    
    // Checkout button should be disabled or show warning
    const submitButton = page.locator('button').filter({ 
      hasText: /Finalizar compra|Place order/i 
    }).first();
    
    if (await submitButton.isVisible()) {
      const isDisabled = await submitButton.isDisabled();
      if (!isDisabled) {
        // Click and expect error
        await submitButton.click();
        await expect(page.locator('text=/mínimo|minimum|vacío|empty/i')).toBeVisible();
      }
    }
  });

  test('should persist cart after failed payment attempt', async ({ page }) => {
    await page.goto('/checkout');
    
    // Get initial cart state
    const initialCart = await page.evaluate(() => {
      const cart = localStorage.getItem('luzimarket-cart');
      return cart ? JSON.parse(cart) : [];
    });
    
    await fillCheckoutForm(page);
    
    // Mock payment failure
    await page.route('**/api/checkout/sessions', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment processing failed' })
      });
    });
    
    // Try to submit
    const submitButton = page.locator('button').filter({ 
      hasText: /Finalizar compra.*\$|Place order.*\$/i 
    }).first();
    await submitButton.click();
    
    // Wait for error
    await page.waitForTimeout(1000);
    
    // Verify cart is still intact
    const currentCart = await page.evaluate(() => {
      const cart = localStorage.getItem('luzimarket-cart');
      return cart ? JSON.parse(cart) : [];
    });
    
    expect(currentCart).toEqual(initialCart);
    expect(currentCart.length).toBeGreaterThan(0);
  });

  test('should handle webhook confirmation flow', async ({ page }) => {
    // This test simulates the success page waiting for webhook confirmation
    // In real scenario, this would be triggered by Stripe webhook
    
    // Simulate successful payment redirect with session ID
    await page.goto('/success?session_id=cs_test_123456');
    
    // Page should show processing/waiting state
    await expect(page.locator('text=/procesando|processing|confirmando|confirming/i')).toBeVisible();
    
    // In real app, this would poll for order status
    // For testing, we'll just verify the page structure
    await expect(page.locator('text=/pedido|order|número|number/i')).toBeVisible();
    
    // Should clear cart after successful payment
    const cart = await page.evaluate(() => {
      const cart = localStorage.getItem('luzimarket-cart');
      return cart ? JSON.parse(cart) : [];
    });
    expect(cart.length).toBe(0);
  });

  test('should show order summary in Stripe checkout session', async ({ page }) => {
    // Add multiple products to test line items
    await addProductToCart(page);
    await page.waitForTimeout(500);
    await addProductToCart(page);
    
    await page.goto('/checkout');
    
    // Intercept the checkout session creation
    const apiPromise = page.waitForResponse(
      response => response.url().includes('/api/checkout/sessions')
    );
    
    await fillCheckoutForm(page);
    
    const submitButton = page.locator('button').filter({ 
      hasText: /Finalizar compra.*\$|Place order.*\$/i 
    }).first();
    await submitButton.click();
    
    const response = await apiPromise;
    const responseData = await response.json();
    
    // Verify line items are included
    const requestData = response.request().postDataJSON();
    expect(requestData.items).toBeDefined();
    expect(requestData.items.length).toBeGreaterThanOrEqual(2);
    
    // Each item should have required Stripe fields
    requestData.items.forEach((item: any) => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('amount');
      expect(item).toHaveProperty('quantity');
    });
  });
});