import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Homepage should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    });
    expect((metrics as any).loadEventEnd - (metrics as any).loadEventStart).toBeLessThan(3000);

    const metrics2 = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries.find(e => e.name === 'first-contentful-paint');
          const lcp = entries.find(e => e.entryType === 'largest-contentful-paint');
          
          resolve({
            fcp: fcp?.startTime,
            lcp: lcp?.startTime
          });
        });
        
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Fallback after 5 seconds
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    // FCP should be under 1.8s (good)
    if (metrics2.fcp) {
      expect(metrics2.fcp).toBeLessThan(1800);
    }
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/products');
    
    // Get all images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    // Check that images have loading="lazy" or equivalent
    let lazyLoadedCount = 0;
    
    for (let i = 0; i < imageCount; i++) {
      const loading = await images.nth(i).getAttribute('loading');
      const dataSrc = await images.nth(i).getAttribute('data-src');
      
      if (loading === 'lazy' || dataSrc) {
        lazyLoadedCount++;
      }
    }
    
    // Most images should be lazy loaded (except above fold)
    expect(lazyLoadedCount).toBeGreaterThan(imageCount * 0.5);
  });

  test('should handle pagination efficiently', async ({ page }) => {
    await page.goto('/products');
    
    // Measure initial load
    const firstPageMetrics = await page.evaluate(() => performance.now());
    
    // Go to next page
    const nextButton = page.locator('button, a').filter({ hasText: /Next|Siguiente|2/ }).first();
    
    if (await nextButton.isVisible()) {
      const beforeClick = Date.now();
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      const afterClick = Date.now();
      
      // Pagination should be fast (under 1 second)
      expect(afterClick - beforeClick).toBeLessThan(1000);
      
      // Should not reload entire page (check if it's client-side routing)
      const isClientSideRouting = await page.evaluate(() => {
        return window.performance.navigation.type === 0;
      });
      
      // Prefer client-side routing for better performance
      expect(isClientSideRouting).toBeTruthy();
    }
  });

  test('should optimize bundle size', async ({ page }) => {
    const resources: { url: string; size: number }[] = [];
    
    page.on('response', response => {
      const url = response.url();
      const headers = response.headers();
      const contentLength = headers['content-length'];
      
      if (url.includes('.js') || url.includes('.css')) {
        resources.push({
          url,
          size: contentLength ? parseInt(contentLength) : 0
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check JavaScript bundle sizes
    const jsBundles = resources.filter(r => r.url.includes('.js'));
    const totalJsSize = jsBundles.reduce((sum, bundle) => sum + bundle.size, 0);
    
    // Total JS should be under 500KB (compressed)
    expect(totalJsSize).toBeLessThan(500 * 1024);
    
    // Check for code splitting
    const hasMultipleBundles = jsBundles.length > 3;
    expect(hasMultipleBundles).toBeTruthy();
  });

  test('should cache static assets', async ({ page }) => {
    // First visit
    await page.goto('/');
    
    // Collect cached resources
    const cachedResources: string[] = [];
    
    page.on('response', response => {
      const headers = response.headers();
      if (headers['cache-control'] && headers['cache-control'].includes('max-age')) {
        cachedResources.push(response.url());
      }
    });
    
    // Navigate to another page
    await page.goto('/products');
    
    // Static assets should be cached
    expect(cachedResources.length).toBeGreaterThan(0);
    
    // Check that images, CSS, and JS have cache headers
    const hasCachedImages = cachedResources.some(url => url.match(/\.(png|jpg|jpeg|webp)/));
    const hasCachedCSS = cachedResources.some(url => url.includes('.css'));
    const hasCachedJS = cachedResources.some(url => url.includes('.js'));
    
    expect(hasCachedImages || hasCachedCSS || hasCachedJS).toBeTruthy();
  });

  test('should minimize layout shifts', async ({ page }) => {
    await page.goto('/');
    
    // Measure Cumulative Layout Shift
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = performance.getEntriesByType('layout-shift');
          clsValue = entries.filter((entry: any) => !entry.hadRecentInput).reduce((sum: number, entry: any) => {
            return sum + entry.value;
          }, 0);
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        // Measure for 3 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });
    
    // CLS should be under 0.1 (good)
    expect(cls).toBeLessThan(0.1);
  });

  test('should handle slow network gracefully', async ({ page, context }) => {
    // Simulate slow 3G
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
      await route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should show loading indicators
    const loadingIndicator = page.locator('.loading, .skeleton, [aria-busy="true"]').first();
    
    // Even on slow network, initial content should appear quickly
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });

  test('should optimize API calls', async ({ page }) => {
    const apiCalls: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });
    
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Check for duplicate API calls
    const uniqueApiCalls = [...new Set(apiCalls)];
    
    // Should not have many duplicate calls
    expect(apiCalls.length).toBeLessThanOrEqual(uniqueApiCalls.length * 1.2);
    
    // Should batch requests where possible
    const simultaneousCalls = apiCalls.filter((call, index) => 
      index > 0 && apiCalls[index - 1] === call
    );
    
    expect(simultaneousCalls.length).toBe(0);
  });

  test('should preload critical resources', async ({ page }) => {
    const response = await page.goto('/');
    const html = await response!.text();
    
    // Check for preload/prefetch hints
    const hasPreloadFonts = html.includes('rel="preload"') && html.includes('font');
    const hasPreloadCSS = html.includes('rel="preload"') && html.includes('.css');
    const hasDNSPrefetch = html.includes('rel="dns-prefetch"');
    
    // Should preload critical resources
    expect(hasPreloadFonts || hasPreloadCSS || hasDNSPrefetch).toBeTruthy();
  });

  test('should implement infinite scroll efficiently', async ({ page }) => {
    await page.goto('/products');
    
    // Check if infinite scroll is implemented
    const loadMoreButton = page.locator('button').filter({ hasText: /Load More|Cargar más/ });
    const hasInfiniteScroll = !(await loadMoreButton.isVisible());
    
    if (hasInfiniteScroll) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for new products
      const initialProductCount = await page.locator('[data-testid="product-card"]').count();
      await page.waitForTimeout(2000);
      const newProductCount = await page.locator('[data-testid="product-card"]').count();
      
      // Should load more products
      if (newProductCount > initialProductCount) {
        // Check that it doesn't load too many at once
        const difference = newProductCount - initialProductCount;
        expect(difference).toBeLessThanOrEqual(24); // Reasonable batch size
      }
    }
  });

  test('should optimize search functionality', async ({ page }) => {
    await page.goto('/');
    
    // Use the first visible search input (desktop version)
    const searchInput = page.locator('input[id="search-input"]').first();
    await expect(searchInput).toBeVisible();
    
    // Type slowly to test debouncing
    const searchTerm = 'flores';
    let requestCount = 0;
    
    page.on('request', request => {
      if (request.url().includes('search')) {
        requestCount++;
      }
    });
    
    // Type each character with delay
    for (const char of searchTerm) {
      await searchInput.type(char);
      await page.waitForTimeout(100);
    }
    
    await page.waitForTimeout(500);
    
    // Should debounce requests (not one per character)
    expect(requestCount).toBeLessThan(searchTerm.length);
  });

  test('should handle large product lists', async ({ page }) => {
    // Navigate to category with many products
    await page.goto('/category/flores-arreglos');
    
    // Check rendering performance
    const renderTime = await page.evaluate(() => {
      const start = performance.now();
      // Force reflow
      document.body.offsetHeight;
      return performance.now() - start;
    });
    
    // Rendering should be fast
    expect(renderTime).toBeLessThan(100);
    
    // Check if virtualization is used for very long lists
    const visibleProducts = await page.locator('[data-testid="product-card"]:visible').count();
    const allProducts = await page.locator('[data-testid="product-card"]').count();
    
    // If there are many products, some might be virtualized
    if (allProducts > 50) {
      console.log(`Visible products: ${visibleProducts}, Total: ${allProducts}`);
    }
  });
});