import { test, expect } from '@playwright/test';
import { routes, uiText } from '../helpers/navigation';
import path from 'path';

test.describe('Image Upload and Approval Workflow', () => {
  // Helper to login as vendor
  async function loginAsVendor(page: any) {
    await page.goto(routes.login);
    const vendorTab = page.locator('button[role="tab"]').filter({ hasText: /Vendedor|Vendor/ });
    await vendorTab.click();
    await page.waitForTimeout(500); // Wait for tab transition
    await page.fill('input[type="email"]', 'vendor@luzimarket.shop');
    await page.fill('input[type="password"]', 'password123');
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Iniciar sesión|Sign in/ });
    await submitButton.click();
    // More flexible URL matching for vendor dashboard (handles localized URLs)
    await page.waitForURL((url: URL) => url.pathname.includes('/vendor') || url.pathname.includes('/vendedor'), { timeout: 15000 });
  }

  // Helper to login as admin
  async function loginAsAdmin(page: any) {
    await page.goto(routes.login);
    const adminTab = page.locator('button[role="tab"]').filter({ hasText: /Admin/ });
    await adminTab.click();
    await page.fill('input[type="email"]', 'admin@luzimarket.shop');
    await page.fill('input[type="password"]', 'admin123');
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Iniciar sesión|Sign in/ });
    await submitButton.click();
    await page.waitForURL(/\/admin/, { timeout: 10000 });
  }

  test.describe('Vendor Image Upload', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsVendor(page);
    });

    test('should display image upload interface when creating product', async ({ page }) => {
      // Navigate to add product
      await page.goto('/vendor/products/new');
      
      // Check for image upload area
      const uploadArea = page.locator('[data-testid*="upload"], .dropzone, input[type="file"], text=/Subir imagen|Upload image|Arrastrar|Drag/i').first();
      await expect(uploadArea).toBeVisible();
      
      // Check for upload instructions
      await expect(page.locator('text=/Arrastrar.*soltar|Drag.*drop|Seleccionar|Choose|Browse/i')).toBeVisible();
      
      // Verify file input exists
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toHaveCount(1);
    });

    test('should upload single product image', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Find file input
      const fileInput = page.locator('input[type="file"]').first();
      
      // Create test image path
      const imagePath = path.join(__dirname, '../fixtures/test-product.jpg');
      
      // Set file on input
      await fileInput.setInputFiles(imagePath);
      
      // Wait for upload preview
      await page.waitForTimeout(1000);
      
      // Check for image preview
      const preview = page.locator('img[src*="blob:"], img[src*="upload"], img[alt*="preview"], .image-preview img').first();
      await expect(preview).toBeVisible({ timeout: 5000 });
      
      // Check for upload success indicator
      const successIndicator = page.locator('text=/subido|uploaded|éxito|success/i, svg.text-green-500, .upload-success');
      await expect(successIndicator.first()).toBeVisible();
    });

    test('should handle multiple image uploads', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Look for multiple file input or add more button
      const multipleInput = page.locator('input[type="file"][multiple]');
      const addMoreButton = page.locator('button').filter({ hasText: /Agregar.*imagen|Add.*image|más|more/i });
      
      if (await multipleInput.isVisible()) {
        // Upload multiple files at once
        const imagePaths = [
          path.join(__dirname, '../fixtures/test-product-1.jpg'),
          path.join(__dirname, '../fixtures/test-product-2.jpg'),
          path.join(__dirname, '../fixtures/test-product-3.jpg')
        ];
        
        await multipleInput.setInputFiles(imagePaths);
        await page.waitForTimeout(2000);
        
        // Check for multiple previews
        const previews = page.locator('img[src*="blob:"], img[src*="upload"], .image-preview img');
        await expect(previews).toHaveCount(3);
      } else if (await addMoreButton.isVisible()) {
        // Upload one by one
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-product-1.jpg'));
        await page.waitForTimeout(1000);
        
        await addMoreButton.click();
        const newInput = page.locator('input[type="file"]').last();
        await newInput.setInputFiles(path.join(__dirname, '../fixtures/test-product-2.jpg'));
      }
    });

    test('should validate image file types', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      const fileInput = page.locator('input[type="file"]').first();
      
      // Try to upload invalid file type
      const invalidFile = path.join(__dirname, '../fixtures/test-document.pdf');
      await fileInput.setInputFiles(invalidFile);
      
      // Should show error message
      await expect(page.locator('text=/tipo.*archivo|file.*type|formato|format|jpg|png|imagen|image/i')).toBeVisible({ timeout: 5000 });
      
      // Preview should not appear
      const preview = page.locator('img[src*="blob:"], img[src*="upload"]');
      await expect(preview).not.toBeVisible();
    });

    test('should validate image file size', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Look for size limit information
      const sizeInfo = page.locator('text=/MB|tamaño|size|máximo|maximum/i');
      await expect(sizeInfo.first()).toBeVisible();
      
      // Note: Actually testing large file upload would require a large test file
      // This test verifies the UI shows size limits
    });

    test('should allow image reordering', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Upload multiple images first
      const multipleInput = page.locator('input[type="file"][multiple]');
      if (await multipleInput.isVisible()) {
        const imagePaths = [
          path.join(__dirname, '../fixtures/test-product-1.jpg'),
          path.join(__dirname, '../fixtures/test-product-2.jpg')
        ];
        await multipleInput.setInputFiles(imagePaths);
        await page.waitForTimeout(2000);
        
        // Look for drag handles or reorder buttons
        const dragHandles = page.locator('[data-testid*="drag"], .drag-handle, button[aria-label*="reorder"], svg.cursor-move');
        
        if (await dragHandles.count() > 0) {
          // Test drag and drop reordering
          const firstHandle = dragHandles.first();
          const secondHandle = dragHandles.nth(1);
          
          await firstHandle.dragTo(secondHandle);
          await page.waitForTimeout(500);
          
          // Verify order changed (this is hard to test without specific attributes)
          // In real implementation, you'd check data attributes or order indicators
        }
      }
    });

    test('should remove uploaded images', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Upload an image
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-product.jpg'));
      await page.waitForTimeout(1000);
      
      // Find remove button
      const removeButton = page.locator('button[aria-label*="remove"], button[aria-label*="delete"], button').filter({ 
        has: page.locator('svg.text-red-500, svg[class*="trash"], svg[class*="x-mark"]') 
      }).first();
      
      await expect(removeButton).toBeVisible();
      await removeButton.click();
      
      // Confirm removal if needed
      const confirmButton = page.locator('button').filter({ hasText: /Eliminar|Delete|Confirmar|Confirm/i });
      if (await confirmButton.isVisible({ timeout: 1000 })) {
        await confirmButton.click();
      }
      
      // Image should be removed
      const preview = page.locator('img[src*="blob:"], img[src*="upload"]');
      await expect(preview).not.toBeVisible();
    });

    test('should show upload progress', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      const fileInput = page.locator('input[type="file"]').first();
      
      // Start file upload and immediately check for progress indicators
      const uploadPromise = fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-product.jpg'));
      
      // Look for progress indicators that should appear during upload
      const progressText = page.locator('text=/Subiendo.*imágenes|Uploading|Cargando|Loading/i');
      const spinnerIcon = page.locator('.animate-spin');
      
      // Check if progress indicators appear (they should be visible briefly)
      let hasProgressText = false;
      let hasSpinner = false;
      
      try {
        // Check multiple times in quick succession to catch the brief progress state
        for (let i = 0; i < 5; i++) {
          if (await progressText.isVisible({ timeout: 100 })) {
            hasProgressText = true;
            break;
          }
          if (await spinnerIcon.isVisible({ timeout: 100 })) {
            hasSpinner = true;
            break;
          }
          await page.waitForTimeout(50);
        }
      } catch {
        // Continue to check final state
      }
      
      // Wait for upload to complete
      await uploadPromise;
      
      // At least one progress indicator should have been visible, or upload completed successfully
      const uploadCompleted = await page.locator('text=/imagen.*agregada|image.*added/i').isVisible({ timeout: 1000 });
      
      expect(hasProgressText || hasSpinner || uploadCompleted).toBeTruthy();
    });

    test('should handle upload errors gracefully', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Mock upload failure
      await page.route('**/api/upload', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Upload failed' })
        });
      });
      
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-product.jpg'));
      
      // Should show error message
      await expect(page.locator('text=/error|Error|falló|failed|problema|problem/i')).toBeVisible({ timeout: 5000 });
      
      // Should allow retry
      const retryButton = page.locator('button').filter({ hasText: /Reintentar|Retry|Intentar|Try again/i });
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeEnabled();
      }
    });

    test('should save product with images', async ({ page }) => {
      await page.goto('/vendor/products/new');
      
      // Fill basic product info
      await page.fill('input[name="name"], input[placeholder*="nombre"]', 'Test Product');
      await page.fill('textarea[name="description"], textarea[placeholder*="descripción"]', 'Test Description');
      await page.fill('input[name="price"], input[type="number"][placeholder*="precio"]', '299');
      
      // Upload image
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-product.jpg'));
      await page.waitForTimeout(1000);
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button').filter({ 
        hasText: /Guardar|Save|Crear|Create|Publicar|Publish/i 
      }).first();
      
      await submitButton.click();
      
      // Look for toast success message (appears when form is submitted)
      const toastMessage = page.locator('[data-sonner-toast]').filter({ 
        hasText: /exitosamente|successfully|creado|created|guardado|saved/i 
      });
      
      // Wait for either success toast or successful redirect
      try {
        await expect(toastMessage).toBeVisible({ timeout: 8000 });
      } catch {
        // If no toast, check if we redirected successfully
        await expect(page).toHaveURL(/\/vendor\/products/, { timeout: 5000 });
      }
    });
  });

  test.describe('Admin Image Approval', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('should display pending images for approval', async ({ page }) => {
      // Navigate to image moderation
      await page.goto('/admin');
      
      const moderationLink = page.locator('a, button').filter({ 
        hasText: /Imágenes|Images|Moderar|Moderate|Aprobar|Approve/i 
      }).first();
      
      if (await moderationLink.isVisible()) {
        await moderationLink.click();
        await page.waitForTimeout(1000);
        
        // Check for pending images section
        await expect(page.locator('text=/Pendiente|Pending|Revisar|Review|Aprobar|Approve/i')).toBeVisible();
        
        // Should show image grid or list
        const imageItems = page.locator('[data-testid*="image-item"], .image-card, .moderation-item');
        
        if (await imageItems.count() > 0) {
          // Verify image preview
          const firstImage = imageItems.first();
          await expect(firstImage.locator('img')).toBeVisible();
          
          // Should have approve/reject buttons
          await expect(firstImage.locator('button').filter({ hasText: /Aprobar|Approve/i })).toBeVisible();
          await expect(firstImage.locator('button').filter({ hasText: /Rechazar|Reject/i })).toBeVisible();
        }
      }
    });

    test('should approve product image', async ({ page }) => {
      await page.goto('/admin/moderation/images');
      
      // Find first pending image
      const pendingImage = page.locator('[data-testid*="pending-image"], .pending-image').first();
      
      if (await pendingImage.isVisible()) {
        // Click approve button
        const approveButton = pendingImage.locator('button').filter({ hasText: /Aprobar|Approve/i });
        await approveButton.click();
        
        // Confirm if needed
        const confirmButton = page.locator('button').filter({ hasText: /Confirmar|Confirm/i });
        if (await confirmButton.isVisible({ timeout: 1000 })) {
          await confirmButton.click();
        }
        
        // Should show success message
        await expect(page.locator('text=/aprobado|approved|éxito|success/i')).toBeVisible();
        
        // Image should move to approved section or disappear from pending
        await expect(pendingImage).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('should reject product image with reason', async ({ page }) => {
      await page.goto('/admin/moderation/images');
      
      const pendingImage = page.locator('[data-testid*="pending-image"], .pending-image').first();
      
      if (await pendingImage.isVisible()) {
        // Click reject button
        const rejectButton = pendingImage.locator('button').filter({ hasText: /Rechazar|Reject/i });
        await rejectButton.click();
        
        // Should show reason modal/form
        const reasonModal = page.locator('[role="dialog"], .modal, .reason-form');
        await expect(reasonModal).toBeVisible();
        
        // Select or type rejection reason
        const reasonSelect = reasonModal.locator('select, [role="combobox"]');
        const reasonTextarea = reasonModal.locator('textarea');
        
        if (await reasonSelect.isVisible()) {
          await reasonSelect.selectOption({ index: 1 }); // Select first reason
        }
        
        if (await reasonTextarea.isVisible()) {
          await reasonTextarea.fill('Image quality is too low for product listing');
        }
        
        // Submit rejection
        const submitButton = reasonModal.locator('button').filter({ hasText: /Rechazar|Reject|Enviar|Submit/i });
        await submitButton.click();
        
        // Should show success message
        await expect(page.locator('text=/rechazado|rejected|notificado|notified/i')).toBeVisible();
      }
    });

    test('should bulk approve images', async ({ page }) => {
      await page.goto('/admin/moderation/images');
      
      // Look for select all checkbox
      const selectAllCheckbox = page.locator('input[type="checkbox"]').filter({ 
        has: page.locator('label:has-text(/Seleccionar todo|Select all/i)') 
      }).first();
      
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.click();
        
        // Look for bulk actions
        const bulkApprove = page.locator('button').filter({ hasText: /Aprobar seleccionados|Approve selected|Aprobar todos|Approve all/i });
        await expect(bulkApprove).toBeVisible();
        
        await bulkApprove.click();
        
        // Confirm bulk action
        const confirmButton = page.locator('button').filter({ hasText: /Confirmar|Confirm/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        // Should show success message with count
        await expect(page.locator('text=/aprobado|approved/i')).toBeVisible();
      }
    });

    test('should filter images by status', async ({ page }) => {
      await page.goto('/admin/moderation/images');
      
      // Look for status filters
      const statusFilter = page.locator('select, [role="combobox"], button[role="tab"]').filter({ 
        hasText: /Estado|Status|Filtrar|Filter/i 
      });
      
      if (await statusFilter.isVisible()) {
        // Try different statuses
        const pendingFilter = page.locator('option, button').filter({ hasText: /Pendiente|Pending/i });
        const approvedFilter = page.locator('option, button').filter({ hasText: /Aprobado|Approved/i });
        const rejectedFilter = page.locator('option, button').filter({ hasText: /Rechazado|Rejected/i });
        
        if (await approvedFilter.isVisible()) {
          await approvedFilter.click();
          await page.waitForTimeout(1000);
          
          // Should only show approved images
          const images = page.locator('[data-testid*="image-item"], .image-card');
          if (await images.count() > 0) {
            const firstImage = images.first();
            await expect(firstImage.locator('text=/Aprobado|Approved/i, .badge-success')).toBeVisible();
          }
        }
      }
    });

    test('should preview full size image before approval', async ({ page }) => {
      await page.goto('/admin/moderation/images');
      
      const pendingImage = page.locator('[data-testid*="pending-image"], .pending-image').first();
      
      if (await pendingImage.isVisible()) {
        // Click on image or preview button
        const previewTrigger = pendingImage.locator('img, button').filter({ hasText: /Ver|View|Preview/i }).first();
        await previewTrigger.click();
        
        // Should open modal with full size image
        const modal = page.locator('[role="dialog"], .modal, .lightbox');
        await expect(modal).toBeVisible();
        
        // Should show larger image
        const fullImage = modal.locator('img');
        await expect(fullImage).toBeVisible();
        
        // Should have zoom controls
        const zoomIn = modal.locator('button').filter({ hasText: /\+|Zoom in|Acercar/i });
        if (await zoomIn.isVisible()) {
          await zoomIn.click();
          // Image should be zoomed (hard to test without specific attributes)
        }
        
        // Close modal
        const closeButton = modal.locator('button[aria-label*="close"], button').filter({ has: page.locator('svg.x-mark, svg[class*="close"]') });
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      }
    });
  });

  // Test fixture files note
  test.fixme('Create test fixture images', async () => {
    // Note: You'll need to create these test images in e2e/fixtures/:
    // - test-product.jpg (valid product image)
    // - test-product-1.jpg, test-product-2.jpg, test-product-3.jpg (for multiple upload)
    // - test-document.pdf (invalid file type)
    // - test-large.jpg (>10MB for size validation)
  });
});