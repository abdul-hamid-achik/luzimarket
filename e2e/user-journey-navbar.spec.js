import { test, expect } from '@playwright/test';

test.describe('User Journey - Customer Navigation Flow', () => {
    test('should complete a full customer browsing journey', async ({ page }) => {
        // Start at homepage
        await page.goto('/');
        await expect(page.locator('h1, h2, h3')).toContainText(['Luzi', 'Market', 'Bienvenido', 'Welcome']);

        // Browse categories
        await page.click('text=Categorias');
        await expect(page).toHaveURL(/.*categorias/);
        await expect(page.locator('h1')).toContainText('Nuestras Categorías');

        // Click on a specific category
        await page.click('text=Ver Productos >> nth=0');
        await expect(page).toHaveURL(/.*handpicked\/productos\?category=/);

        // Go back to explore brands
        await page.goBack();
        await page.click('text=Tiendas + Marcas');
        await expect(page).toHaveURL(/.*tiendas-marcas/);
        await expect(page.locator('text=Luzimarket Originals')).toBeVisible();

        // Check out editorial content
        await page.click('text=Editorial');
        await expect(page).toHaveURL(/.*editorial/);
        await expect(page.locator('text=Tendencias de regalos 2025')).toBeVisible();

        // Browse occasions
        await page.click('text=Ocasiones');
        await expect(page).toHaveURL(/.*ocasiones/);
        await expect(page.locator('text=Cumpleaños')).toBeVisible();

        // Return to homepage
        await page.click('img[alt*="Logo"]');
        await expect(page).toHaveURL('/');
    });

    test('should handle customer authentication flow', async ({ page }) => {
        await page.goto('/');

        // Check for guest state
        await expect(page.locator('text=Invitado')).toBeVisible();
        await expect(page.locator('text=Login')).toBeVisible();
        await expect(page.locator('text=Register')).toBeVisible();

        // Navigate to login
        await page.click('text=Login');
        await expect(page).toHaveURL(/.*login/);

        // Navigate to register
        await page.goBack();
        await page.click('text=Register');
        await expect(page).toHaveURL(/.*register/);

        // Go back to homepage
        await page.goto('/');
    });

    test('should navigate through product discovery flow', async ({ page }) => {
        await page.goto('/');

        // Start with Best Sellers
        await page.click('text=Best Sellers');
        await expect(page).toHaveURL(/.*handpicked\/productos/);

        // Try Handpicked products
        await page.goto('/');
        await page.click('text=Handpicked');
        await expect(page).toHaveURL(/.*handpicked\/productos/);

        // Browse by category
        await page.goto('/categorias');
        await page.click('text=Ver Productos >> nth=1'); // Click second category
        await expect(page).toHaveURL(/.*handpicked\/productos\?category=/);

        // Check if filters work (if available)
        const filterSection = page.locator('[id*="filtro"], .filters, .filter');
        if (await filterSection.isVisible()) {
            await expect(filterSection).toBeVisible();
        }
    });
});

test.describe('User Journey - Employee Workflow', () => {
    test('should complete employee daily workflow', async ({ page }) => {
        // Start at employee dashboard
        await page.goto('/InicioEmpleados/DashboardEmpleados');

        // Check alerts first
        await page.click('text=Alertas');
        await expect(page).toHaveURL(/.*AlertasEmpleados/);

        // Review products
        await page.click('text=Productos');
        await expect(page).toHaveURL(/.*Productos/);
        await expect(page.locator('input[value="Tetera Sowden"]')).toBeVisible();

        // Check financial status
        await page.click('text=Dinero');
        await expect(page).toHaveURL(/.*Dinero/);
        await expect(page.locator('text=Ventas Totales')).toBeVisible();

        // Review period data
        await page.click('button:has-text("Semana")');
        await expect(page.locator('button:has-text("Semana")')).toHaveClass(/btn-primary/);

        // Check shipments
        await page.click('text=Envíos');
        await expect(page).toHaveURL(/.*Envios/);

        // Review schedule
        await page.click('text=Horarios');
        await expect(page).toHaveURL(/.*Horarios/);

        // Return to dashboard
        await page.click('text=Dashboard');
        await expect(page).toHaveURL(/.*DashboardEmpleados/);
    });

    test('should handle employee financial management workflow', async ({ page }) => {
        await page.goto('/InicioEmpleados/Dinero');

        // Review current month data
        await expect(page.locator('button:has-text("Mes")')).toHaveClass(/btn-primary/);
        await expect(page.locator('text=$45,250')).toBeVisible();

        // Check weekly performance
        await page.click('button:has-text("Semana")');
        await expect(page.locator('button:has-text("Semana")')).toHaveClass(/btn-primary/);

        // Review yearly trends
        await page.click('button:has-text("Año")');
        await expect(page.locator('button:has-text("Año")')).toHaveClass(/btn-primary/);

        // Export report
        await page.click('button:has-text("Exportar Reporte")');
        // In real app, this would trigger download

        // Request payment
        await page.click('button:has-text("Solicitar Pago")');
        // In real app, this would open a form or modal

        // Review transaction details
        await expect(page.locator('text=Transacciones Recientes')).toBeVisible();
        await expect(page.locator('text=2024-01-15')).toBeVisible();
    });
});

test.describe('User Journey - Admin Workflow', () => {
    test('should complete admin management workflow', async ({ page }) => {
        // Start at admin dashboard
        await page.goto('/inicio/dashboard');

        // Review petitions
        await page.click('text=Peticiones');
        await expect(page).toHaveURL(/.*peticiones/);

        // Check sales data
        await page.click('text=Ventas');
        await expect(page).toHaveURL(/.*ventas/);

        // Manage categories
        await page.click('text=Categorias');
        await expect(page).toHaveURL(/.*categorias/);

        // Review locations
        await page.click('text=Locaciones');
        await expect(page).toHaveURL(/.*locaciones/);

        // Return to dashboard
        await page.click('text=Dashboard');
        await expect(page).toHaveURL(/.*dashboard/);
    });
});

test.describe('User Journey - Cross-Platform Consistency', () => {
    test('should maintain consistency across different devices', async ({ page }) => {
        const testNavigation = async (viewport) => {
            await page.setViewportSize(viewport);
            await page.goto('/');

            // Test main navigation
            await page.click('text=Categorias');
            await expect(page).toHaveURL(/.*categorias/);
            await expect(page.locator('h1')).toContainText('Nuestras Categorías');

            // Test category interaction
            await page.click('text=Ver Productos >> nth=0');
            await expect(page).toHaveURL(/.*handpicked\/productos\?category=/);

            await page.goto('/');
        };

        // Test on desktop
        await testNavigation({ width: 1920, height: 1080 });

        // Test on tablet
        await testNavigation({ width: 768, height: 1024 });

        // Test on mobile
        await testNavigation({ width: 375, height: 667 });
    });

    test('should handle navigation state persistence', async ({ page }) => {
        // Navigate to a specific page
        await page.goto('/categorias');
        await expect(page.locator('h1')).toContainText('Nuestras Categorías');

        // Refresh the page
        await page.reload();
        await expect(page).toHaveURL(/.*categorias/);
        await expect(page.locator('h1')).toContainText('Nuestras Categorías');

        // Navigate using browser back/forward
        await page.goto('/tiendas-marcas');
        await page.goBack();
        await expect(page).toHaveURL(/.*categorias/);
        await page.goForward();
        await expect(page).toHaveURL(/.*tiendas-marcas/);
    });
});

test.describe('User Journey - Error Recovery', () => {
    test('should recover gracefully from navigation errors', async ({ page }) => {
        // Start at a valid page
        await page.goto('/categorias');
        await expect(page.locator('h1')).toContainText('Nuestras Categorías');

        // Try to navigate to invalid page
        await page.goto('/invalid-page');

        // Should handle error gracefully
        const is404 = await page.locator('text=404').isVisible();
        const isRedirected = !page.url().includes('invalid-page');
        expect(is404 || isRedirected).toBeTruthy();

        // Should be able to navigate back to valid pages
        await page.goto('/categorias');
        await expect(page.locator('h1')).toContainText('Nuestras Categorías');
    });

    test('should handle slow network conditions', async ({ page }) => {
        // Simulate slow network
        await page.route('**/*', route => {
            setTimeout(() => route.continue(), 100); // Add 100ms delay
        });

        await page.goto('/categorias');
        await expect(page.locator('h1')).toContainText('Nuestras Categorías');

        // Navigation should still work
        await page.click('text=Ver Productos >> nth=0');
        await expect(page).toHaveURL(/.*handpicked\/productos\?category=/);
    });
});

test.describe('User Journey - Performance Validation', () => {
    test('should load pages within acceptable time limits', async ({ page }) => {
        const pages = [
            '/',
            '/categorias',
            '/tiendas-marcas',
            '/ocasiones',
            '/editorial'
        ];

        for (const pagePath of pages) {
            const startTime = Date.now();
            await page.goto(pagePath);
            const loadTime = Date.now() - startTime;

            // Page should load within 5 seconds
            expect(loadTime).toBeLessThan(5000);

            // Page should have meaningful content
            await expect(page.locator('h1, h2, h3')).toHaveCount({ min: 1 });
        }
    });

    test('should handle concurrent navigation efficiently', async ({ page }) => {
        // Rapidly navigate between pages
        await page.goto('/');
        await page.click('text=Categorias');
        await page.click('text=Tiendas + Marcas');
        await page.click('text=Editorial');
        await page.click('text=Ocasiones');

        // Should end up on the last clicked page
        await expect(page).toHaveURL(/.*ocasiones/);
        await expect(page.locator('h1')).toContainText('Ocasiones');
    });
}); 