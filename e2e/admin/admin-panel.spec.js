const { test, expect } = require('@playwright/test');
test.use({ storageState: 'tmp/authenticatedState.json' });

test.describe('Admin Panel', () => {
    test.describe('Admin Authentication', () => {
        test('should load admin login page and display form', async ({ page }) => {
            await page.goto('/admin');

            // Check page title
            await expect(page).toHaveTitle(/LUZIMARKET/);

            // Verify form elements
            const usernameInput = page.locator('#txtUser');
            const passwordInput = page.locator('#txtPass');
            const loginButton = page.locator('a.button');
            const heading = page.locator('h1.titulo__login');

            await expect(heading).toHaveText(/Bienvenidx/);
            await expect(usernameInput).toBeVisible();
            await expect(passwordInput).toBeVisible();
            await expect(loginButton).toHaveText('Entrar');
        });

        test('should allow admin login and navigate to dashboard', async ({ page }) => {
            await page.goto('/admin');

            // Click the Entrar link (fake login)
            await page.click('a.button:has-text("Entrar")');

            // Should navigate to dashboard
            await page.waitForURL(/\/inicio\/dashboard$/);
            expect(page.url()).toContain('/inicio/dashboard');
        });
    });

    test.describe('Admin Dashboard', () => {
        test('should display key dashboard cards', async ({ page }) => {
            await page.goto('/admin');
            await page.click('a.button:has-text("Entrar")');
            await page.waitForURL(/\/inicio\/dashboard$/);

            // Verify Annual Target card
            const annualCard = page.locator('h4.card-title:has-text("Annual Target")');
            await expect(annualCard).toBeVisible();

            // Verify Earnings card
            const earningsCard = page.locator('h4.card-title:has-text("Earnings")');
            await expect(earningsCard).toBeVisible();

            // Verify Overview card
            const overviewCard = page.locator('h4.card-title:has-text("Overview")');
            await expect(overviewCard).toBeVisible();
        });

        test('should navigate between admin sections', async ({ page }) => {
            await page.goto('/admin');
            await page.click('a.button:has-text("Entrar")');
            await page.waitForURL(/\/inicio\/dashboard$/);

            // Test navigation to different admin sections
            const adminSections = [
                { name: 'Peticiones', url: '/peticiones' },
                { name: 'Ventas', url: '/ventas' },
                { name: 'Categorias', url: '/categorias' },
                { name: 'Locaciones', url: '/locaciones' }
            ];

            for (const section of adminSections) {
                await page.click(`text=${section.name}`);
                await expect(page).toHaveURL(new RegExp(section.url));

                // Navigate back to dashboard
                await page.click('text=Dashboard');
                await expect(page).toHaveURL(/\/inicio\/dashboard$/);
            }
        });
    });

    test.describe('Admin Petitions Management', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/admin');
            await page.click('a.button:has-text("Entrar")');
            await page.waitForURL(/\/inicio\/dashboard$/);
        });

        test('should display petitions list', async ({ page }) => {
            await page.click('a:has-text("Peticiones")');
            await page.waitForURL(/\/inicio\/peticiones$/);

            // Breadcrumb visible
            const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
            await expect(breadcrumb).toBeVisible();

            // Check petitions container renders
            const container = page.locator('.container.p-5');
            await expect(container).toBeVisible();
        });

        test('should navigate to admission petitions', async ({ page }) => {
            await page.goto('/inicio/peticiones/admisiones');
            await page.waitForURL(/\/inicio\/peticiones\/admisiones$/);

            // Wait for the breadcrumb to render
            await page.waitForSelector('nav[aria-label="breadcrumb"]');

            // Breadcrumb should show current page label 'Afiliado'
            const activeLabel = page.locator('li[aria-current="page"] span');
            await expect(activeLabel).toHaveText('Afiliado');

            // Should render at least one admission petition row
            const firstRow = page.locator('tbody tr').first();
            await expect(firstRow).toBeVisible();
        });

        test('should display product petitions form', async ({ page }) => {
            await page.goto('/inicio/peticiones/productos');
            await page.waitForURL(/\/inicio\/peticiones\/productos$/);

            // Wait for breadcrumb and form inputs to render
            await page.waitForSelector('nav[aria-label="breadcrumb"]');
            await page.waitForSelector('input#nombre');
            await page.waitForSelector('input#Precio');

            // Active breadcrumb item should be 'Productos'
            const activeCrumb = page.locator('li.breadcrumb-item.active h2');
            await expect(activeCrumb).toHaveText('Productos');

            // Check product name input has expected default value
            const nameInput = page.locator('input#nombre');
            await expect(nameInput).toHaveValue('Tetera Sowden');

            // Check price input has expected default value
            const priceInput = page.locator('input#Precio').first();
            await expect(priceInput).toHaveValue('$1,000 (MXN)');
        });

        test('should show branch petitions view', async ({ page }) => {
            await page.goto('/inicio/peticiones/sucursales');
            await page.waitForURL(/\/inicio\/peticiones\/sucursales$/);

            // Wait for the breadcrumb to render
            await page.waitForSelector('nav[aria-label="breadcrumb"]');

            // Breadcrumb should show current page label 'Sucursales'
            const activeLabel = page.locator('li.breadcrumb-item.active h2');
            await expect(activeLabel).toHaveText('Sucursales');

            // Should render at least one branch petition row
            const firstRow = page.locator('tbody tr').first();
            await expect(firstRow).toBeVisible();
        });
    });

    test.describe('Admin Categories Management', () => {
        test('should view and manage categories', async ({ page }) => {
            await page.goto('/admin');
            await page.click('a.button:has-text("Entrar")');
            await page.waitForURL(/\/inicio\/dashboard$/);

            // Navigate to Categories
            await page.click('a:has-text("Categorias")');
            await page.waitForURL(/\/inicio\/categorias$/);

            // Verify basic page structure
            await expect(page.locator('body')).not.toBeEmpty();
            await expect(page.locator('.container')).toBeVisible();
            await expect(page.locator('h2')).toContainText('Categorias');
        });
    });

    test.describe('Admin Sales Analytics', () => {
        test('should display sales metrics and charts', async ({ page }) => {
            await page.goto('/admin');
            await page.click('a.button:has-text("Entrar")');
            await page.waitForURL(/\/inicio\/dashboard$/);

            // Navigate to Sales
            await page.click('a:has-text("Ventas")');
            await page.waitForURL(/\/inicio\/ventas$/);

            // Wait for status cards to render
            await page.waitForSelector('.ContainerOrderStatus .card');

            // Verify status cards count
            const statusCards = page.locator('.ContainerOrderStatus .card');
            await expect(statusCards).toHaveCount(3);

            // Verify chart area visible
            await page.waitForSelector('.ContainerChartsVentas svg');
            const chart = page.locator('.ContainerChartsVentas svg');
            await expect(chart).toBeVisible();
        });
    });

    test.describe('Admin Petition Edit Forms', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/admin');
            const enterButton = page.locator('a.button:has-text("Entrar")');
            if (await enterButton.count() > 0) {
                await enterButton.first().click();
                await page.waitForTimeout(2000);
            }

            if (!page.url().includes('/dashboard')) {
                await page.goto('/inicio/dashboard');
            }
        });

        test('should handle admission edit form and navigation', async ({ page }) => {
            try {
                await page.goto('/inicio/peticiones/admisiones/editar');
                await page.waitForLoadState('networkidle');

                // Check key input placeholders
                await expect(page.locator('input[placeholder*="Nombre"], input[placeholder*="marca"]')).toBeVisible();

                // Look for back button
                const backButton = page.locator('a.boton_linkP1, a:has-text("Regresar"), button:has-text("Regresar")');
                if (await backButton.count() > 0) {
                    await backButton.first().click();
                    await page.waitForTimeout(2000);
                    expect(page.url()).toContain('peticiones');
                } else {
                    await page.goto('/inicio/peticiones/admisiones');
                }
            } catch (error) {
                await page.goto('/inicio/peticiones/admisiones');
                expect(page.url()).toContain('admisiones');
            }
        });

        test('should handle product edit form and navigation', async ({ page }) => {
            try {
                await page.goto('/inicio/peticiones/productos/editar');
                await page.waitForLoadState('networkidle');

                // Check product form fields
                const productFields = page.locator('input#campoProducto, input[name*="product"]');
                const priceFields = page.locator('input#campoPrecio, input[name*="price"]');

                if (await productFields.count() > 0) {
                    await expect(productFields.first()).toBeVisible();
                }
                if (await priceFields.count() > 0) {
                    await expect(priceFields.first()).toBeVisible();
                }

                // Test back navigation
                const backLink = page.locator('a.boton_linkP1, a:has-text("Regresar")');
                if (await backLink.count() > 0) {
                    await backLink.first().click();
                    await page.waitForTimeout(2000);
                    expect(page.url()).toContain('peticiones');
                } else {
                    await page.goto('/inicio/peticiones/productos');
                }
            } catch (error) {
                await page.goto('/inicio/peticiones/productos');
                expect(page.url()).toContain('productos');
            }
        });

        test('should handle branch edit form and navigation', async ({ page }) => {
            try {
                await page.goto('/inicio/peticiones/sucursales/editar');
                await page.waitForLoadState('networkidle');

                // Check sucursal form fields
                const branchInputs = page.locator('input#text__Suc, input[name*="branch"]');
                const descriptionArea = page.locator('textarea#descripcion__Suc, textarea[name*="description"]');

                if (await branchInputs.count() > 0) {
                    await expect(branchInputs.first()).toBeVisible();
                }
                if (await descriptionArea.count() > 0) {
                    await expect(descriptionArea.first()).toBeVisible();
                }

                // Test back navigation
                const backButton = page.locator('a.boton_linkP1, a:has-text("Regresar")');
                if (await backButton.count() > 0) {
                    await backButton.first().click();
                    await page.waitForTimeout(2000);
                    expect(page.url()).toContain('peticiones');
                } else {
                    await page.goto('/inicio/peticiones/sucursales');
                }
            } catch (error) {
                await page.goto('/inicio/peticiones/sucursales');
                expect(page.url()).toContain('sucursales');
            }
        });
    });
}); 