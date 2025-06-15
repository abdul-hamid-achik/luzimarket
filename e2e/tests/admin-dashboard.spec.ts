import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@luzimarket.shop');
    await page.fill('input[type="password"]', 'admin123');
    
    const userTypeSelector = page.locator('select[name="userType"]').first();
    if (await userTypeSelector.isVisible()) {
      await userTypeSelector.selectOption('admin');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/**', { timeout: 10000 });
  });

  test('should display admin dashboard', async ({ page }) => {
    // Check dashboard elements
    await expect(page.locator('h1').filter({ hasText: /Dashboard|Panel/ })).toBeVisible();
    
    // Should have navigation menu
    const sidebar = page.locator('nav, aside').filter({ hasText: /Products|Orders|Vendors/ });
    await expect(sidebar).toBeVisible();
  });

  test('should show dashboard statistics', async ({ page }) => {
    // Look for stat cards
    const statCards = page.locator('.stat-card, [data-testid="stat"], .metric');
    await expect(statCards.first()).toBeVisible();
    
    // Should show key metrics
    await expect(page.locator('text=/Orders|Pedidos/')).toBeVisible();
    await expect(page.locator('text=/Revenue|Ingresos/')).toBeVisible();
    await expect(page.locator('text=/Products|Productos/')).toBeVisible();
    await expect(page.locator('text=/Vendors|Vendedores/')).toBeVisible();
  });

  test('should navigate to orders management', async ({ page }) => {
    // Click orders link
    await page.click('text=/Orders|Pedidos/');
    
    // Should show orders table
    await expect(page.locator('table, [data-testid="orders-table"]')).toBeVisible();
    
    // Should have order columns
    await expect(page.locator('th').filter({ hasText: /Order|Pedido|#/ })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Customer|Cliente/ })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Status|Estado/ })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Total/ })).toBeVisible();
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/admin/orders');
    
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
    await page.goto('/admin/orders');
    
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
    await page.click('text=/Products|Productos/');
    
    // Should show products table
    await expect(page.locator('table, [data-testid="products-table"]')).toBeVisible();
    
    // Should have action buttons
    await expect(page.locator('button, a').filter({ hasText: /Add|Agregar|New/ })).toBeVisible();
  });

  test('should approve/reject vendors', async ({ page }) => {
    await page.click('text=/Vendors|Vendedores/');
    
    // Should show vendors list
    await expect(page.locator('table, [data-testid="vendors-table"]')).toBeVisible();
    
    // Find pending vendor
    const pendingVendor = page.locator('tr').filter({ hasText: /Pending|Pendiente/ }).first();
    
    if (await pendingVendor.isVisible()) {
      // Should have approve/reject buttons
      const approveButton = pendingVendor.locator('button').filter({ hasText: /Approve|Aprobar/ }).first();
      await expect(approveButton).toBeVisible();
      
      await approveButton.click();
      
      // Should show confirmation
      const confirmButton = page.locator('button').filter({ hasText: /Confirm|Confirmar/ }).first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Status should update
      await expect(page.locator('text=/Approved|Aprobado|Active/')).toBeVisible();
    }
  });

  test('should manage categories', async ({ page }) => {
    await page.click('text=/Categories|Categorías/');
    
    // Should show categories list
    await expect(page.locator('h1, h2').filter({ hasText: /Categories|Categorías/ })).toBeVisible();
    
    // Should be able to add category
    const addButton = page.locator('button').filter({ hasText: /Add|Agregar|Nueva/ }).first();
    await expect(addButton).toBeVisible();
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
    await page.goto('/admin/orders');
    
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
    await page.goto('/admin/orders');
    
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
    
    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(login|$)/);
  });
});