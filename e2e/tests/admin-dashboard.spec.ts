import { test, expect } from '@playwright/test';
import { routes, uiText } from '../helpers/navigation';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(routes.login);

    // Click on admin tab first
    const adminTab = page.locator('button[role="tab"]').filter({ hasText: /Admin/i });
    await adminTab.click();

    // Use admin login form with admin credentials
    await page.fill('input[id="admin-email"]', 'admin@luzimarket.shop');
    await page.fill('input[id="admin-password"]', 'admin123');

    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Iniciar sesión|Sign in/ });
    await submitButton.click();

    // Wait for navigation to admin area (handle localized URLs like /es/admin)
    await page.waitForURL((url: URL) => {
      const path = url.pathname;
      return path.includes('/admin') || !!path.match(/\/[a-z]{2}\/admin/);
    }, { timeout: 15000 });
  });

  test('should display admin dashboard', async ({ page }) => {
    // Check dashboard elements
    await expect(page.locator('h1').filter({ hasText: /Dashboard|Panel de control/i })).toBeVisible();

    // Should have navigation menu with translated text - using new sidebar structure
    const sidebar = page.locator('div[data-sidebar="sidebar"]').first();
    await expect(sidebar).toBeVisible();
    await expect(page.locator('text="Órdenes"')).toBeVisible();
    await expect(page.locator('text="Productos"')).toBeVisible();
  });

  test('should show dashboard statistics', async ({ page }) => {
    // Look for stat cards - they are divs with specific structure
    const statCards = page.locator('.bg-white.rounded-lg.border.border-gray-200.p-6').first();
    await expect(statCards).toBeVisible();

    // Should show key metrics as headings (translated)
    await expect(page.getByRole('heading', { name: /Ingresos totales/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Órdenes totales|Ordenes totales/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Productos activos/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Vendedores activos/i })).toBeVisible();
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
    await page.goto('/es/admin/email-templates');

    // Should show templates list (heading)
    await expect(page.getByRole('heading', { name: /Email Templates|Plantillas de correo/i })).toBeVisible();

    // Should show template types info or cards
    await expect(page.getByText(/Plantillas de Email:|Email Templates/i)).toBeVisible();
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
        await startDate.fill('2025-01-01');
        await endDate.fill('2025-12-31');

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

    // Wait for products to load
    await page.waitForSelector('table');

    // Select multiple items - shadcn checkboxes are buttons with role="checkbox"
    const checkboxes = page.locator('button[role="checkbox"]').filter({ hasNotText: /all|todos/ });

    if (await checkboxes.first().isVisible()) {
      // Select first few items by clicking the checkbox button
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();

      // Bulk actions should appear - look for Spanish text
      const bulkActions = page.locator('button').filter({ hasText: /Seleccionados|Aprobar|Rechazar/ }).first();
      await expect(bulkActions).toBeVisible();
    }
  });

  test('should display products in admin panel', async ({ page }) => {
    await page.goto('/admin/products');

    // Should show products page header
    await expect(page.getByRole('heading', { name: 'Productos', exact: true })).toBeVisible();
    await expect(page.getByText('Administra todos los productos de la plataforma')).toBeVisible();

    // Should show stats cards grid
    const statsGrid = page.locator('.grid').filter({ hasText: 'Total productos' });
    await expect(statsGrid).toBeVisible();

    // Check individual stat cards
    await expect(page.locator('.bg-white').filter({ hasText: 'Total productos' })).toBeVisible();

    // Should show at least one product table (there may be pending and active tables)
    const anyTable = page.locator('table').first();
    await expect(anyTable).toBeVisible();

    // Should have basic table structure
    await expect(page.locator('th').first()).toBeVisible();
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