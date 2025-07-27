import { test, expect } from '@playwright/test';
import { routes, uiText } from '../helpers/navigation';
import path from 'path';

test.describe('Vendor Product Management', () => {
  // Helper to login as vendor
  async function loginAsVendor(page: any) {
    await page.goto(routes.login);
    const vendorTab = page.locator('button[role="tab"]').filter({ hasText: /Vendedor|Vendor/ });
    await vendorTab.click();
    await page.fill('#vendor-email', 'vendor@luzimarket.shop');
    await page.fill('#vendor-password', 'password123');
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Iniciar sesión|Sign in/ });
    await submitButton.click();
    await page.waitForURL(/\/vendedor/, { timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await loginAsVendor(page);
  });

  test.describe('Product Creation', () => {
    test('should create new product with all required fields', async ({ page }) => {
      // Navigate to add product
      await page.goto('/es/vendor/products/new');
      await page.waitForLoadState('networkidle');
      
      // Fill basic information
      await page.fill('input[name="name"]', 'Ramo de Rosas Rojas');
      await page.fill('textarea[name="description"]', 'Hermoso ramo de 12 rosas rojas frescas, perfectas para ocasiones especiales. Incluye papel decorativo y tarjeta personalizada.');
      await page.fill('input[name="price"]', '599');
      await page.fill('input[name="stock"]', '25');
      
      // Select category - handle shadcn/ui Select component
      const categorySelect = page.locator('[role="combobox"]').filter({ hasText: /Selecciona una categoría/i }).first();
      await categorySelect.click();
      await page.waitForTimeout(500); // Wait for dropdown animation
      
      // Select "Flores & Amores" category (as shown in the dropdown)
      await page.locator('[role="option"]').filter({ hasText: 'Flores & Amores' }).click();
      
      // Add product specifications
      const addSpecButton = page.locator('button').filter({ hasText: /Agregar especificación|Add specification|Característica|Feature/i });
      if (await addSpecButton.isVisible()) {
        await addSpecButton.click();
        await page.fill('input[placeholder*="Nombre"], input[placeholder*="Name"]', 'Tamaño');
        await page.fill('input[placeholder*="Valor"], input[placeholder*="Value"]', '30cm x 40cm');
      }
      
      // Upload image
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-product.jpg'));
      await page.waitForTimeout(1000);
      
      // Save as draft first
      const draftButton = page.locator('button').filter({ hasText: /Guardar.*borrador|Save.*draft/i });
      if (await draftButton.isVisible()) {
        await draftButton.click();
      } else {
        // Or publish directly
        const publishButton = page.locator('button[type="submit"]').filter({ hasText: /Publicar|Publish|Crear|Create/i });
        await publishButton.click();
      }
      
      // Should show success message
      await expect(page.locator('text=/creado|created|guardado|saved/i')).toBeVisible();
      
      // Should redirect to products list
      await expect(page).toHaveURL(/\/products/, { timeout: 5000 });
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Publicar|Publish|Crear|Create/i });
      await submitButton.click();
      
      // Should show validation errors - check for specific field errors
      await page.waitForTimeout(500);
      const formErrors = page.locator('[role="alert"], .text-destructive, .text-red-500');
      await expect(formErrors.first()).toBeVisible();
      
      // Specific field errors
      const nameError = page.locator('text=/nombre.*requerido|name.*required/i');
      const priceError = page.locator('text=/precio.*requerido|price.*required/i');
      
      await expect(nameError.or(priceError)).toBeVisible();
    });

    test('should create product with variants', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Fill basic info
      await page.fill('input[name="name"]', 'Camiseta Personalizada');
      await page.fill('textarea[name="description"]', 'Camiseta de algodón 100% con diseño personalizado');
      await page.fill('input[name="price"]', '299');
      
      // Add variants section
      const variantsButton = page.locator('button').filter({ hasText: /Variantes|Variants|Opciones|Options/i });
      if (await variantsButton.isVisible()) {
        await variantsButton.click();
        
        // Add size variants
        const addVariantButton = page.locator('button').filter({ hasText: /Agregar variante|Add variant/i });
        await addVariantButton.click();
        
        // Size variant
        await page.fill('input[placeholder*="Tipo"], input[placeholder*="Type"]', 'Talla');
        await page.fill('input[placeholder*="Valor"], input[placeholder*="Value"]', 'S');
        await page.fill('input[placeholder*="Stock"]', '10');
        
        // Add another size
        await addVariantButton.click();
        await page.fill('input[placeholder*="Valor"]:last', 'M');
        await page.fill('input[placeholder*="Stock"]:last', '15');
        
        // Add color variant
        await addVariantButton.click();
        await page.fill('input[placeholder*="Tipo"]:last', 'Color');
        await page.fill('input[placeholder*="Valor"]:last', 'Negro');
        await page.fill('input[placeholder*="Stock"]:last', '20');
      }
      
      // Save product
      const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Crear|Create/i });
      await submitButton.click();
      
      await expect(page.locator('text=/creado|created/i')).toBeVisible();
    });

    test('should save product as draft', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Fill minimal info
      await page.fill('input[name="name"]', 'Producto en Borrador');
      await page.fill('input[name="price"]', '100');
      
      // Save as draft
      const draftButton = page.locator('button').filter({ hasText: /Borrador|Draft/i });
      await draftButton.click();
      
      // Should save successfully
      await expect(page.locator('text=/guardado.*borrador|saved.*draft/i')).toBeVisible();
      
      // Should appear in products list as draft
      await page.goto('/es/vendor/products');
      const draftProduct = page.locator('tr, .product-card').filter({ hasText: 'Producto en Borrador' });
      await expect(draftProduct).toBeVisible();
      await expect(draftProduct.locator('text=/Borrador|Draft/i')).toBeVisible();
    });
  });

  test.describe('Product Editing', () => {
    test('should edit existing product', async ({ page }) => {
      // Go to products list
      await page.goto('/es/vendor/products');
      
      // Find edit button for first product
      const editButton = page.locator('button, a').filter({ hasText: /Editar|Edit/i }).first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Wait for edit form
        await page.waitForURL(/\/edit|editar/, { timeout: 5000 });
        
        // Update product name
        const nameInput = page.locator('input[name="name"]');
        await nameInput.clear();
        await nameInput.fill('Producto Actualizado');
        
        // Update price
        const priceInput = page.locator('input[name="price"]');
        await priceInput.clear();
        await priceInput.fill('799');
        
        // Add to description
        const descriptionTextarea = page.locator('textarea[name="description"]');
        const currentDescription = await descriptionTextarea.inputValue();
        await descriptionTextarea.fill(currentDescription + '\n\nActualizado con nuevas características.');
        
        // Save changes
        const saveButton = page.locator('button[type="submit"]').filter({ hasText: /Guardar|Save|Actualizar|Update/i });
        await saveButton.click();
        
        // Should show success
        await expect(page.locator('text=/actualizado|updated|guardado|saved/i')).toBeVisible();
      }
    });

    test('should update product images', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      const editButton = page.locator('button, a').filter({ hasText: /Editar|Edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Add new image
        const addImageButton = page.locator('button').filter({ hasText: /Agregar imagen|Add image/i });
        if (await addImageButton.isVisible()) {
          await addImageButton.click();
        }
        
        const fileInput = page.locator('input[type="file"]').last();
        await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-product-2.jpg'));
        await page.waitForTimeout(1000);
        
        // Remove old image if exists
        const removeButtons = page.locator('button[aria-label*="remove"], button').filter({ 
          has: page.locator('svg.text-red-500') 
        });
        
        if (await removeButtons.count() > 1) {
          await removeButtons.first().click();
          
          // Confirm removal
          const confirmButton = page.locator('button').filter({ hasText: /Confirmar|Confirm/i });
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
        }
        
        // Save changes
        const saveButton = page.locator('button[type="submit"]').filter({ hasText: /Guardar|Save/i });
        await saveButton.click();
        
        await expect(page.locator('text=/actualizado|updated/i')).toBeVisible();
      }
    });

    test('should manage product inventory', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      // Look for inline inventory edit
      const stockInput = page.locator('input[type="number"][name*="stock"]').first();
      
      if (await stockInput.isVisible()) {
        // Direct inline edit
        await stockInput.clear();
        await stockInput.fill('50');
        
        // Save if needed
        const saveButton = stockInput.locator('..').locator('button').filter({ hasText: /✓|Guardar|Save/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      } else {
        // Or through edit page
        const editButton = page.locator('button, a').filter({ hasText: /Editar|Edit|Inventario|Inventory/i }).first();
        await editButton.click();
        
        await page.waitForTimeout(1000);
        
        const stockField = page.locator('input[name="stock"], input[type="number"][placeholder*="stock"]');
        await stockField.clear();
        await stockField.fill('50');
        
        const saveButton = page.locator('button').filter({ hasText: /Guardar|Save/i });
        await saveButton.click();
      }
      
      await expect(page.locator('text=/actualizado|updated|guardado|saved/i')).toBeVisible();
    });

    test('should duplicate product', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      // Find product actions menu
      const actionsButton = page.locator('button').filter({ 
        has: page.locator('svg.w-4.h-4, svg[class*="dots"]') 
      }).first();
      
      if (await actionsButton.isVisible()) {
        await actionsButton.click();
        
        // Click duplicate option
        const duplicateOption = page.locator('button, a').filter({ hasText: /Duplicar|Duplicate|Copiar|Copy/i });
        if (await duplicateOption.isVisible()) {
          await duplicateOption.click();
          
          // Should open edit form with copied data
          await page.waitForURL(/\/vendor\/products\/new/, { timeout: 5000 });
          
          // Verify fields are pre-filled
          const nameInput = page.locator('input[name="name"]');
          const nameValue = await nameInput.inputValue();
          expect(nameValue).toContain('Copia');
          
          // Modify name
          await nameInput.clear();
          await nameInput.fill('Producto Duplicado - Nueva Versión');
          
          // Save new product
          const saveButton = page.locator('button[type="submit"]').filter({ hasText: /Crear|Create/i });
          await saveButton.click();
          
          await expect(page.locator('text=/creado|created/i')).toBeVisible();
        }
      }
    });
  });

  test.describe('Product Status Management', () => {
    test('should publish draft product', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      // Filter by drafts
      const draftFilter = page.locator('button, option').filter({ hasText: /Borrador|Draft/i });
      if (await draftFilter.isVisible()) {
        await draftFilter.click();
        await page.waitForTimeout(1000);
      }
      
      // Find draft product
      const draftProduct = page.locator('tr, .product-card').filter({ hasText: /Borrador|Draft/i }).first();
      
      if (await draftProduct.isVisible()) {
        // Click publish button
        const publishButton = draftProduct.locator('button').filter({ hasText: /Publicar|Publish/i });
        await publishButton.click();
        
        // Confirm publication
        const confirmDialog = page.locator('[role="dialog"]');
        if (await confirmDialog.isVisible()) {
          const confirmButton = confirmDialog.locator('button').filter({ hasText: /Confirmar|Confirm/i });
          await confirmButton.click();
        }
        
        // Should show success
        await expect(page.locator('text=/publicado|published/i')).toBeVisible();
        
        // Status should change
        await expect(draftProduct.locator('text=/Activo|Active|Publicado|Published/i')).toBeVisible();
      }
    });

    test('should pause/unpause product', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      // Find active product
      const activeProduct = page.locator('tr, .product-card').filter({ hasText: /Activo|Active/i }).first();
      
      if (await activeProduct.isVisible()) {
        // Toggle status
        const statusToggle = activeProduct.locator('button[role="switch"], input[type="checkbox"]').first();
        
        if (await statusToggle.isVisible()) {
          await statusToggle.click();
          
          // Should update status
          await expect(activeProduct.locator('text=/Pausado|Paused|Inactivo|Inactive/i')).toBeVisible();
          
          // Toggle back
          await statusToggle.click();
          await expect(activeProduct.locator('text=/Activo|Active/i')).toBeVisible();
        }
      }
    });

    test('should delete product', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      // Get initial product count
      const initialProducts = await page.locator('tr:not(:first-child), .product-card').count();
      
      // Find delete button
      const actionsButton = page.locator('button').filter({ 
        has: page.locator('svg.w-4.h-4') 
      }).first();
      
      if (await actionsButton.isVisible()) {
        await actionsButton.click();
        
        const deleteOption = page.locator('button, a').filter({ hasText: /Eliminar|Delete/i });
        await deleteOption.click();
        
        // Confirm deletion
        const confirmDialog = page.locator('[role="dialog"]');
        await expect(confirmDialog).toBeVisible();
        await expect(confirmDialog.locator('text=/eliminar.*permanente|delete.*permanent/i')).toBeVisible();
        
        const confirmButton = confirmDialog.locator('button').filter({ hasText: /Eliminar|Delete/i });
        await confirmButton.click();
        
        // Should show success
        await expect(page.locator('text=/eliminado|deleted/i')).toBeVisible();
        
        // Product count should decrease
        await page.waitForTimeout(1000);
        const finalProducts = await page.locator('tr:not(:first-child), .product-card').count();
        expect(finalProducts).toBe(initialProducts - 1);
      }
    });
  });

  test.describe('Product Analytics', () => {
    test('should view product performance', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      // Click on product to view details
      const productRow = page.locator('tr:not(:first-child), .product-card').first();
      const productName = await productRow.locator('td:first-child, .product-name').textContent();
      
      const viewButton = productRow.locator('button, a').filter({ hasText: /Ver|View|Estadísticas|Stats/i });
      if (await viewButton.isVisible()) {
        await viewButton.click();
        
        // Should show product analytics
        await page.waitForTimeout(1000);
        
        // Verify product name
        await expect(page.locator('h1, h2').filter({ hasText: productName || '' })).toBeVisible();
        
        // Check for metrics
        await expect(page.locator('text=/Vistas|Views/i')).toBeVisible();
        await expect(page.locator('text=/Ventas|Sales/i')).toBeVisible();
        await expect(page.locator('text=/Ingresos|Revenue/i')).toBeVisible();
        
        // Should show time period selector
        const periodSelector = page.locator('select, button').filter({ hasText: /día|day|semana|week|mes|month/i });
        await expect(periodSelector.first()).toBeVisible();
      }
    });

    test('should export product data', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      // Look for export button
      const exportButton = page.locator('button').filter({ hasText: /Exportar|Export|Descargar|Download/i });
      
      if (await exportButton.isVisible()) {
        // Set up download promise
        const downloadPromise = page.waitForEvent('download');
        
        await exportButton.click();
        
        // Select format if asked
        const formatDialog = page.locator('[role="dialog"]');
        if (await formatDialog.isVisible({ timeout: 1000 })) {
          const csvOption = formatDialog.locator('button').filter({ hasText: /CSV/i });
          await csvOption.click();
        }
        
        // Wait for download
        const download = await downloadPromise;
        
        // Verify download
        expect(download.suggestedFilename()).toMatch(/products.*\.csv|productos.*\.csv/i);
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should bulk update product prices', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      // Select multiple products
      const allCheckboxes = await page.locator('input[type="checkbox"]:not([disabled])').all();
      const checkboxes = allCheckboxes.slice(0, 3);
      
      for (const checkbox of checkboxes) {
        await checkbox.click();
      }
      
      // Bulk actions should appear
      const bulkActions = page.locator('button, select').filter({ hasText: /Acciones|Actions|Bulk/i });
      await bulkActions.first().click();
      
      // Select price update
      const priceOption = page.locator('button, option').filter({ hasText: /Actualizar precio|Update price/i });
      await priceOption.click();
      
      // Price update dialog
      const priceDialog = page.locator('[role="dialog"]');
      await expect(priceDialog).toBeVisible();
      
      // Select percentage increase
      const percentOption = page.locator('input[type="radio"]').filter({ hasText: /Porcentaje|Percentage/i });
      if (await percentOption.isVisible()) {
        await percentOption.click();
        await page.fill('input[type="number"]', '10'); // 10% increase
      }
      
      // Apply changes
      const applyButton = priceDialog.locator('button').filter({ hasText: /Aplicar|Apply/i });
      await applyButton.click();
      
      // Should show success
      await expect(page.locator('text=/actualizado|updated/i')).toBeVisible();
    });

    test('should bulk delete products', async ({ page }) => {
      await page.goto('/es/vendor/products');
      
      // Get initial count
      const initialCount = await page.locator('tr:not(:first-child), .product-card').count();
      
      // Select products
      const allCheckboxes = await page.locator('input[type="checkbox"]:not([disabled])').all();
      const checkboxes = allCheckboxes.slice(0, 2);
      for (const checkbox of checkboxes) {
        await checkbox.click();
      }
      
      // Bulk delete
      const bulkActions = page.locator('button').filter({ hasText: /Acciones|Actions/i });
      await bulkActions.click();
      
      const deleteOption = page.locator('button').filter({ hasText: /Eliminar|Delete/i });
      await deleteOption.click();
      
      // Confirm
      const confirmDialog = page.locator('[role="dialog"]');
      const confirmButton = confirmDialog.locator('button').filter({ hasText: /Eliminar|Delete/i });
      await confirmButton.click();
      
      // Verify count decreased
      await page.waitForTimeout(1000);
      const finalCount = await page.locator('tr:not(:first-child), .product-card').count();
      expect(finalCount).toBe(initialCount - 2);
    });
  });
});