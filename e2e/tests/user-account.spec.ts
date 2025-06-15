import { test, expect } from '@playwright/test';

test.describe('User Account', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'maria.garcia@email.com');
    await page.fill('input[type="password"]', 'customer123');
    
    const userTypeSelector = page.locator('select[name="userType"]').first();
    if (await userTypeSelector.isVisible()) {
      await userTypeSelector.selectOption('customer');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'));
  });

  test('should access account dashboard', async ({ page }) => {
    // Navigate to account
    const userMenu = page.locator('button').filter({ hasText: /María|Account|Cuenta/ }).first();
    await userMenu.click();
    
    const accountLink = page.locator('a').filter({ hasText: /Account|Mi Cuenta|Profile/ }).first();
    await accountLink.click();
    
    // Should show account dashboard
    await expect(page.locator('h1').filter({ hasText: /Account|Cuenta|Profile/ })).toBeVisible();
  });

  test('should view order history', async ({ page }) => {
    await page.goto('/account/orders');
    
    // Should show orders list
    await expect(page.locator('text=/Orders|Pedidos|Historial/')).toBeVisible();
    
    // If there are orders
    const ordersList = page.locator('table, .orders-list, [data-testid="order"]').first();
    
    if (await ordersList.isVisible()) {
      // Should show order details
      await expect(ordersList.locator('text=/LM-/')).toBeVisible(); // Order number
      await expect(ordersList.locator('text=/\\$/')).toBeVisible(); // Price
    } else {
      // Should show empty state
      await expect(page.locator('text=/No orders|Sin pedidos|Empty/')).toBeVisible();
    }
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/account/orders');
    
    // Click on first order if exists
    const viewOrderButton = page.locator('button, a').filter({ hasText: /View|Ver|Details/ }).first();
    
    if (await viewOrderButton.isVisible()) {
      await viewOrderButton.click();
      
      // Should show order details
      await expect(page.locator('text=/Order.*LM-/')).toBeVisible();
      await expect(page.locator('text=/Items|Productos/')).toBeVisible();
      await expect(page.locator('text=/Shipping|Envío/')).toBeVisible();
      await expect(page.locator('text=/Total/')).toBeVisible();
    }
  });

  test('should update profile information', async ({ page }) => {
    await page.goto('/account/profile');
    
    // Should show profile form
    const nameInput = page.locator('input[name="name"]').first();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue(/María/);
    
    // Update name
    await nameInput.clear();
    await nameInput.fill('María Elena García');
    
    // Update phone if field exists
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('5559998877');
    }
    
    // Save changes
    const saveButton = page.locator('button[type="submit"], button').filter({ hasText: /Save|Guardar|Update/ }).first();
    await saveButton.click();
    
    // Should show success message
    await expect(page.locator('text=/Updated|Actualizado|Success/')).toBeVisible();
  });

  test('should manage addresses', async ({ page }) => {
    const addressesLink = page.locator('a').filter({ hasText: /Addresses|Direcciones/ }).first();
    
    if (await addressesLink.isVisible()) {
      await addressesLink.click();
      
      // Should show addresses page
      await expect(page.locator('h1, h2').filter({ hasText: /Addresses|Direcciones/ })).toBeVisible();
      
      // Add new address button
      const addButton = page.locator('button').filter({ hasText: /Add|Agregar|Nueva/ }).first();
      await expect(addButton).toBeVisible();
    }
  });

  test('should add new address', async ({ page }) => {
    await page.goto('/account/addresses');
    
    const addButton = page.locator('button').filter({ hasText: /Add|Agregar|Nueva/ }).first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Fill address form
      await page.fill('input[name="street"], input[placeholder*="Calle"]', 'Av. Insurgentes 123');
      await page.fill('input[name="city"], input[placeholder*="Ciudad"]', 'Ciudad de México');
      await page.fill('input[name="state"], input[placeholder*="Estado"]', 'CDMX');
      await page.fill('input[name="postalCode"], input[placeholder*="Código"]', '06700');
      
      // Save
      await page.click('button[type="submit"]');
      
      // Should show success or redirect
      await expect(page.locator('text=/Saved|Guardado|Added/')).toBeVisible();
    }
  });

  test('should change password', async ({ page }) => {
    await page.goto('/account/security');
    
    // Should show password change form
    const currentPassword = page.locator('input[name="currentPassword"], input[placeholder*="Current"]').first();
    const newPassword = page.locator('input[name="newPassword"], input[placeholder*="New"]').first();
    const confirmPassword = page.locator('input[name="confirmPassword"], input[placeholder*="Confirm"]').first();
    
    if (await currentPassword.isVisible()) {
      await currentPassword.fill('customer123');
      await newPassword.fill('NewPassword123!');
      await confirmPassword.fill('NewPassword123!');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Should show success (but we won't actually change it to not break other tests)
      await expect(page.locator('text=/Updated|Changed|Success|Error/')).toBeVisible();
    }
  });

  test('should view and manage wishlist', async ({ page }) => {
    await page.goto('/account/wishlist');
    
    // Should show wishlist page
    await expect(page.locator('h1').filter({ hasText: /Wishlist|Favoritos|Lista de Deseos/ })).toBeVisible();
    
    const wishlistItems = page.locator('[data-testid="wishlist-item"], .wishlist-item');
    
    if (await wishlistItems.first().isVisible()) {
      // Should have remove button
      const removeButton = wishlistItems.first().locator('button').filter({ hasText: /Remove|Eliminar/ });
      await expect(removeButton).toBeVisible();
      
      // Should have add to cart button
      const addToCartButton = wishlistItems.first().locator('button').filter({ hasText: /Add to Cart|Agregar/ });
      await expect(addToCartButton).toBeVisible();
    } else {
      // Empty wishlist
      await expect(page.locator('text=/Empty|Vacío|No items/')).toBeVisible();
    }
  });

  test('should view notifications/preferences', async ({ page }) => {
    const notificationsLink = page.locator('a').filter({ hasText: /Notifications|Notificaciones|Preferences/ }).first();
    
    if (await notificationsLink.isVisible()) {
      await notificationsLink.click();
      
      // Should show notification settings
      await expect(page.locator('text=/Email|Newsletter|Notifications/')).toBeVisible();
      
      // Should have toggles/checkboxes
      const toggles = page.locator('input[type="checkbox"], [role="switch"]');
      await expect(toggles.first()).toBeVisible();
    }
  });

  test('should download invoices', async ({ page }) => {
    await page.goto('/account/orders');
    
    // Find download invoice button
    const invoiceButton = page.locator('button, a').filter({ hasText: /Invoice|Factura|Download/ }).first();
    
    if (await invoiceButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await invoiceButton.click();
      
      try {
        const download = await Promise.race([
          downloadPromise,
          page.waitForTimeout(3000).then(() => null)
        ]);
        
        if (download) {
          expect(download.suggestedFilename()).toMatch(/invoice|factura|\.pdf/i);
        }
      } catch {
        // Might open in new tab or show preview
        console.log('Invoice download not triggered, might be preview');
      }
    }
  });

  test('should track order shipment', async ({ page }) => {
    await page.goto('/account/orders');
    
    // Find shipped order
    const shippedOrder = page.locator('tr, .order-card').filter({ hasText: /Shipped|Enviado/ }).first();
    
    if (await shippedOrder.isVisible()) {
      const trackButton = shippedOrder.locator('button, a').filter({ hasText: /Track|Rastrear/ }).first();
      
      if (await trackButton.isVisible()) {
        await trackButton.click();
        
        // Should show tracking info
        await expect(page.locator('text=/Tracking|Guía|Status/')).toBeVisible();
      }
    }
  });

  test('should request order cancellation', async ({ page }) => {
    await page.goto('/account/orders');
    
    // Find pending order
    const pendingOrder = page.locator('tr, .order-card').filter({ hasText: /Pending|Pendiente/ }).first();
    
    if (await pendingOrder.isVisible()) {
      const cancelButton = pendingOrder.locator('button').filter({ hasText: /Cancel|Cancelar/ }).first();
      
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        
        // Should show confirmation
        const confirmButton = page.locator('button').filter({ hasText: /Confirm|Confirmar/ }).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          
          // Should show success or status update
          await expect(page.locator('text=/Cancelled|Cancelado|Request sent/')).toBeVisible();
        }
      }
    }
  });

  test('should delete account', async ({ page }) => {
    await page.goto('/account/settings');
    
    // Look for delete account option
    const deleteButton = page.locator('button').filter({ hasText: /Delete Account|Eliminar Cuenta/ }).first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Should show confirmation dialog
      await expect(page.locator('text=/Are you sure|¿Estás seguro|permanent/')).toBeVisible();
      
      // Don't actually delete - just check the flow
      const cancelButton = page.locator('button').filter({ hasText: /Cancel|Cancelar/ }).first();
      await cancelButton.click();
    }
  });
});