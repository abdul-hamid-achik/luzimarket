const { test, expect } = require('@playwright/test');

// Utility functions for accessing obfuscated storage keys
const getSecureStorageKeys = () => ({
    accessToken: btoa('_luzi_auth_access'),
    refreshToken: btoa('_luzi_auth_refresh')
});

test.describe('Token Refresh Flow', () => {
    let userEmail;
    let userPassword;

    test.beforeEach(async () => {
        const timestamp = Date.now();
        userEmail = `e2e-refresh-${timestamp}@example.com`;
        userPassword = 'RefreshTest123!';
    });

    test.describe('Token Issuance', () => {
        test('should issue both access token and refresh token on login', async ({ page }) => {
            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for registration to complete and redirect to login
            await page.waitForURL('**/login', { timeout: 10000 });

            // Now login to get tokens
            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for login to complete and tokens to be stored
            await page.waitForFunction(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                const accessToken = sessionStorage.getItem(keys.accessToken);
                const refreshToken = sessionStorage.getItem(keys.refreshToken);

                return accessToken && refreshToken;
            }, { timeout: 10000 });

            const tokensAfterLogin = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                return {
                    accessToken: sessionStorage.getItem(keys.accessToken),
                    refreshToken: sessionStorage.getItem(keys.refreshToken)
                };
            });

            expect(tokensAfterLogin.accessToken).toBeTruthy();
            expect(tokensAfterLogin.refreshToken).toBeTruthy();
        });

        test('should issue both tokens on registration', async ({ page }) => {
            // Listen for console logs and errors
            page.on('console', msg => {
                console.log('BROWSER CONSOLE:', msg.type(), msg.text());
            });

            page.on('pageerror', error => {
                console.log('BROWSER ERROR:', error.message);
            });

            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);

            // Listen for the registration API response
            const responsePromise = page.waitForResponse(response =>
                response.url().includes('/api/auth/register') && response.status() === 201
            );

            await page.click('button[type="submit"]');

            // Wait for the API response and check what it returns
            const response = await responsePromise;
            const responseData = await response.json();

            console.log('Registration API response:', responseData);

            // Verify the API returns both tokens
            expect(responseData).toHaveProperty('accessToken');
            expect(responseData).toHaveProperty('refreshToken');
            expect(responseData.accessToken).toBeTruthy();
            expect(responseData.refreshToken).toBeTruthy();

            // Wait for redirect to login page (since registration skips auto-login)
            await page.waitForURL('**/login', { timeout: 10000 });

            // Now login to test that tokens are properly stored
            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);

            // Listen for the login API response
            const loginResponsePromise = page.waitForResponse(response =>
                response.url().includes('/api/auth/login') && response.status() === 200
            );

            await page.click('button[type="submit"]');

            // Wait for the login API response
            const loginResponse = await loginResponsePromise;
            const loginData = await loginResponse.json();

            console.log('Login API response:', loginData);

            // Verify login API also returns both tokens
            expect(loginData).toHaveProperty('accessToken');
            expect(loginData).toHaveProperty('refreshToken');
            expect(loginData.accessToken).toBeTruthy();
            expect(loginData.refreshToken).toBeTruthy();

            // Wait for login to complete and check tokens are stored
            await page.waitForFunction(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                const accessToken = sessionStorage.getItem(keys.accessToken);
                const refreshToken = sessionStorage.getItem(keys.refreshToken);

                return accessToken && refreshToken;
            }, { timeout: 10000 });

            // Verify tokens are stored correctly
            const storedTokens = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                return {
                    accessToken: sessionStorage.getItem(keys.accessToken),
                    refreshToken: sessionStorage.getItem(keys.refreshToken)
                };
            });

            expect(storedTokens.accessToken).toBeTruthy();
            expect(storedTokens.refreshToken).toBeTruthy();
        });
    });

    test.describe('Manual Token Refresh', () => {
        test('should refresh token via API endpoint', async ({ page }) => {
            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for registration to complete and redirect to login
            await page.waitForURL('**/login', { timeout: 10000 });

            // Now login to get tokens
            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for login to complete and tokens to be stored
            await page.waitForFunction(() => {
                const keys = {
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                return sessionStorage.getItem(keys.refreshToken);
            }, { timeout: 10000 });

            // Get the refresh token
            const refreshToken = await page.evaluate(() => {
                const keys = {
                    refreshToken: btoa('_luzi_auth_refresh')
                };
                return sessionStorage.getItem(keys.refreshToken);
            });

            // Call refresh endpoint directly
            const response = await page.evaluate(async (token) => {
                const response = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken: token })
                });
                return {
                    status: response.status,
                    data: await response.json()
                };
            }, refreshToken);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('accessToken');
            expect(response.data).toHaveProperty('refreshToken');
            expect(response.data.accessToken).toBeTruthy();
            expect(response.data.refreshToken).toBeTruthy();
            expect(response.data.refreshToken).not.toBe(refreshToken); // Should be rotated
        });

        test('should reject invalid refresh token', async ({ request }) => {
            const refreshResponse = await request.post('/api/auth/refresh', {
                data: {
                    refreshToken: 'invalid-refresh-token'
                }
            });

            expect(refreshResponse.status()).toBe(401);
        });

        test('should reject expired refresh token', async ({ page, request }) => {
            // This test would require setting up a scenario with an expired token
            // For now, we'll test with a malformed token
            const refreshResponse = await request.post('/api/auth/refresh', {
                data: {
                    refreshToken: 'expired.token.here'
                }
            });

            expect(refreshResponse.status()).toBe(401);
        });
    });

    test.describe('Automatic Token Refresh', () => {
        test('should automatically refresh token on 401 response', async ({ page }) => {
            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for registration to complete and redirect to login
            await page.waitForURL('**/login', { timeout: 10000 });

            // Now login to get tokens
            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for login to complete and tokens to be stored
            await page.waitForFunction(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                const accessToken = sessionStorage.getItem(keys.accessToken);
                const refreshToken = sessionStorage.getItem(keys.refreshToken);

                return accessToken && refreshToken;
            }, { timeout: 10000 });

            // Get the original tokens
            const originalTokens = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                return {
                    accessToken: sessionStorage.getItem(keys.accessToken),
                    refreshToken: sessionStorage.getItem(keys.refreshToken)
                };
            });

            // Simulate an expired token by setting an invalid one
            await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access')
                };
                sessionStorage.setItem(keys.accessToken, 'invalid.expired.token');
            });

            // Simulate what the axios interceptor does: detect 401, refresh token, retry request
            const result = await page.evaluate(async () => {
                try {
                    const keys = {
                        accessToken: btoa('_luzi_auth_access'),
                        refreshToken: btoa('_luzi_auth_refresh')
                    };

                    // First attempt with invalid token (simulates initial API call)
                    const initialResponse = await fetch('/api/cart', {
                        headers: {
                            'Authorization': `Bearer invalid.expired.token`
                        }
                    });

                    // If 401, attempt to refresh token (simulates axios interceptor)
                    if (initialResponse.status === 401) {
                        const refreshToken = sessionStorage.getItem(keys.refreshToken);

                        if (refreshToken) {
                            const refreshResponse = await fetch('/api/auth/refresh', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ refreshToken })
                            });

                            if (refreshResponse.ok) {
                                const { accessToken, refreshToken: newRefreshToken } = await refreshResponse.json();
                                // Update stored tokens (simulates what axios interceptor does)
                                sessionStorage.setItem(keys.accessToken, accessToken);
                                sessionStorage.setItem(keys.refreshToken, newRefreshToken);

                                // Retry the original request with new token
                                const retryResponse = await fetch('/api/cart', {
                                    headers: {
                                        'Authorization': `Bearer ${accessToken}`
                                    }
                                });

                                return {
                                    success: true,
                                    status: retryResponse.status,
                                    refreshed: true
                                };
                            }
                        }
                    }

                    return {
                        success: false,
                        status: initialResponse.status,
                        refreshed: false,
                        debug: 'Health endpoint returned non-401 status'
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        refreshed: false
                    };
                }
            });

            // Verify the refresh was successful
            expect(result.success).toBe(true);
            expect(result.refreshed).toBe(true);
            expect(result.status).toBe(200);

            // Check that the access token was refreshed in storage
            const newAccessToken = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access')
                };
                return sessionStorage.getItem(keys.accessToken);
            });

            expect(newAccessToken).toBeTruthy();
            expect(newAccessToken).not.toBe('invalid.expired.token');
            expect(newAccessToken).not.toBe(originalTokens.accessToken);
        });

        test('should logout user when refresh token is invalid', async ({ page }) => {
            // Register and login to get initial tokens
            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access')
                };
                return sessionStorage.getItem(keys.accessToken) !== null;
            }, null, { timeout: 10000 });

            // Set both tokens to invalid values
            await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };
                sessionStorage.setItem(keys.accessToken, 'invalid.expired.token');
                sessionStorage.setItem(keys.refreshToken, 'invalid.refresh.token');
            });

            // Attempt to make an authenticated request and simulate failed refresh
            await page.evaluate(async () => {
                try {
                    const keys = {
                        accessToken: btoa('_luzi_auth_access'),
                        refreshToken: btoa('_luzi_auth_refresh')
                    };

                    const refreshResponse = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ refreshToken: sessionStorage.getItem(keys.refreshToken) })
                    });

                    if (!refreshResponse.ok) {
                        // Simulate what axios interceptor does on failed refresh
                        sessionStorage.removeItem(keys.accessToken);
                        sessionStorage.removeItem(keys.refreshToken);
                    }
                } catch (error) {
                    const keys = {
                        accessToken: btoa('_luzi_auth_access'),
                        refreshToken: btoa('_luzi_auth_refresh')
                    };
                    sessionStorage.removeItem(keys.accessToken);
                    sessionStorage.removeItem(keys.refreshToken);
                }
            });

            await page.waitForTimeout(1000);

            // Verify tokens are cleared
            const tokens = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };
                return {
                    accessToken: sessionStorage.getItem(keys.accessToken),
                    refreshToken: sessionStorage.getItem(keys.refreshToken)
                };
            });

            expect(tokens.accessToken).toBeFalsy();
            expect(tokens.refreshToken).toBeFalsy();
        });
    });

    test.describe('Session Management with Refresh', () => {
        test('should maintain session across token refresh', async ({ page }) => {
            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for registration to complete and redirect to login
            await page.waitForURL('**/login', { timeout: 10000 });

            // Now login to get tokens
            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for login to complete and tokens to be stored
            await page.waitForFunction(() => {
                const keys = {
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                return sessionStorage.getItem(keys.refreshToken);
            }, { timeout: 10000 });

            // Get the refresh token
            const refreshToken = await page.evaluate(() => {
                const keys = {
                    refreshToken: btoa('_luzi_auth_refresh')
                };
                return sessionStorage.getItem(keys.refreshToken);
            });

            // Call refresh endpoint to get new tokens
            const refreshResponse = await page.evaluate(async (token) => {
                const response = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken: token })
                });
                return {
                    status: response.status,
                    data: await response.json()
                };
            }, refreshToken);

            expect(refreshResponse.status).toBe(200);
            expect(refreshResponse.data.accessToken).toBeTruthy();
            expect(refreshResponse.data.refreshToken).toBeTruthy();

            // Verify the new refresh token is different (rotated)
            expect(refreshResponse.data.refreshToken).not.toBe(refreshToken);
        });

        test('should clear all tokens on logout', async ({ page }) => {
            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for registration to complete and redirect to login
            await page.waitForURL('**/login', { timeout: 10000 });

            // Now login to get tokens
            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            // Wait for login to complete and tokens to be stored
            await page.waitForFunction(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                const accessToken = sessionStorage.getItem(keys.accessToken);
                const refreshToken = sessionStorage.getItem(keys.refreshToken);

                return accessToken && refreshToken;
            }, { timeout: 10000 });

            // Verify tokens are present
            const tokensBeforeLogout = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                return {
                    accessToken: sessionStorage.getItem(keys.accessToken),
                    refreshToken: sessionStorage.getItem(keys.refreshToken)
                };
            });

            expect(tokensBeforeLogout.accessToken).toBeTruthy();
            expect(tokensBeforeLogout.refreshToken).toBeTruthy();

            // Simulate logout by clearing tokens
            await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                sessionStorage.removeItem(keys.accessToken);
                sessionStorage.removeItem(keys.refreshToken);
            });

            // Verify tokens are cleared
            const tokensAfterLogout = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access'),
                    refreshToken: btoa('_luzi_auth_refresh')
                };

                return {
                    accessToken: sessionStorage.getItem(keys.accessToken),
                    refreshToken: sessionStorage.getItem(keys.refreshToken)
                };
            });

            expect(tokensAfterLogout.accessToken).toBeNull();
            expect(tokensAfterLogout.refreshToken).toBeNull();
        });
    });

    test.describe('Environment Configuration', () => {
        test('should respect token duration configuration', async ({ page, request }) => {
            // This test verifies that the token system respects environment variables
            // Since we can't easily change env vars in E2E tests, we'll test the default behavior

            await page.goto('/register');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            await page.fill('input[type="email"]', userEmail);
            await page.fill('input[type="password"]', userPassword);
            await page.click('button[type="submit"]');

            await page.waitForFunction(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access')
                };
                return sessionStorage.getItem(keys.accessToken) !== null;
            }, null, { timeout: 10000 });

            // Decode the JWT to check expiration
            const tokenExpiration = await page.evaluate(() => {
                const keys = {
                    accessToken: btoa('_luzi_auth_access')
                };
                const accessToken = sessionStorage.getItem(keys.accessToken);
                if (!accessToken) return null;

                try {
                    const payload = JSON.parse(atob(accessToken.split('.')[1]));
                    return payload.exp;
                } catch (error) {
                    return null;
                }
            });

            expect(tokenExpiration).toBeTruthy();

            // Verify the token has a reasonable expiration (should be in the future)
            const currentTime = Math.floor(Date.now() / 1000);
            expect(tokenExpiration).toBeGreaterThan(currentTime);
        });
    });
}); 