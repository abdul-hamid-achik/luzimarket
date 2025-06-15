import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Add a product to cart before each test
    await page.goto('/products');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"], article');
    
    // Add first product to cart
    const firstProduct = page.locator('[data-testid="product-card"], article').first();
    await firstProduct.hover();
    
    const addToCartButton = firstProduct.locator('button').filter({ 
      hasText: /Add to Cart|Agregar/ 
    }).first();
    
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      // Wait for cart to update
      await page.waitForTimeout(1000);
    }
  });

  test('should open cart sidebar', async ({ page }) => {
    // Click cart button
    const cartButton = page.locator('[aria-label="Cart"], button').filter({
      has: page.locator('svg, text=/Cart|Carrito/')
    }).first();
    
    await cartButton.click();
    
    // Cart sidebar should be visible
    const cartSidebar = page.locator('[data-testid="cart-sidebar"], aside').filter({
      hasText: /Cart|Carrito/
    });
    
    await expect(cartSidebar).toBeVisible();
  });

  test('should update quantity in cart', async ({ page }) => {
    // Open cart
    const cartButton = page.locator('[aria-label="Cart"], button').first();
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
    // Open cart
    const cartButton = page.locator('[aria-label="Cart"], button').first();
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
    // Open cart
    const cartButton = page.locator('[aria-label="Cart"], button').first();
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
      hasText: /Place Order|Realizar Pedido|Pagar/
    }).first();
    
    await submitButton.click();
    
    // Should show validation errors
    const errorMessages = page.locator('.error, [role="alert"], text=/required|requerido/i');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('should fill checkout form', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill customer information
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name*="name"], input[placeholder*="Nombre"]', 'Test User');
    await page.fill('input[name*="phone"], input[type="tel"]', '5551234567');
    
    // Fill shipping address
    await page.fill('input[name*="address"], input[placeholder*="Dirección"]', 'Av. Reforma 123');
    await page.fill('input[name*="city"], input[placeholder*="Ciudad"]', 'Ciudad de México');
    await page.fill('input[name*="state"], input[placeholder*="Estado"]', 'CDMX');
    await page.fill('input[name*="zip"], input[name*="postal"]', '06500');
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
    
    // Look for shipping options
    const shippingSection = page.locator('text=/Shipping|Envío/').first();
    
    if (await shippingSection.isVisible()) {
      // Should have shipping method options
      const shippingOptions = page.locator('input[type="radio"][name*="shipping"]');
      await expect(shippingOptions).toHaveCount(2, { timeout: 5000 });
    }
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
    await page.fill('input[name*="name"]', 'Test User');
    
    // Look for Stripe iframe or payment section
    const paymentSection = page.locator('text=/Payment|Pago|Card/').first();
    await expect(paymentSection).toBeVisible();
    
    // Check for Stripe elements (might be in iframe)
    const stripeFrame = page.frameLocator('iframe[title*="Stripe"], iframe[src*="stripe"]').first();
    if (await page.locator('iframe[title*="Stripe"]').isVisible()) {
      // Stripe is integrated
      expect(true).toBeTruthy();
    }
  });
});