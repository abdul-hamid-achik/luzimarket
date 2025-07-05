import { test, expect } from '../fixtures/test';
import { routes } from '../helpers/navigation';

test.describe('Order Lifecycle - Complete Flow', () => {
  let customerEmail: string;
  let orderId: string;

  test.beforeEach(async ({ page }) => {
    customerEmail = `customer-${Date.now()}@example.com`;
  });

  test('should handle complete order lifecycle from placement to delivery', async ({ page }) => {
    // Step 1: Customer places order
    await test.step('Customer places order', async () => {
      await page.goto(routes.products);
      await page.waitForLoadState('networkidle');

      // Add product to cart
      await page.getByTestId('product-card').first().click();
      const productName = await page.getByTestId('product-name').textContent();
      const vendorName = await page.getByTestId('vendor-name').textContent();
      
      await page.getByRole('button', { name: /agregar al carrito/i }).click();
      await page.waitForSelector('[role="dialog"]');
      await page.waitForTimeout(300);

      // Proceed to checkout
      await page.getByRole('button', { name: /pagar/i }).click();
      await page.waitForURL('**/pagar');

      // Fill checkout form
      await page.fill('input[name="email"]', customerEmail);
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Customer');
      await page.fill('input[name="phone"]', '+52 55 1234 5678');
      await page.fill('input[name="address"]', 'Av. Reforma 123');
      await page.fill('input[name="city"]', 'Ciudad de México');
      await page.fill('input[name="state"]', 'CDMX');
      await page.fill('input[name="postalCode"]', '06600');
      await page.fill('input[name="country"]', 'México');
      await page.locator('label[for="acceptTerms"]').click();

      // Mock successful checkout
      await page.route('**/api/checkout/sessions', async route => {
        const json = {
          url: 'https://checkout.stripe.com/test_session',
          sessionId: 'test_session_' + Date.now()
        };
        await route.fulfill({ json });
      });

      await page.getByRole('button', { name: /proceder al pago/i }).click();

      // Simulate successful payment webhook
      orderId = 'ORD-' + Date.now();
      await page.goto(`/success?session_id=test_session&order_id=${orderId}`);
      
      await expect(page.getByText(/gracias por tu compra/i)).toBeVisible();
      await expect(page.getByText(orderId)).toBeVisible();
    });

    // Step 2: Admin views and processes new order
    await test.step('Admin views new order', async () => {
      // Login as admin
      await page.goto(routes.login);
      await page.getByRole('tab', { name: 'Admin' }).click();
      await page.fill('input[name="email"]', 'admin@luzimarket.shop');
      await page.fill('input[name="password"]', 'Admin123!@#');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Navigate to orders
      await page.waitForURL('**/admin');
      await page.goto(routes.adminOrders);
      await page.waitForLoadState('networkidle');

      // Find the new order
      await page.getByRole('cell', { name: orderId }).click();
      
      // Verify order details
      await expect(page.getByText(customerEmail)).toBeVisible();
      await expect(page.getByText(/pending|pendiente/i)).toBeVisible();
      
      // Update status to processing
      await page.getByTestId('order-status-select').selectOption('processing');
      await page.getByRole('button', { name: /actualizar estado/i }).click();
      
      await expect(page.getByText(/estado actualizado/i)).toBeVisible();
    });

    // Step 3: Vendor sees order and fulfills it
    await test.step('Vendor processes order', async () => {
      // Logout admin
      await page.getByTestId('user-menu').click();
      await page.getByRole('button', { name: /cerrar sesión/i }).click();
      
      // Login as vendor (using first vendor from seed data)
      await page.goto(routes.login);
      await page.getByRole('tab', { name: 'Vendedor' }).click();
      await page.fill('input[name="email"]', 'vendor1@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Navigate to vendor orders
      await page.waitForURL('**/vendor/dashboard');
      await page.goto('/vendor/orders');
      await page.waitForLoadState('networkidle');

      // Find and click on the order
      await page.getByRole('cell', { name: new RegExp(orderId) }).click();
      
      // Add tracking information
      await page.fill('input[name="trackingNumber"]', 'TRACK123456789');
      await page.selectOption('select[name="carrier"]', 'fedex');
      
      // Update to shipped status
      await page.getByTestId('order-status-select').selectOption('shipped');
      await page.getByRole('button', { name: /actualizar orden/i }).click();
      
      await expect(page.getByText(/orden actualizada/i)).toBeVisible();
    });

    // Step 4: Customer receives shipping notification and tracks package
    await test.step('Customer tracks package', async () => {
      // Logout vendor
      await page.getByTestId('user-menu').click();
      await page.getByRole('button', { name: /cerrar sesión/i }).click();
      
      // Guest order lookup
      await page.goto('/orders/lookup');
      await page.fill('input[name="email"]', customerEmail);
      await page.fill('input[name="orderNumber"]', orderId);
      await page.getByRole('button', { name: /buscar orden/i }).click();

      // Verify order shows shipped status
      await expect(page.getByText(/enviado|shipped/i)).toBeVisible();
      await expect(page.getByText('TRACK123456789')).toBeVisible();
      
      // Click track package link
      await page.getByRole('button', { name: /rastrear paquete/i }).click();
      
      // Should open tracking URL (we can verify the URL contains tracking number)
      const newTab = await page.waitForEvent('popup');
      expect(newTab.url()).toContain('TRACK123456789');
      await newTab.close();
    });

    // Step 5: Admin marks order as delivered
    await test.step('Admin marks order as delivered', async () => {
      // Login as admin again
      await page.goto(routes.login);
      await page.getByRole('tab', { name: 'Admin' }).click();
      await page.fill('input[name="email"]', 'admin@luzimarket.shop');
      await page.fill('input[name="password"]', 'Admin123!@#');
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      
      // Go to order
      await page.goto(routes.adminOrders);
      await page.getByRole('cell', { name: orderId }).click();
      
      // Update to delivered
      await page.getByTestId('order-status-select').selectOption('delivered');
      await page.getByRole('button', { name: /actualizar estado/i }).click();
      
      await expect(page.getByText(/estado actualizado/i)).toBeVisible();
    });

    // Step 6: Customer can download invoice
    await test.step('Customer downloads invoice', async () => {
      // Logout and check order as guest
      await page.getByTestId('user-menu').click();
      await page.getByRole('button', { name: /cerrar sesión/i }).click();
      
      await page.goto('/orders/lookup');
      await page.fill('input[name="email"]', customerEmail);
      await page.fill('input[name="orderNumber"]', orderId);
      await page.getByRole('button', { name: /buscar orden/i }).click();

      // Verify delivered status
      await expect(page.getByText(/entregado|delivered/i)).toBeVisible();
      
      // Download invoice
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /descargar factura/i }).click();
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain(orderId);
      expect(download.suggestedFilename()).toMatch(/\.(pdf|PDF)$/);
    });
  });

  test('should handle order cancellation by customer', async ({ page }) => {
    // Place an order first
    await page.goto(routes.products);
    await page.getByTestId('product-card').first().click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.waitForSelector('[role="dialog"]');
    await page.getByRole('button', { name: /pagar/i }).click();

    // Quick checkout
    const cancelOrderId = 'ORD-CANCEL-' + Date.now();
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

    // Mock checkout
    await page.route('**/api/checkout/sessions', async route => {
      await route.fulfill({ json: { url: 'https://stripe.com', sessionId: 'test' } });
    });
    await page.getByRole('button', { name: /proceder al pago/i }).click();
    await page.goto(`/success?order_id=${cancelOrderId}`);

    // Now lookup order and request cancellation
    await page.goto('/orders/lookup');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="orderNumber"]', cancelOrderId);
    await page.getByRole('button', { name: /buscar orden/i }).click();

    // Request cancellation
    await page.getByRole('button', { name: /cancelar orden/i }).click();
    
    // Confirm cancellation
    await page.getByRole('button', { name: /confirmar cancelación/i }).click();
    
    // Should show cancellation requested
    await expect(page.getByText(/cancelación solicitada/i)).toBeVisible();
  });

  test('should send order status email notifications', async ({ page }) => {
    // Mock email sending
    let emailsSent: any[] = [];
    await page.route('**/api/email/send', async route => {
      const body = await route.request().postDataJSON();
      emailsSent.push(body);
      await route.fulfill({ json: { success: true } });
    });

    // Place order
    await page.goto(routes.products);
    await page.getByTestId('product-card').first().click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.waitForSelector('[role="dialog"]');
    await page.getByRole('button', { name: /pagar/i }).click();

    // Checkout
    const emailOrderId = 'ORD-EMAIL-' + Date.now();
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="firstName"]', 'Email');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Email Test 123');
    await page.fill('input[name="city"]', 'CDMX');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '01000');
    await page.fill('input[name="country"]', 'México');
    await page.locator('label[for="acceptTerms"]').click();

    await page.route('**/api/checkout/sessions', async route => {
      await route.fulfill({ json: { url: 'https://stripe.com', sessionId: 'test' } });
    });
    await page.getByRole('button', { name: /proceder al pago/i }).click();

    // Verify order confirmation email was sent
    expect(emailsSent).toHaveLength(1);
    expect(emailsSent[0]).toMatchObject({
      to: customerEmail,
      subject: expect.stringContaining(/confirmación|confirmation/i)
    });

    // Admin updates order status
    await page.goto(routes.login);
    await page.getByRole('tab', { name: 'Admin' }).click();
    await page.fill('input[name="email"]', 'admin@luzimarket.shop');
    await page.fill('input[name="password"]', 'Admin123!@#');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    await page.goto(routes.adminOrders);
    await page.getByRole('cell', { name: emailOrderId }).click();
    await page.getByTestId('order-status-select').selectOption('shipped');
    await page.getByRole('button', { name: /actualizar estado/i }).click();

    // Verify shipping notification was sent
    expect(emailsSent.length).toBeGreaterThan(1);
    const shippingEmail = emailsSent[emailsSent.length - 1];
    expect(shippingEmail).toMatchObject({
      to: customerEmail,
      subject: expect.stringContaining(/enviado|shipped/i)
    });
  });

  test('should handle vendor order notes and customer communication', async ({ page }) => {
    // Place order
    const noteOrderId = 'ORD-NOTE-' + Date.now();
    await page.goto(routes.products);
    await page.getByTestId('product-card').first().click();
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.waitForSelector('[role="dialog"]');
    await page.getByRole('button', { name: /pagar/i }).click();

    // Add order note during checkout
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="firstName"]', 'Note');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="address"]', 'Note Test 123');
    await page.fill('input[name="city"]', 'CDMX');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '01000');
    await page.fill('input[name="country"]', 'México');
    
    // Add special instructions
    await page.fill('textarea[name="notes"]', 'Por favor entregar en la tarde después de las 4pm');
    await page.locator('label[for="acceptTerms"]').click();

    await page.route('**/api/checkout/sessions', async route => {
      await route.fulfill({ json: { url: 'https://stripe.com', sessionId: 'test' } });
    });
    await page.getByRole('button', { name: /proceder al pago/i }).click();
    await page.goto(`/success?order_id=${noteOrderId}`);

    // Vendor views order with notes
    await page.goto(routes.login);
    await page.getByRole('tab', { name: 'Vendedor' }).click();
    await page.fill('input[name="email"]', 'vendor1@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    await page.goto('/vendor/orders');
    await page.getByRole('cell', { name: new RegExp(noteOrderId) }).click();

    // Verify customer note is visible
    await expect(page.getByText(/entregar en la tarde después de las 4pm/)).toBeVisible();

    // Vendor adds internal note
    await page.fill('textarea[name="vendorNotes"]', 'Programado para entrega a las 5pm');
    await page.getByRole('button', { name: /guardar nota/i }).click();
    
    await expect(page.getByText(/nota guardada/i)).toBeVisible();
  });
});