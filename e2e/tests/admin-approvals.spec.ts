import { test, expect } from '@playwright/test';
import { routes, uiText } from '../helpers/navigation';

test.describe('Admin Approval Workflows', () => {
  // Helper to login as admin
  async function loginAsAdmin(page: any) {
    await page.goto(routes.login);
    const adminTab = page.locator(`button[role="tab"]:has-text("${uiText.es.adminTab}")`);
    await adminTab.click();
    await page.waitForTimeout(500); // Wait for tab transition
    await page.fill('#admin-email', 'admin@luzimarket.shop');
    await page.fill('#admin-password', 'admin123');
    const submitButton = page.locator(`form:has(#admin-email) button[type="submit"]:has-text("${uiText.es.login}")`);
    await submitButton.click();
    await page.waitForURL(routes.admin, { timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('Vendor Approval', () => {
    test('should display pending vendor applications', async ({ page }) => {
      // Navigate to vendor management
      const vendorLink = page.locator('a, button').filter({ hasText: /Vendedores|Vendors|Proveedores|Suppliers/i }).first();
      await vendorLink.click();

      // Wait for page to load
      await page.waitForURL(/\/vendors|vendedores/, { timeout: 5000 });

      // Check for pending tab/filter
      const pendingTab = page.locator('button[role="tab"], button').filter({ hasText: /Pendiente|Pending|Revisar|Review/i });
      if (await pendingTab.isVisible()) {
        await pendingTab.click();
      }

      // Should show pending vendors list
      await expect(page.locator('text=/Solicitudes pendientes|Pending applications|Vendedores por aprobar|Vendors to approve/i')).toBeVisible();

      // Check for vendor cards/rows
      const vendorItems = page.locator('[data-testid*="vendor"], .vendor-card, tr').filter({ hasText: /Pendiente|Pending/i });

      if (await vendorItems.count() > 0) {
        const firstVendor = vendorItems.first();

        // Should show vendor info
        await expect(firstVendor.locator('text=/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}/')).toBeVisible(); // Email

        // Should have action buttons
        await expect(firstVendor.locator('button').filter({ hasText: /Ver|View|Revisar|Review/i })).toBeVisible();
      }
    });

    test('should view vendor application details', async ({ page }) => {
      await page.goto(routes.adminVendors);

      // Find first pending vendor
      const reviewButton = page.locator('button').filter({ hasText: /Ver|View|Revisar|Review/i }).first();

      if (await reviewButton.isVisible()) {
        await reviewButton.click();

        // Should show vendor details modal or page
        await page.waitForTimeout(1000);

        // Check for vendor information sections
        await expect(page.locator('text=/Información.*negocio|Business.*information|Datos.*empresa|Company.*details/i')).toBeVisible();
        await expect(page.locator('text=/Información.*contacto|Contact.*information/i')).toBeVisible();

        // Should show service type
        await expect(page.locator('text=/Servicio|Service|Domicilio|Delivery|Propio|Own/i')).toBeVisible();

        // Should show social media links if provided
        const socialSection = page.locator('text=/Social|Redes|Instagram|Facebook/i');
        if (await socialSection.isVisible()) {
          await expect(socialSection).toBeVisible();
        }

        // Should have approve/reject buttons
        await expect(page.locator('button').filter({ hasText: /Aprobar|Approve/i })).toBeVisible();
        await expect(page.locator('button').filter({ hasText: /Rechazar|Reject/i })).toBeVisible();
      }
    });

    test('should approve vendor application', async ({ page }) => {
      await page.goto(routes.adminVendors);

      // Review first pending vendor
      const reviewButton = page.locator('button').filter({ hasText: /Ver|View|Revisar|Review/i }).first();
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForTimeout(1000);

        // Click approve button
        const approveButton = page.locator('button').filter({ hasText: /Aprobar|Approve/i }).first();
        await approveButton.click();

        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], .modal').filter({ hasText: /Confirmar|Confirm/i });
        if (await confirmDialog.isVisible()) {
          // Optionally add welcome message
          const messageInput = confirmDialog.locator('textarea, input[type="text"]');
          if (await messageInput.isVisible()) {
            await messageInput.fill('Bienvenido a Luzimarket! Tu cuenta ha sido aprobada.');
          }

          // Confirm approval
          const confirmButton = confirmDialog.locator('button').filter({ hasText: /Confirmar|Confirm|Aprobar|Approve/i });
          await confirmButton.click();
        }

        // Should show success message
        await expect(page.locator('text=/aprobado|approved|éxito|success/i')).toBeVisible();

        // Should send email notification (check for confirmation)
        await expect(page.locator('text=/notificado|notified|email.*enviado|email.*sent/i')).toBeVisible();
      }
    });

    test('should reject vendor application with reason', async ({ page }) => {
      await page.goto(routes.adminVendors);

      const reviewButton = page.locator('button').filter({ hasText: /Ver|View|Revisar|Review/i }).first();
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForTimeout(1000);

        // Click reject button
        const rejectButton = page.locator('button').filter({ hasText: /Rechazar|Reject/i }).first();
        await rejectButton.click();

        // Should show reason form
        const reasonDialog = page.locator('[role="dialog"], .modal').filter({ hasText: /Razón|Reason|Motivo|Motive/i });
        await expect(reasonDialog).toBeVisible();

        // Select rejection reason
        const reasonSelect = reasonDialog.locator('select, [role="combobox"]');
        if (await reasonSelect.isVisible()) {
          await reasonSelect.selectOption({ index: 1 });
        }

        // Add additional comments
        const commentsTextarea = reasonDialog.locator('textarea');
        await commentsTextarea.fill('La información proporcionada es insuficiente. Por favor, incluya más detalles sobre su negocio.');

        // Submit rejection
        const submitButton = reasonDialog.locator('button').filter({ hasText: /Rechazar|Reject|Enviar|Submit/i });
        await submitButton.click();

        // Should show confirmation
        await expect(page.locator('text=/rechazado|rejected|notificado|notified/i')).toBeVisible();
      }
    });

    test('should filter vendors by status', async ({ page }) => {
      await page.goto(routes.adminVendors);

      // Check for status filters
      const filters = page.locator('button[role="tab"], select option, button').filter({
        hasText: /Todos|All|Pendiente|Pending|Aprobado|Approved|Rechazado|Rejected/i
      });

      // Click approved filter
      const approvedFilter = filters.filter({ hasText: /Aprobado|Approved/i }).first();
      if (await approvedFilter.isVisible()) {
        await approvedFilter.click();
        await page.waitForTimeout(1000);

        // Should only show approved vendors
        const vendorRows = page.locator('[data-testid*="vendor"], .vendor-row, tr:not(:first-child)');

        if (await vendorRows.count() > 0) {
          // Check that all visible vendors are approved
          const statusBadges = vendorRows.locator('.badge, .status, text=/Aprobado|Approved/i');
          await expect(statusBadges.first()).toBeVisible();
        }
      }
    });

    test('should search vendors by name or email', async ({ page }) => {
      await page.goto(routes.adminVendors);

      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]').first();

      if (await searchInput.isVisible()) {
        // Search by email
        await searchInput.fill('vendor@');
        await page.waitForTimeout(500);

        // Results should be filtered
        const vendorRows = page.locator('[data-testid*="vendor"], .vendor-row, tr:not(:first-child)');
        const visibleRows = await vendorRows.count();

        if (visibleRows > 0) {
          // All visible vendors should contain search term
          const firstVendor = vendorRows.first();
          await expect(firstVendor).toContainText('vendor@');
        }

        // Clear and search by name
        await searchInput.clear();
        await searchInput.fill('Flores');
        await page.waitForTimeout(500);

        // Should show vendors with matching business name
        if (await vendorRows.count() > 0) {
          await expect(vendorRows.first()).toContainText(/Flores/i);
        }
      }
    });
  });

  test.describe('Product Approval', () => {
    test('should display pending products for approval', async ({ page }) => {
      // Navigate to product moderation
      const productsLink = page.locator('a, button').filter({ hasText: /Productos|Products|Moderar|Moderate/i }).first();
      await productsLink.click();

      await page.waitForTimeout(1000);

      // Filter by pending status
      const pendingFilter = page.locator('button, option').filter({ hasText: /Pendiente|Pending|Revisar|Review/i }).first();
      if (await pendingFilter.isVisible()) {
        await pendingFilter.click();
      }

      // Should show pending products
      const productItems = page.locator('[data-testid*="product"], .product-card, tr').filter({
        hasText: /Pendiente|Pending/i
      });

      if (await productItems.count() > 0) {
        const firstProduct = productItems.first();

        // Should show product info
        await expect(firstProduct.locator('img')).toBeVisible(); // Product image
        await expect(firstProduct.locator('text=/\\$[0-9,]+/')).toBeVisible(); // Price

        // Should show vendor name
        await expect(firstProduct.locator('text=/Vendedor|Vendor|Por|By/i')).toBeVisible();

        // Should have review button
        await expect(firstProduct.locator('button').filter({ hasText: /Revisar|Review|Ver|View/i })).toBeVisible();
      }
    });

    test('should review product details before approval', async ({ page }) => {
      await page.goto(routes.adminProductsPending);

      const reviewButton = page.locator('button').filter({ hasText: /Revisar|Review|Ver|View/i }).first();

      if (await reviewButton.isVisible()) {
        await reviewButton.click();

        // Should show product detail modal/page
        await page.waitForTimeout(1000);

        // Check all product information
        await expect(page.locator('text=/Nombre|Name|Título|Title/i')).toBeVisible();
        await expect(page.locator('text=/Descripción|Description/i')).toBeVisible();
        await expect(page.locator('text=/Precio|Price/i')).toBeVisible();
        await expect(page.locator('text=/Categoría|Category/i')).toBeVisible();
        await expect(page.locator('text=/Stock|Inventario|Inventory/i')).toBeVisible();

        // Should show all product images
        const images = page.locator('.product-images img, .gallery img');
        expect(await images.count()).toBeGreaterThan(0);

        // Should show vendor information
        await expect(page.locator('text=/Vendedor|Vendor|Proveedor|Supplier/i')).toBeVisible();

        // Action buttons
        await expect(page.locator('button').filter({ hasText: /Aprobar|Approve/i })).toBeVisible();
        await expect(page.locator('button').filter({ hasText: /Rechazar|Reject/i })).toBeVisible();
        await expect(page.locator('button').filter({ hasText: /Solicitar cambios|Request changes/i })).toBeVisible();
      }
    });

    test('should approve product with category assignment', async ({ page }) => {
      await page.goto(routes.adminProductsPending);

      const reviewButton = page.locator('button').filter({ hasText: /Revisar|Review/i }).first();
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForTimeout(1000);

        // Verify or change category
        const categorySelect = page.locator('select[name*="category"], [role="combobox"]').filter({
          hasText: /Categoría|Category/i
        });

        if (await categorySelect.isVisible()) {
          // Make sure correct category is selected
          await categorySelect.selectOption({ index: 1 });
        }

        // Add admin notes if needed
        const notesInput = page.locator('textarea[placeholder*="Notas"], textarea[placeholder*="Notes"]');
        if (await notesInput.isVisible()) {
          await notesInput.fill('Producto verificado y aprobado para venta.');
        }

        // Click approve
        const approveButton = page.locator('button').filter({ hasText: /Aprobar|Approve/i }).last();
        await approveButton.click();

        // Confirm if needed
        const confirmButton = page.locator('button').filter({ hasText: /Confirmar|Confirm/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Should show success
        await expect(page.locator('text=/aprobado|approved|publicado|published/i')).toBeVisible();
      }
    });

    test('should request changes to product', async ({ page }) => {
      await page.goto(routes.adminProductsPending);

      const reviewButton = page.locator('button').filter({ hasText: /Revisar|Review/i }).first();
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForTimeout(1000);

        // Click request changes
        const changesButton = page.locator('button').filter({ hasText: /Solicitar cambios|Request changes|Modificar|Modify/i });
        await changesButton.click();

        // Should show changes form
        const changesDialog = page.locator('[role="dialog"], .modal');
        await expect(changesDialog).toBeVisible();

        // Select what needs to be changed
        const checkboxes = changesDialog.locator('input[type="checkbox"]');
        if (await checkboxes.count() > 0) {
          // Check specific items
          const imageCheckbox = checkboxes.filter({ hasText: /Imagen|Image|Foto|Photo/i });
          const descriptionCheckbox = checkboxes.filter({ hasText: /Descripción|Description/i });

          if (await imageCheckbox.isVisible()) await imageCheckbox.click();
          if (await descriptionCheckbox.isVisible()) await descriptionCheckbox.click();
        }

        // Add detailed feedback
        const feedbackTextarea = changesDialog.locator('textarea');
        await feedbackTextarea.fill('Por favor:\n1. Mejora la calidad de las imágenes\n2. Agrega más detalles a la descripción del producto');

        // Submit request
        const submitButton = changesDialog.locator('button').filter({ hasText: /Enviar|Send|Solicitar|Request/i });
        await submitButton.click();

        // Should notify vendor
        await expect(page.locator('text=/notificado|notified|enviado|sent/i')).toBeVisible();
      }
    });

    test('should bulk approve products', async ({ page }) => {
      await page.goto(routes.adminProductsPending);

      // Select multiple products
      const checkboxes = page.locator('input[type="checkbox"]:not([disabled])');

      if (await checkboxes.count() >= 3) {
        // Select first 3 products
        for (let i = 0; i < 3; i++) {
          await checkboxes.nth(i).click();
        }

        // Bulk actions should appear
        const bulkActions = page.locator('button, select').filter({ hasText: /Acciones|Actions|Bulk/i });
        await expect(bulkActions.first()).toBeVisible();

        // Select approve action
        const approveOption = page.locator('button, option').filter({ hasText: /Aprobar.*seleccionados|Approve.*selected/i });
        await approveOption.click();

        // Confirm bulk approval
        const confirmDialog = page.locator('[role="dialog"]');
        if (await confirmDialog.isVisible()) {
          const confirmButton = confirmDialog.locator('button').filter({ hasText: /Confirmar|Confirm/i });
          await confirmButton.click();
        }

        // Should show success with count
        await expect(page.locator('text=/3.*productos.*aprobados|3.*products.*approved/i')).toBeVisible();
      }
    });
  });

  test.describe('User Management', () => {
    test('should list all users with filters', async ({ page }) => {
      // Navigate to users
      const usersLink = page.locator('a, button').filter({ hasText: /Usuarios|Users|Clientes|Customers/i }).first();
      await usersLink.click();

      await page.waitForURL(/\/users|usuarios/, { timeout: 5000 });

      // Should show user type filters
      const filters = page.locator('button[role="tab"], select option').filter({
        hasText: /Todos|All|Cliente|Customer|Vendedor|Vendor|Admin/i
      });
      await expect(filters.first()).toBeVisible();

      // Should show user table
      const userTable = page.locator('table, [role="table"]');
      await expect(userTable).toBeVisible();

      // Check table headers
      await expect(userTable.locator('th').filter({ hasText: /Email|Correo/i })).toBeVisible();
      await expect(userTable.locator('th').filter({ hasText: /Tipo|Type|Rol|Role/i })).toBeVisible();
      await expect(userTable.locator('th').filter({ hasText: /Estado|Status/i })).toBeVisible();
      await expect(userTable.locator('th').filter({ hasText: /Registro|Registered|Fecha|Date/i })).toBeVisible();
    });

    test('should block/unblock users', async ({ page }) => {
      await page.goto(routes.adminUsers);

      // Find an active user
      const activeUser = page.locator('tr, [data-testid*="user"]').filter({ hasText: /Activo|Active/i }).first();

      if (await activeUser.isVisible()) {
        // Click actions menu
        const actionsButton = activeUser.locator('button').filter({
          has: page.locator('svg.w-4.h-4, svg[class*="dots"]')
        }).first();
        await actionsButton.click();

        // Click block option
        const blockOption = page.locator('button, a').filter({ hasText: /Bloquear|Block|Suspender|Suspend/i });
        await blockOption.click();

        // Confirm action
        const confirmDialog = page.locator('[role="dialog"]');
        if (await confirmDialog.isVisible()) {
          const reasonInput = confirmDialog.locator('textarea, input[type="text"]');
          if (await reasonInput.isVisible()) {
            await reasonInput.fill('Violación de términos de servicio');
          }

          const confirmButton = confirmDialog.locator('button').filter({ hasText: /Confirmar|Confirm|Bloquear|Block/i });
          await confirmButton.click();
        }

        // User status should update
        await expect(activeUser.locator('text=/Bloqueado|Blocked|Suspendido|Suspended/i')).toBeVisible();

        // Should show success message
        await expect(page.locator('text=/bloqueado|blocked|actualizado|updated/i')).toBeVisible();
      }
    });

    test('should view user activity log', async ({ page }) => {
      await page.goto(routes.adminUsers);

      // Click on a user to view details
      const userRow = page.locator('tr, [data-testid*="user"]').nth(1);
      const viewButton = userRow.locator('button, a').filter({ hasText: /Ver|View|Detalles|Details/i });

      if (await viewButton.isVisible()) {
        await viewButton.click();

        // Should show user detail page/modal
        await page.waitForTimeout(1000);

        // Look for activity tab
        const activityTab = page.locator('button[role="tab"], a').filter({ hasText: /Actividad|Activity|Historial|History/i });
        if (await activityTab.isVisible()) {
          await activityTab.click();

          // Should show activity log
          await expect(page.locator('text=/Último acceso|Last login|Actividad reciente|Recent activity/i')).toBeVisible();

          // Should show activity items
          const activityItems = page.locator('.activity-item, [data-testid*="activity"], .timeline-item');
          if (await activityItems.count() > 0) {
            // Should show timestamps
            await expect(activityItems.first().locator('time, .timestamp')).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Dashboard Overview', () => {
    test('should show pending items count on dashboard', async ({ page }) => {
      await page.goto(routes.admin);

      // Should show overview cards with pending counts
      const pendingCards = page.locator('.stat-card, .metric-card, [data-testid*="stat"]').filter({
        hasText: /Pendiente|Pending/i
      });

      await expect(pendingCards.first()).toBeVisible();

      // Should show specific pending items
      await expect(page.locator('text=/Vendedores.*pendientes|Vendors.*pending|Solicitudes.*vendedor|Vendor.*applications/i')).toBeVisible();
      await expect(page.locator('text=/Productos.*revisar|Products.*review|Productos.*pendientes|Products.*pending/i')).toBeVisible();
      await expect(page.locator('text=/Imágenes.*moderar|Images.*moderate|Imágenes.*pendientes|Images.*pending/i')).toBeVisible();

      // Each should be clickable
      const vendorCard = page.locator('[data-testid*="vendors-pending"], .card').filter({ hasText: /Vendedores|Vendors/i });
      if (await vendorCard.isVisible()) {
        await expect(vendorCard).toHaveAttribute('href', /vendors|vendedores/);
      }
    });

    test('should show recent activity feed', async ({ page }) => {
      await page.goto(routes.admin);

      // Look for activity section
      const activitySection = page.locator('section, div').filter({ hasText: /Actividad reciente|Recent activity|Últimas acciones|Latest actions/i });

      if (await activitySection.isVisible()) {
        // Should show activity items
        const activityItems = activitySection.locator('.activity-item, .feed-item, li');

        if (await activityItems.count() > 0) {
          const firstItem = activityItems.first();

          // Should show timestamp
          await expect(firstItem.locator('time, .time, .timestamp')).toBeVisible();

          // Should show action description
          await expect(firstItem.locator('text=/registró|registered|aprobó|approved|rechazó|rejected/i')).toBeVisible();
        }
      }
    });
  });
});