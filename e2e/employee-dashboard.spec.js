import { test, expect } from '@playwright/test';
import { generateValidEmployeeToken } from './test-utils/token-generator.js';

test.describe('Employee Dashboard', () => {
    test.beforeEach(async ({ page, context }) => {
        // Set up employee authentication with properly signed tokens
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            // Set tokens using obfuscated keys
            sessionStorage.setItem(keys.accessToken, token);
            sessionStorage.setItem(keys.refreshToken, token);
            localStorage.setItem(keys.accessToken, token);
            localStorage.setItem(keys.refreshToken, token);

            // Also set legacy keys for compatibility
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        // Navigate to the employee dashboard
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should render the main dashboard layout', async ({ page }) => {
        // Check if navigation bars are present (there are multiple navbars on the page)
        await expect(page.locator('nav.navbar').first()).toBeVisible();

        // Check if the sidebar is present (use first() since there are multiple sidebars)
        await expect(page.locator('.sidebar').first()).toBeVisible();

        // Check if the main content area is present
        await expect(page.locator('main.outlet')).toBeVisible();
    });

    test('should navigate between sections using sidebar', async ({ page }) => {
        // Test navigation to different sections
        const sections = [
            { link: 'Dashboard', url: '/dashboard' },
            { link: 'Alertas', url: '/dashboard/alertas' },
            { link: 'Productos', url: '/dashboard/productos' },
            { link: 'Envíos', url: '/dashboard/envios' },
            { link: 'Dinero', url: '/dashboard/dinero' },
            { link: 'Horarios', url: '/dashboard/horarios' }
        ];

        for (const section of sections) {
            await page.click(`text=${section.link}`);
            await expect(page).toHaveURL(new RegExp(section.url));

            // Wait for page to load
            await page.waitForLoadState('networkidle');
        }
    });

    test('should display user information in navbar', async ({ page }) => {
        // Check if user name is displayed
        await expect(page.locator('text=Mariana García')).toBeVisible();

        // Check if location is displayed
        await expect(page.locator('text=Montacometa')).toBeVisible();

        // Check if user avatar is present
        await expect(page.locator('img[alt="mdo"]')).toBeVisible();
    });
});

test.describe('Products Page', () => {
    test.beforeEach(async ({ page, context }) => {
        // Set up employee authentication with properly signed tokens
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            sessionStorage.setItem(keys.accessToken, token);
            sessionStorage.setItem(keys.refreshToken, token);
            localStorage.setItem(keys.accessToken, token);
            localStorage.setItem(keys.refreshToken, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        await page.goto('/dashboard/productos');
        await page.waitForLoadState('networkidle');
    });

    test('should display product form with all sections', async ({ page }) => {
        // Check main sections
        await expect(page.locator('text=Detalles del Producto')).toBeVisible();
        await expect(page.locator('text=Información Básica')).toBeVisible();
        await expect(page.locator('text=Descripción y Detalles')).toBeVisible();
        await expect(page.locator('text=Galería de Fotos')).toBeVisible();
    });

    test('should have pre-filled form data', async ({ page }) => {
        // Check if form has default values
        await expect(page.locator('input[name="nombre"]')).toHaveValue('Tetera Sowden');
        await expect(page.locator('input[name="precio"]')).toHaveValue('1000');
        await expect(page.locator('input[name="marca"]')).toHaveValue('HAY DESIGN');
    });

    test('should validate required fields', async ({ page }) => {
        // Clear a required field
        await page.fill('input[name="nombre"]', '');

        // Try to submit
        await page.click('text=Aceptar');

        // Check for error message
        await expect(page.locator('text=El nombre del producto es requerido')).toBeVisible();
    });

    test('should handle image management', async ({ page }) => {
        // Check if initial images are displayed
        const images = page.locator('.photo-container img');
        await expect(images).toHaveCount(3);

        // Check if upload area is present
        await expect(page.locator('text=Agregar')).toBeVisible();
    });

    test('should submit product for approval', async ({ page }) => {
        // Fill form with valid data
        await page.fill('input[name="nombre"]', 'Test Product');
        await page.fill('input[name="precio"]', '500');
        await page.fill('input[name="marca"]', 'Test Brand');

        // Submit for approval
        await page.click('text=Aceptar');

        // Check for loading state
        await expect(page.locator('.loading-spinner').first()).toBeVisible();

        // Wait for completion
        await page.waitForFunction(
            () => !document.querySelector('.loading-spinner'),
            null,
            { timeout: 5000 }
        );
    });

    test('should handle feedback submission', async ({ page }) => {
        await page.click('text=Enviar Feedback');

        // Check for loading state
        await expect(page.locator('.loading-spinner').first()).toBeVisible();

        // Wait for completion
        await page.waitForFunction(
            () => !document.querySelector('.loading-spinner'),
            null,
            { timeout: 5000 }
        );
    });
});

test.describe('Schedules Page', () => {
    test.beforeEach(async ({ page, context }) => {
        // Set up employee authentication with properly signed tokens
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            sessionStorage.setItem(keys.accessToken, token);
            sessionStorage.setItem(keys.refreshToken, token);
            localStorage.setItem(keys.accessToken, token);
            localStorage.setItem(keys.refreshToken, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        await page.goto('/dashboard/horarios');
        await page.waitForLoadState('networkidle');
    });

    test('should display schedules management interface', async ({ page }) => {
        // Check main sections
        await expect(page.locator('text=Gestión de Horarios')).toBeVisible();
        await expect(page.locator('text=Filtrar por Ubicación')).toBeVisible();
        await expect(page.locator('text=Tiendas y Horarios')).toBeVisible();
    });

    test('should display store data in table', async ({ page }) => {
        // Check table headers - use more specific locators to avoid strict mode violations
        await expect(page.locator('th:has-text("Tienda")')).toBeVisible();
        await expect(page.locator('th:has-text("Ubicación")')).toBeVisible();
        await expect(page.locator('th:has-text("Hora de Apertura")')).toBeVisible();
        await expect(page.locator('th:has-text("Hora de Cierre")')).toBeVisible();

        // Check store data
        await expect(page.locator('text=Tienda Uno')).toBeVisible();
        await expect(page.locator('text=Tienda Dos')).toBeVisible();
    });

    test('should filter stores by location', async ({ page }) => {
        // Select state
        await page.selectOption('select >> nth=0', 'Ciudad de México');

        // Select city
        await page.selectOption('select >> nth=1', 'Coyoacán');

        // Check if filter info is displayed
        await expect(page.locator('text=Mostrando tiendas en Coyoacán, Ciudad de México')).toBeVisible();
    });

    test('should open edit modal when edit button is clicked', async ({ page }) => {
        // Click edit button for first store
        await page.click('.action-btn.btn-edit >> nth=0');

        // Check if modal is opened
        await expect(page.locator('text=Editar Horarios de Tienda')).toBeVisible();

        // Check if form fields are present
        await expect(page.locator('input[type="text"]')).toBeVisible();
        await expect(page.locator('input[type="time"]')).toHaveCount(2);
    });

    test('should open delete confirmation when delete button is clicked', async ({ page }) => {
        // Click delete button for first store
        await page.click('.action-btn.btn-delete >> nth=0');

        // Check if confirmation modal is opened
        await expect(page.locator('text=Eliminar Tienda')).toBeVisible();
        await expect(page.locator('text=¿Está seguro de que desea eliminar')).toBeVisible();
    });

    test('should add new store', async ({ page }) => {
        // First select a location
        await page.selectOption('select >> nth=0', 'Ciudad de México');
        await page.selectOption('select >> nth=1', 'Coyoacán');

        // Click add store button
        await page.click('text=Agregar Tienda');

        // Check if modal is opened - use more specific locator for modal title
        await expect(page.locator('.modal-title:has-text("Agregar Nueva Tienda")')).toBeVisible();

        // Confirm addition
        await page.click('text=Agregar Tienda >> nth=1');

        // Wait for modal to close
        await expect(page.locator('.modal-title:has-text("Agregar Nueva Tienda")')).not.toBeVisible();
    });

    test('should update all schedules', async ({ page }) => {
        // Click update schedules button
        await page.click('text=Actualizar Horarios');

        // Check for loading state
        await expect(page.locator('.loading-spinner').first()).toBeVisible();

        // Wait for completion
        await page.waitForFunction(
            () => !document.querySelector('.loading-spinner'),
            null,
            { timeout: 5000 }
        );
    });
});

test.describe('Money/Finance Page', () => {
    test.beforeEach(async ({ page, context }) => {
        // Set up employee authentication with properly signed tokens
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            sessionStorage.setItem(keys.accessToken, token);
            sessionStorage.setItem(keys.refreshToken, token);
            localStorage.setItem(keys.accessToken, token);
            localStorage.setItem(keys.refreshToken, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        await page.goto('/dashboard/dinero');
        await page.waitForLoadState('networkidle');
    });

    test('should display financial overview cards', async ({ page }) => {
        // Check financial cards
        await expect(page.locator('text=Ventas Totales')).toBeVisible();
        await expect(page.locator('text=Comisiones')).toBeVisible();
        await expect(page.locator('text=Pagos Pendientes')).toBeVisible();
        await expect(page.locator('text=Crecimiento')).toBeVisible();
    });

    test('should display financial values', async ({ page }) => {
        // Check for monetary values
        await expect(page.locator('text=$45,250')).toBeVisible();
        await expect(page.locator('text=$2,262.5')).toBeVisible();
        await expect(page.locator('text=$1,850')).toBeVisible();
        await expect(page.locator('text=+12.5%')).toBeVisible();
    });

    test('should switch between time periods', async ({ page }) => {
        // Test period selector - use more specific locators to avoid ambiguity
        await page.click('button:has-text("Semana")');
        await expect(page.locator('button:has-text("Semana").active')).toBeVisible();

        await page.click('button:has-text("Año")');
        await expect(page.locator('button:has-text("Año").active')).toBeVisible();

        await page.click('button:has-text("Mes")');
        await expect(page.locator('button:has-text("Mes").active')).toBeVisible();
    });

    test('should display transactions table', async ({ page }) => {
        // Check table headers
        await expect(page.locator('text=Fecha')).toBeVisible();
        await expect(page.locator('text=Tipo')).toBeVisible();
        await expect(page.locator('text=Monto')).toBeVisible();
        await expect(page.locator('text=Estado')).toBeVisible();

        // Check for transaction data
        await expect(page.locator('text=2025-01-15')).toBeVisible();
        await expect(page.locator('text=$250.00')).toBeVisible();
    });

    test('should handle export and payment actions', async ({ page }) => {
        // Check action buttons
        await expect(page.locator('text=Exportar Reporte')).toBeVisible();
        await expect(page.locator('text=Solicitar Pago')).toBeVisible();

        // Test export button click
        await page.click('text=Exportar Reporte');

        // Test payment request button click
        await page.click('text=Solicitar Pago');
    });
});

test.describe('Alerts Page', () => {
    test.beforeEach(async ({ page, context }) => {
        // Set up employee authentication with properly signed tokens
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            sessionStorage.setItem(keys.accessToken, token);
            sessionStorage.setItem(keys.refreshToken, token);
            localStorage.setItem(keys.accessToken, token);
            localStorage.setItem(keys.refreshToken, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        await page.goto('/dashboard/alertas');
        await page.waitForLoadState('networkidle');
    });

    test('should display alerts page', async ({ page }) => {
        // Use more specific locator to avoid strict mode violation
        await expect(page.locator('h2:has-text("Alertas")')).toBeVisible();

        // Check for alert components - verify at least one alert exists
        const alertCount = await page.locator('.alert').count();
        expect(alertCount).toBeGreaterThan(0);
    });
});

test.describe('Orders/Shipping Page', () => {
    test.beforeEach(async ({ page, context }) => {
        // Set up employee authentication with properly signed tokens
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            sessionStorage.setItem(keys.accessToken, token);
            sessionStorage.setItem(keys.refreshToken, token);
            localStorage.setItem(keys.accessToken, token);
            localStorage.setItem(keys.refreshToken, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        await page.goto('/dashboard/envios');
        await page.waitForLoadState('networkidle');
    });

    test('should display orders interface', async ({ page }) => {
        await expect(page.locator('text=Ordenes')).toBeVisible();

        // Check for filter bar
        await expect(page.locator('.filter-bar')).toBeVisible();

        // Check for search input
        await expect(page.locator('.search-input')).toBeVisible();

        // Check for orders table
        await expect(page.locator('.orders-table')).toBeVisible();
    });

    test('should filter orders', async ({ page }) => {
        // Test search functionality
        await page.fill('.search-input', 'Mariana');

        // Wait for filtering to complete
        await page.waitForTimeout(500);

        // Should show filtered results
        await expect(page.locator('text=Mariana García')).toBeVisible();
    });
});

test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page, context }) => {
        // Set up employee authentication with properly signed tokens
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            sessionStorage.setItem(keys.accessToken, token);
            sessionStorage.setItem(keys.refreshToken, token);
            localStorage.setItem(keys.accessToken, token);
            localStorage.setItem(keys.refreshToken, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Check if page still loads correctly
        await expect(page.locator('nav.navbar').first()).toBeVisible();

        // Check if sidebar becomes collapsible on mobile
        // This depends on the specific responsive implementation
    });

    test('should work on tablet viewport', async ({ page, context }) => {
        // Set up employee authentication with properly signed tokens
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            sessionStorage.setItem(keys.accessToken, token);
            sessionStorage.setItem(keys.refreshToken, token);
            localStorage.setItem(keys.accessToken, token);
            localStorage.setItem(keys.refreshToken, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });

        await page.goto('/dashboard/productos');
        await page.waitForLoadState('networkidle');

        // Check if page adapts correctly
        await expect(page.locator('text=Detalles del Producto')).toBeVisible();
    });
});

test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
        // Set up employee authentication with properly signed tokens
        const employeeToken = generateValidEmployeeToken();

        await context.addInitScript((token) => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            sessionStorage.setItem(keys.accessToken, token);
            sessionStorage.setItem(keys.refreshToken, token);
            localStorage.setItem(keys.accessToken, token);
            localStorage.setItem(keys.refreshToken, token);
            sessionStorage.setItem('token', token);
            localStorage.setItem('token', token);
        }, employeeToken);

        // First navigate to the page normally to ensure it loads
        await page.goto('/dashboard/envios');
        await page.waitForLoadState('networkidle');

        // Wait for the page to render first
        await expect(page.locator('text=Ordenes')).toBeVisible();

        // Now simulate network failure for specific API calls only
        // This ensures the page structure stays intact but data fetching fails
        await page.route('**/api/admin/orders', route => route.abort());

        // Reload the page to trigger the error state
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should still render the page structure
        await expect(page.locator('text=Ordenes')).toBeVisible();

        // Should show error state or fallback content
        // The component has fallback data so it should render even when API fails
        await expect(page.locator('.filter-bar')).toBeVisible();
        await expect(page.locator('.orders-table')).toBeVisible();
    });
});

test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
        await page.goto('/dashboard');

        // Test tab navigation
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Check if focus is visible and logical
        const focusedElement = await page.locator(':focus');
        await expect(focusedElement).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
        await page.goto('/dashboard/productos');

        // Check for form labels - verify there are labels present
        const labelCount = await page.locator('label').count();
        expect(labelCount).toBeGreaterThan(0);

        // Check for button accessibility - buttons should have text, aria-label, or title
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();

        let accessibleButtonCount = 0;
        for (let i = 0; i < buttonCount; i++) {
            const button = buttons.nth(i);
            const text = await button.textContent();
            const ariaLabel = await button.getAttribute('aria-label');
            const title = await button.getAttribute('title');

            // Button is accessible if it has text, aria-label, or title
            if (text?.trim() || ariaLabel?.trim() || title?.trim()) {
                accessibleButtonCount++;
            }
        }

        // At least 80% of buttons should have proper accessibility labels
        expect(accessibleButtonCount).toBeGreaterThan(buttonCount * 0.8);
    });
});

test.describe('Performance', () => {
    test('should load pages within reasonable time', async ({ page, context }) => {
        // Set up employee authentication with obfuscated keys
        await context.addInitScript(() => {
            const getSecureStorageKeys = () => ({
                accessToken: btoa('_luzi_auth_access'),
                refreshToken: btoa('_luzi_auth_refresh')
            });
            const keys = getSecureStorageKeys();

            const employeeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJmYWtlLWVtcGxveWVlLXNlc3Npb24iLCJ1c2VySWQiOiJmYWtlLWVtcGxveWVlLWlkIiwicm9sZSI6ImVtcGxveWVlIiwiaWF0IjoxNjIzNDU2Nzg5LCJleHAiOjk5OTk5OTk5OTl9.fake-employee-signature';

            sessionStorage.setItem(keys.accessToken, employeeToken);
            sessionStorage.setItem(keys.refreshToken, employeeToken);
            localStorage.setItem(keys.accessToken, employeeToken);
            localStorage.setItem(keys.refreshToken, employeeToken);
            sessionStorage.setItem('token', employeeToken);
            localStorage.setItem('token', employeeToken);
        });

        const startTime = Date.now();

        await page.goto('/dashboard/productos');
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // Should load within 10 seconds (increased for development environment)
        expect(loadTime).toBeLessThan(10000);
    });
}); 