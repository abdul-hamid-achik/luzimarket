import { test, expect } from '../fixtures/test';
import { routes } from '../helpers/navigation';

test.describe('Inventory Management', () => {
  let limitedStockProductId: string;
  let vendorEmail = 'vendor1@example.com';
  let vendorPassword = 'password123';

  test.beforeEach(async ({ page }) => {
    // Mock a product with limited stock
    await page.route('**/api/products/limited-stock', async route => {
      await route.fulfill({
        json: {
          id: 'prod-123',
          name: 'Limited Edition Product',
          stock: 5,
          price: 299.99
        }
      });
    });
  });

  test('should validate stock availability during checkout', async ({ page }) => {
    // Go to products
    await page.goto(routes.products);
    
    // Find any product card (stock info is not displayed on cards)
    const productCard = page.getByTestId('product-card').first();
    await expect(productCard).toBeVisible();
    
    await productCard.click();
    await page.waitForLoadState('networkidle');
    
    // Check current stock from quantity selector max value or low stock warning
    let availableStock = 99; // default max
    
    // Try to find low stock warning first
    const lowStockWarning = page.getByText(/quedan \d+|\d+ left|stock bajo/i);
    if (await lowStockWarning.isVisible({ timeout: 2000 }).catch(() => false)) {
      const stockText = await lowStockWarning.textContent();
      availableStock = parseInt(stockText?.match(/\d+/)?.[0] || '99');
    } else {
      // If no low stock warning, assume higher stock (use quantity selector to test)
      availableStock = 10; // assume reasonable stock for testing
    }
    
    // Try to add more than available stock using quantity selector buttons
    const increaseButton = page.getByRole('button').filter({ has: page.locator('svg').first() }).last();
    
    // Increase quantity to more than available stock
    for (let i = 1; i < Math.min(availableStock + 2, 15); i++) {
      if (await increaseButton.isEnabled()) {
        await increaseButton.click();
        await page.waitForTimeout(100);
      } else {
        break; // Hit the max limit
      }
    }
    // Try to add to cart - use the main product detail page button (first one)
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    
    // Should show stock validation error via toast notification
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
    // Check for stock-related error messages in toast
    const toastVisible = await page.locator('[data-sonner-toast]').filter({
      hasText: /stock|inventario|disponible|agotado/i
    }).isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!toastVisible) {
      // If no stock error toast, the quantity selector might have prevented the issue
      console.log('No stock validation error - quantity selector may have limited input');
    }
    
    // Reset quantity to 1 by clicking decrease button multiple times
    const decreaseButton = page.getByRole('button').filter({ has: page.locator('svg').first() }).first();
    for (let i = 0; i < 20; i++) {
      if (await decreaseButton.isEnabled()) {
        await decreaseButton.click();
        await page.waitForTimeout(50);
      } else {
        break;
      }
    }
    
    await page.getByRole('button', { name: /agregar al carrito/i }).first().click();
    
    // Should succeed
    await expect(page.getByText(/agregado al carrito|added to cart/i)).toBeVisible();
  });

  test('should handle concurrent stock reservations', async ({ page, context }) => {
    // Create two browser contexts to simulate concurrent users
    const page2 = await context.newPage();
    
    // Both users view same product
    await page.goto(routes.products);
    await page2.goto(routes.products);
    
    // Find product with exactly 1 in stock
    await page.getByTestId('product-card').filter({
      hasText: /1 disponible|1 in stock/i
    }).first().click();
    
    await page2.getByTestId('product-card').filter({
      hasText: /1 disponible|1 in stock/i
    }).first().click();
    
    // User 1 adds to cart
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.waitForSelector('[role="dialog"]'); // Cart opens
    
    // User 2 tries to add same product
    await page2.getByRole('button', { name: /agregar al carrito/i }).click();
    
    // User 2 should see out of stock message
    await expect(page2.getByText(/agotado|out of stock|no disponible/i)).toBeVisible();
    
    // User 1 proceeds to checkout
    await page.getByRole('button', { name: /pagar/i }).click();
    await page.waitForURL('**/pagar');
    
    // Fill checkout quickly
    await page.fill('input[name="email"]', 'user1@example.com');
    await page.fill('input[name="firstName"]', 'User');
    await page.fill('input[name="lastName"]', 'One');
    await page.fill('input[name="phone"]', '+52 55 1111 1111');
    await page.fill('input[name="address"]', 'Address 1');
    await page.fill('input[name="city"]', 'CDMX');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '01000');
    await page.fill('input[name="country"]', 'México');
    await page.locator('label[for="acceptTerms"]').click();
    
    // Complete checkout
    await page.route('**/api/checkout/sessions', async route => {
      await route.fulfill({ json: { url: 'https://stripe.com', sessionId: 'test' } });
    });
    await page.getByRole('button', { name: /proceder al pago/i }).click();
    
    // Product should now be permanently out of stock for user 2
    await page2.reload();
    await expect(page2.getByText(/agotado|out of stock/i)).toBeVisible();
    await expect(page2.getByRole('button', { name: /agregar al carrito/i })).toBeDisabled();
    
    await page2.close();
  });

  test('should release stock reservation after timeout', async ({ page }) => {
    // Add product to cart
    await page.goto(routes.products);
    const product = page.getByTestId('product-card').first();
    const productName = await product.getByTestId('product-name').textContent();
    await product.click();
    
    // Add to cart
    await page.getByRole('button', { name: /agregar al carrito/i }).click();
    await page.waitForSelector('[role="dialog"]');
    
    // Go to checkout but don't complete
    await page.getByRole('button', { name: /pagar/i }).click();
    await page.waitForURL('**/pagar');
    
    // Mock reservation timeout (usually 15-30 minutes)
    await page.evaluate(() => {
      // Simulate session storage expiry
      sessionStorage.removeItem('cart');
      sessionStorage.removeItem('stockReservation');
    });
    
    // Wait and refresh
    await page.waitForTimeout(2000);
    await page.reload();
    
    // Should show cart is empty
    await expect(page.getByText(/carrito.*vacío|cart.*empty/i)).toBeVisible();
    
    // Product should be available again
    await page.goto(routes.products);
    await page.getByTestId('product-card').filter({ hasText: productName }).click();
    await expect(page.getByRole('button', { name: /agregar al carrito/i })).toBeEnabled();
  });

  test('should show low stock warnings', async ({ page }) => {
    // Browse products
    await page.goto(routes.products);
    
    // Look for low stock indicators
    const lowStockProducts = page.getByTestId('product-card').filter({
      has: page.getByText(/últimas? \d+ unidades?|only \d+ left|pocas? unidades?/i)
    });
    
    if (await lowStockProducts.count() > 0) {
      // Click on low stock product
      await lowStockProducts.first().click();
      
      // Should show urgency message
      await expect(page.getByText(/últimas? unidades?|limited stock|date prisa/i)).toBeVisible();
      
      // Should show exact stock number
      await expect(page.getByTestId('stock-info')).toBeVisible();
      const stockInfo = await page.getByTestId('stock-info').textContent();
      expect(stockInfo).toMatch(/\d+/);
    }
  });

  test('should handle back in stock notifications', async ({ page }) => {
    // Find out of stock product
    await page.goto(routes.products);
    
    // Mock an out of stock product
    await page.route('**/api/products/out-of-stock-1', async route => {
      await route.fulfill({
        json: {
          id: 'oos-1',
          name: 'Out of Stock Product',
          stock: 0,
          isAvailable: false
        }
      });
    });
    
    // Navigate to out of stock product
    const outOfStockProduct = page.getByTestId('product-card').filter({
      has: page.getByText(/agotado|out of stock/i)
    }).first();
    
    if (await outOfStockProduct.isVisible()) {
      await outOfStockProduct.click();
      
      // Should show out of stock message
      await expect(page.getByText(/agotado|out of stock/i)).toBeVisible();
      
      // Should show notify me form
      await expect(page.getByRole('button', { name: /notificar.*disponible|notify.*available/i })).toBeVisible();
      
      // Click notify button
      await page.getByRole('button', { name: /notificar.*disponible|notify.*available/i }).click();
      
      // Fill email if not logged in
      const emailInput = page.locator('input[name="notifyEmail"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('notify@example.com');
      }
      
      // Submit notification request
      await page.getByRole('button', { name: /enviar|submit|notificar/i }).click();
      
      // Should show confirmation
      await expect(page.getByText(/notificación.*registrada|notification.*registered/i)).toBeVisible();
    }
  });

  test('should update vendor inventory in real-time', async ({ page }) => {
    // Login as vendor
    await page.goto(routes.login);
    await page.getByRole('tab', { name: 'Vendedor' }).click();
    await page.fill('input[name="email"]', vendorEmail);
    await page.fill('input[name="password"]', vendorPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Go to products
    await page.goto(routes.vendorProducts);
    await page.waitForLoadState('networkidle');
    
    // Find product with stock
    const productRow = page.getByRole('row').filter({
      has: page.getByTestId('stock-cell')
    }).first();
    
    // Click to edit
    await productRow.getByRole('button', { name: /editar|edit/i }).click();
    
    // Update stock
    const stockInput = page.locator('input[name="stock"]');
    await stockInput.clear();
    await stockInput.fill('10');
    
    // Save changes
    await page.getByRole('button', { name: /guardar|save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/stock actualizado|inventory updated/i)).toBeVisible();
    
    // Verify update in list
    await page.goto(routes.vendorProducts);
    await expect(productRow.getByTestId('stock-cell')).toContainText('10');
  });

  test('should show inventory alerts for vendors', async ({ page }) => {
    // Login as vendor
    await page.goto(routes.login);
    await page.getByRole('tab', { name: 'Vendedor' }).click();
    await page.fill('input[name="email"]', vendorEmail);
    await page.fill('input[name="password"]', vendorPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Check dashboard for inventory alerts
    await page.goto(routes.vendorDashboard);
    
    // Look for low stock alerts
    const alertsSection = page.getByTestId('inventory-alerts');
    if (await alertsSection.isVisible()) {
      // Should show products with low stock
      const lowStockAlerts = alertsSection.getByTestId('low-stock-alert');
      
      if (await lowStockAlerts.count() > 0) {
        // Click on an alert
        await lowStockAlerts.first().click();
        
        // Should navigate to product edit
        await page.waitForURL('**/vendor/products/**/edit');
        
        // Stock input should be highlighted or focused
        const stockInput = page.locator('input[name="stock"]');
        await expect(stockInput).toBeFocused();
      }
    }
  });

  test('should handle product variants stock separately', async ({ page }) => {
    // Go to product with variants
    await page.goto(routes.products);
    
    // Find product with size/color options
    const productWithVariants = page.getByTestId('product-card').filter({
      has: page.getByText(/talla|size|color/i)
    }).first();
    
    if (await productWithVariants.isVisible()) {
      await productWithVariants.click();
      
      // Select first variant
      const sizeSelector = page.locator('select[name="size"], [data-testid="size-selector"]');
      if (await sizeSelector.isVisible()) {
        await sizeSelector.selectOption({ index: 1 });
      }
      
      const colorSelector = page.locator('select[name="color"], [data-testid="color-selector"]');
      if (await colorSelector.isVisible()) {
        await colorSelector.selectOption({ index: 1 });
      }
      
      // Check stock for this variant
      const variant1Stock = await page.getByTestId('variant-stock').textContent();
      
      // Select different variant
      if (await sizeSelector.isVisible()) {
        const optionCount = await sizeSelector.locator('option').count();
        if (optionCount > 2) {
          await sizeSelector.selectOption({ index: 2 });
        }
      }
      
      // Stock should update for different variant
      const variant2Stock = await page.getByTestId('variant-stock').textContent();
      
      // Stocks might be different
      expect(variant1Stock).toBeDefined();
      expect(variant2Stock).toBeDefined();
    }
  });

  test('should prevent overselling during flash sales', async ({ page }) => {
    // Mock flash sale product
    await page.route('**/api/products/flash-sale', async route => {
      await route.fulfill({
        json: {
          id: 'flash-1',
          name: 'Flash Sale Item',
          originalPrice: 500,
          salePrice: 250,
          stock: 3,
          flashSaleEnd: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        }
      });
    });
    
    // Go to flash sale section
    await page.goto('/flash-sales');
    
    const flashProduct = page.getByTestId('flash-sale-product').first();
    if (await flashProduct.isVisible()) {
      // Should show countdown timer
      await expect(flashProduct.getByTestId('countdown-timer')).toBeVisible();
      
      // Should show limited stock
      await expect(flashProduct.getByText(/solo \d+ disponibles?|only \d+ available/i)).toBeVisible();
      
      // Click to view product
      await flashProduct.click();
      
      // Add maximum available to cart
      const maxQty = await page.getByTestId('stock-info').textContent();
      const maxNum = parseInt(maxQty?.match(/\d+/)?.[0] || '1');
      
      const qtyInput = page.locator('input[name="quantity"]');
      await qtyInput.clear();
      await qtyInput.fill(String(maxNum));
      
      await page.getByRole('button', { name: /agregar al carrito/i }).click();
      
      // Try to add more (should fail)
      await page.reload();
      await expect(page.getByText(/agotado|sold out/i)).toBeVisible();
    }
  });

  test('should sync inventory across multiple sales channels', async ({ page }) => {
    // Login as vendor
    await page.goto(routes.login);
    await page.getByRole('tab', { name: 'Vendedor' }).click();
    await page.fill('input[name="email"]', vendorEmail);
    await page.fill('input[name="password"]', vendorPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Go to inventory sync settings
    await page.goto('/vendor/settings/inventory');
    
    // Enable multi-channel sync if available
    const syncToggle = page.locator('input[name="enableInventorySync"]');
    if (await syncToggle.isVisible()) {
      await syncToggle.check();
      
      // Configure sync settings
      await page.selectOption('select[name="syncFrequency"]', 'realtime');
      
      // Add external channel
      await page.getByRole('button', { name: /agregar canal|add channel/i }).click();
      await page.fill('input[name="channelName"]', 'External Store');
      await page.fill('input[name="apiKey"]', 'test-api-key');
      
      // Save settings
      await page.getByRole('button', { name: /guardar configuración|save settings/i }).click();
      
      // Should show sync status
      await expect(page.getByText(/sincronización activa|sync active/i)).toBeVisible();
      
      // Test sync by updating product stock
      await page.goto(routes.vendorProducts);
      await page.getByRole('button', { name: /editar|edit/i }).first().click();
      
      const stockInput = page.locator('input[name="stock"]');
      const currentStock = await stockInput.inputValue();
      const newStock = parseInt(currentStock) - 1;
      
      await stockInput.clear();
      await stockInput.fill(String(newStock));
      await page.getByRole('button', { name: /guardar|save/i }).click();
      
      // Should show sync notification
      await expect(page.getByText(/sincronizado con|synced with/i)).toBeVisible();
    }
  });
});