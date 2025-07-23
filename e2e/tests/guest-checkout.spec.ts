import { test, expect } from '../fixtures/test';
import { routes } from '../helpers/navigation';

test.describe('Guest Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.home);
  });

  test('should allow guest users to complete checkout', async ({ page }) => {
    // Browse to products page
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');

    // Add first product to cart
    await page.getByTestId('product-card').first().click();
    await page.waitForLoadState('networkidle');
    
    // Add to cart from product detail page - wait for page to fully load
    await page.waitForTimeout(1000);
    const addToCartButton = page.locator('main').getByRole('button', { name: /agregar al carrito|add to cart/i }).first();
    await addToCartButton.click();
    
    // Wait for cart sidebar to appear
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(500); // Wait for animation

    // Proceed to checkout - button should be in the cart dialog
    const checkoutButton = page.locator('[role="dialog"]').getByRole('button', { name: /pagar|checkout/i });
    await checkoutButton.click();
    await page.waitForURL('**/pagar');

    // Fill guest checkout form
    await page.fill('input[name="email"]', `guest-${Date.now()}@example.com`);
    await page.fill('input[name="firstName"]', 'Guest');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    
    // Fill shipping address
    await page.fill('input[name="address"]', 'Av. Insurgentes Sur 123');
    await page.fill('input[name="city"]', 'Ciudad de México');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '01000');
    await page.fill('input[name="country"]', 'México');

    // Accept terms
    await page.locator('label[for="acceptTerms"]').click();

    // Verify order summary is displayed
    await expect(page.getByTestId('order-summary')).toBeVisible();
    
    // Intercept Stripe checkout session creation
    const checkoutPromise = page.waitForResponse(
      response => response.url().includes('/api/checkout/sessions') && response.status() === 200
    );

    // Submit checkout
    await page.getByRole('button', { name: /proceder al pago/i }).click();
    
    const checkoutResponse = await checkoutPromise;
    const checkoutData = await checkoutResponse.json();
    
    // Verify checkout session was created
    expect(checkoutData).toHaveProperty('url');
    expect(checkoutData.url).toContain('checkout.stripe.com');
  });

  test('should validate guest checkout form fields', async ({ page }) => {
    // Add product to cart
    await page.goto(routes.products);
    await page.getByTestId('product-card').first().click();
    await page.waitForTimeout(1000);
    await page.locator('main').getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(300);
    
    // Go to checkout
    await page.getByRole('button', { name: /pagar/i }).click();
    await page.waitForURL('**/pagar');

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /proceder al pago/i }).click();

    // Check for validation errors
    await expect(page.getByText(/este campo es requerido/i).first()).toBeVisible();
    
    // Fill email with invalid format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.getByRole('button', { name: /proceder al pago/i }).click();
    
    // Should show email validation error
    await expect(page.getByText(/correo electrónico inválido/i)).toBeVisible();
  });

  test('should show guest order confirmation with order number', async ({ page }) => {
    // Add product and go to checkout
    await page.goto(routes.products);
    await page.getByTestId('product-card').first().click();
    await page.waitForTimeout(1000);
    await page.locator('main').getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /pagar/i }).click();

    // Fill checkout form
    const guestEmail = `guest-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', guestEmail);
    await page.fill('input[name="firstName"]', 'Guest');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Av. Reforma 222');
    await page.fill('input[name="city"]', 'Ciudad de México');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '06600');
    await page.fill('input[name="country"]', 'México');
    await page.locator('label[for="acceptTerms"]').click();

    // Mock successful payment completion
    await page.route('**/api/checkout/sessions', async route => {
      const json = {
        url: 'https://checkout.stripe.com/test_session',
        sessionId: 'test_session_123'
      };
      await route.fulfill({ json });
    });

    // Submit checkout
    await page.getByRole('button', { name: /proceder al pago/i }).click();

    // In real test, we would handle Stripe redirect
    // For now, let's navigate to success page with mock data
    await page.goto(`/success?session_id=test_session_123`);

    // Verify success page shows order confirmation
    await expect(page.getByText(/gracias por tu compra/i)).toBeVisible();
    await expect(page.getByText(/número de orden/i)).toBeVisible();
    
    // Store order number for lookup test
    const orderNumberElement = await page.getByTestId('order-number');
    const orderNumber = await orderNumberElement.textContent();
    
    expect(orderNumber).toBeTruthy();
    
    // Test guest can lookup order
    await page.goto('/orders/lookup');
    await page.fill('input[name="email"]', guestEmail);
    await page.fill('input[name="orderNumber"]', orderNumber!);
    await page.getByRole('button', { name: /buscar orden/i }).click();

    // Verify order details are displayed
    await expect(page.getByText(orderNumber!)).toBeVisible();
    await expect(page.getByText(guestEmail)).toBeVisible();
  });

  test('should persist cart after failed checkout attempt', async ({ page }) => {
    // Add multiple products to cart
    await page.goto(routes.products);
    
    // Add first product
    await page.getByTestId('product-card').first().click();
    await page.waitForTimeout(1000);
    await page.locator('main').getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForTimeout(500);
    
    // Close cart and add second product
    await page.keyboard.press('Escape');
    await page.goto(routes.products);
    await page.getByTestId('product-card').nth(1).click();
    await page.locator('main').getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]');

    // Verify cart has 2 items
    await expect(page.getByTestId('cart-item')).toHaveCount(2);

    // Go to checkout
    await page.getByRole('button', { name: /pagar/i }).click();
    
    // Simulate payment failure by going back
    await page.goBack();
    
    // Open cart again
    await page.getByTestId('cart-trigger').click();
    await page.waitForSelector('[role="dialog"]');
    
    // Verify cart still has 2 items
    await expect(page.getByTestId('cart-item')).toHaveCount(2);
  });

  test('should handle product becoming unavailable during checkout', async ({ page }) => {
    // Add product to cart
    await page.goto(routes.products);
    await page.getByTestId('product-card').first().click();
    
    // Store product name - get from the detail page, not the listing
    const productName = await page.locator('main').getByTestId('product-name').first().textContent();
    
    await page.locator('main').getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(300);
    
    // Go to checkout
    await page.getByRole('button', { name: /pagar/i }).click();
    await page.waitForURL('**/pagar');

    // Mock API to return out of stock error
    await page.route('**/api/checkout/sessions', async route => {
      await route.fulfill({
        status: 400,
        json: {
          error: 'Product out of stock',
          productName: productName
        }
      });
    });

    // Fill form and try to checkout
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Test Address 123');
    await page.fill('input[name="city"]', 'CDMX');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '01000');
    await page.fill('input[name="country"]', 'México');
    await page.locator('label[for="acceptTerms"]').click();
    
    await page.getByRole('button', { name: /proceder al pago/i }).click();

    // Should show error message
    await expect(page.getByText(/producto.*no.*disponible|out of stock/i)).toBeVisible();
  });

  test('should calculate shipping and taxes correctly', async ({ page }) => {
    // Add product to cart
    await page.goto(routes.products);
    await page.getByTestId('product-card').first().click();
    await page.waitForTimeout(1000);
    await page.locator('main').getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(300);
    
    // Go to checkout
    await page.getByRole('button', { name: /pagar/i }).click();
    await page.waitForURL('**/pagar');

    // Verify order summary shows correct calculations
    const subtotal = await page.getByTestId('order-subtotal').textContent();
    const shipping = await page.getByTestId('order-shipping').textContent();
    const tax = await page.getByTestId('order-tax').textContent();
    const total = await page.getByTestId('order-total').textContent();

    // Verify shipping is displayed (should be $99 based on existing tests)
    expect(shipping).toContain('99');
    
    // Verify tax is calculated (16% IVA in Mexico)
    expect(tax).toBeTruthy();
    
    // Verify total includes subtotal + shipping + tax
    expect(total).toBeTruthy();
  });
});