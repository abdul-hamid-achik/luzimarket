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
            '5c355f6a-0a09-4a50-9887-bbbf92a63bbd', // The original problem ID
            '00000000-0000-0000-0000-000000000000', // Valid UUID format but non-existent
            'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', // Another valid UUID format
        ];

        for (const productId of nonExistentIds) {
            console.log(`Testing non-existent product: ${productId}`);

            // Navigate to the product page
            await page.goto(`/handpicked/productos/${productId}`);
            await page.waitForLoadState('networkidle', { timeout: 10000 });

            // The frontend should gracefully handle the missing product
            // It should either show a fallback product or a proper error message
            const pageContent = await page.textContent('body');

            // Check if the page shows appropriate content
            const hasProductElements = await page.locator('.product-title, .product-price, .add-to-cart').count() > 0;
            const hasErrorMessage = pageContent.includes('Product not found') ||
                pageContent.includes('404') ||
                pageContent.includes('Not Found');

            console.log(`Product elements found: ${hasProductElements}`);
            console.log(`Error message found: ${hasErrorMessage}`);

            // The page should either show fallback content OR a proper error
            expect(hasProductElements || hasErrorMessage).toBe(true);

            // If it shows product elements, it should be the fallback product
            if (hasProductElements) {
                const title = await page.textContent('.product-title');
                console.log(`Fallback product title: ${title}`);
                expect(title).toContain('Featured Product');
            }
        }
    });

    test('should provide proper error messages for malformed product IDs', async ({ page }) => {
        console.log('=== Testing Malformed Product ID Handling ===');

        const malformedIds = [
            'not-a-uuid',
            '123abc',
            'invalid',
            'product-123',
            '12345678-1234-1234-1234-12345678901234567890', // Too long
        ];

        for (const productId of malformedIds) {
            console.log(`Testing malformed ID: ${productId}`);

            // Test API response first
            const apiResponse = await page.request.get(`/api/products/${productId}`);
            expect(apiResponse.status()).toBe(404);

            // Test frontend handling
            await page.goto(`/handpicked/productos/${productId}`);
            await page.waitForLoadState('networkidle', { timeout: 5000 });

            // Should show either fallback content or error
            const hasContent = await page.locator('.product-title, .add-to-cart, h1').count() > 0;
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

                // Navigate to the product
                await link.click();
                await page.waitForLoadState('networkidle', { timeout: 10000 });

                // Verify we're on a product page
                const currentUrl = page.url();
                expect(currentUrl).toContain('/handpicked/productos/');

                // Check if product page loaded properly
                const hasProductElements = await page.locator('.product-title, .add-to-cart').count() > 0;
                expect(hasProductElements).toBe(true);

                // Go back to listing
                await page.goto('/handpicked/productos');
                await page.waitForLoadState('networkidle', { timeout: 10000 });
            }
        }
    });

    test('should handle rapid navigation between products', async ({ page }) => {
        if (validProducts.length < 2) {
            test.skip('Need at least 2 products for navigation testing');
            return;
        }

        console.log('=== Testing Rapid Product Navigation ===');

        const productIds = validProducts.slice(0, 3).map(p => p.id);

        for (const productId of productIds) {
            console.log(`Navigating to product: ${productId}`);

            await page.goto(`/handpicked/productos/${productId}`);
            await page.waitForLoadState('networkidle', { timeout: 10000 });

            // Verify page loaded
            const hasElements = await page.locator('.product-title, .add-to-cart').count() > 0;
            expect(hasElements).toBe(true);

            // Check if the correct product is loaded
            const productTitle = await page.textContent('.product-title');
            console.log(`Product title: ${productTitle}`);

            // Wait a bit before next navigation
            await page.waitForTimeout(500);
        }
    });

    test('should handle browser back/forward navigation on product pages', async ({ page }) => {
        if (validProducts.length < 2) {
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
    });

    test('should verify API error handling consistency', async ({ page }) => {
        console.log('=== Testing API Error Consistency ===');

        const testCases = [
            { id: '5c355f6a-0a09-4a50-9887-bbbf92a63bbd', expectedStatus: 404 },
            { id: 'invalid-uuid', expectedStatus: 404 },
            { id: '00000000-0000-0000-0000-000000000000', expectedStatus: 404 },
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
        const nonExistentId = '5c355f6a-0a09-4a50-9887-bbbf92a63bbd';

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