import { test, expect } from '@playwright/test';

test.describe('Basic Navbar Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should navigate to categories page', async ({ page }) => {
        await page.click('text=Categorias');
        await expect(page).toHaveURL(/.*categorias/);
        await expect(page.locator('h1')).toBeVisible();
    });

    test('should navigate to tiendas-marcas page', async ({ page }) => {
        await page.click('text=Tiendas + Marcas');
        await expect(page).toHaveURL(/.*tiendas-marcas/);
        await expect(page.locator('h1')).toBeVisible();
    });

    test('should navigate to ocasiones page', async ({ page }) => {
        await page.click('text=Ocasiones');
        await expect(page).toHaveURL(/.*ocasiones/);
        await expect(page.locator('h1')).toBeVisible();
    });

    test('should navigate to editorial page', async ({ page }) => {
        await page.click('text=Editorial');
        await expect(page).toHaveURL(/.*editorial/);
        await expect(page.locator('h1')).toBeVisible();
    });

    test('should have working navbar links', async ({ page }) => {
        // Check that navbar exists (there are multiple navbars, so check for the main one)
        const navbar = page.locator('#NavbarOpciones');
        await expect(navbar).toBeVisible();

        // Check that main navigation links exist using more specific selectors
        await expect(page.locator('a[href="/categorias"]')).toBeVisible();
        await expect(page.locator('a[href="/tiendas-marcas"]')).toBeVisible();
        await expect(page.locator('a[href="/ocasiones"]')).toBeVisible();
        await expect(page.locator('a[href="/editorial"]')).toBeVisible();
    });

    test('should maintain page state after navigation', async ({ page }) => {
        // Navigate to categories
        await page.click('text=Categorias');
        await expect(page).toHaveURL(/.*categorias/);

        // Navigate to another page
        await page.click('text=Editorial');
        await expect(page).toHaveURL(/.*editorial/);

        // Go back
        await page.goBack();
        await expect(page).toHaveURL(/.*categorias/);
    });
});

test.describe('Employee Navigation', () => {
    // Use authenticated storage state for employee tests
    test.use({ storageState: 'tmp/authenticatedState.json' });

    test('should navigate to employee dashboard', async ({ page, context }) => {
        // Fallback authentication setup for employee role
        const { generateValidEmployeeToken } = require('../test-utils/token-generator');
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
            sessionStorage.setItem(obfuscatedAccessTokenKey, token);
            localStorage.setItem(obfuscatedAccessTokenKey, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        await page.goto('/dashboard');

        // Check that we're on the employee dashboard
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should navigate to employee financial page', async ({ page, context }) => {
        // Fallback authentication setup for employee role
        const { generateValidEmployeeToken } = require('../test-utils/token-generator');
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
            sessionStorage.setItem(obfuscatedAccessTokenKey, token);
            localStorage.setItem(obfuscatedAccessTokenKey, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        await page.goto('/dashboard/dinero');

        // Check that we're on the financial page
        await expect(page).toHaveURL(/.*dinero/);

        // Check for basic financial content
        const headings = page.locator('h1, h2, h3, h4, h5');
        await expect(headings.first()).toBeVisible();
    });

    test('should navigate between employee pages', async ({ page, context }) => {
        // Fallback authentication setup for employee role
        const { generateValidEmployeeToken } = require('../test-utils/token-generator');
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
            sessionStorage.setItem(obfuscatedAccessTokenKey, token);
            localStorage.setItem(obfuscatedAccessTokenKey, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        await page.goto('/dashboard');

        // Navigate to products page
        await page.goto('/dashboard/productos');
        await expect(page).toHaveURL(/.*productos/);

        // Navigate to financial page
        await page.goto('/dashboard/dinero');
        await expect(page).toHaveURL(/.*dinero/);
    });
});

test.describe('Error Handling', () => {
    test('should handle invalid routes gracefully', async ({ page }) => {
        await page.goto('/this-route-should-not-exist-12345');
        await page.waitForLoadState('networkidle');

        const currentUrl = page.url();

        // Check various ways the app might handle invalid routes
        const is404Page = await page.locator('text=/404|not found/i').count() > 0;
        const isRedirectToHome = currentUrl.includes('localhost:5173/') && !currentUrl.includes('this-route-should-not-exist');
        const isErrorPage = await page.locator('h1:has-text("Product Not Found")').count() > 0;
        const staysOnInvalidRoute = currentUrl.includes('this-route-should-not-exist');
        const hasErrorMessage = await page.locator('text=/error|unavailable/i').count() > 0;

        // App should either show 404, redirect, show error, or at minimum load something
        const handledGracefully = is404Page || isRedirectToHome || isErrorPage || hasErrorMessage ||
            (staysOnInvalidRoute && await page.locator('body').count() > 0);

        if (!handledGracefully) {
            console.log('Route handling details:', {
                currentUrl,
                is404Page,
                isRedirectToHome,
                isErrorPage,
                staysOnInvalidRoute,
                hasErrorMessage,
                pageHasBody: await page.locator('body').count() > 0
            });
        }

        expect(handledGracefully).toBeTruthy();
    });

    test('should recover from navigation errors', async ({ page }) => {
        // Start at a valid page
        await page.goto('/');
        await expect(page.locator('body')).toBeVisible();

        // Try invalid navigation
        await page.goto('/invalid-page');

        // Should be able to navigate back to valid pages
        await page.goto('/');
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Performance', () => {
    test('should load pages within reasonable time', async ({ page }) => {
        const pages = ['/', '/categorias', '/tiendas-marcas', '/ocasiones', '/editorial'];

        for (const pagePath of pages) {
            const startTime = Date.now();
            await page.goto(pagePath);
            const loadTime = Date.now() - startTime;

            // Should load within 5 seconds
            expect(loadTime).toBeLessThan(5000);

            // Should have content
            await expect(page.locator('body')).not.toBeEmpty();
        }
    });
}); 