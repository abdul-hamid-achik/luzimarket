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
    test('should navigate to employee dashboard', async ({ page }) => {
        await page.goto('/InicioEmpleados/DashboardEmpleados');

        // Check that we're on the employee dashboard
        await expect(page).toHaveURL(/.*DashboardEmpleados/);
    });

    test('should navigate to employee financial page', async ({ page }) => {
        await page.goto('/InicioEmpleados/Dinero');

        // Check that we're on the financial page
        await expect(page).toHaveURL(/.*Dinero/);

        // Check for basic financial content
        const headings = page.locator('h1, h2, h3, h4, h5');
        await expect(headings.first()).toBeVisible();
    });

    test('should navigate between employee pages', async ({ page }) => {
        await page.goto('/InicioEmpleados/DashboardEmpleados');

        // Navigate to products page
        await page.goto('/InicioEmpleados/Productos');
        await expect(page).toHaveURL(/.*Productos/);

        // Navigate to financial page
        await page.goto('/InicioEmpleados/Dinero');
        await expect(page).toHaveURL(/.*Dinero/);
    });
});

test.describe('Error Handling', () => {
    test('should handle invalid routes gracefully', async ({ page }) => {
        // Test navigation to non-existent page
        const invalidUrl = '/invalid-route-that-does-not-exist-' + Date.now();
        await page.goto(invalidUrl);

        const currentUrl = page.url();
        console.log('Current URL after invalid navigation:', currentUrl);

        // Check various ways the app might handle 404s
        const has404Text = await page.locator('text=404, text=Not Found, text=Page not found').count();
        const isRedirected = !currentUrl.includes('invalid-route-that-does-not-exist');
        const hasErrorPage = await page.locator('[data-testid="error-page"], .error-page').count() > 0;
        const isHomepage = currentUrl === 'http://localhost:5173/' || currentUrl.endsWith('/');

        // App should handle error in one of these ways
        const handledGracefully = has404Text > 0 || isRedirected || hasErrorPage || isHomepage;

        if (!handledGracefully) {
            console.log('404 text found:', has404Text);
            console.log('Redirected:', isRedirected);
            console.log('Error page found:', hasErrorPage);
            console.log('Is homepage:', isHomepage);
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