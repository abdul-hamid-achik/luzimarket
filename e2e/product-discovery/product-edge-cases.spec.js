const { test, expect } = require('@playwright/test');

test.setTimeout(120000);

test.describe('Product Edge Cases and Error Handling', () => {
    let validProducts = [];

    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            const response = await page.request.get('/api/products');
            if (response.ok()) {
                validProducts = await response.json();
            }
        } catch (error) {
            console.log(`Error fetching products: ${error.message}`);
        }

        await context.close();
    });

    test('should handle non-existent product IDs gracefully', async ({ page }) => {
        console.log('=== Testing Non-Existent Product Handling ===');

        const nonExistentIds = [
            'lm_prod_5c355f6a0a094a509887bbbf92a63bbd', // Valid prefixed format but non-existent
            'lm_prod_00000000000000000000000000000000', // Valid prefixed format but non-existent
            'lm_prod_aaaaaaaaaabbbbccccddddeeeeeeeeeeee', // Another valid prefixed format
        ];

        for (const productId of nonExistentIds) {
            console.log(`Testing non-existent product: ${productId}`);

            // Navigate to the product page
            await page.goto(`/handpicked/productos/${productId}`);
            await page.waitForLoadState('networkidle', { timeout: 10000 });

            // The frontend should gracefully handle the missing product
            // It should either show a fallback product or a proper error message
            const pageContent = await page.textContent('body');

            // Check for the actual error page elements that exist in the frontend
            const hasErrorPage = await page.locator('.error-title, .error-content, .modern-error-container').count() > 0;
            const hasProductElements = await page.locator('.product-title, .add-to-cart-btn').count() > 0;

            // Check for error text content
            const hasErrorMessage = pageContent.includes('Product Not Found') ||
                pageContent.includes('404') ||
                pageContent.includes('Not Found') ||
                pageContent.includes('doesn\'t exist') ||
                pageContent.includes('removed from our catalog');

            console.log(`Product elements found: ${hasProductElements}`);
            console.log(`Error page found: ${hasErrorPage}`);
            console.log(`Error message found: ${hasErrorMessage}`);

            // The page should either show a product OR an error page
            expect(hasProductElements || hasErrorPage || hasErrorMessage).toBe(true);

            // If it shows an error page, verify it has the expected elements
            if (hasErrorPage) {
                // Should have error title
                const errorTitle = await page.locator('.error-title').count() > 0;
                expect(errorTitle).toBe(true);

                // Should have navigation buttons
                const hasNavigationButtons = await page.locator('.btn-modern, .error-actions a').count() > 0;
                expect(hasNavigationButtons).toBe(true);

                console.log('✅ Error page correctly displayed');
            }

            // If it shows product elements, it should be a fallback product
            if (hasProductElements) {
                console.log('✅ Fallback product displayed');
            }

            // Verify the page loads some content (not completely blank)
            const hasContent = await page.locator('h1, .error-title, .product-title, .container').count() > 0;
            expect(hasContent).toBe(true);
        }
    });

    test('should provide proper error messages for malformed product IDs', async ({ page }) => {
        console.log('=== Testing Malformed Product ID Handling ===');

        const malformedIds = [
            'not-a-uuid',
            '123abc',
            'invalid',
            'product-123',
            'lm_prod_12345678123412341234123456789012345', // Too long
            'lm_invalid_123456781234123412341234567890123', // Invalid pattern
            '5c355f6a-0a09-4a50-9887-bbbf92a63bbd', // Legacy UUID format (should be handled gracefully)
        ];

        for (const productId of malformedIds) {
            console.log(`Testing malformed ID: ${productId}`);

            // Test API response first
            const apiResponse = await page.request.get(`/api/products/${productId}`);
            expect(apiResponse.status()).toBe(404);

            // Test frontend handling
            await page.goto(`/handpicked/productos/${productId}`);

            // Use more flexible waiting approach
            try {
                await page.waitForLoadState('networkidle', { timeout: 10000 });
            } catch (error) {
                console.log(`Network idle timeout for ${productId}, continuing with test...`);
                // Continue with test even if networkidle times out
            }

            // Wait for either product elements or 404 page to appear
            try {
                await page.waitForSelector('.product-title, .error-title, h1:has-text("404"), .modern-error-container', { timeout: 5000 });
            } catch (error) {
                console.log(`No specific elements found for ${productId}, checking general content...`);
            }

            // Check for the actual error page elements that exist in the frontend
            const hasErrorPage = await page.locator('.error-title, .error-content, .modern-error-container, h1:has-text("404")').count() > 0;
            const hasProductElements = await page.locator('.product-title, .add-to-cart-btn').count() > 0;

            // Check for error text content
            const pageContent = await page.textContent('body');
            const hasErrorMessage = pageContent.includes('Product Not Found') ||
                pageContent.includes('404') ||
                pageContent.includes('Not Found') ||
                pageContent.includes('doesn\'t exist') ||
                pageContent.includes('removed from our catalog');

            // Should show either error page or fallback content
            expect(hasErrorPage || hasProductElements || hasErrorMessage).toBe(true);

            // Verify the page loads some content (not completely blank)
            const hasContent = await page.locator('h1, .error-title, .product-title, .container').count() > 0;
            expect(hasContent).toBe(true);
        }
    });

    test('should test product links from product listing page', async ({ page }) => {
        if (validProducts.length === 0) {
            test.skip('No products available for testing');
            return;
        }

        console.log('=== Testing Product Links Navigation ===');

        // Go to products listing page
        await page.goto('/handpicked/productos');
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        // Find all product links
        const productLinks = await page.locator('a[href*="/handpicked/productos/"]').all();
        console.log(`Found ${productLinks.length} product links`);

        if (productLinks.length > 0) {
            // Test first few product links
            const linksToTest = Math.min(3, productLinks.length);

            for (let i = 0; i < linksToTest; i++) {
                const link = productLinks[i];
                const href = await link.getAttribute('href');
                console.log(`Testing product link: ${href}`);

                await link.click();
                await page.waitForLoadState('networkidle');

                // Wait for loading state to complete
                await page.waitForFunction(() => {
                    const loadingContainer = document.querySelector('.modern-loading-container');
                    return !loadingContainer;
                }, { timeout: 10000 });

                // Check if product page loaded properly (correct selectors for our enhanced design)
                const hasProductElements = await page.locator('.product-title, .add-to-cart-btn, .price-value, .product-description').count() > 0;
                expect(hasProductElements).toBe(true);

                // Go back to listing
                await page.goto('/handpicked/productos');
                await page.waitForLoadState('networkidle', { timeout: 10000 });
            }
        }
    });

    test('should handle rapid navigation between products', async ({ page }) => {
        if (!Array.isArray(validProducts) || validProducts.length < 2) {
            test.skip('Need at least 2 products for navigation testing');
            return;
        }

        console.log('=== Testing Rapid Product Navigation ===');

        const productIds = validProducts.slice(0, 3).map(p => p.id);

        for (const productId of productIds) {
            console.log(`Navigating to product: ${productId}`);

            await page.goto(`/handpicked/productos/${productId}`);
            await page.waitForLoadState('networkidle', { timeout: 10000 });

            // Verify page loaded - should show either product or error page
            const hasProductElements = await page.locator('.product-title, .add-to-cart-btn').count() > 0;
            const hasErrorPage = await page.locator('.error-title, .error-content').count() > 0;
            expect(hasProductElements || hasErrorPage).toBe(true);

            // If it's a product page, log the title
            if (hasProductElements) {
                const productTitle = await page.textContent('.product-title');
                console.log(`Product title: ${productTitle}`);
            } else {
                console.log('Error page displayed for product:', productId);
            }

            // Wait a bit before next navigation
            await page.waitForTimeout(500);
        }
    });

    test('should handle browser back/forward navigation on product pages', async ({ page }) => {
        if (!Array.isArray(validProducts) || validProducts.length < 2) {
            test.skip('Need at least 2 products for navigation testing');
            return;
        }

        console.log('=== Testing Browser Navigation ===');

        const [product1, product2] = validProducts.slice(0, 2);

        // Navigate to first product
        await page.goto(`/handpicked/productos/${product1.id}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const title1 = await page.textContent('.product-title');
        console.log(`First product: ${title1}`);

        // Navigate to second product
        await page.goto(`/handpicked/productos/${product2.id}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const title2 = await page.textContent('.product-title');
        console.log(`Second product: ${title2}`);

        // Go back
        await page.goBack();
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const titleBack = await page.textContent('.product-title');
        console.log(`After going back: ${titleBack}`);

        // Should be back to first product (or fallback with same ID)
        expect(page.url()).toContain(product1.id);

        // Go forward
        await page.goForward();
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const titleForward = await page.textContent('.product-title');
        console.log(`After going forward: ${titleForward}`);

        // Should be at second product
        expect(page.url()).toContain(product2.id);

        // Should still render something
        const hasContent = await page.locator('h1, .product-title, .container').count() > 0;
        expect(hasContent).toBe(true);
    });

    test('should verify API error handling consistency', async ({ page }) => {
        console.log('=== Testing API Error Consistency ===');

        const testCases = [
            { id: 'lm_prod_5c355f6a0a094a509887bbbf92a63bbd', expectedStatus: 404 },
            { id: 'invalid-uuid', expectedStatus: 404 },
            { id: 'lm_prod_00000000000000000000000000000000', expectedStatus: 404 },
            { id: '5c355f6a-0a09-4a50-9887-bbbf92a63bbd', expectedStatus: 404 }, // Legacy UUID
        ];

        for (const testCase of testCases) {
            console.log(`Testing API error for: ${testCase.id}`);

            const response = await page.request.get(`/api/products/${testCase.id}`);
            expect(response.status()).toBe(testCase.expectedStatus);

            if (response.status() === 404) {
                const errorData = await response.json();
                expect(errorData).toHaveProperty('error');
                console.log(`Error message: ${errorData.error}`);
            }
        }
    });

    test('should test product page performance with missing products', async ({ page }) => {
        console.log('=== Testing Performance with Missing Products ===');

        // Monitor page load times for non-existent products
        const nonExistentId = 'lm_prod_5c355f6a0a094a509887bbbf92a63bbd';

        const startTime = Date.now();
        await page.goto(`/handpicked/productos/${nonExistentId}`);
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        const loadTime = Date.now() - startTime;

        console.log(`Page load time for non-existent product: ${loadTime}ms`);

        // Should load reasonably fast even with missing product
        expect(loadTime).toBeLessThan(10000); // 10 seconds max

        // Should still render something
        const hasContent = await page.locator('h1, .product-title, .container').count() > 0;
        expect(hasContent).toBe(true);
    });
}); 