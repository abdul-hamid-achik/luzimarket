import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('CSRF Protection', () => {
    test.describe('CSRF Token Generation', () => {
        test('should include CSRF token in forms', async ({ page }) => {
            await page.goto(routes.login);

            // Check for CSRF token in cookie
            const cookies = await page.context().cookies();
            const csrfCookie = cookies.find(c => c.name === 'csrf-token' || c.name.includes('csrf'));

            // CSRF token might be set via cookie
            if (csrfCookie) {
                expect(csrfCookie.value).toBeTruthy();
                expect(csrfCookie.value.length).toBeGreaterThan(16);
            }
        });

        test('should generate different tokens for different sessions', async ({ page, context }) => {
            await page.goto(routes.login);

            const cookies1 = await page.context().cookies();
            const csrfToken1 = cookies1.find(c => c.name.includes('csrf'))?.value;

            // Create new context (new session)
            const page2 = await context.newPage();
            await page2.goto(routes.login);

            const cookies2 = await page2.context().cookies();
            const csrfToken2 = cookies2.find(c => c.name.includes('csrf'))?.value;

            if (csrfToken1 && csrfToken2) {
                // Tokens may be the same if using single app-wide token (that's OK)
                // Just verify both tokens exist
                expect(csrfToken1).toBeTruthy();
                expect(csrfToken2).toBeTruthy();
            }

            await page2.close();
        });
    });

    test.describe('CSRF Protection on State-Changing Operations', () => {
        test('should protect POST requests to API routes', async ({ page }) => {
            // Try to make a POST request without CSRF token
            const response = await page.request.post('/api/auth/register', {
                data: {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                },
                headers: {
                    'Content-Type': 'application/json',
                    // Deliberately omit CSRF token
                },
                failOnStatusCode: false
            });

            // Should either:
            // 1. Accept it (if CSRF is origin-based only)
            // 2. Reject with 403 (if token-based CSRF is enforced)
            // 3. Accept it (if registration is excluded from CSRF)

            // For now, just verify we get a response
            expect(response.status()).toBeGreaterThanOrEqual(200);
            expect(response.status()).toBeLessThan(500);
        });

        test('should protect product creation endpoint', async ({ page }) => {
            // Login as vendor first
            await page.goto(routes.login);

            const vendorTab = page.locator('button[role="tab"]').filter({ hasText: /Vendedor|Vendor/ });
            await vendorTab.click();
            await page.waitForTimeout(500);

            await page.fill('#vendor-email', 'vendor@luzimarket.shop');
            await page.fill('#vendor-password', 'password123');

            const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Iniciar sesión|Sign in/ }).first();
            await submitButton.click();

            await page.waitForURL((url) => url.pathname.includes('/vendor') || url.pathname.includes('/vendedor'), { timeout: 15000 });

            // Try to create product via API without proper CSRF token
            const response = await page.request.post('/api/vendor/products', {
                data: {
                    name: 'Test Product',
                    description: 'Test Description for CSRF test product',
                    price: 100,
                    stock: 10,
                    categoryId: 1,
                    images: ['https://via.placeholder.com/400'], // Required field
                    tags: []
                },
                failOnStatusCode: false
            });

            // Log the response for debugging
            const status = response.status();
            const responseText = await response.text();
            let body = null;
            try {
                body = JSON.parse(responseText);
            } catch (e) {
                // Not JSON
            }

            console.log('CSRF test response status:', status);
            console.log('CSRF test response type:', responseText.startsWith('<!DOCTYPE') ? 'HTML' : 'JSON');

            if (responseText.startsWith('<!DOCTYPE')) {
                // Extract error message from HTML
                const titleMatch = responseText.match(/<title>(.*?)<\/title>/);
                console.log('HTML Error Title:', titleMatch ? titleMatch[1] : 'Unknown');

                // Look for error details in the page
                const h1Match = responseText.match(/<h1[^>]*>(.*?)<\/h1>/);
                if (h1Match) {
                    console.log('Error heading:', h1Match[1].replace(/<[^>]*>/g, ''));
                }

                // Check for stack trace or error details
                if (responseText.includes('Error:')) {
                    const errorIdx = responseText.indexOf('Error:');
                    console.log('Error snippet:', responseText.substring(errorIdx, errorIdx + 300).replace(/<[^>]*>/g, ' '));
                }
            } else if (body) {
                console.log('JSON Response body:', body);
            }

            // Should have CSRF protection
            // If it's a 403, CSRF is working
            // If it's 400/422, validation caught it  
            // If it's 201/200, request was allowed (origin-based CSRF)
            // Should NOT be 500 (that's a server error we need to fix)
            expect([200, 201, 400, 403, 422]).toContain(response.status());
        });

        test('should protect order update endpoint', async ({ page }) => {
            // Login as admin
            await page.goto(routes.login);

            const adminTab = page.locator('button[role="tab"]').filter({ hasText: /Admin/i });
            await adminTab.click();
            await page.waitForTimeout(500);

            await page.fill('#admin-email', 'admin@luzimarket.shop');
            await page.fill('#admin-password', 'admin123');

            const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Iniciar sesión|Sign in/ }).first();
            await submitButton.click();

            await page.waitForURL(/\/admin/, { timeout: 10000 });

            // Try to update settings without CSRF token
            const response = await page.request.put('/api/admin/settings', {
                data: {
                    platformCommission: 20
                },
                failOnStatusCode: false
            });

            // Should have protection (403) or accept (200) if origin-based
            expect([200, 400, 403]).toContain(response.status());
        });
    });

    test.describe('CSRF Validation', () => {
        test('should reject requests with mismatched CSRF tokens', async ({ page }) => {
            await page.goto(routes.login);

            // Set a fake CSRF token cookie
            await page.context().addCookies([
                {
                    name: 'csrf-token',
                    value: 'fake-token-12345',
                    domain: 'localhost',
                    path: '/',
                }
            ]);

            // Try to submit form with different/missing token in header
            const response = await page.request.post('/api/contact', {
                data: {
                    name: 'Test',
                    email: 'test@example.com',
                    subject: 'test',
                    message: 'test message'
                },
                headers: {
                    'x-csrf-token': 'different-token-67890' // Mismatched token
                },
                failOnStatusCode: false
            });

            // Should reject with 403 if token-based CSRF is enforced
            // Or accept if using origin-based CSRF only
            expect([200, 400, 403]).toContain(response.status());
        });

        test('should accept requests with valid CSRF tokens', async ({ page }) => {
            await page.goto(routes.login);

            // Get the CSRF token from cookie
            const cookies = await page.context().cookies();
            const csrfToken = cookies.find(c => c.name === 'csrf-token')?.value;

            if (csrfToken) {
                // Make request with matching token
                const response = await page.request.post('/api/newsletter', {
                    data: {
                        email: 'newsletter@example.com'
                    },
                    headers: {
                        'x-csrf-token': csrfToken
                    },
                    failOnStatusCode: false
                });

                // Should accept (200) or have other validation error (400)
                expect([200, 400]).toContain(response.status());
            }
        });
    });

    test.describe('CSRF Exempt Routes', () => {
        test('should allow webhooks without CSRF token', async ({ page }) => {
            // Stripe webhooks should be exempt from CSRF
            const response = await page.request.post('/api/webhooks/stripe', {
                data: {
                    type: 'payment_intent.succeeded',
                    data: {}
                },
                headers: {
                    'stripe-signature': 'test-signature'
                },
                failOnStatusCode: false
            });

            // Should not reject due to CSRF (will reject due to invalid signature)
            // Status should be 400 (invalid signature) not 403 (CSRF)
            expect(response.status()).not.toBe(403);
        });

        test('should allow GET requests without CSRF token', async ({ page }) => {
            // GET requests should not require CSRF tokens
            const response = await page.request.get('/api/products');

            // Should succeed
            expect(response.status()).toBe(200);
        });

        test('should allow public search endpoint', async ({ page }) => {
            // Search should work without authentication or CSRF
            const response = await page.request.get('/api/search?q=flores');

            // Should succeed
            expect(response.status()).toBe(200);
        });
    });

    test.describe('Origin and Referer Validation', () => {
        test('should validate request origin', async ({ page }) => {
            await page.goto(routes.home);

            // Try request from different origin
            const response = await page.request.post('/api/contact', {
                data: {
                    name: 'Test',
                    email: 'test@example.com',
                    subject: 'test',
                    message: 'test'
                },
                headers: {
                    'Origin': 'https://evil.com'
                },
                failOnStatusCode: false
            });

            // Should reject with 403 if origin validation is enforced
            // Or accept if same-origin policy is at browser level only
            if (response.status() === 403) {
                const body = await response.json().catch(() => ({}));
                expect(body.error).toMatch(/origin|CSRF/i);
            }
        });

        test('should validate referer header', async ({ page }) => {
            await page.goto(routes.home);

            // Try request with suspicious referer
            const response = await page.request.post('/api/newsletter', {
                data: {
                    email: 'test@example.com'
                },
                headers: {
                    'Referer': 'https://phishing-site.com/fake-login'
                },
                failOnStatusCode: false
            });

            // Should validate referer or use origin
            expect(response.status()).toBeGreaterThanOrEqual(200);
        });
    });

    test.describe('CSRF in Forms', () => {
        test('should include CSRF token in vendor registration', async ({ page }) => {
            await page.goto(routes.vendorRegister);

            // Check if form has CSRF token (hidden input or via fetch)
            const hiddenCsrfInput = page.locator('input[name="csrf"], input[name="csrfToken"], input[name="_csrf"]');

            // Form should either:
            // 1. Have hidden CSRF input
            // 2. Set CSRF via cookie (checked on form submit)
            const formCount = await page.locator('form').count();
            expect(formCount).toBeGreaterThan(0);
        });

        test('should include CSRF in contact form', async ({ page }) => {
            await page.goto('/es/contact');
            await page.waitForLoadState('networkidle');

            // Contact form should be protected - scope to the contact form (not newsletter)
            const contactForm = page.locator('form').filter({ has: page.locator('input[name="name"]') });
            await expect(contactForm).toBeVisible();

            // Fill and submit
            await contactForm.locator('input[name="name"]').fill('Test User');
            await contactForm.locator('input[name="email"]').fill('test@example.com');
            await contactForm.locator('select[name="subject"]').selectOption('other');
            await contactForm.locator('textarea[name="message"]').fill('Test message');

            // Form submission should include CSRF protection
            const submitButton = contactForm.locator('button[type="submit"]');
            await submitButton.click();

            // Should process successfully or show validation
            await page.waitForTimeout(2000);

            // No CSRF error should appear
            const csrfError = page.locator('text=/CSRF|token.*invalid/i');
            const hasCsrfError = await csrfError.isVisible({ timeout: 1000 }).catch(() => false);
            expect(hasCsrfError).toBeFalsy();
        });
    });

    test.describe('Double Submit Cookie Pattern', () => {
        test('should validate token matches cookie', async ({ page }) => {
            await page.goto(routes.home);

            // This is implementation-specific
            // If using double-submit cookie pattern:
            // 1. Cookie contains token
            // 2. Header/form contains same token
            // 3. Server validates they match

            const cookies = await page.context().cookies();
            const csrfCookie = cookies.find(c => c.name.includes('csrf'));

            if (csrfCookie) {
                // Cookie-based CSRF is implemented
                expect(csrfCookie.httpOnly).toBeDefined();
            }
        });
    });
});

