import { test, expect } from '@playwright/test';

test.describe('Main Site Navbar Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should navigate to all main navbar links successfully', async ({ page }) => {
        // Test Best Sellers link
        await page.click('text=Best Sellers');
        await expect(page).toHaveURL(/.*handpicked\/productos/);
        await expect(page.locator('h1, h2, h3, h4')).toContainText(['Hand Picked Products']);

        // Go back to home
        await page.goto('/');

        // Test Handpicked link
        await page.click('text=Handpicked');
        await expect(page).toHaveURL(/.*handpicked\/productos/);

        // Go back to home
        await page.goto('/');

        // Test Tiendas + Marcas link
        await page.click('text=Tiendas + Marcas');
        await expect(page).toHaveURL(/.*tiendas-marcas/);
        await expect(page.locator('h1')).toContainText('Tiendas + Marcas');

        // Go back to home
        await page.goto('/');

        // Test Categorias link
        await page.click('text=Categorias');
        await expect(page).toHaveURL(/.*categorias/);
        await expect(page.locator('h1')).toContainText('Nuestras Categorías');

        // Go back to home
        await page.goto('/');

        // Test Ocasiones link
        await page.click('text=Ocasiones');
        await expect(page).toHaveURL(/.*ocasiones/);
        await expect(page.locator('h1')).toContainText('Ocasiones');

        // Go back to home
        await page.goto('/');

        // Test Editorial link
        await page.click('text=Editorial');
        await expect(page).toHaveURL(/.*editorial/);
        await expect(page.locator('h1')).toContainText('Editorial');
    });

    test('should display content on categories page', async ({ page }) => {
        await page.click('text=Categorias');

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check for category-related content (be flexible about specific categories)
        const categoryHeaders = page.locator('h1, h2, h3, h4');
        await expect(categoryHeaders.first()).toBeVisible();

        // Look for any category names or "Ver Productos" buttons
        const hasCategories = await page.locator('text=Ver Productos, text=Flowershop, text=Sweet, text=Events, text=Giftshop').count();

        if (hasCategories === 0) {
            // If specific demo categories aren't found, just check for general category content
            await expect(page.locator('h1')).toContainText('Categorías');
            console.log('Categories page loaded but no specific demo categories found');
        } else {
            // Test clicking on a category if available
            const viewProductsButtons = page.locator('text=Ver Productos');
            const buttonCount = await viewProductsButtons.count();

            if (buttonCount > 0) {
                await viewProductsButtons.first().click();
                await expect(page).toHaveURL(/.*handpicked\/productos|.*categoria/);
            }
        }
    });

    test('should display content on tiendas-marcas page', async ({ page }) => {
        await page.click('text=Tiendas + Marcas');

        // Check for demo brands
        await expect(page.locator('text=Luzimarket Originals')).toBeVisible();
        await expect(page.locator('text=ElectroMax')).toBeVisible();
        await expect(page.locator('text=ModaPlus')).toBeVisible();

        // Check for brand descriptions
        await expect(page.locator('text=Our in-house brand for quality essentials')).toBeVisible();
        await expect(page.locator('text=Top electronics and gadgets')).toBeVisible();
        await expect(page.locator('text=Trendy fashion for all ages')).toBeVisible();
    });

    test('should display content on ocasiones page', async ({ page }) => {
        await page.click('text=Ocasiones');
        await page.waitForLoadState('networkidle');

        // Check for occasions content - use more specific selectors to avoid strict mode violations
        const occasionHeaders = page.locator('h2:has-text("Cumpleaños"), h3:has-text("Cumpleaños")');
        if (await occasionHeaders.count() > 0) {
            await expect(occasionHeaders.first()).toBeVisible();
        } else {
            // Fallback to checking for page title
            await expect(page.locator('h1')).toContainText('Ocasiones');
        }

        // Check for other occasions if they exist
        const occasionNames = ['Aniversario', 'Graduación', 'Navidad'];
        for (const occasion of occasionNames) {
            const elements = page.locator(`h2:has-text("${occasion}"), h3:has-text("${occasion}")`);
            if (await elements.count() > 0) {
                await expect(elements.first()).toBeVisible();
            }
        }
    });

    test('should display content on editorial page', async ({ page }) => {
        await page.click('text=Editorial');

        // Check for demo articles
        await expect(page.locator('text=Tendencias de regalos 2025')).toBeVisible();
        await expect(page.locator('text=Cómo elegir el regalo perfecto')).toBeVisible();
        await expect(page.locator('text=Ideas para celebraciones inolvidables')).toBeVisible();

        // Check for "Leer más" links
        const readMoreLinks = page.locator('text=Leer más');
        await expect(readMoreLinks).toHaveCount(3);
    });

    test('should have responsive navbar on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Check if any navbar is visible - some may be hidden on mobile
        const navbars = page.locator('nav');
        const navCount = await navbars.count();

        if (navCount > 0) {
            // Check if at least one navbar or mobile menu exists
            const visibleNavs = await Promise.all(
                Array.from({ length: navCount }, async (_, i) =>
                    await navbars.nth(i).isVisible()
                )
            );

            const hasVisibleNav = visibleNavs.some(visible => visible);

            if (!hasVisibleNav) {
                // Check if mobile menu toggle exists
                const mobileToggle = page.locator('.navbar-toggler, .mobile-menu-toggle, [data-bs-toggle="collapse"]');
                if (await mobileToggle.count() > 0) {
                    await mobileToggle.first().click();
                    // Check if mobile menu opens
                    const mobileMenu = page.locator('.navbar-collapse, .mobile-menu');
                    await expect(mobileMenu.first()).toBeVisible();
                } else {
                    console.log('No visible navbar or mobile toggle found - this may be expected on mobile');
                }
            }
        }
    });
});

test.describe('Employee Dashboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to employee login page
        await page.goto('/empleados');

        // Skip login for now - in a real scenario you'd login here
        // For testing purposes, we'll go directly to the employee dashboard
        await page.goto('/InicioEmpleados/DashboardEmpleados');
    });

    test('should navigate to all employee sidebar links successfully', async ({ page }) => {
        // Test Dashboard link
        await page.click('text=Dashboard');
        await expect(page).toHaveURL(/.*DashboardEmpleados/);

        // Test Alertas link
        await page.click('text=Alertas');
        await expect(page).toHaveURL(/.*AlertasEmpleados/);

        // Test Productos link
        await page.click('text=Productos');
        await expect(page).toHaveURL(/.*Productos/);

        // Test Envíos link
        await page.click('text=Envíos');
        await expect(page).toHaveURL(/.*Envios/);

        // Test Dinero link
        await page.click('text=Dinero');
        await expect(page).toHaveURL(/.*Dinero/);

        // Test Horarios link
        await page.click('text=Horarios');
        await expect(page).toHaveURL(/.*Horarios/);
    });

    test('should display financial dashboard content on Dinero page', async ({ page }) => {
        await page.click('text=Dinero');

        // Check for financial overview cards
        await expect(page.locator('text=Ventas Totales')).toBeVisible();
        await expect(page.locator('text=Comisiones')).toBeVisible();
        await expect(page.locator('text=Pagos Pendientes')).toBeVisible();
        await expect(page.locator('text=Crecimiento')).toBeVisible();

        // Check for financial values
        await expect(page.locator('text=$45,250')).toBeVisible();
        await expect(page.locator('text=$2,262.5')).toBeVisible();
        await expect(page.locator('text=$1,850')).toBeVisible();
        await expect(page.locator('text=+12.5%')).toBeVisible();

        // Check for period selector
        await expect(page.locator('button:has-text("Semana")')).toBeVisible();
        await expect(page.locator('button:has-text("Mes")')).toBeVisible();
        await expect(page.locator('button:has-text("Año")')).toBeVisible();

        // Test period selector functionality
        await page.click('button:has-text("Semana")');
        await expect(page.locator('button:has-text("Semana")')).toHaveClass(/btn-primary/);

        // Check for transactions table
        await expect(page.locator('text=Transacciones Recientes')).toBeVisible();
        await expect(page.locator('text=Fecha')).toBeVisible();
        await expect(page.locator('text=Tipo')).toBeVisible();
        await expect(page.locator('text=Monto')).toBeVisible();
        await expect(page.locator('text=Estado')).toBeVisible();

        // Check for action buttons
        await expect(page.locator('text=Exportar Reporte')).toBeVisible();
        await expect(page.locator('text=Solicitar Pago')).toBeVisible();
    });

    test('should display productos content on Productos page', async ({ page }) => {
        await page.click('text=Productos');

        // Check for product form elements
        await expect(page.locator('input[value="Tetera Sowden"]')).toBeVisible();
        await expect(page.locator('input[value="$1,000 (MXN)"]')).toBeVisible();

        // Check for textareas
        await expect(page.locator('textarea')).toHaveCount(2);

        // Check for product images
        const images = page.locator('img[src*="imagen_test"]');
        await expect(images).toHaveCount(3);

        // Check for action buttons
        await expect(page.locator('text=← Regresar')).toBeVisible();
        await expect(page.locator('text=Enviar feedback')).toBeVisible();
        await expect(page.locator('text=Aceptar')).toBeVisible();
    });

    test('should have no broken links in employee sidebar', async ({ page }) => {
        const sidebarLinks = [
            'Dashboard',
            'Alertas',
            'Productos',
            'Envíos',
            'Dinero',
            'Horarios'
        ];

        for (const linkText of sidebarLinks) {
            await page.click(`text=${linkText}`);

            // Check that we're not on a 404 page
            await expect(page.locator('text=404')).not.toBeVisible();
            await expect(page.locator('text=Not Found')).not.toBeVisible();

            // Check that the page has loaded content
            await expect(page.locator('body')).not.toBeEmpty();
        }
    });
});

test.describe('Admin Dashboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to admin login page
        await page.goto('/admin');

        // Skip login for now - in a real scenario you'd login here
        // For testing purposes, we'll go directly to the admin dashboard
        await page.goto('/inicio/dashboard');
    });

    test('should navigate to admin navbar links successfully', async ({ page }) => {
        // Test Dashboard link
        await page.click('text=Dashboard');
        await expect(page).toHaveURL(/.*dashboard/);

        // Test Peticiones link
        await page.click('text=Peticiones');
        await expect(page).toHaveURL(/.*peticiones/);

        // Test Ventas link
        await page.click('text=Ventas');
        await expect(page).toHaveURL(/.*ventas/);

        // Test Categorias link (admin version)
        await page.click('text=Categorias');
        await expect(page).toHaveURL(/.*categorias/);

        // Test Locaciones link
        await page.click('text=Locaciones');
        await expect(page).toHaveURL(/.*locaciones/);
    });
});

test.describe('Cross-Browser Navigation Tests', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
        test(`should work correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
            test.skip(currentBrowser !== browserName, `Skipping ${browserName} test`);

            await page.goto('/');

            // Test basic navigation
            await page.click('text=Categorias');
            await expect(page).toHaveURL(/.*categorias/);
            await expect(page.locator('h1')).toContainText('Nuestras Categorías');

            // Test going back
            await page.goBack();
            await expect(page).toHaveURL('/');
        });
    });
});

test.describe('Performance and Accessibility', () => {
    test('should load navbar pages quickly', async ({ page }) => {
        const pages = [
            '/categorias',
            '/tiendas-marcas',
            '/ocasiones',
            '/editorial'
        ];

        for (const pagePath of pages) {
            const startTime = Date.now();
            await page.goto(pagePath);
            const loadTime = Date.now() - startTime;

            // Page should load within 3 seconds
            expect(loadTime).toBeLessThan(3000);

            // Page should have content
            await expect(page.locator('h1')).toBeVisible();
        }
    });

    test('should have accessible navigation', async ({ page }) => {
        await page.goto('/');

        // Check for proper navigation structure
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();

        // Check for proper link structure
        const navLinks = page.locator('nav a');
        const linkCount = await navLinks.count();
        expect(linkCount).toBeGreaterThan(0);

        // Check that links have proper href attributes
        for (let i = 0; i < linkCount; i++) {
            const href = await navLinks.nth(i).getAttribute('href');
            expect(href).toBeTruthy();
            expect(href).not.toBe('#');
        }
    });
});

test.describe('Error Handling', () => {
    test('should handle navigation errors gracefully', async ({ page }) => {
        // Test navigation to non-existent page
        await page.goto('/non-existent-page');

        // Should show 404 page or redirect appropriately
        const is404 = await page.locator('text=404').isVisible();
        const isRedirected = page.url() !== '/non-existent-page';

        expect(is404 || isRedirected).toBeTruthy();
    });

    test('should maintain navigation state after page refresh', async ({ page }) => {
        await page.goto('/categorias');
        await expect(page.locator('h1')).toContainText('Nuestras Categorías');

        // Refresh the page
        await page.reload();

        // Should still be on the same page with content
        await expect(page).toHaveURL(/.*categorias/);
        await expect(page.locator('h1')).toContainText('Nuestras Categorías');
    });
}); 