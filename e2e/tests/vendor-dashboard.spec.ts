import { test, expect } from '@playwright/test';
import { routes, uiText } from '../helpers/navigation';

test.describe('Vendor Dashboard', () => {
  // Helper function to login as vendor
  async function loginAsVendor(page: any, email: string = 'vendor@luzimarket.shop', password: string = 'password123') {
    // Navigate to login page (Spanish is default, no prefix needed)
    await page.goto(routes.login);
    
    // Click on vendor tab
    await page.getByRole('tab', { name: uiText.es.vendorTab }).click();
    
    // Wait for vendor form to be visible
    await page.waitForTimeout(500);
    
    // Fill in vendor credentials using proper selectors for vendor form
    await page.locator('#vendor-email').fill(email);
    await page.locator('#vendor-password').fill(password);
    
    // Submit login form
    await page.locator(`button[type="submit"]:has-text("${uiText.es.login}")`).click();
    
    // Wait for redirect to vendor dashboard (localized path)
    await page.waitForURL('**/vendedor/panel', { timeout: 15000 });
  }

  test.beforeEach(async ({ page }) => {
    await loginAsVendor(page);
  });

  test('should access vendor dashboard after login', async ({ page }) => {
    // Verify we're on the vendor dashboard (handle localized paths)
    await expect(page).toHaveURL(/\/(vendor|vendedor)/);
    
    // Check for dashboard elements
    await expect(page.locator('h1, h2').filter({ hasText: /Dashboard|Panel/ })).toBeVisible();
    
    // Verify vendor-specific navigation items
    await expect(page.locator('nav, aside').locator('text=/Mis Productos|My Products|Dashboard/')).toBeVisible();
    await expect(page.locator('nav, aside').locator('text=/Órdenes|Orders/')).toBeVisible();
  });

  test('should display vendor statistics overview', async ({ page }) => {
    // Look for stats cards/widgets containing revenue or products info
    const statsSection = page.locator('section, div').filter({ has: page.locator('text=/Ingresos Totales|Total.*Revenue|Productos Totales|Total.*Products/') });
    await expect(statsSection).toBeVisible();
    
    // Check for key metrics using Spanish translations
    await expect(page.locator('text=/Productos Totales|Total Products/i')).toBeVisible();
    await expect(page.locator('text=/Productos Activos|Active Products/i')).toBeVisible();
    await expect(page.locator('text=/Órdenes Totales|Total Orders/i')).toBeVisible();
    await expect(page.locator('text=/Ingresos Totales|Total Revenue/i')).toBeVisible();
    
    // Verify numbers are displayed
    const metricValues = page.locator('[class*="text-2xl"], [class*="text-3xl"], [class*="text-4xl"]');
    await expect(metricValues.first()).toBeVisible();
  });

  test('should navigate to products management', async ({ page }) => {
    // Click on products link using Spanish translations
    const productsLink = page.locator('a, button').filter({ hasText: /Ver Productos|View Products|Mis Productos|My Products/ }).first();
    await productsLink.click();
    
    // Wait for products page
    await page.waitForURL(/\/products|productos/, { timeout: 5000 });
    
    // Verify products table/grid
    await expect(page.locator('text=/Mis productos|My products/i')).toBeVisible();
    
    // Check for add product button
    const addProductButton = page.locator('button, a').filter({ hasText: /Agregar Producto|Add product|Nuevo producto|New product/i });
    await expect(addProductButton).toBeVisible();
  });

  test('should display vendor products list', async ({ page }) => {
    // Navigate to products
    await page.goto(routes.vendorProducts);
    
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    // Check for product table headers
    const table = page.locator('table, [role="table"]').first();
    
    if (await table.isVisible()) {
      // Table view
      await expect(table.locator('th').filter({ hasText: /Producto|Product|Nombre|Name/ })).toBeVisible();
      await expect(table.locator('th').filter({ hasText: /Precio|Price/ })).toBeVisible();
      await expect(table.locator('th').filter({ hasText: /Stock|Inventario|Inventory/ })).toBeVisible();
      await expect(table.locator('th').filter({ hasText: /Estado|Status/ })).toBeVisible();
    } else {
      // Grid/card view
      const productCards = page.locator('[data-testid*="product-card"], .product-card, [class*="product"]');
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('should navigate to add new product', async ({ page }) => {
    // Go to products page
    await page.goto(routes.vendorProducts);
    
    // Click add product button
    const addButton = page.locator('button, a').filter({ hasText: /Agregar producto|Add product|Nuevo producto|New product/i }).first();
    await addButton.click();
    
    // Wait for form page
    await page.waitForURL(/\/new|nuevo|add|agregar/, { timeout: 5000 });
    
    // Verify form fields
    await expect(page.locator('input[name="name"], input[name="title"], input[placeholder*="nombre"], input[placeholder*="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"], textarea[placeholder*="descripción"], textarea[placeholder*="description"]')).toBeVisible();
    await expect(page.locator('input[name="price"], input[type="number"][placeholder*="precio"], input[type="number"][placeholder*="price"]')).toBeVisible();
    
    // Check for image upload area
    await expect(page.locator('input[type="file"], [data-testid*="upload"], .dropzone, text=/Subir imagen|Upload image|Arrastrar|Drag/i')).toBeVisible();
  });

  test('should display vendor orders', async ({ page }) => {
    // Navigate to orders
    const ordersLink = page.locator('a, button').filter({ hasText: /Pedidos|Orders/ }).first();
    await ordersLink.click();
    
    // Wait for orders page
    await page.waitForURL(/\/orders|pedidos/, { timeout: 5000 });
    
    // Check for orders list
    await expect(page.locator('h1, h2').filter({ hasText: /Pedidos|Orders/ })).toBeVisible();
    
    // Look for order status filters
    const filters = page.locator('button, select, [role="tab"]').filter({ hasText: /Todos|All|Pendiente|Pending|Completado|Completed/ });
    await expect(filters.first()).toBeVisible();
    
    // Check for order table or cards
    const orderElements = page.locator('table, [data-testid*="order"], .order-card, [class*="order"]').first();
    
    // If no orders, should show empty state
    if (!(await orderElements.isVisible({ timeout: 3000 }))) {
      await expect(page.locator('text=/No hay pedidos|No orders|Sin pedidos|Empty/i')).toBeVisible();
    }
  });

  test('should access vendor profile settings', async ({ page }) => {
    // Look for profile/settings link
    const profileLink = page.locator('a, button').filter({ hasText: /Perfil|Profile|Configuración|Settings|Mi cuenta|My account/i }).first();
    await profileLink.click();
    
    // Wait for profile page
    await page.waitForTimeout(1000);
    
    // Check for profile form fields
    await expect(page.locator('input[name*="name"], input[value*="vendor"]')).toBeVisible();
    await expect(page.locator('input[name*="email"], input[type="email"]')).toBeVisible();
    
    // Check for business information fields
    const businessFields = page.locator('input[name*="business"], input[name*="company"], input[placeholder*="negocio"], input[placeholder*="empresa"]');
    if (await businessFields.count() > 0) {
      await expect(businessFields.first()).toBeVisible();
    }
  });

  test('should show vendor analytics/statistics', async ({ page }) => {
    // Navigate to analytics
    const analyticsLink = page.locator('a, button').filter({ hasText: /Estadísticas|Analytics|Análisis|Stats|Reportes|Reports/i }).first();
    
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await page.waitForTimeout(1000);
      
      // Check for charts or statistics
      await expect(page.locator('text=/Ventas|Sales|Ingresos|Revenue/i')).toBeVisible();
      
      // Look for date range selector
      const dateSelector = page.locator('button, select').filter({ hasText: /mes|month|semana|week|día|day/i });
      if (await dateSelector.count() > 0) {
        await expect(dateSelector.first()).toBeVisible();
      }
      
      // Check for chart elements or data visualization
      const charts = page.locator('canvas, svg[class*="chart"], [class*="chart"], [data-testid*="chart"]');
      if (await charts.count() > 0) {
        await expect(charts.first()).toBeVisible();
      }
    }
  });

  test('should handle product status toggle', async ({ page }) => {
    // Go to products page
    await page.goto(routes.vendorProducts);
    await page.waitForLoadState('networkidle');
    
    // Find a product row with status toggle
    const statusToggle = page.locator('button[role="switch"], input[type="checkbox"], .switch, [data-testid*="status"]').first();
    
    if (await statusToggle.isVisible()) {
      // Get initial state
      const initialState = await statusToggle.getAttribute('aria-checked') || await statusToggle.isChecked();
      
      // Toggle status
      await statusToggle.click();
      await page.waitForTimeout(500);
      
      // Verify state changed
      const newState = await statusToggle.getAttribute('aria-checked') || await statusToggle.isChecked();
      expect(newState).not.toBe(initialState);
    }
  });

  test('should logout from vendor dashboard', async ({ page }) => {
    // Find logout button
    const logoutButton = page.locator('button, a').filter({ hasText: /Cerrar sesión|Logout|Sign out|Salir/i }).first();
    
    // Click user menu if logout is in dropdown
    const userMenu = page.locator('button[aria-label*="user"], button[aria-label*="account"], [data-testid*="user-menu"]').first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.waitForTimeout(300);
    }
    
    // Click logout
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(login|home|$)/);
  });

  test('should show pending approval status for new vendors', async ({ page }) => {
    // This test checks if unapproved vendors see appropriate messaging
    const pendingBanner = page.locator('text=/pendiente|pending|aprobación|approval|revisión|review/i');
    
    // If vendor is pending approval, should see notification
    if (await pendingBanner.isVisible({ timeout: 3000 })) {
      await expect(pendingBanner).toContainText(/cuenta.*pendiente|account.*pending|esperando.*aprobación|awaiting.*approval/i);
      
      // Some features might be disabled
      const disabledElements = page.locator('[disabled], [aria-disabled="true"]');
      expect(await disabledElements.count()).toBeGreaterThan(0);
    }
  });

  test('should handle inventory updates', async ({ page }) => {
    // Go to products page
    await page.goto(routes.vendorProducts);
    await page.waitForLoadState('networkidle');
    
    // Find stock/inventory input
    const stockInput = page.locator('input[name*="stock"], input[name*="inventory"], input[type="number"][placeholder*="stock"], input[type="number"][placeholder*="inventario"]').first();
    
    if (await stockInput.isVisible()) {
      // Update stock
      await stockInput.clear();
      await stockInput.fill('50');
      
      // Look for save button (might be inline or require clicking edit first)
      const saveButton = page.locator('button').filter({ hasText: /Guardar|Save|Actualizar|Update/i }).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Check for success message
        await expect(page.locator('text=/actualizado|updated|guardado|saved/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should filter orders by status', async ({ page }) => {
    // Navigate to orders
    await page.goto('/vendor/orders');
    await page.waitForLoadState('networkidle');
    
    // Find status filters
    const statusFilters = page.locator('button[role="tab"], select, button').filter({ 
      hasText: /Pendiente|Pending|Procesando|Processing|Completado|Completed|Cancelado|Cancelled/i 
    });
    
    if (await statusFilters.count() > 0) {
      // Click on a specific status filter
      const pendingFilter = statusFilters.filter({ hasText: /Pendiente|Pending/i }).first();
      if (await pendingFilter.isVisible()) {
        await pendingFilter.click();
        await page.waitForTimeout(1000);
        
        // Verify URL or content updated
        const orders = page.locator('[data-testid*="order"], .order-row, tr').filter({ hasText: /Pendiente|Pending/i });
        
        // If there are orders, they should all be pending
        if (await orders.count() > 0) {
          await expect(orders.first()).toBeVisible();
        }
      }
    }
  });
});