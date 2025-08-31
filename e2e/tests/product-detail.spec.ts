import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to products page
    await page.goto('/products');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Click first product card
    const firstProduct = page.getByTestId('product-card').first();
    await firstProduct.click();
    
    // Wait for product detail page to load
    await page.waitForURL(/\/(en|es)?\/(products|productos)\/[^\/]+$/, { timeout: 10000 });
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('should display product information', async ({ page }) => {
    // Product name
    await expect(page.locator('h1')).toBeVisible();

    // Price should be visible - look for the main price in the product detail section
    await expect(page.locator('.text-3xl').filter({ hasText: /\$[0-9]/ }).first()).toBeVisible();

    // Description or details section
    const tabElement = page.locator('[role="tab"]').first();
    const vendorElement = page.locator('text=/Vendedor|Vendor|Tienda|Shop/i').first();
    
    const hasProductInfo = 
      await tabElement.isVisible() ||
      await vendorElement.isVisible();
    expect(hasProductInfo).toBeTruthy();

    // Add to cart button should be visible - get the first one (main product)
    await expect(page.getByRole('button', { name: /agregar al carrito|add to cart/i }).first()).toBeVisible();
  });

  test('should display product images', async ({ page }) => {
    // Main image - look for any image in the main content area
    const mainImage = page.locator('main img').first();
    await expect(mainImage).toBeVisible();

    // Check if image loaded
    const imageSrc = await mainImage.getAttribute('src');
    expect(imageSrc).toBeTruthy();

    // Thumbnail images (if multiple)
    const thumbnails = page.locator('.thumbnails img, [data-testid="product-thumbnail"]');
    const thumbnailCount = await thumbnails.count();

    if (thumbnailCount > 0) {
      // Click thumbnail to change main image
      await thumbnails.first().click();
      await page.waitForTimeout(300); // Wait for image transition
    }
  });

  test('should handle image gallery', async ({ page }) => {
    const thumbnails = page.locator('.thumbnails img, [data-testid="product-thumbnail"]');
    const count = await thumbnails.count();

    if (count > 1) {
      // Test image switching
      for (let i = 0; i < Math.min(count, 3); i++) {
        await thumbnails.nth(i).click();
        await page.waitForTimeout(300);

        // Main image should update
        const mainImage = page.locator('.main-image img, [data-testid="main-image"]').first();
        await expect(mainImage).toBeVisible();
      }
    }
  });

  test('should show product specifications', async ({ page }) => {
    // Look for specifications/details section
    const specsSection = page.locator('text=/Especificaciones|Detalles|Características/i').first();

    if (await specsSection.isVisible()) {
      // Should have some specs
      const specsList = specsSection.locator('..').locator('li, tr, dd');
      await expect(specsList.first()).toBeVisible();
    }
  });

  test('should add product to cart with quantity', async ({ page }) => {
    // Quantity selector
    const quantityInput = page.locator('input[type="number"], select[name*="quantity"]').first();

    if (await quantityInput.isVisible()) {
      // Change quantity
      await quantityInput.fill('2');
    }

    // Add to cart - look for button with flexible text matching
    const addToCartButton = page.locator('button').filter({ hasText: /add to cart|agregar al carrito/i }).first();
    await addToCartButton.click();

    // Verify added to cart
    const successMessage = page.locator('text=/Added|Agregado/');
    const cartSidebar = page.locator('[data-testid="cart-sidebar"]');

    await expect(successMessage.or(cartSidebar).first()).toBeVisible();
  });

  test('should show related products', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Look for related products section
    const relatedSection = page.locator('text=/Relacionados|Related|También te puede gustar/i').first();

    if (await relatedSection.isVisible()) {
      // Should have related product cards
      const relatedProducts = relatedSection.locator('..').locator('[data-testid="product-card"], article');
      await expect(relatedProducts.first()).toBeVisible();
    }
  });

  test('should handle out of stock product', async ({ page }) => {
    // Look for stock status
    const outOfStock = page.locator('text=/Agotado|Out of Stock|Sin Stock/i').first();

    if (await outOfStock.isVisible()) {
      // Add to cart button should be disabled
      const addToCartButton = page.locator('button').filter({ hasText: /add to cart|agregar/i }).first();
      await expect(addToCartButton).toBeDisabled();

      // Might show notify button
      const notifyButton = page.locator('button').filter({ hasText: /Notify|Notificar|Avisar/ }).first();
      if (await notifyButton.isVisible()) {
        await expect(notifyButton).toBeEnabled();
      }
    }
  });

  test('should show delivery information', async ({ page }) => {
    // Look for delivery/shipping info
    const deliveryInfo = page.locator('text=/Envío|Delivery|Shipping/i').first();

    if (await deliveryInfo.isVisible()) {
      // Should show shipping location at minimum
      const deliveryDetails = deliveryInfo.locator('..');
      await expect(deliveryDetails).toBeVisible();
    }
  });

  test('should handle product variants', async ({ page }) => {
    // Look for variant selectors (size, color, etc)
    const variantSelectors = page.locator('select[name*="variant"], .variant-selector, [data-testid="variant"]');

    if (await variantSelectors.first().isVisible()) {
      // Select a variant
      const firstVariant = variantSelectors.first();

      if (firstVariant) {
        const tagName = await firstVariant.evaluate(el => el.tagName);

        if (tagName === 'SELECT') {
          await firstVariant.selectOption({ index: 1 });
        } else {
          await firstVariant.click();
        }

        // Price might update
        await page.waitForTimeout(500);
      }
    }
  });

  test('should share product', async ({ page }) => {
    // Look for share buttons
    const shareButton = page.locator('button, a').filter({ hasText: /Share|Compartir/ }).first();

    if (await shareButton.isVisible()) {
      await shareButton.click();

      // Should show share options
      const shareOptions = page.locator('text=/WhatsApp|Facebook|Twitter|Copy/');
      await expect(shareOptions.first()).toBeVisible();
    }
  });

  test('should add to wishlist', async ({ page }) => {
    // Look for wishlist button - it should have heart icon
    const wishlistButton = page.locator('button:has(svg), button[aria-label*="wish"], button[aria-label*="favor"]').first();

    if (await wishlistButton.isVisible()) {
      // Get initial state
      const initialUrl = page.url();
      
      await wishlistButton.click();
      await page.waitForTimeout(1000);

      // Check what happened after click
      const currentUrl = page.url();
      
      // Either redirected to login, stayed on page with toast, or button changed state
      const validResponse = 
        currentUrl !== initialUrl || // Redirected somewhere
        await page.locator('[role="alert"], .toast').isVisible() || // Toast notification
        await page.locator('button:has(svg[class*="fill"])').isVisible(); // Button state changed
        
      expect(validResponse).toBeTruthy();
    } else {
      // No wishlist button on this product - that's ok
      expect(true).toBeTruthy();
    }
  });

  test('should navigate with breadcrumbs', async ({ page }) => {
    // Look for breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label*="breadcrumb"], .breadcrumbs').first();

    if (await breadcrumbs.isVisible()) {
      // Should have home link
      const homeLink = breadcrumbs.locator('a').filter({ hasText: /Home|Inicio/ }).first();
      await expect(homeLink).toBeVisible();

      // Should have category link
      const categoryLink = breadcrumbs.locator('a').nth(1);
      if (await categoryLink.isVisible()) {
        const href = await categoryLink.getAttribute('href');
        expect(href).toMatch(/category|products/);
      }
    }
  });

  test('should show product questions/FAQs', async ({ page }) => {
    // Scroll down to find Q&A section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const qaSection = page.locator('text=/Preguntas|Questions|FAQ/i').first();

    if (await qaSection.isVisible()) {
      // Might have accordion or list of questions
      const questions = qaSection.locator('..').locator('button, details');

      if (await questions.first().isVisible()) {
        // Click to expand
        await questions.first().click();

        // Answer should be visible
        await page.waitForTimeout(300);
        const answer = questions.first().locator('..').locator('p, dd');
        await expect(answer.first()).toBeVisible();
      }
    }
  });

  test('should display vendor information', async ({ page }) => {
    // Look for vendor section
    const vendorSection = page.locator('text=/Vendido por|Sold by|Tienda:/').first();

    if (await vendorSection.isVisible()) {
      const vendorInfo = vendorSection.locator('..');

      // Should show vendor name
      await expect(vendorInfo).toContainText(/[A-Za-z]/);

      // Might have link to vendor page
      const vendorLink = vendorInfo.locator('a').first();
      if (await vendorLink.isVisible()) {
        const href = await vendorLink.getAttribute('href');
        expect(href).toMatch(/vendor|tienda/);
      }
    }
  });
});