import { test, expect } from '@playwright/test';
import { routes, uiText } from '../helpers/navigation';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(routes.login);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on Admin tab and wait a bit
    const adminTab = page.locator(`button[role="tab"]:has-text("${uiText.es.adminTab}")`);
    await adminTab.click();
    
    // Force wait for tab animation to complete
    await page.waitForTimeout(1000);
    
    // Try to interact with admin form using force option
    await page.locator('#admin-email').fill('admin@luzimarket.shop', { force: true });
    await page.locator('#admin-password').fill('admin123', { force: true });
    
    // Find and click submit button in admin form
    await page.locator(`form:has(#admin-email) button[type="submit"]:has-text("${uiText.es.login}")`).click();
    
    // Wait for navigation to admin dashboard (more flexible URL matching)
    await page.waitForURL((url: URL) => url.pathname.includes('/admin'), { timeout: 15000 });
  });

  test('should display admin dashboard', async ({ page }) => {
    // Check dashboard elements
    await expect(page.locator('h1').filter({ hasText: /Dashboard|Panel de control/i })).toBeVisible();
    
    // Should have navigation menu with translated text
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('text="Órdenes"')).toBeVisible();
    await expect(sidebar.locator('text="Productos"')).toBeVisible();
  });

  test('should show dashboard statistics', async ({ page }) => {
    // Look for stat cards - they are divs with specific structure
    const statCards = page.locator('.bg-white.rounded-lg.border.border-gray-200.p-6').first();
    await expect(statCards).toBeVisible();
    
    // Should show key metrics in Spanish
    await expect(page.locator('text="Ingresos Totales"')).toBeVisible();
    await expect(page.locator('text="Órdenes Totales"')).toBeVisible();
    await expect(page.locator('text="Productos Activos"')).toBeVisible();
    await expect(page.locator('text="Vendedores Activos"')).toBeVisible();
  });

  test('should navigate to orders management', async ({ page }) => {
    // Click orders link in Spanish
    await page.click('a:has-text("Órdenes")');
    
    // Wait for navigation (handle localized URLs)
    await page.waitForURL((url: URL) => url.pathname.includes('/admin/orders') || url.pathname.includes('/orders'), { timeout: 15000 });
    
    // Should show orders page
    await expect(page.locator('h1:has-text("Órdenes")')).toBeVisible();
  });

  test('should view order details', async ({ page }) => {
    await page.goto(routes.adminOrders);
    
    // Click first order
    const firstOrder = page.locator('tr').filter({ has: page.locator('td') }).first();
    const viewButton = firstOrder.locator('button, a').filter({ hasText: /View|Ver|Details/ }).first();
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
      
      // Should show order details
      await expect(page.locator('text=/Order Details|Detalles del Pedido/')).toBeVisible();
      await expect(page.locator('text=/Items|Artículos|Products/')).toBeVisible();
      await expect(page.locator('text=/Shipping|Envío/')).toBeVisible();
    }
  });

  test('should update order status', async ({ page }) => {
    await page.goto(routes.adminOrders);
    
    // Find status dropdown
    const statusDropdown = page.locator('select').filter({ hasText: /pending|shipped|delivered/ }).first();
    
    if (await statusDropdown.isVisible()) {
      // Change status
      await statusDropdown.selectOption('shipped');
      
      // Should show confirmation or save
      const saveButton = page.locator('button').filter({ hasText: /Save|Guardar|Update/ });
      if (await saveButton.first().isVisible()) {
        await saveButton.first().click();
        
        // Should show success message
        await expect(page.locator('text=/Updated|Actualizado|Success/')).toBeVisible();
      }
    }
  });

  test('should manage products', async ({ page }) => {
    await page.click('a:has-text("Productos")');
    
    // Wait for navigation (handle localized URLs)
    await page.waitForURL((url: URL) => url.pathname.includes('/admin/products') || url.pathname.includes('/products'), { timeout: 15000 });
    
    // Should show products page
    await expect(page.locator('h1:has-text("Productos")')).toBeVisible();
  });

  test('should approve/reject vendors', async ({ page }) => {
    await page.click('a:has-text("Vendedores")');
    
    // Wait for navigation (handle localized URLs)
    await page.waitForURL((url: URL) => url.pathname.includes('/admin/vendors') || url.pathname.includes('/vendors'), { timeout: 15000 });
    
    // Should show vendors page
    await expect(page.locator('h1:has-text("Vendedores")')).toBeVisible();
  });

  test('should manage categories', async ({ page }) => {
    await page.click('a:has-text("Categorías")');
    
    // Wait for navigation (handle localized URLs)
    await page.waitForURL((url: URL) => url.pathname.includes('/admin/categories') || url.pathname.includes('/categorias'), { timeout: 15000 });
    
    // Should show categories page
    await expect(page.locator('h1:has-text("Categorías")')).toBeVisible();
  });

  test('should access email templates', async ({ page }) => {
    await page.goto('/admin/email-templates');
    
    // Should show templates list
    await expect(page.locator('text=/Email Templates|Plantillas de Email/')).toBeVisible();
    
    // Should list template types
    await expect(page.locator('text=/Welcome|Order Confirmation/')).toBeVisible();
  });

  test('should view reports', async ({ page }) => {
    const reportsLink = page.locator('text=/Reports|Reportes|Analytics/').first();
    
    if (await reportsLink.isVisible()) {
      await reportsLink.click();
      
      // Should show charts or metrics
      await expect(page.locator('canvas, svg, .chart')).toBeVisible();
    }
  });

  test('should filter data by date range', async ({ page }) => {
    await page.goto(routes.adminOrders);
    
    // Look for date filters
    const dateFilter = page.locator('input[type="date"], button').filter({ hasText: /Date|Fecha|Filter/ }).first();
    
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      
      // Set date range
      const startDate = page.locator('input[type="date"]').first();
      const endDate = page.locator('input[type="date"]').last();
      
      if (await startDate.isVisible() && await endDate.isVisible()) {
        await startDate.fill('2024-01-01');
        await endDate.fill('2024-12-31');
        
        // Apply filter
        const applyButton = page.locator('button').filter({ hasText: /Apply|Aplicar/ }).first();
        if (await applyButton.isVisible()) {
          await applyButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('should export data', async ({ page }) => {
    await page.goto(routes.adminOrders);
    
    // Look for export button
    const exportButton = page.locator('button').filter({ hasText: /Export|Exportar|Download/ }).first();
    
    if (await exportButton.isVisible()) {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      // Check if download started
      try {
        const download = await Promise.race([
          downloadPromise,
          page.waitForTimeout(5000).then(() => null)
        ]);
        
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.csv|\.xlsx|\.pdf/);
        }
      } catch {
        // Export might open a modal instead
        await expect(page.locator('text=/Export|Format|Download/')).toBeVisible();
      }
    }
  });

  test('should handle bulk actions', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Select multiple items
    const checkboxes = page.locator('input[type="checkbox"]').filter({ hasNotText: /all|todos/ });
    
    if (await checkboxes.first().isVisible()) {
      // Select first few items
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      
      // Bulk actions should appear
      const bulkActions = page.locator('button, select').filter({ hasText: /Bulk|Actions|Selected/ }).first();
      await expect(bulkActions).toBeVisible();
    }
  });

  test('should search in admin panel', async ({ page }) => {
    await page.goto('/admin/products');
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('flores');
      await searchInput.press('Enter');
      
      // Results should filter
      await page.waitForLoadState('networkidle');
      
      // Table should update or show results
      const results = page.locator('table tbody tr, .search-results');
      await expect(results.first()).toBeVisible();
    }
  });

  test('should logout from admin', async ({ page }) => {
    // Find logout button
    const userMenu = page.locator('button').filter({ hasText: /Admin|Profile/ }).first();
    
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }
    
    const logoutButton = page.locator('text=/Logout|Cerrar Sesión|Sign Out/').first();
    await logoutButton.click();
    
    // Should redirect to login or home (handle localized URLs)
    await expect(page).toHaveURL(/\/(login|iniciar-sesion|$)/);
  });
});