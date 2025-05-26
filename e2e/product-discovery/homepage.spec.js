const { test, expect } = require('@playwright/test');

test.describe('Homepage Public View', () => {
  test('should display luxury hero carousel and best sellers carousel', async ({ page }) => {
    await page.goto('/');

    // Check luxury hero carousel is visible
    const heroCarousel = page.locator('.luxury-hero-carousel');
    await expect(heroCarousel).toBeVisible();

    // Check if slides are loaded (either actual slides or placeholder)
    const slideContent = page.locator('.slide-content, .placeholder-content');
    await expect(slideContent.first()).toBeVisible({ timeout: 10000 });

    // If slides are loaded, check navigation elements
    const slides = await page.locator('.slide-wrapper').count();
    if (slides > 1) {
      await expect(page.locator('.carousel-nav-prev')).toBeVisible();
      await expect(page.locator('.carousel-nav-next')).toBeVisible();
      await expect(page.locator('.carousel-indicators')).toBeVisible();
    }

    // Check luxury best sellers carousel
    const bestSellersSection = page.locator('.luxury-bestsellers-section');
    await expect(bestSellersSection).toBeVisible();

    // Check section header
    await expect(page.locator('.section-title')).toBeVisible();
    await expect(page.locator('.section-subtitle')).toBeVisible();

    // Check if products are loaded or loading state is shown
    const productCards = page.locator('.product-card');
    const loadingState = page.locator('.carousel-loading');
    const emptyState = page.locator('text="Próximamente productos increíbles"');

    // Should have either products, loading state, or empty state
    const hasProducts = await productCards.count() > 0;
    const hasLoading = await loadingState.count() > 0;
    const hasEmpty = await emptyState.count() > 0;

    expect(hasProducts || hasLoading || hasEmpty).toBe(true);

    // If products are visible, check their structure
    if (hasProducts) {
      const firstProductCard = productCards.first();
      await expect(firstProductCard).toBeVisible();

      // Check product rank badge
      await expect(page.locator('.product-rank').first()).toBeVisible();

      // Check "Ver Todos" link
      await expect(page.locator('a.view-all-btn:has-text("Ver Todos")')).toBeVisible();
    }
  });

  test('should handle hero carousel interactions', async ({ page }) => {
    await page.goto('/');

    const heroCarousel = page.locator('.luxury-hero-carousel');
    await expect(heroCarousel).toBeVisible();

    // Check if we have multiple slides
    const indicators = page.locator('.indicator');
    const indicatorCount = await indicators.count();

    if (indicatorCount > 1) {
      // Test clicking indicators
      await indicators.nth(1).click();
      await page.waitForTimeout(500); // Wait for transition

      // Test navigation arrows (specifically for hero carousel)
      const nextButton = page.locator('[data-testid="hero-carousel-next"]');
      const prevButton = page.locator('[data-testid="hero-carousel-prev"]');

      if (await nextButton.count() > 0) {
        await expect(nextButton).toBeVisible();
        await nextButton.click();
        await page.waitForTimeout(500);
      }

      if (await prevButton.count() > 0) {
        await expect(prevButton).toBeVisible();
        await prevButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should handle best sellers carousel interactions', async ({ page }) => {
    await page.goto('/');

    const bestSellersCarousel = page.locator('.luxury-bestsellers-section');
    await expect(bestSellersCarousel).toBeVisible();

    // Check if products are loaded
    const productCards = page.locator('.product-card');
    const productCount = await productCards.count();

    if (productCount > 4) { // More than visible cards
      // Test navigation arrows - using specific data-testid
      const nextButton = page.locator('[data-testid="bestsellers-carousel-next"]');
      const prevButton = page.locator('[data-testid="bestsellers-carousel-prev"]');

      if (await nextButton.count() > 0) {
        await expect(nextButton).toBeVisible();
        await nextButton.click();
        await page.waitForTimeout(500);

        // Check if prev button becomes enabled
        await expect(prevButton).toBeVisible();
        await prevButton.click();
        await page.waitForTimeout(500);
      }

      // Test pagination dots
      const paginationDots = page.locator('.pagination-dot');
      const dotCount = await paginationDots.count();

      if (dotCount > 1) {
        await paginationDots.nth(1).click();
        await page.waitForTimeout(500);
      }
    }

    // Test "Ver Todos" link
    const viewAllButton = page.locator('a.view-all-btn:has-text("Ver Todos")');
    if (await viewAllButton.count() > 0) {
      await expect(viewAllButton).toHaveAttribute('href', '/best-sellers');
    }
  });

  test('should navigate to product details from best sellers', async ({ page }) => {
    await page.goto('/');

    const productCards = page.locator('.product-card');
    const productCount = await productCards.count();

    if (productCount > 0) {
      // Click on first product
      const firstProduct = productCards.first();
      const productLink = firstProduct.locator('a').first();

      await productLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to product detail page
      expect(page.url()).toContain('/handpicked/productos/');
      expect(page.url()).not.toBe('/handpicked/productos');
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1200, height: 800, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Hero carousel should be visible and responsive
      const heroCarousel = page.locator('.luxury-hero-carousel');
      await expect(heroCarousel).toBeVisible();

      // Best sellers section should be visible
      const bestSellersSection = page.locator('.luxury-bestsellers-section');
      await expect(bestSellersSection).toBeVisible();

      // Check that content doesn't overflow
      const body = await page.locator('body').boundingBox();
      if (body) {
        expect(body.width).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin
      }

      console.log(`✅ ${viewport.name} viewport (${viewport.width}x${viewport.height}) looks good`);
    }
  });
});