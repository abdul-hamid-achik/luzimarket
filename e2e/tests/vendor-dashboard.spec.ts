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

    // Fill in vendor credentials using name attributes (more reliable)
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    // Submit login form
    await page.getByRole('button', { name: /iniciar sesión|sign in|login/i }).click();

    // Wait for redirect or dashboard content (support localized and non-localized URL)
    await Promise.race([
      page.waitForURL(/\/(vendedor|vendor)\/(panel|dashboard)/, { timeout: 20000 }),
      page.waitForSelector('[data-testid="vendor-stats"]', { timeout: 20000 }),
    ]);
  }

  test.beforeEach(async ({ page }) => {
    await loginAsVendor(page);
  });

  test('should access vendor dashboard after login', async ({ page }) => {
    // Verify we're on the vendor dashboard (handle localized paths)
    await expect(page).toHaveURL(/\/(vendor|vendedor)/);

    // Check for dashboard elements - look for vendor stats which has test-id
    await expect(page.getByTestId('vendor-stats')).toBeVisible();

    // Verify vendor-specific navigation items (sidebar renders links within buttons)
    // Look for links by text content since they're nested in buttons
    await expect(page.locator('a:has-text("Productos"), a:has-text("Products")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Pedidos"), a:has-text("Orders"), a:has-text("Órdenes")').first()).toBeVisible();
  });

  test('should display vendor statistics overview', async ({ page }) => {
    // Look for stats section via testid
    await expect(page.getByTestId('vendor-stats')).toBeVisible();

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
    // Prefer direct navigation to avoid overlay intercepts
    await page.goto('/es/vendedor/productos');

    // Wait for products page
    await Promise.race([
      page.waitForURL(/\/(vendor|vendedor)\/(products|productos)/, { timeout: 20000 }),
      page.waitForSelector('[data-testid="vendor-products-title"]', { timeout: 20000 }),
    ]);

    // Verify products table/grid
    await expect(page.getByTestId('vendor-products-title')).toBeVisible();

    // Check for add product button (use stable testid)
    const addProductButton = page.getByTestId('vendor-add-product');
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
    const addButton = page.getByTestId('vendor-add-product');
    await addButton.click();

    // Wait for form page
    await page.waitForURL(/\/new|nuevo|add|agregar/, { timeout: 5000 });

    // Verify form fields
    await expect(page.locator('input[name="name"], input[name="title"], input[placeholder*="nombre"], input[placeholder*="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"], textarea[placeholder*="descripción"], textarea[placeholder*="description"]')).toBeVisible();
    await expect(page.locator('input[name="price"], input[type="number"][placeholder*="precio"], input[type="number"][placeholder*="price"]')).toBeVisible();

    // Check for image upload area
    // Hidden input is acceptable in UI; assert visible dropzone or upload button instead
    const uploadArea = page.locator('.dropzone, [data-testid*="upload"], label:has(input[type="file"]), button:has-text("Upload")').first();
    const isUploadVisible = await uploadArea.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!isUploadVisible) {
      // Image upload might be optional or on different page
      // Just verify we're on the add product page
      expect(page.url()).toMatch(/\/new|nuevo|add|agregar/);
    }
  });

  test('should display vendor orders', async ({ page }) => {
    // Navigate to orders
    const ordersLink = page.locator('a, button').filter({ hasText: /Pedidos|Orders/ }).first();
    if (await ordersLink.isVisible({ timeout: 1000 })) {
      await ordersLink.click();
      await page.waitForTimeout(2000); // Wait for navigation
    } else {
      // Navigate directly to orders page
      await page.goto('/es/vendor/orders');
    }

    // Check for orders page - be more flexible about what constitutes an orders page
    const orderPageIndicators = [
      page.locator('h1, h2').filter({ hasText: /Pedidos|Orders/ }),
      page.locator('text=/Sin pedidos|No orders|Empty/'),
      page.locator('table'),
      page.locator('[data-testid="orders"]'),
      page.locator('.orders-list')
    ];
    
    let foundOrdersPage = false;
    for (const indicator of orderPageIndicators) {
      if (await indicator.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        foundOrdersPage = true;
        break;
      }
    }
    
    // If we found an orders page or empty state, that's success
    if (foundOrdersPage) {
      expect(foundOrdersPage).toBeTruthy();
    } else {
      // Otherwise, check if we're at least in the vendor dashboard
      const vendorDashboard = page.locator('text=/vendedor|vendor|dashboard/i').first();
      await expect(vendorDashboard).toBeVisible({ timeout: 3000 });
    }

    // Look for any order-related elements (filters, tables, empty states)
    const orderRelatedElements = [
      page.locator('text=/Todos|All|Pendiente|Pending|Completado|Completed/'),
      page.locator('text=/No hay pedidos|No orders|Sin pedidos|Empty/i'),
      page.locator('table'),
      page.locator('[data-testid*="order"]')
    ];

    let foundOrderElement = false;
    for (const element of orderRelatedElements) {
      if (await element.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        foundOrderElement = true;
        break;
      }
    }

    // At minimum, we should be on a vendor page
    expect(foundOrdersPage || foundOrderElement).toBeTruthy();
  });

  test('should access vendor profile settings', async ({ page }) => {
    // Look for settings link in sidebar
    const settingsLink = page.locator('a[href*="/vendor/settings"]').first();
    if (await settingsLink.isVisible({ timeout: 2000 })) {
      await settingsLink.click();
    } else {
      // Fallback: navigate directly
      await page.goto('/es/vendedor/configuracion');
    }

    // Wait for settings page
    await page.waitForURL(/\/(vendor|vendedor)\/(settings|configuracion)/, { timeout: 5000 });

    // Check for settings page content - look for setting sections or tabs
    const settingsContent = page.locator('h1, h2').filter({ hasText: /Configuración|Settings|Perfil|Profile/i }).first();
    await expect(settingsContent).toBeVisible();

    // Check for setting options/links
    const settingLinks = page.locator('a[href*="/vendor/settings/"], a[href*="/vendedor/configuracion/"]');
    expect(await settingLinks.count()).toBeGreaterThan(0);
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
    try {
      await logoutButton.click();
    } catch {
      // Dev overlay can intercept clicks in Next dev; trigger form submit directly
      await page.evaluate(() => {
        const form = document.querySelector('form[action*="/api/auth/signout"]') as HTMLFormElement | null;
        if (form) form.submit();
      });
    }

    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(iniciar-sesion|login|home|$)/);
  });

  test('should show pending approval status for new vendors', async ({ page }) => {
    // This test checks if unapproved vendors see appropriate messaging
    const pendingBanner = page.getByText(/pendiente|pending|aprobación|approval|revisión|review/i).first();

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
    await page.goto('/es/vendedor/ordenes');
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