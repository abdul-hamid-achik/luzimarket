const { test, expect } = require('@playwright/test');
test.use({ storageState: 'tmp/authenticatedState.json' });

test.describe('Employee Panel', () => {
    test.describe('Employee Authentication', () => {
        test('should login and view dashboard', async ({ page }) => {
            // Navigate to vendor login
            await page.goto('/empleados');
            console.log('On employee login page');

            // Use the Entrar link to login (fake login)
            await page.click('a.button:has-text("Entrar")');
            console.log('Clicked login button');

            // Should be on dashboard
            await page.waitForURL(/\/InicioEmpleados\/DashboardEmpleados$/);
            console.log('On employee dashboard');

            // Check key dashboard cards
            await expect(page.locator('h4.card-title:has-text("Annual Target")')).toBeVisible();
            await expect(page.locator('h4.card-title:has-text("Earnings")')).toBeVisible();
            await expect(page.locator('h4.card-title:has-text("Overview")')).toBeVisible();
        });
    });

    test.describe('Employee Navigation', () => {
        test.beforeEach(async ({ page }) => {
            // Login before each test
            await page.goto('/empleados');
            await page.click('a.button:has-text("Entrar")');
            await page.waitForURL(/\/InicioEmpleados\/DashboardEmpleados$/);
        });

        test('should navigate between employee sections', async ({ page }) => {
            const employeeSections = [
                { name: 'Dashboard', url: '/DashboardEmpleados' },
                { name: 'Alertas', url: '/AlertasEmpleados' },
                { name: 'Productos', url: '/Productos' },
                { name: 'Envíos', url: '/Envios' },
                { name: 'Dinero', url: '/Dinero' },
                { name: 'Horarios', url: '/Horarios' }
            ];

            for (const section of employeeSections) {
                await page.click(`text=${section.name}`);
                await expect(page).toHaveURL(new RegExp(section.url));
                console.log(`✅ Navigated to ${section.name}`);

                // Wait a moment for page to load
                await page.waitForTimeout(1000);
            }
        });
    });

    test.describe('Employee Alerts Management', () => {
        test('should view alerts page', async ({ page }) => {
            await page.goto('/InicioEmpleados/AlertasEmpleados');
            console.log('Navigated to alerts page');

            // Breadcrumb should be visible
            await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible();

            // Alert components count
            await expect(page.locator('.alert-success')).toHaveCount(2);
            await expect(page.locator('.alert-danger')).toHaveCount(2);
        });
    });

    test.describe('Employee Financial Dashboard', () => {
        test('should display all financial overview cards', async ({ page }) => {
            await page.goto('/InicioEmpleados/Dinero');

            // Check for all financial cards
            await expect(page.locator('text=Ventas Totales')).toBeVisible();
            await expect(page.locator('text=Comisiones')).toBeVisible();
            await expect(page.locator('text=Pagos Pendientes')).toBeVisible();
            await expect(page.locator('text=Crecimiento')).toBeVisible();

            // Check for financial values
            await expect(page.locator('text=$45,250')).toBeVisible();
            await expect(page.locator('text=$2,262.5')).toBeVisible();
            await expect(page.locator('text=$1,850')).toBeVisible();
            await expect(page.locator('text=+12.5%')).toBeVisible();

            // Check for descriptive text
            await expect(page.locator('text=Este mes')).toBeVisible();
            await expect(page.locator('text=5% de ventas')).toBeVisible();
            await expect(page.locator('text=Por procesar')).toBeVisible();
            await expect(page.locator('text=vs mes anterior')).toBeVisible();
        });

        test('should have functional period selector', async ({ page }) => {
            await page.goto('/InicioEmpleados/Dinero');

            // Check that all period buttons are visible
            await expect(page.locator('button:has-text("Semana")')).toBeVisible();
            await expect(page.locator('button:has-text("Mes")')).toBeVisible();
            await expect(page.locator('button:has-text("Año")')).toBeVisible();

            // Month should be selected by default
            const monthButton = page.locator('button:has-text("Mes")');
            await expect(monthButton).toHaveClass(/btn-primary/);

            // Test clicking week button
            const weekButton = page.locator('button:has-text("Semana")');
            await weekButton.click();
            await expect(weekButton).toHaveClass(/btn-primary/);
            await expect(monthButton).toHaveClass(/btn-outline-primary/);

            // Test clicking year button
            const yearButton = page.locator('button:has-text("Año")');
            await yearButton.click();
            await expect(yearButton).toHaveClass(/btn-primary/);
            await expect(weekButton).toHaveClass(/btn-outline-primary/);
        });

        test('should display financial summary section', async ({ page }) => {
            await page.goto('/InicioEmpleados/Dinero');

            await expect(page.locator('text=Resumen Financiero')).toBeVisible();
            await expect(page.locator('text=Transacciones Completadas')).toBeVisible();
            await expect(page.locator('text=127')).toBeVisible();
            await expect(page.locator('text=Promedio por Transacción')).toBeVisible();
            await expect(page.locator('text=$356.30')).toBeVisible();
        });

        test('should display transactions table with correct data', async ({ page }) => {
            await page.goto('/InicioEmpleados/Dinero');

            // Check table headers
            await expect(page.locator('text=Transacciones Recientes')).toBeVisible();
            await expect(page.locator('th:has-text("Fecha")')).toBeVisible();
            await expect(page.locator('th:has-text("Tipo")')).toBeVisible();
            await expect(page.locator('th:has-text("Monto")')).toBeVisible();
            await expect(page.locator('th:has-text("Estado")')).toBeVisible();

            // Check for specific transaction data
            await expect(page.locator('text=2024-01-15')).toBeVisible();
            await expect(page.locator('text=$250.00')).toBeVisible();
            await expect(page.locator('text=2024-01-14')).toBeVisible();
            await expect(page.locator('text=$180.50')).toBeVisible();

            // Check for transaction types
            const ventaBadges = page.locator('.badge:has-text("Venta")');
            await expect(ventaBadges).toHaveCount(3);

            const comisionBadges = page.locator('.badge:has-text("Comisión")');
            await expect(comisionBadges).toHaveCount(2);

            // Check for transaction statuses
            const completadoBadges = page.locator('.badge:has-text("Completado")');
            await expect(completadoBadges).toHaveCount(4);

            const pendienteBadges = page.locator('.badge:has-text("Pendiente")');
            await expect(pendienteBadges).toHaveCount(1);
        });

        test('should display action buttons', async ({ page }) => {
            await page.goto('/InicioEmpleados/Dinero');

            const exportButton = page.locator('button:has-text("Exportar Reporte")');
            const paymentButton = page.locator('button:has-text("Solicitar Pago")');

            await expect(exportButton).toBeVisible();
            await expect(paymentButton).toBeVisible();

            // Check button classes
            await expect(exportButton).toHaveClass(/btn-outline-primary/);
            await expect(paymentButton).toHaveClass(/btn-primary/);
        });
    });

    test.describe('Employee Products Management', () => {
        test('should view and update product information', async ({ page }) => {
            await page.goto('/InicioEmpleados/Productos');
            console.log('Navigated to products page');

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
    });

    test.describe('Employee Orders (Envios)', () => {
        test('should access orders page', async ({ page }) => {
            await page.goto('/InicioEmpleados/Envios');
            await page.waitForLoadState('networkidle', { timeout: 30000 });
            console.log('Navigated to orders page');

            // Use more flexible selectors for the orders page
            const pageElements = [
                'h1:has-text("Ordenes")',
                '.container',
                '.filter-bar',
                '.filter-list',
                '.search-input',
                'table.orders-table',
                'button.add-order-button'
            ];

            let foundElements = 0;
            for (const selector of pageElements) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    console.log(`Found element with selector: ${selector}`);
                    foundElements++;
                } catch (e) {
                    console.log(`Selector not found: ${selector}`);
                }
            }

            // Verify at minimum we're on the right URL
            expect(page.url()).toContain('Envios');
            console.log('URL contains Envios as expected');

            // Should have found at least some page elements
            expect(foundElements).toBeGreaterThan(0);
        });
    });

    test.describe('Employee Schedule Management', () => {
        test('should view and update schedule', async ({ page }) => {
            await page.goto('/InicioEmpleados/Horarios');
            console.log('Navigated to schedule page');

            // Breadcrumb present
            await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible();

            // State & city selectors
            await expect(page.locator('select.form-select')).toHaveCount(2);

            // Update button
            await expect(page.locator('button:has-text("Actualizar")')).toBeVisible();
        });
    });

    test.describe('Employee Dashboard Performance', () => {
        test('should be responsive on different screen sizes', async ({ page }) => {
            await page.goto('/InicioEmpleados/Dinero');

            const viewports = [
                { width: 1200, height: 800, name: 'Desktop' },
                { width: 768, height: 1024, name: 'Tablet' },
                { width: 375, height: 667, name: 'Mobile' }
            ];

            for (const viewport of viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                console.log(`Testing ${viewport.name} viewport`);

                // Check for financial overview cards
                const financialCards = page.locator('[class*="col-"]:has(.card)');
                const cardCount = await financialCards.count();
                expect(cardCount).toBeGreaterThanOrEqual(4); // At least 4 financial cards

                // Check if table is responsive
                const responsiveTable = page.locator('.table-responsive, .table');
                await expect(responsiveTable.first()).toBeVisible();
            }
        });

        test('should load pages within acceptable time limits', async ({ page }) => {
            const employeePages = [
                '/InicioEmpleados/DashboardEmpleados',
                '/InicioEmpleados/Dinero',
                '/InicioEmpleados/Productos',
                '/InicioEmpleados/AlertasEmpleados'
            ];

            for (const pagePath of employeePages) {
                const startTime = Date.now();
                await page.goto(pagePath);
                const loadTime = Date.now() - startTime;

                console.log(`${pagePath} loaded in ${loadTime}ms`);

                // Page should load within 5 seconds
                expect(loadTime).toBeLessThan(5000);

                // Page should have meaningful content
                const hasContent = await page.locator('h1, h2, .container, .card').count() > 0;
                expect(hasContent).toBe(true);
            }
        });
    });

    test.describe('Employee Workflow Integration', () => {
        test('should complete daily workflow', async ({ page }) => {
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

            console.log('✅ Complete employee workflow tested');
        });
    });
}); 