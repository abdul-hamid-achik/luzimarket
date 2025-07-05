import { test, expect } from '../fixtures/test';
import { routes } from '../helpers/navigation';

test.describe('Multi-Vendor Orders', () => {
  let customerEmail: string;
  let orderId: string;
  let vendor1Products: { name: string; vendor: string }[] = [];
  let vendor2Products: { name: string; vendor: string }[] = [];

  test.beforeEach(async ({ page }) => {
    customerEmail = `multi-vendor-${Date.now()}@example.com`;
    
    // Get products from different vendors
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    
    // Collect vendor information from product cards
    const productCards = await page.getByTestId('product-card').all();
    
    for (let i = 0; i < Math.min(4, productCards.length); i++) {
      const card = productCards[i];
      const productName = await card.getByTestId('product-name').textContent() || '';
      const vendorName = await card.getByTestId('vendor-name').textContent() || '';
      
      if (vendorName && !vendor1Products.length) {
        vendor1Products.push({ name: productName, vendor: vendorName });
      } else if (vendorName && vendorName !== vendor1Products[0]?.vendor && !vendor2Products.length) {
        vendor2Products.push({ name: productName, vendor: vendorName });
      }
      
      if (vendor1Products.length && vendor2Products.length) break;
    }
  });

  test('should split order by vendor and calculate shipping separately', async ({ page }) => {
    // Add products from first vendor
    await page.goto(routes.products);
    
    // Find and add product from vendor 1
    const vendor1Card = page.getByTestId('product-card').filter({ 
      hasText: vendor1Products[0].vendor 
    }).first();
    await vendor1Card.click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.waitForTimeout(500);
    
    // Close cart and add product from vendor 2
    await page.keyboard.press('Escape');
    await page.goto(routes.products);
    
    const vendor2Card = page.getByTestId('product-card').filter({ 
      hasText: vendor2Products[0].vendor 
    }).first();
    await vendor2Card.click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.waitForSelector('[role="dialog"]');
    
    // Verify cart has products from both vendors
    await expect(page.getByTestId('cart-item')).toHaveCount(2);
    
    // Proceed to checkout
    await page.getByRole('button', { name: /pagar/i }).click();
    await page.waitForURL('**/pagar');
    
    // Fill checkout form
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="firstName"]', 'Multi');
    await page.fill('input[name="lastName"]', 'Vendor');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Av. Multi Vendor 123');
    await page.fill('input[name="city"]', 'Ciudad de México');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '06700');
    await page.fill('input[name="country"]', 'México');
    await page.locator('label[for="acceptTerms"]').click();
    
    // Verify order summary shows vendor grouping
    const orderSummary = page.getByTestId('order-summary');
    await expect(orderSummary).toBeVisible();
    
    // Check for vendor sections in order summary
    await expect(orderSummary.getByText(vendor1Products[0].vendor)).toBeVisible();
    await expect(orderSummary.getByText(vendor2Products[0].vendor)).toBeVisible();
    
    // Verify separate shipping costs (should show multiple shipping lines)
    const shippingLines = await page.getByTestId('shipping-line').all();
    expect(shippingLines.length).toBeGreaterThanOrEqual(2);
    
    // Mock checkout session creation
    await page.route('**/api/checkout/sessions', async route => {
      const body = await route.request().postDataJSON();
      
      // Verify the request includes vendor grouping
      expect(body.items).toBeDefined();
      expect(body.vendorGroups).toBeDefined();
      
      await route.fulfill({
        json: {
          url: 'https://checkout.stripe.com/test',
          sessionId: 'multi-vendor-session-' + Date.now()
        }
      });
    });
    
    await page.getByRole('button', { name: /proceder al pago/i }).click();
  });

  test('should create separate orders for each vendor', async ({ page }) => {
    // Add products from multiple vendors
    await page.goto(routes.products);
    
    // Add from vendor 1
    const vendor1Card = page.getByTestId('product-card').filter({ 
      hasText: vendor1Products[0].vendor 
    }).first();
    await vendor1Card.click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.keyboard.press('Escape');
    
    // Add from vendor 2
    await page.goto(routes.products);
    const vendor2Card = page.getByTestId('product-card').filter({ 
      hasText: vendor2Products[0].vendor 
    }).first();
    await vendor2Card.click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    
    // Checkout
    await page.getByRole('button', { name: /pagar/i }).click();
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Test 123');
    await page.fill('input[name="city"]', 'CDMX');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '01000');
    await page.fill('input[name="country"]', 'México');
    await page.locator('label[for="acceptTerms"]').click();
    
    // Mock successful checkout that returns multiple order IDs
    const orderIds = [`ORD-V1-${Date.now()}`, `ORD-V2-${Date.now()}`];
    await page.route('**/api/checkout/sessions', async route => {
      await route.fulfill({
        json: {
          url: 'https://checkout.stripe.com/test',
          sessionId: 'test-session',
          metadata: { orderIds: orderIds.join(',') }
        }
      });
    });
    
    await page.getByRole('button', { name: /proceder al pago/i }).click();
    
    // Simulate success page with multiple orders
    await page.goto(`/success?session_id=test-session&order_ids=${orderIds.join(',')}`);
    
    // Verify success page shows multiple order numbers
    await expect(page.getByText(orderIds[0])).toBeVisible();
    await expect(page.getByText(orderIds[1])).toBeVisible();
    await expect(page.getByText(/pedidos creados/i)).toBeVisible();
  });

  test('should allow vendors to manage their portions independently', async ({ page }) => {
    // Create multi-vendor order first
    const baseOrderId = Date.now();
    const vendor1OrderId = `ORD-V1-${baseOrderId}`;
    const vendor2OrderId = `ORD-V2-${baseOrderId}`;
    
    // Place order with products from both vendors
    await page.goto(routes.products);
    const vendor1Card = page.getByTestId('product-card').filter({ 
      hasText: vendor1Products[0].vendor 
    }).first();
    await vendor1Card.click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.keyboard.press('Escape');
    
    await page.goto(routes.products);
    const vendor2Card = page.getByTestId('product-card').filter({ 
      hasText: vendor2Products[0].vendor 
    }).first();
    await vendor2Card.click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    
    // Quick checkout
    await page.getByRole('button', { name: /pagar/i }).click();
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Test 123');
    await page.fill('input[name="city"]', 'CDMX');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '01000');
    await page.fill('input[name="country"]', 'México');
    await page.locator('label[for="acceptTerms"]').click();
    
    await page.route('**/api/checkout/sessions', async route => {
      await route.fulfill({ json: { url: 'https://stripe.com', sessionId: 'test' } });
    });
    await page.getByRole('button', { name: /proceder al pago/i }).click();
    await page.goto(`/success?order_ids=${vendor1OrderId},${vendor2OrderId}`);
    
    // Login as first vendor
    await page.goto(routes.login);
    await page.getByRole('tab', { name: 'Vendedor' }).click();
    await page.fill('input[name="email"]', 'vendor1@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Check vendor 1 orders
    await page.goto('/vendor/orders');
    await expect(page.getByText(vendor1OrderId)).toBeVisible();
    await expect(page.getByText(vendor2OrderId)).not.toBeVisible(); // Should NOT see other vendor's order
    
    // Update vendor 1 order status
    await page.getByText(vendor1OrderId).click();
    await page.fill('input[name="trackingNumber"]', 'V1-TRACK-123');
    await page.selectOption('select[name="carrier"]', 'dhl');
    await page.getByTestId('order-status-select').selectOption('shipped');
    await page.getByRole('button', { name: /actualizar/i }).click();
    
    // Logout and login as vendor 2
    await page.getByTestId('user-menu').click();
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    
    await page.goto(routes.login);
    await page.getByRole('tab', { name: 'Vendedor' }).click();
    await page.fill('input[name="email"]', 'vendor2@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Check vendor 2 orders
    await page.goto('/vendor/orders');
    await expect(page.getByText(vendor2OrderId)).toBeVisible();
    await expect(page.getByText(vendor1OrderId)).not.toBeVisible(); // Should NOT see other vendor's order
    
    // Vendor 2's order should still be pending
    await page.getByText(vendor2OrderId).click();
    await expect(page.getByText(/pending|pendiente/i)).toBeVisible();
  });

  test('should handle partial order cancellations', async ({ page }) => {
    // Place multi-vendor order
    await page.goto(routes.products);
    const vendor1Card = page.getByTestId('product-card').filter({ 
      hasText: vendor1Products[0].vendor 
    }).first();
    await vendor1Card.click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.keyboard.press('Escape');
    
    await page.goto(routes.products);
    const vendor2Card = page.getByTestId('product-card').filter({ 
      hasText: vendor2Products[0].vendor 
    }).first();
    await vendor2Card.click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    
    // Checkout
    const cancelOrderId1 = `ORD-CANCEL-V1-${Date.now()}`;
    const cancelOrderId2 = `ORD-CANCEL-V2-${Date.now()}`;
    
    await page.getByRole('button', { name: /pagar/i }).click();
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="firstName"]', 'Cancel');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Cancel Test 123');
    await page.fill('input[name="city"]', 'CDMX');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '01000');
    await page.fill('input[name="country"]', 'México');
    await page.locator('label[for="acceptTerms"]').click();
    
    await page.route('**/api/checkout/sessions', async route => {
      await route.fulfill({ json: { url: 'https://stripe.com', sessionId: 'test' } });
    });
    await page.getByRole('button', { name: /proceder al pago/i }).click();
    await page.goto(`/success?order_ids=${cancelOrderId1},${cancelOrderId2}`);
    
    // Customer requests cancellation of one vendor's items
    await page.goto('/orders/lookup');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="orderNumber"]', cancelOrderId1);
    await page.getByRole('button', { name: /buscar/i }).click();
    
    // Cancel only vendor 1's order
    await page.getByRole('button', { name: /cancelar orden/i }).click();
    await page.getByRole('button', { name: /confirmar/i }).click();
    
    // Check status of both orders
    await page.goto('/orders/lookup');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="orderNumber"]', cancelOrderId1);
    await page.getByRole('button', { name: /buscar/i }).click();
    await expect(page.getByText(/cancelado|cancelled/i)).toBeVisible();
    
    // Vendor 2's order should still be active
    await page.goto('/orders/lookup');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="orderNumber"]', cancelOrderId2);
    await page.getByRole('button', { name: /buscar/i }).click();
    await expect(page.getByText(/pendiente|pending/i)).toBeVisible();
  });

  test('should show combined tracking when all vendors ship', async ({ page }) => {
    // Create order with multiple vendors
    const trackingOrderId1 = `ORD-TRACK-V1-${Date.now()}`;
    const trackingOrderId2 = `ORD-TRACK-V2-${Date.now()}`;
    
    // Mock order lookup to return both orders shipped
    await page.route('**/api/orders/lookup', async route => {
      await route.fulfill({
        json: {
          orders: [
            {
              id: trackingOrderId1,
              status: 'shipped',
              trackingNumber: 'TRACK-V1-123',
              carrier: 'fedex',
              vendor: vendor1Products[0].vendor
            },
            {
              id: trackingOrderId2,
              status: 'shipped',
              trackingNumber: 'TRACK-V2-456',
              carrier: 'ups',
              vendor: vendor2Products[0].vendor
            }
          ]
        }
      });
    });
    
    // Lookup combined order
    await page.goto('/orders/lookup');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="orderNumber"]', trackingOrderId1);
    await page.getByRole('button', { name: /buscar/i }).click();
    
    // Should show both tracking numbers
    await expect(page.getByText('TRACK-V1-123')).toBeVisible();
    await expect(page.getByText('TRACK-V2-456')).toBeVisible();
    
    // Should show both vendor names
    await expect(page.getByText(vendor1Products[0].vendor)).toBeVisible();
    await expect(page.getByText(vendor2Products[0].vendor)).toBeVisible();
    
    // Should have multiple track package buttons
    const trackButtons = await page.getByRole('button', { name: /rastrear/i }).all();
    expect(trackButtons.length).toBeGreaterThanOrEqual(2);
  });

  test('should calculate taxes per vendor based on their location', async ({ page }) => {
    // Add products from different vendors
    await page.goto(routes.products);
    
    // Add multiple items to see tax calculation
    for (let i = 0; i < 2; i++) {
      const vendor1Card = page.getByTestId('product-card').filter({ 
        hasText: vendor1Products[0].vendor 
      }).first();
      await vendor1Card.click();
      await page.getByRole('button', { name: /agregar al carrito/i }).click();
      await page.keyboard.press('Escape');
      await page.goto(routes.products);
    }
    
    const vendor2Card = page.getByTestId('product-card').filter({ 
      hasText: vendor2Products[0].vendor 
    }).first();
    await vendor2Card.click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    
    // Go to checkout
    await page.getByRole('button', { name: /pagar/i }).click();
    
    // Fill address to trigger tax calculation
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="firstName"]', 'Tax');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Tax Test 123');
    await page.fill('input[name="city"]', 'Ciudad de México');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '06700');
    await page.fill('input[name="country"]', 'México');
    
    // Wait for tax calculation
    await page.waitForTimeout(1000);
    
    // Verify tax lines per vendor
    const taxLines = await page.getByTestId('tax-line').all();
    expect(taxLines.length).toBeGreaterThanOrEqual(2); // One per vendor
    
    // Each vendor should have their own tax calculation
    for (const taxLine of taxLines) {
      const taxText = await taxLine.textContent();
      expect(taxText).toMatch(/\$[\d,]+\.\d{2}/); // Should show currency amount
    }
  });
});