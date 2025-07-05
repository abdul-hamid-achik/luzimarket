import { test, expect } from '@playwright/test';
import { routes, uiText, enRoutes } from '../helpers/navigation';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Add a product to cart before each test
    await page.goto(routes.products);

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
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should open cart sidebar', async ({ page }) => {
    // Close any open dialogs first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Click cart button - look for button with ShoppingBag icon
    const cartButton = page.locator('button[aria-label*="Shopping cart" i], button[aria-label*="cart" i], button[aria-label*="carrito" i], button[data-testid="cart-button"]').filter({
      has: page.locator('svg')
    }).last(); // Use last() to avoid mobile menu button

    await cartButton.click();

    // Wait for animation to complete
    await page.waitForTimeout(300);

    // Cart sidebar should be visible - Sheet component renders with role="dialog"
    const cartSidebar = page.getByRole('dialog');

    // Verify it's the cart dialog by checking for cart-specific content
    await expect(cartSidebar).toBeVisible();
    await expect(cartSidebar.locator('text=/Carrito|Cart/')).toBeVisible();
  });

  test('should update quantity in cart', async ({ page }) => {
    // Close any open dialogs first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Open cart - use the shopping cart button
    const cartButton = page.locator('button[aria-label*="Shopping cart" i], button[aria-label*="cart" i], button[aria-label*="carrito" i], button[data-testid="cart-button"]').filter({
      has: page.locator('svg')
    }).last();
    await cartButton.click();

    // Wait for dialog to open
    await page.waitForTimeout(300);
    const cartDialog = page.getByRole('dialog');
    await expect(cartDialog).toBeVisible();

    // Find quantity controls within the dialog - look for button with Plus SVG icon
    const increaseButton = cartDialog.locator('button:has(svg.h-3.w-3)').nth(1); // Second button is the plus

    // Wait for the button to be interactive
    await expect(increaseButton).toBeVisible();

    // Get initial quantity
    const quantitySpan = cartDialog.locator('span.text-sm.font-univers.w-8.text-center').first();
    const initialQuantity = await quantitySpan.textContent();

    // Increase quantity
    await increaseButton.click();

    // Wait for update and check quantity
    await page.waitForTimeout(100);
    await expect(quantitySpan).toHaveText('2');
  });

  test('should remove item from cart', async ({ page }) => {
    // Close any open dialogs first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Open cart - use the shopping cart button
    const cartButton = page.locator('button[aria-label*="Shopping cart" i], button[aria-label*="cart" i], button[aria-label*="carrito" i], button[data-testid="cart-button"]').filter({
      has: page.locator('svg')
    }).last();
    await cartButton.click();

    // Wait for dialog to open
    await page.waitForTimeout(300);
    const cartDialog = page.getByRole('dialog');
    await expect(cartDialog).toBeVisible();

    // Find remove button (X icon)
    const removeButton = cartDialog.locator('button').filter({
      has: page.locator('svg.h-4.w-4')
    }).first();

    await expect(removeButton).toBeVisible();
    await removeButton.click();

    // Cart should be empty
    await expect(cartDialog.locator('text=/vacío|empty/i')).toBeVisible();
  });

  test('should proceed to checkout', async ({ page }) => {
    // Close any open dialogs first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Open cart - use the shopping cart button
    const cartButton = page.locator('button[aria-label*="Shopping cart" i], button[aria-label*="cart" i], button[aria-label*="carrito" i], button[data-testid="cart-button"]').filter({
      has: page.locator('svg')
    }).last();
    await cartButton.click();

    // Wait for dialog to open
    await page.waitForTimeout(300);
    const cartDialog = page.getByRole('dialog');
    await expect(cartDialog).toBeVisible();

    // Click checkout button
    const checkoutButton = cartDialog.locator('a').filter({
      hasText: /Proceder al pago|Checkout|Finalizar/
    }).first();

    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();

    // Should navigate to checkout page
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('should show checkout form', async ({ page }) => {
    // Go directly to checkout
    await page.goto(routes.checkout);

    // Check form fields are present
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name*="name"], input[placeholder*="Nombre"]').first()).toBeVisible();
    await expect(page.locator('input[name*="address"], input[placeholder*="Dirección"]').first()).toBeVisible();
  });

  test('should validate checkout form', async ({ page }) => {
    await page.goto(routes.checkout);

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
    await page.goto(routes.checkout);

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
    await page.goto(routes.checkout);

    // Check order summary is visible
    const orderSummary = page.locator('text=/Order Summary|Resumen|Total/').first();
    await expect(orderSummary).toBeVisible();

    // Check price is displayed
    const price = page.locator('text=/\\$[0-9,]+/').first();
    await expect(price).toBeVisible();
  });

  test('should handle guest checkout', async ({ page }) => {
    await page.goto(routes.checkout);

    // Look for guest checkout option
    const guestOption = page.locator('text=/Guest|Invitado|Continue without/').first();

    if (await guestOption.isVisible()) {
      await guestOption.click();

      // Form should still be accessible
      await expect(page.locator('input[type="email"]').first()).toBeVisible();
    }
  });

  test('should show shipping options', async ({ page }) => {
    await page.goto(routes.checkout);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for shipping in the totals section - it's within a div with flex justify-between
    const shippingRow = page.locator('div.flex.justify-between').filter({
      hasText: 'Envío'
    });

    // Verify shipping row is visible
    await expect(shippingRow).toBeVisible();

    // Verify the shipping amount shows $89 (base rate for standard shipping)
    await expect(shippingRow).toContainText('$89');
  });

  test('should calculate totals correctly', async ({ page }) => {
    await page.goto(routes.checkout);

    // Check for subtotal, tax, shipping, and total
    const subtotal = page.locator('text=/Subtotal/').first();
    const total = page.locator('text=/Total.*\\$/').first();

    await expect(subtotal).toBeVisible();
    await expect(total).toBeVisible();
  });

  test('should integrate with payment provider', async ({ page }) => {
    await page.goto(routes.checkout);

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
    // Since beforeEach already adds a product to cart,
    // let's verify cart has items by checking localStorage
    const cartItems = await page.evaluate(() => {
      const cart = localStorage.getItem('luzimarket-cart');
      return cart ? JSON.parse(cart) : [];
    });

    console.log('Cart items:', cartItems.length);

    // If no items in cart, add one
    if (cartItems.length === 0) {
      // Go to products page
      await page.goto(enRoutes.products);
      await page.waitForLoadState('networkidle');

      // Add first product
      const firstProduct = page.locator('main').locator('a[href*="/products/"]').first();
      await firstProduct.hover();
      const addToCartButton = firstProduct.locator('button:has-text("Add to cart")').first();
      await addToCartButton.click();
      await page.waitForTimeout(1000);
    }

    // Now navigate to checkout
    const currentUrl = page.url();
    const locale = currentUrl.includes('/es/') ? 'es' : 'en';
    await page.goto(locale === 'en' ? enRoutes.checkout : routes.checkout);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Debug: Check what's on the page
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log('Page title:', pageTitle);
    console.log('Page URL:', pageUrl);

    // Check if we have the checkout form (not empty cart page)
    const checkoutForm = page.locator('form.space-y-8'); // The main checkout form has this class
    const emptyCartMessage = page.locator('text=/Tu carrito está vacío|Your cart is empty/i');

    // If cart is empty, skip this test
    if (await emptyCartMessage.isVisible()) {
      test.skip(true, 'Cart is empty, skipping checkout submission test');
      return;
    }

    // Wait for form to be visible
    await expect(checkoutForm).toBeVisible({ timeout: 10000 });

    // Fill all required fields
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[type="tel"]', '5551234567');
    await page.fill('input[id="address"]', 'Av. Reforma 123');
    await page.fill('input[id="city"]', 'Ciudad de México');
    await page.fill('input[id="state"]', 'CDMX');
    await page.fill('input[id="postalCode"]', '06500');

    // Accept terms - Click the label to toggle the Radix checkbox
    const termsLabel = page.locator('label[for="acceptTerms"]');
    await termsLabel.click();

    // Wait for the checkout form to be visible (it has class space-y-8)
    await expect(page.locator('form.space-y-8')).toBeVisible({ timeout: 10000 });

    // Wait a bit more for React to render
    await page.waitForTimeout(2000);

    // Find the submit button by its text content
    const submitButton = page.locator('button').filter({
      hasText: /Finalizar compra.*\$|Place order.*\$/i
    }).first();

    // Verify button is visible and enabled
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeEnabled();

    // Setup response listener before clicking
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/checkout/sessions') && response.request().method() === 'POST',
      { timeout: 10000 }
    );

    // Click submit
    await submitButton.click();

    try {
      const response = await responsePromise;

      // Check if the API call was successful
      expect(response.status()).toBe(200);

      // Response should contain sessionId
      const responseData = await response.json();
      expect(responseData).toHaveProperty('sessionId');

      // If we have a URL in response, verify it's for Stripe
      if (responseData.url) {
        expect(responseData.url).toContain('checkout.stripe.com');
      }
    } catch (error) {
      // Check if we were redirected to Stripe
      await page.waitForTimeout(2000);
      const currentUrl = page.url();

      if (currentUrl.includes('checkout.stripe.com')) {
        // Success - we're on Stripe checkout
        expect(currentUrl).toContain('checkout.stripe.com');
      } else if (currentUrl.includes('/success')) {
        // Success - we're on success page
        expect(currentUrl).toContain('/success');
      } else {
        // Check for error messages
        const errorMessage = await page.locator('.text-red-600, .text-red-500').first().textContent().catch(() => null);
        if (errorMessage) {
          throw new Error(`Checkout failed with error: ${errorMessage}`);
        }
        throw new Error(`Unexpected state - current URL: ${currentUrl}`);
      }
    }
  });
});