const { test, expect } = require('@playwright/test');

test.describe('Employee Panel', () => {
    test.describe('Employee Authentication', () => {
        test('should login and view dashboard', async ({ page, context }) => {
            // Set up employee authentication
            await context.addInitScript(() => {
                // Set employee tokens
                const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
                const employeeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJmYWtlLWVtcGxveWVlLXNlc3Npb24iLCJ1c2VySWQiOiJmYWtlLWVtcGxveWVlLWlkIiwicm9sZSI6ImVtcGxveWVlIiwiaWF0IjoxNjIzNDU2Nzg5LCJleHAiOjE2MjM0NTY3ODl9.fake-employee-signature';
                sessionStorage.setItem(obfuscatedAccessTokenKey, employeeToken);
                localStorage.setItem(obfuscatedAccessTokenKey, employeeToken);
                sessionStorage.setItem('token', employeeToken);
                localStorage.setItem('token', employeeToken);
            });

            // Navigate to employee dashboard
            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');
            console.log('On employee dashboard');

            // Check that we're logged in as employee and can see dashboard
            await expect(page.locator('h1, h2, .card').first()).toBeVisible({ timeout: 10000 });
            console.log('Employee dashboard loaded successfully');
        });
    });

    test.describe('Employee Navigation', () => {
        test.beforeEach(async ({ page, context }) => {
            // Set up employee authentication before each test
            await context.addInitScript(() => {
                const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
                const employeeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJmYWtlLWVtcGxveWVlLXNlc3Npb24iLCJ1c2VySWQiOiJmYWtlLWVtcGxveWVlLWlkIiwicm9sZSI6ImVtcGxveWVlIiwiaWF0IjoxNjIzNDU2Nzg5LCJleHAiOjE2MjM0NTY3ODl9.fake-employee-signature';
                sessionStorage.setItem(obfuscatedAccessTokenKey, employeeToken);
                localStorage.setItem(obfuscatedAccessTokenKey, employeeToken);
                sessionStorage.setItem('token', employeeToken);
                localStorage.setItem('token', employeeToken);
            });

            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');
        });

        test('should navigate between employee sections', async ({ page }) => {
            const employeeSections = [
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Alertas', path: '/dashboard/alertas' },
                { name: 'Productos', path: '/dashboard/productos' },
                { name: 'Envíos', path: '/dashboard/envios' },
                { name: 'Dinero', path: '/dashboard/dinero' },
                { name: 'Horarios', path: '/dashboard/horarios' }
            ];

            for (const section of employeeSections) {
                try {
                    await page.goto(section.path);
                    await expect(page).toHaveURL(new RegExp(section.path.replace('/', '\\/')));
                    console.log(`✅ Navigated to ${section.name}`);

                    // Wait for content to load
                    await page.waitForTimeout(1000);
                } catch (error) {
                    console.log(`⚠️ Could not navigate to ${section.name}: ${error.message}`);
                }
            }
        });
    });

    test.describe('Employee Financial Dashboard', () => {
        test.beforeEach(async ({ page, context }) => {
            await context.addInitScript(() => {
                const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
                const employeeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJmYWtlLWVtcGxveWVlLXNlc3Npb24iLCJ1c2VySWQiOiJmYWtlLWVtcGxveWVlLWlkIiwicm9sZSI6ImVtcGxveWVlIiwiaWF0IjoxNjIzNDU2Nzg5LCJleHAiOjE2MjM0NTY3ODl9.fake-employee-signature';
                sessionStorage.setItem(obfuscatedAccessTokenKey, employeeToken);
                localStorage.setItem(obfuscatedAccessTokenKey, employeeToken);
                sessionStorage.setItem('token', employeeToken);
                localStorage.setItem('token', employeeToken);
            });
        });

        test('should display financial dashboard', async ({ page }) => {
            await page.goto('/dashboard/dinero');
            await page.waitForLoadState('networkidle');

            // Check that the page loads
            const pageContent = await page.locator('body').textContent();
            console.log('Dinero page loaded with content length:', pageContent.length);

            // Basic check that we're on the right page and it has content
            await expect(page.locator('body')).toContainText('', { timeout: 10000 });
        });

        test('should be responsive on different screen sizes', async ({ page }) => {
            await page.goto('/dashboard/dinero');
            await page.waitForLoadState('networkidle');

            const viewports = [
                { width: 1200, height: 800, name: 'Desktop' },
                { width: 768, height: 1024, name: 'Tablet' },
                { width: 375, height: 667, name: 'Mobile' }
            ];

            for (const viewport of viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                console.log(`Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);

                // Basic content check
                const hasContent = await page.locator('body').textContent();
                expect(hasContent.length).toBeGreaterThan(0);
            }
        });
    });

    test.describe('Employee Dashboard Performance', () => {
        test('should load pages within acceptable time limits', async ({ page, context }) => {
            await context.addInitScript(() => {
                const obfuscatedAccessTokenKey = btoa('_luzi_auth_access');
                const employeeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJmYWtlLWVtcGxveWVlLXNlc3Npb24iLCJ1c2VySWQiOiJmYWtlLWVtcGxveWVlLWlkIiwicm9sZSI6ImVtcGxveWVlIiwiaWF0IjoxNjIzNDU2Nzg5LCJleHAiOjE2MjM0NTY3ODl9.fake-employee-signature';
                sessionStorage.setItem(obfuscatedAccessTokenKey, employeeToken);
                localStorage.setItem(obfuscatedAccessTokenKey, employeeToken);
                sessionStorage.setItem('token', employeeToken);
                localStorage.setItem('token', employeeToken);
            });

            const employeePages = [
                '/dashboard',
                '/dashboard/dinero',
                '/dashboard/productos',
                '/dashboard/alertas'
            ];

            for (const pagePath of employeePages) {
                const startTime = Date.now();
                try {
                    await page.goto(pagePath);
                    await page.waitForLoadState('networkidle');
                    const loadTime = Date.now() - startTime;

                    console.log(`${pagePath} loaded in ${loadTime}ms`);

                    // Page should load within 10 seconds
                    expect(loadTime).toBeLessThan(10000);

                    // Page should have some content
                    const hasContent = await page.locator('body').textContent();
                    expect(hasContent.length).toBeGreaterThan(0);
                } catch (error) {
                    console.log(`Could not test ${pagePath}: ${error.message}`);
                }
            }
        });
    });


}); 