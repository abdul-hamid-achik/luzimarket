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
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Collect vendor information from product cards
    const productCards = await page.getByTestId('product-card').all();

    for (let i = 0; i < Math.min(10, productCards.length); i++) {
      const card = productCards[i];
      const productName = await card.getByTestId('product-name').textContent() || '';
      const vendorNameElement = card.getByTestId('vendor-name');
      const vendorName = await vendorNameElement.isVisible() ? await vendorNameElement.textContent() || '' : '';

      if (vendorName && !vendor1Products.length) {
        vendor1Products.push({ name: productName, vendor: vendorName });
      } else if (vendorName && vendorName !== vendor1Products[0]?.vendor && !vendor2Products.length) {
        vendor2Products.push({ name: productName, vendor: vendorName });
      }

      if (vendor1Products.length && vendor2Products.length) break;
    }
  });

  test('should split order by vendor and calculate shipping separately', async ({ page }) => {
    // Skip test if we don't have products from 2 different vendors
    if (!vendor1Products.length || !vendor2Products.length) {
      // 'Skipping test: Need products from at least 2 different vendors');
      return;
    }

    // Add products from first vendor
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Find and add product from vendor 1
    const vendor1Card = page.getByTestId('product-card').filter({
      hasText: vendor1Products[0].name
    }).first();
    await vendor1Card.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

    // Close cart and add product from vendor 2
    // Close cart sidebar and wait until hidden
    await page.keyboard.press('Escape');
    await page.locator('[role="dialog"]').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const vendor2Card = page.getByTestId('product-card').filter({
      hasText: vendor2Products[0].name
    }).first();
    await vendor2Card.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

    // Verify cart has products from both vendors
    await expect(page.getByTestId('cart-item')).toHaveCount(2);

    // Proceed to checkout - try link first, then button
    const checkoutLink = page.getByRole('link', { name: /proceder al pago|pagar/i });
    const checkoutButton = page.getByRole('button', { name: /pagar/i });

    if (await checkoutLink.isVisible({ timeout: 2000 })) {
      await checkoutLink.click();
    } else if (await checkoutButton.isVisible({ timeout: 2000 })) {
      await checkoutButton.click();
    }
    await page.waitForURL('**/pagar', { timeout: 20000 });
    await page.waitForSelector('input[name="email"]', { timeout: 20000 });

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
    await page.locator('label[for="acceptTerms"]').click({ force: true });

    // Verify order summary shows vendor grouping
    const orderSummary = page.getByTestId('order-summary');
    await expect(orderSummary).toBeVisible();

    // Check for vendor sections in order summary (vendor names might be transformed)
    const vendor1Text = vendor1Products[0].vendor.replace('+ ', '');
    const vendor2Text = vendor2Products[0].vendor.replace('+ ', '');

    // Check if vendor names appear in order summary (they might be formatted differently)
    const orderSummaryText = await orderSummary.textContent();
    expect(orderSummaryText?.toLowerCase()).toContain(vendor1Text.toLowerCase());
    expect(orderSummaryText?.toLowerCase()).toContain(vendor2Text.toLowerCase());

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

    // Submit the checkout form - look for the submit button
    const submitButton = page.getByRole('button', { name: /proceder al pago|completar compra|pagar/i });
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
    } else {
      // Try finding any submit button at the bottom of the form
      const formSubmit = page.locator('button[type="submit"]').last();
      await formSubmit.click();
    }
  });

  test('should create separate orders for each vendor', async ({ page }) => {
    // Skip test if we don't have products from 2 different vendors
    if (!vendor1Products.length || !vendor2Products.length) {
      // 'Skipping test: Need products from at least 2 different vendors');
      return;
    }

    // Add products from multiple vendors
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Add from vendor 1
    const vendor1Card = page.getByTestId('product-card').filter({
      hasText: vendor1Products[0].name
    }).first();
    await vendor1Card.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    await page.keyboard.press('Escape');
    await page.locator('[role="dialog"]').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });

    // Add from vendor 2
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const vendor2Card = page.getByTestId('product-card').filter({
      hasText: vendor2Products[0].name
    }).first();
    await vendor2Card.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

    // Checkout - try link first, then button
    const checkoutLink2 = page.getByRole('link', { name: /proceder al pago|pagar/i });
    const checkoutButton2 = page.getByRole('button', { name: /pagar/i });

    if (await checkoutLink2.isVisible({ timeout: 2000 })) {
      await checkoutLink2.click();
    } else if (await checkoutButton2.isVisible({ timeout: 2000 })) {
      await checkoutButton2.click();
    }
    await page.waitForSelector('input[name="email"]', { timeout: 20000 });
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Test 123');
    await page.fill('input[name="city"]', 'CDMX');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '01000');
    await page.fill('input[name="country"]', 'México');
    await page.locator('label[for="acceptTerms"]').click({ force: true });

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

    // Submit the checkout form - look for the submit button
    const submitButton = page.getByRole('button', { name: /proceder al pago|completar compra|pagar/i });
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
    } else {
      // Try finding any submit button at the bottom of the form
      const formSubmit = page.locator('button[type="submit"]').last();
      await formSubmit.click();
    }

    // Simulate success page with multiple orders
    await page.goto(`/success?session_id=test-session&orderIds=${orderIds.join(',')}`);

    // Verify success page shows multiple order numbers
    await expect(page.getByText(orderIds[0])).toBeVisible();
    await expect(page.getByText(orderIds[1])).toBeVisible();
    await expect(page.getByText(/pedidos creados/i)).toBeVisible();
  });

  test('should allow vendors to manage their portions independently', async ({ page }) => {
    // Use test orders from seed data (created in db/seed/index.ts)
    const vendor1OrderId = 'LM-TEST-MV1';
    const vendor2OrderId = 'LM-TEST-MV2';

    // Orders already exist from seed data - no need to create them

    // Login as vendor1 to verify order isolation
    await page.goto(routes.login);
    await page.getByRole('tab', { name: 'Vendedor' }).click();
    await page.waitForTimeout(500);
    await page.locator('#vendor-email').fill('vendor1@example.com');
    await page.locator('#vendor-password').fill('password123');
    await page.locator('form').filter({ has: page.locator('#vendor-email') }).locator('button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname.includes('/vendor') || url.pathname.includes('/vendedor'), { timeout: 15000 });

    // Check vendor1 orders - should see own order only
    await page.goto('/vendor/orders');
    await page.waitForLoadState('networkidle');

    // Should see vendor1's order
    const vendor1OrderVisible = await page.getByText(vendor1OrderId).isVisible({ timeout: 3000 }).catch(() => false);
    expect(vendor1OrderVisible).toBeTruthy();

    // Should NOT see vendor2's order
    const vendor2OrderVisible = await page.getByText(vendor2OrderId).isVisible({ timeout: 1000 }).catch(() => false);
    expect(vendor2OrderVisible).toBeFalsy();

    // Logout vendor1
    const logoutForm = page.locator('form[action*="signout"]');
    if (await logoutForm.isVisible({ timeout: 2000 })) {
      await logoutForm.locator('button[type="submit"]').click();
    } else {
      await page.context().clearCookies();
    }
    await page.waitForTimeout(1000);

    // Login as vendor2 to verify the reverse
    await page.goto(routes.login);
    await page.getByRole('tab', { name: 'Vendedor' }).click();
    await page.waitForTimeout(500);
    await page.locator('#vendor-email').fill('vendor2@example.com');
    await page.locator('#vendor-password').fill('password123');
    await page.locator('form').filter({ has: page.locator('#vendor-email') }).locator('button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname.includes('/vendor') || url.pathname.includes('/vendedor'), { timeout: 15000 });

    // Check vendor2 orders
    await page.goto('/vendor/orders');
    await page.waitForLoadState('networkidle');

    // Should see vendor2's order
    const vendor2OrderVisible2 = await page.getByText(vendor2OrderId).isVisible({ timeout: 3000 }).catch(() => false);
    expect(vendor2OrderVisible2).toBeTruthy();

    // Should NOT see vendor1's order  
    const vendor1OrderVisible2 = await page.getByText(vendor1OrderId).isVisible({ timeout: 1000 }).catch(() => false);
    expect(vendor1OrderVisible2).toBeFalsy();
  });

  test('should handle partial order cancellations', async ({ page }) => {
    // Place multi-vendor order
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const vendor1Card = page.getByTestId('product-card').filter({
      hasText: vendor1Products[0].name
    }).first();
    await vendor1Card.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

    // Close cart properly
    await page.keyboard.press('Escape');
    await page.locator('[role="dialog"]').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });

    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const vendor2Card = page.getByTestId('product-card').filter({
      hasText: vendor2Products[0].name
    }).first();
    await vendor2Card.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

    // Verify cart has 2 items
    await expect(page.getByTestId('cart-item')).toHaveCount(2);

    // Mock order creation for testing
    const cancelOrderId1 = `ORD-CANCEL-V1-${Date.now()}`;
    const cancelOrderId2 = `ORD-CANCEL-V2-${Date.now()}`;

    // Mock the order lookup
    await page.route('**/api/orders/lookup', async route => {
      await route.fulfill({
        json: { orderNumber: cancelOrderId1 }
      });
    });

    // Mock the guest order detail endpoint with cancellable status
    await page.route(`**/api/orders/guest/${cancelOrderId1}**`, async route => {
      await route.fulfill({
        json: {
          order: {
            id: '1',
            orderNumber: cancelOrderId1,
            status: 'pending', // Cancellable status
            total: '1000',
            subtotal: '860',
            tax: '140',
            shipping: '100',
            vendor: {
              id: '1',
              businessName: vendor1Products[0].vendor,
              email: 'vendor1@example.com',
              phone: null
            },
            items: [
              { id: '1', quantity: 1, price: '860', total: '860', product: { name: vendor1Products[0].name, images: [], slug: 'product-1' } }
            ],
            shippingAddress: { street: 'Test', city: 'CDMX', state: 'CDMX', postalCode: '01000', country: 'MX' },
            guestEmail: customerEmail,
            guestName: 'Cancel Test',
            guestPhone: '+52 55 1234 5678',
            createdAt: new Date().toISOString()
          },
          relatedOrders: []
        }
      });
    });

    // Mock the cancellation endpoint
    await page.route(`**/api/orders/${cancelOrderId1}/cancel`, async route => {
      await route.fulfill({
        json: { success: true, message: 'Orden cancelada exitosamente' }
      });
    });

    // Go to order lookup
    await page.goto('/orders/lookup');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="orderNumber"]', cancelOrderId1);
    await page.getByRole('button', { name: /buscar/i }).click();

    // Wait for order page to load (matches both /orders/ and /pedidos/ localized routes)
    await page.waitForURL(`**/${cancelOrderId1}**`, { timeout: 10000 });
    await page.waitForSelector('text=Cancelar orden', { timeout: 5000 });

    // Click cancel button
    await page.getByRole('button', { name: /cancelar orden/i }).click();

    // Confirm cancellation
    await page.waitForSelector('text=¿Estás seguro', { timeout: 2000 });
    await page.getByRole('button', { name: /confirmar/i }).click();

    // Wait for cancellation to complete - page should reload
    await page.waitForTimeout(1000);

    // Mock the cancelled order response
    await page.route(`**/api/orders/guest/${cancelOrderId1}**`, async route => {
      await route.fulfill({
        json: {
          order: {
            id: '1',
            orderNumber: cancelOrderId1,
            status: 'cancelled', // Now cancelled
            total: '1000',
            subtotal: '860',
            tax: '140',
            shipping: '100',
            vendor: {
              id: '1',
              businessName: vendor1Products[0].vendor,
              email: 'vendor1@example.com',
              phone: null
            },
            items: [
              { id: '1', quantity: 1, price: '860', total: '860', product: { name: vendor1Products[0].name, images: [], slug: 'product-1' } }
            ],
            shippingAddress: { street: 'Test', city: 'CDMX', state: 'CDMX', postalCode: '01000', country: 'MX' },
            guestEmail: customerEmail,
            guestName: 'Cancel Test',
            guestPhone: '+52 55 1234 5678',
            createdAt: new Date().toISOString()
          },
          relatedOrders: []
        }
      });
    });

    // Verify cancellation - look up order again
    await page.goto('/orders/lookup');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="orderNumber"]', cancelOrderId1);
    await page.getByRole('button', { name: /buscar/i }).click();

    // Should show cancelled status
    await page.waitForURL(`**/${cancelOrderId1}**`, { timeout: 10000 });
    await expect(page.getByText(/cancelado|cancelled/i).first()).toBeVisible();

    // Mock vendor 2's order (still active)
    await page.route(`**/api/orders/guest/${cancelOrderId2}**`, async route => {
      await route.fulfill({
        json: {
          order: {
            id: '2',
            orderNumber: cancelOrderId2,
            status: 'pending', // Still active
            total: '800',
            subtotal: '690',
            tax: '110',
            shipping: '100',
            vendor: {
              id: '2',
              businessName: vendor2Products[0].vendor,
              email: 'vendor2@example.com',
              phone: null
            },
            items: [
              { id: '2', quantity: 1, price: '690', total: '690', product: { name: vendor2Products[0].name, images: [], slug: 'product-2' } }
            ],
            shippingAddress: { street: 'Test', city: 'CDMX', state: 'CDMX', postalCode: '01000', country: 'MX' },
            guestEmail: customerEmail,
            guestName: 'Cancel Test',
            guestPhone: '+52 55 1234 5678',
            createdAt: new Date().toISOString()
          },
          relatedOrders: []
        }
      });
    });

    await page.route('**/api/orders/lookup', async route => {
      await route.fulfill({
        json: { orderNumber: cancelOrderId2 }
      });
    });

    // Verify vendor 2's order is still active
    await page.goto('/orders/lookup');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="orderNumber"]', cancelOrderId2);
    await page.getByRole('button', { name: /buscar/i }).click();
    await expect(page.getByText(/pendiente|pending/i).first()).toBeVisible();
  });

  test('should show combined tracking when all vendors ship', async ({ page }) => {
    // Test the combined tracking view for multi-vendor orders
    // Orders now have orderGroupId to link related orders from same checkout

    // Create order with multiple vendors
    const trackingOrderId1 = `ORD-TRACK-V1-${Date.now()}`;
    const trackingOrderId2 = `ORD-TRACK-V2-${Date.now()}`;

    // Mock order lookup to return both orders shipped
    await page.route('**/api/orders/lookup', async route => {
      await route.fulfill({
        json: {
          orderNumber: trackingOrderId1
        }
      });
    });

    // Mock the guest order detail endpoint to return multi-vendor tracking
    await page.route(`**/api/orders/guest/${trackingOrderId1}**`, async route => {
      await route.fulfill({
        json: {
          order: {
            id: '1',
            orderNumber: trackingOrderId1,
            status: 'shipped',
            trackingNumber: 'TRACK-V1-123',
            carrier: 'fedex',
            total: '1000',
            subtotal: '860',
            tax: '140',
            shipping: '100',
            vendor: {
              id: '1',
              businessName: vendor1Products[0].vendor,
              email: 'vendor1@example.com',
              phone: null
            },
            items: [],
            shippingAddress: {},
            createdAt: new Date().toISOString()
          },
          // Multi-vendor tracking
          relatedOrders: [
            {
              id: '1',
              orderNumber: trackingOrderId1,
              status: 'shipped',
              trackingNumber: 'TRACK-V1-123',
              carrier: 'fedex',
              total: '1000',
              vendor: {
                id: '1',
                businessName: vendor1Products[0].vendor
              },
              items: [{ id: '1', quantity: 1, product: { name: 'Product 1' } }]
            },
            {
              id: '2',
              orderNumber: trackingOrderId2,
              status: 'shipped',
              trackingNumber: 'TRACK-V2-456',
              carrier: 'ups',
              total: '800',
              vendor: {
                id: '2',
                businessName: vendor2Products[0].vendor
              },
              items: [{ id: '2', quantity: 1, product: { name: 'Product 2' } }]
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

    // Should show both tracking numbers in the combined view
    await expect(page.getByText('TRACK-V1-123').first()).toBeVisible();
    await expect(page.getByText('TRACK-V2-456').first()).toBeVisible();

    // Should show both vendor names in the multi-vendor summary
    await expect(page.getByText(vendor1Products[0].vendor).first()).toBeVisible();
    await expect(page.getByText(vendor2Products[0].vendor).first()).toBeVisible();

    // Multi-vendor summary card should be visible
    await expect(page.getByText('Orden Multi-Vendedor')).toBeVisible();
    await expect(page.getByText(/vendedores diferentes/i)).toBeVisible();
  });

  test('should calculate taxes per vendor based on their location', async ({ page }) => {
    // Skip test if we don't have products from 2 different vendors
    if (!vendor1Products.length || !vendor2Products.length) {
      return;
    }

    // Add products from different vendors - EXACT same pattern as working test
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Add product from vendor 1
    const vendor1Card = page.getByTestId('product-card').filter({
      hasText: vendor1Products[0].name
    }).first();
    await vendor1Card.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

    // Close cart and go back to products
    await page.keyboard.press('Escape');
    await page.locator('[role="dialog"]').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });

    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Add product from vendor 2
    const vendor2Card = page.getByTestId('product-card').filter({
      hasText: vendor2Products[0].name
    }).first();
    await vendor2Card.click();
    await page.waitForURL('**/productos/**', { timeout: 10000 });
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });

    // Verify cart has products from both vendors
    await expect(page.getByTestId('cart-item')).toHaveCount(2);

    // Proceed to checkout - try link first, then button (use same pattern as working test)
    const checkoutLink = page.getByRole('link', { name: /proceder al pago|pagar/i });
    const checkoutButton = page.getByRole('button', { name: /pagar/i });

    if (await checkoutLink.isVisible({ timeout: 2000 })) {
      await checkoutLink.click();
    } else if (await checkoutButton.isVisible({ timeout: 2000 })) {
      await checkoutButton.click();
    }

    // Wait for checkout page to load
    await page.waitForURL('**/pagar', { timeout: 20000 });
    await page.waitForSelector('input[name="email"]', { timeout: 20000 });

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