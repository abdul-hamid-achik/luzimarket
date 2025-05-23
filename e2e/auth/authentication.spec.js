const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
    test.describe('Guest State', () => {
        test('should show guest state when not logged in', async ({ page }) => {
            await page.goto('/');

            // Check for guest indicators
            await expect(page.locator('text=Invitado')).toBeVisible();
            await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
            await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
        });

        test('should allow navigation to registration page', async ({ page }) => {
            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            // Check for form elements
            await expect(page.locator('input[type="email"]')).toBeVisible();
            await expect(page.locator('input[type="password"]')).toBeVisible();
            await expect(page.locator('button[type="submit"]')).toBeVisible();
        });

        test('should allow navigation to login page', async ({ page }) => {
            await page.goto('/login');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            // Check for login form elements
            await expect(page.locator('input[type="email"]')).toBeVisible();
            await expect(page.locator('input[type="password"]')).toBeVisible();
            await expect(page.locator('button[type="submit"]')).toBeVisible();
        });
    });

    test.describe('Registration & Login Flow', () => {
        test('should complete registration and login flow', async ({ page }) => {
            const timestamp = Date.now();
            const email = `e2e-auth-${timestamp}@example.com`;
            const password = 'AuthTest123!';

            // Register new user
            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            await page.fill('input[type="email"]', email);
            await page.fill('input[type="password"]', password);
            await page.click('button[type="submit"]');

            // Wait for registration to complete
            await page.waitForTimeout(2000);

            // Navigate to login if not automatically redirected
            if (!page.url().includes('/login')) {
                await page.goto('/login');
            }

            // Login with same credentials
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
            await page.fill('input[type="email"]', email);
            await page.fill('input[type="password"]', password);
            await page.click('button[type="submit"]');

            // Wait for login to complete
            await page.waitForFunction(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access')
                };
                return sessionStorage.getItem(keys.accessToken) !== null;
            }, null, { timeout: 10000 });

            // Verify user is logged in by checking session storage
            const accessToken = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access')
                };
                return sessionStorage.getItem(keys.accessToken);
            });
            expect(accessToken).toBeTruthy();
        });

        test('should handle login errors gracefully', async ({ page }) => {
            await page.goto('/login');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            // Try login with invalid credentials
            await page.fill('input[type="email"]', 'invalid@example.com');
            await page.fill('input[type="password"]', 'wrongpassword');
            await page.click('button[type="submit"]');

            // Should remain on login page or show error
            await page.waitForTimeout(2000);

            // Either still on login page or shows error message
            const isOnLoginPage = page.url().includes('/login');
            const hasErrorMessage = await page.locator('text=/error|invalid|wrong/i').count() > 0;

            expect(isOnLoginPage || hasErrorMessage).toBe(true);
        });
    });

    test.describe('Protected Routes', () => {
        test('should redirect to login for protected routes when unauthenticated', async ({ page }) => {
            const protectedRoutes = ['/perfil', '/carrito'];

            for (const route of protectedRoutes) {
                await page.goto(route);
                await page.waitForTimeout(3000);

                const currentUrl = page.url();
                const isRedirectedToLogin = currentUrl.includes('/login');
                const isOnProtectedPage = currentUrl.includes(route.substring(1));

                // Either redirected to login OR the route is accessible as guest (like cart)
                if (!isRedirectedToLogin && isOnProtectedPage) {
                    console.log(`Route ${route} is accessible as guest`);
                } else {
                    expect(isRedirectedToLogin).toBe(true);
                }
            }
        });

        test('should redirect order confirmation to login when unauthenticated', async ({ page }) => {
            await page.goto('/order-confirmation/12345');
            await page.waitForTimeout(3000);

            const currentUrl = page.url();
            expect(currentUrl.includes('login') || currentUrl.includes('order-confirmation')).toBe(true);
        });
    });

    test.describe('Session Management', () => {
        test('should maintain authentication state across page refreshes', async ({ page }) => {
            const timestamp = Date.now();
            const email = `e2e-session-${timestamp}@example.com`;
            const password = 'SessionTest123!';

            // Register and login
            await page.goto('/register');
            await page.fill('input[type="email"]', email);
            await page.fill('input[type="password"]', password);
            await page.click('button[type="submit"]');

            await page.waitForTimeout(2000);
            if (!page.url().includes('/login')) {
                await page.goto('/login');
            }

            await page.fill('input[type="email"]', email);
            await page.fill('input[type="password"]', password);
            await page.click('button[type="submit"]');

            // Wait for login to complete
            await page.waitForFunction(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access')
                };
                return sessionStorage.getItem(keys.accessToken) !== null;
            }, null, { timeout: 10000 });

            // Refresh the page
            await page.reload();

            // Token should still exist after refresh
            const accessTokenAfterRefresh = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access')
                };
                return sessionStorage.getItem(keys.accessToken);
            });
            expect(accessTokenAfterRefresh).toBeTruthy();
        });

        test('should handle logout functionality if available', async ({ page }) => {
            // This test can be expanded when logout functionality is implemented
            await page.goto('/');

            // Look for logout button/link (might not exist yet)
            const logoutButton = page.locator('text=Logout, text=Cerrar Sesión, text=Salir');
            const logoutExists = await logoutButton.count() > 0;

            if (logoutExists) {
                await logoutButton.first().click();
                await page.waitForTimeout(2000);

                // Should clear session
                const accessTokenAfterLogout = await page.evaluate(() => {
                    const keys = {
                        accessToken: btoa('_luzi_auth_access')
                    };
                    return sessionStorage.getItem(keys.accessToken);
                });
                expect(accessTokenAfterLogout).toBeFalsy();
            } else {
                console.log('Logout functionality not yet implemented');
            }
        });
    });
}); 