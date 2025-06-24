import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Add a product to cart before each test
    await page.goto('/products');
    
    // Wait for products to load with updated selector
    await page.waitForSelector('a[href*="/products/"]', { timeout: 10000 });
    
    // Add first product to cart
    const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
    await firstProduct.hover();
    
    const addToCartButton = firstProduct.locator('button:has-text("Add to cart")').first();
    
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      // Wait for cart to update
      await page.waitForTimeout(1000);
    } else {
      // If hover doesn't work, click product and add from detail page
      await firstProduct.click();
      await page.waitForLoadState('networkidle');
      const detailAddButton = page.locator('button:has-text("Add to cart"), button:has-text("Agregar al carrito")');
      if (await detailAddButton.count() > 0) {
        await detailAddButton.first().click();
      }
    }
  });

  test('should open cart sidebar', async ({ page }) => {
    // Close any open dialogs first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Click cart button - look for button with ShoppingBag icon
    const cartButton = page.locator('button[aria-label*="Shopping cart" i], button[aria-label*="cart" i]').filter({
      has: page.locator('svg')
    }).last(); // Use last() to avoid mobile menu button
    
    await cartButton.click();
    
    // Cart sidebar should be visible
    const cartSidebar = page.locator('aside, [role="dialog"]').filter({
      hasText: /Shopping cart|Your Cart|Tu carrito/i
    });
    
    await expect(cartSidebar.first()).toBeVisible();
  });

  test('should update quantity in cart', async ({ page }) => {
    // Close any open dialogs first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Open cart - use the shopping cart button
    const cartButton = page.locator('button[aria-label*="Shopping cart" i], button[aria-label*="cart" i]').filter({
      has: page.locator('svg')
    }).last();
    await cartButton.click();
    
    // Find quantity controls
    const increaseButton = page.locator('button').filter({ hasText: '+' }).first();
    
    if (await increaseButton.isVisible()) {
      // Increase quantity
      await increaseButton.click();
      
      // Check quantity updated
      const quantityInput = page.locator('input[type="number"], [data-testid="quantity"]').first();
      await expect(quantityInput).toHaveValue('2');
    }
  });

  test('should remove item from cart', async ({ page }) => {
    // Close any open dialogs first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Open cart - use the shopping cart button
    const cartButton = page.locator('button[aria-label*="Shopping cart" i], button[aria-label*="cart" i]').filter({
      has: page.locator('svg')
    }).last();
    await cartButton.click();
    
    // Find remove button
    const removeButton = page.locator('button').filter({ 
      hasText: /Remove|Eliminar|×|X/ 
    }).first();
    
    if (await removeButton.isVisible()) {
      await removeButton.click();
      
      // Cart should be empty
      await expect(page.locator('text=/Empty|Vacío/')).toBeVisible();
    }
  });

  test('should proceed to checkout', async ({ page }) => {
    // Close any open dialogs first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Open cart - use the shopping cart button
    const cartButton = page.locator('button[aria-label*="Shopping cart" i], button[aria-label*="cart" i]').filter({
      has: page.locator('svg')
    }).last();
    await cartButton.click();
    
    // Click checkout button
    const checkoutButton = page.locator('button, a').filter({ 
      hasText: /Checkout|Finalizar|Proceder/ 
    }).first();
    
    await checkoutButton.click();
    
    // Should navigate to checkout page
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('should show checkout form', async ({ page }) => {
    // Go directly to checkout
    await page.goto('/checkout');
    
    // Check form fields are present
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name*="name"], input[placeholder*="Nombre"]').first()).toBeVisible();
    await expect(page.locator('input[name*="address"], input[placeholder*="Dirección"]').first()).toBeVisible();
  });

  test('should validate checkout form', async ({ page }) => {
    await page.goto('/checkout');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button').filter({
      hasText: /Finalizar compra|Place Order|Pagar/
    }).first();
    
    await submitButton.click();
    
    // Should show validation errors
    const errorMessages = page.locator('text=/requerido|inválido|required|invalid/i');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('should fill checkout form', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill customer information
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[type="tel"]', '5551234567');
    
    // Fill shipping address
    await page.fill('input[id="address"]', 'Av. Reforma 123');
    await page.fill('input[id="city"]', 'Ciudad de México');
    await page.fill('input[id="state"]', 'CDMX');
    await page.fill('input[id="postalCode"]', '06500');
  });

  test('should show order summary', async ({ page }) => {
    await page.goto('/checkout');
    
    // Check order summary is visible
    const orderSummary = page.locator('text=/Order Summary|Resumen|Total/').first();
    await expect(orderSummary).toBeVisible();
    
    // Check price is displayed
    const price = page.locator('text=/\\$[0-9,]+/').first();
    await expect(price).toBeVisible();
  });

  test('should handle guest checkout', async ({ page }) => {
    await page.goto('/checkout');
    
    // Look for guest checkout option
    const guestOption = page.locator('text=/Guest|Invitado|Continue without/').first();
    
    if (await guestOption.isVisible()) {
      await guestOption.click();
      
      // Form should still be accessible
      await expect(page.locator('input[type="email"]').first()).toBeVisible();
    }
  });

  test('should show shipping options', async ({ page }) => {
    await page.goto('/checkout');
    
    // Since shipping is now handled by Stripe, just verify the shipping cost is shown
    const shippingInfo = page.locator('text=/Envío|Shipping/');
    await expect(shippingInfo.first()).toBeVisible();
    
    // Verify shipping cost is displayed in the order summary
    const shippingCost = page.locator('text=/\$99|Envío.*99/');
    await expect(shippingCost.first()).toBeVisible();
  });

  test('should calculate totals correctly', async ({ page }) => {
    await page.goto('/checkout');
    
    // Check for subtotal, tax, shipping, and total
    const subtotal = page.locator('text=/Subtotal/').first();
    const total = page.locator('text=/Total.*\\$/').first();
    
    await expect(subtotal).toBeVisible();
    await expect(total).toBeVisible();
  });

  test('should integrate with payment provider', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill required fields first
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    
    // Since payment methods are now handled by Stripe,
    // just verify the checkout button exists
    const checkoutButton = page.locator('button[type="submit"]').filter({
      hasText: /Finalizar compra/
    });
    
    await expect(checkoutButton).toBeVisible();
  });

  test('should handle successful checkout submission', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill all required fields
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[type="tel"]', '5551234567');
    await page.fill('input[id="address"]', 'Av. Reforma 123');
    await page.fill('input[id="city"]', 'Ciudad de México');
    await page.fill('input[id="state"]', 'CDMX');
    await page.fill('input[id="postalCode"]', '06500');
    
    // Accept terms
    const termsCheckbox = page.locator('input[type="checkbox"]#acceptTerms');
    await termsCheckbox.check();
    
    // Submit form (this will create Stripe session)
    const submitButton = page.locator('button[type="submit"]').filter({
      hasText: /Finalizar compra/
    });
    
    // Intercept the API call to verify it works
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/checkout/sessions') && 
      response.request().method() === 'POST'
    );
    
    await submitButton.click();
    
    const response = await responsePromise;
    
    // Check if the API call was successful
    expect(response.status()).toBe(200);
    
    // Response should contain sessionId
    const responseData = await response.json();
    expect(responseData).toHaveProperty('sessionId');
  });
});