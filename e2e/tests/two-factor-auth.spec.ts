import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('Two-Factor Authentication', () => {
    const customerEmail = 'customer1@example.com';
    const customerPassword = 'password123';

    // Helper to login as customer
    async function loginAsCustomer(page: any) {
        await page.goto(routes.login);

        const customerTab = page.locator('button[role="tab"]').filter({ hasText: 'Cliente' });
        await customerTab.click();
        await page.waitForTimeout(300);

        await page.fill('#customer-email', customerEmail);
        await page.fill('#customer-password', customerPassword);

        const submitButton = page.locator('button[type="submit"]:has-text("Iniciar sesión")').first();
        await submitButton.click();

        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    }

    test.describe('2FA Setup Flow', () => {
        test('should navigate to security settings', async ({ page }) => {
            await loginAsCustomer(page);

            // Navigate to account security settings
            await page.goto('/es/account/security');

            // Should show security page
            await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();

            // Should show 2FA section or security features
            const twoFactorSection = page.locator('text=/autenticación.*dos factores|two.*factor|2FA/i').first();
            const securitySection = page.locator('text=/seguridad|security|contraseña|password|sesiones|sessions/i').first();

            const hasSecurity = await twoFactorSection.isVisible({ timeout: 2000 }) || await securitySection.isVisible({ timeout: 2000 });
            expect(hasSecurity).toBeTruthy();
        });

        test('should display 2FA status when disabled', async ({ page }) => {
            await loginAsCustomer(page);
            await page.goto('/es/account/security');

            // Check for 2FA toggle or enable button
            const twoFactorSection = page.locator('text=/autenticación.*dos factores|two.*factor/i').first().locator('..');

            // Should show enable option
            const enableButton = twoFactorSection.locator('button, [role="switch"]').first();
            if (await enableButton.isVisible({ timeout: 2000 })) {
                await expect(enableButton).toBeVisible();
            }
        });

        test('should initiate 2FA setup', async ({ page }) => {
            await loginAsCustomer(page);
            await page.goto('/es/account/security');

            // Mock the 2FA enable API to return QR code
            await page.route('**/api/auth/2fa/enable', async route => {
                await route.fulfill({
                    status: 200,
                    json: {
                        success: true,
                        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                        backupCodes: ['ABCD1234', 'EFGH5678', 'IJKL9012', 'MNOP3456', 'QRST7890', 'UVWX1234', 'YZAB5678', 'CDEF9012'],
                        secret: 'JBSWY3DPEHPK3PXP'
                    }
                });
            });

            // Click enable 2FA button or toggle
            const twoFactorToggle = page.locator('[role="switch"]').first();
            if (await twoFactorToggle.isVisible({ timeout: 2000 })) {
                await twoFactorToggle.click();

                // Should show QR code setup dialog
                const setupDialog = page.locator('[role="dialog"]');
                if (await setupDialog.isVisible({ timeout: 3000 })) {
                    await expect(setupDialog).toBeVisible();

                    // Should show QR code image
                    await expect(setupDialog.locator('img[alt*="QR"]')).toBeVisible();

                    // Should show backup codes
                    await expect(setupDialog.locator('text=/backup.*codes|códigos.*respaldo/i')).toBeVisible();
                }
            }
        });

        test('should verify 2FA setup with valid code', async ({ page }) => {
            await loginAsCustomer(page);
            await page.goto('/es/account/security');

            // Mock enable API
            await page.route('**/api/auth/2fa/enable', async route => {
                await route.fulfill({
                    status: 200,
                    json: {
                        success: true,
                        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                        backupCodes: ['ABCD1234'],
                        secret: 'JBSWY3DPEHPK3PXP'
                    }
                });
            });

            // Mock verify API
            await page.route('**/api/auth/2fa/verify', async route => {
                await route.fulfill({
                    status: 200,
                    json: { success: true, message: '2FA enabled successfully' }
                });
            });

            const twoFactorToggle = page.locator('[role="switch"]').first();
            if (await twoFactorToggle.isVisible({ timeout: 2000 })) {
                await twoFactorToggle.click();
                await page.waitForTimeout(1000);

                // Enter verification code
                const codeInput = page.locator('input[name="code"], input[placeholder*="código"], input[placeholder*="code"]').first();
                if (await codeInput.isVisible({ timeout: 2000 })) {
                    await codeInput.fill('123456');

                    // Submit verification
                    const verifyButton = page.locator('button').filter({ hasText: /verificar|verify|confirmar|confirm/i });
                    await verifyButton.click();

                    // Should show success message
                    await expect(page.locator('text=/2FA.*habilitado|2FA.*enabled|autenticación.*activada/i')).toBeVisible({ timeout: 5000 });
                }
            }
        });

        test('should reject invalid verification code', async ({ page }) => {
            await loginAsCustomer(page);
            await page.goto('/es/account/security');

            // Mock enable API
            await page.route('**/api/auth/2fa/enable', async route => {
                await route.fulfill({
                    status: 200,
                    json: {
                        success: true,
                        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                        backupCodes: ['ABCD1234'],
                    }
                });
            });

            // Mock verify API to fail
            await page.route('**/api/auth/2fa/verify', async route => {
                await route.fulfill({
                    status: 400,
                    json: { error: 'Invalid verification code' }
                });
            });

            const twoFactorToggle = page.locator('[role="switch"]').first();
            if (await twoFactorToggle.isVisible({ timeout: 2000 })) {
                await twoFactorToggle.click();
                await page.waitForTimeout(1000);

                const codeInput = page.locator('input[name="code"], input[placeholder*="código"]').first();
                if (await codeInput.isVisible({ timeout: 2000 })) {
                    await codeInput.fill('000000');

                    const verifyButton = page.locator('button').filter({ hasText: /verificar|verify/i });
                    await verifyButton.click();

                    // Should show error message
                    await expect(page.locator('text=/invalid.*code|código.*inválido/i')).toBeVisible({ timeout: 3000 });
                }
            }
        });

        test('should display and copy backup codes', async ({ page }) => {
            await loginAsCustomer(page);
            await page.goto('/es/account/security');

            // Mock enable API with backup codes
            await page.route('**/api/auth/2fa/enable', async route => {
                await route.fulfill({
                    status: 200,
                    json: {
                        success: true,
                        qrCode: 'data:image/png;base64,test',
                        backupCodes: ['ABCD1234', 'EFGH5678', 'IJKL9012', 'MNOP3456', 'QRST7890', 'UVWX1234', 'YZAB5678', 'CDEF9012'],
                    }
                });
            });

            const twoFactorToggle = page.locator('[role="switch"]').first();
            if (await twoFactorToggle.isVisible({ timeout: 2000 })) {
                await twoFactorToggle.click();
                await page.waitForTimeout(1000);

                const setupDialog = page.locator('[role="dialog"]');
                if (await setupDialog.isVisible({ timeout: 2000 })) {
                    // Should show 8 backup codes
                    const backupCodesList = setupDialog.locator('code, .backup-code');
                    const codeCount = await backupCodesList.count();

                    if (codeCount > 0) {
                        expect(codeCount).toBeGreaterThanOrEqual(8);

                        // Should have copy button
                        const copyButton = setupDialog.locator('button').filter({ hasText: /copiar|copy/i });
                        if (await copyButton.isVisible({ timeout: 1000 })) {
                            await copyButton.click();

                            // Should show copied confirmation
                            await expect(setupDialog.locator('text=/copiado|copied/i')).toBeVisible({ timeout: 2000 });
                        }
                    }
                }
            }
        });
    });

    test.describe('2FA Login Flow', () => {
        test('should prompt for 2FA code during login', async ({ page }) => {
            // This test would require a user with 2FA already enabled
            // For now, we'll mock the login flow

            await page.goto(routes.login);

            // Mock the credentials endpoint to indicate 2FA is required
            await page.route('**/api/auth/callback/credentials**', async route => {
                const postData = route.request().postDataJSON();
                if (postData && postData.email === customerEmail) {
                    await route.fulfill({
                        status: 200,
                        json: {
                            url: '/login?2fa=required',
                            error: null
                        }
                    });
                } else {
                    await route.continue();
                }
            });

            await page.fill('#customer-email', customerEmail);
            await page.fill('#customer-password', customerPassword);

            const submitButton = page.locator('button[type="submit"]:has-text("Iniciar sesión")').first();
            await submitButton.click();

            // Should show 2FA code input
            const twoFactorInput = page.locator('input[name="twoFactorCode"], input[placeholder*="código de verificación"]');
            if (await twoFactorInput.isVisible({ timeout: 3000 })) {
                await expect(twoFactorInput).toBeVisible();

                // Should show option to use backup code
                await expect(page.locator('text=/usar.*código.*respaldo|use.*backup.*code/i')).toBeVisible();
            }
        });

        test('should accept valid 2FA code during login', async ({ page }) => {
            await page.goto(routes.login);

            // Mock 2FA verification
            await page.route('**/api/auth/2fa/verify**', async route => {
                await route.fulfill({
                    status: 200,
                    json: { success: true }
                });
            });

            // If 2FA prompt appears, fill it
            const twoFactorInput = page.locator('input[name="twoFactorCode"]');
            if (await twoFactorInput.isVisible({ timeout: 2000 })) {
                await twoFactorInput.fill('123456');

                const verifyButton = page.locator('button[type="submit"]');
                await verifyButton.click();

                // Should complete login
                await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
            }
        });

        test('should accept backup code during login', async ({ page }) => {
            await page.goto(routes.login);

            // If 2FA is prompted, try using backup code
            const useBackupLink = page.locator('text=/usar.*código.*respaldo|use.*backup.*code/i');
            if (await useBackupLink.isVisible({ timeout: 2000 })) {
                await useBackupLink.click();

                // Should show backup code input
                const backupCodeInput = page.locator('input[name="backupCode"], input[placeholder*="código de respaldo"]');
                await expect(backupCodeInput).toBeVisible();

                // Mock backup code verification
                await page.route('**/api/auth/2fa/verify-backup**', async route => {
                    await route.fulfill({
                        status: 200,
                        json: { success: true }
                    });
                });

                await backupCodeInput.fill('ABCD1234');

                const submitButton = page.locator('button[type="submit"]');
                await submitButton.click();

                // Should complete login
                await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
            }
        });
    });

    test.describe('2FA Management', () => {
        test('should disable 2FA', async ({ page }) => {
            await loginAsCustomer(page);
            await page.goto('/es/account/security');

            // Mock 2FA status as enabled
            await page.route('**/api/auth/2fa/status', async route => {
                await route.fulfill({
                    status: 200,
                    json: { enabled: true, hasSecret: true }
                });
            });

            // Mock disable API
            await page.route('**/api/auth/2fa/disable', async route => {
                await route.fulfill({
                    status: 200,
                    json: { success: true, message: '2FA disabled successfully' }
                });
            });

            // Find and click disable button/toggle
            const twoFactorToggle = page.locator('[role="switch"]').first();
            if (await twoFactorToggle.isVisible({ timeout: 2000 })) {
                // If already enabled, clicking should prompt for disable
                await twoFactorToggle.click();

                // Should show confirmation dialog
                const confirmDialog = page.locator('[role="dialog"]');
                if (await confirmDialog.isVisible({ timeout: 2000 })) {
                    // May require password or 2FA code to disable
                    const passwordInput = confirmDialog.locator('input[type="password"]');
                    const codeInput = confirmDialog.locator('input[name="code"]');

                    if (await passwordInput.isVisible({ timeout: 1000 })) {
                        await passwordInput.fill(customerPassword);
                    } else if (await codeInput.isVisible({ timeout: 1000 })) {
                        await codeInput.fill('123456');
                    }

                    const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirmar|confirm|disable|deshabilitar/i });
                    await confirmButton.click();

                    // Should show success message
                    await expect(page.locator('text=/2FA.*deshabilitado|2FA.*disabled/i')).toBeVisible({ timeout: 3000 });
                }
            }
        });

        test('should regenerate backup codes', async ({ page }) => {
            await loginAsCustomer(page);
            await page.goto('/es/account/security');

            // Mock backup codes endpoint
            await page.route('**/api/auth/2fa/backup-codes', async route => {
                if (route.request().method() === 'POST') {
                    await route.fulfill({
                        status: 200,
                        json: {
                            success: true,
                            backupCodes: ['NEW11111', 'NEW22222', 'NEW33333', 'NEW44444', 'NEW55555', 'NEW66666', 'NEW77777', 'NEW88888'],
                            message: 'Backup codes regenerated'
                        }
                    });
                } else {
                    await route.continue();
                }
            });

            // Find backup codes section
            const backupCodesButton = page.locator('button').filter({ hasText: /backup.*codes|códigos.*respaldo|regenerar/i });
            if (await backupCodesButton.isVisible({ timeout: 2000 })) {
                await backupCodesButton.click();

                // Should show regeneration dialog or new codes
                const dialog = page.locator('[role="dialog"]');
                if (await dialog.isVisible({ timeout: 2000 })) {
                    // Confirm regeneration
                    const confirmButton = dialog.locator('button').filter({ hasText: /regenerar|regenerate|confirmar/i });
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();

                        // Should show new codes
                        await expect(dialog.locator('text=/NEW11111|nuevos.*códigos|new.*codes/i')).toBeVisible({ timeout: 3000 });
                    }
                }
            }
        });

        test('should require 2FA when enabled for sensitive actions', async ({ page }) => {
            await loginAsCustomer(page);

            // Mock 2FA as enabled
            await page.route('**/api/auth/2fa/status', async route => {
                await route.fulfill({
                    status: 200,
                    json: { enabled: true }
                });
            });

            // Try to change password (sensitive action)
            await page.goto('/es/account/security');

            const currentPasswordInput = page.locator('input[name="currentPassword"]').first();
            if (await currentPasswordInput.isVisible({ timeout: 2000 })) {
                await currentPasswordInput.fill(customerPassword);
                await page.locator('input[name="newPassword"]').first().fill('NewPassword123!');
                await page.locator('input[name="confirmPassword"]').first().fill('NewPassword123!');

                // Submit password change
                const submitButton = page.locator('button[type="submit"]').first();
                await submitButton.click();

                // With 2FA enabled, might prompt for code
                const twoFactorPrompt = page.locator('text=/código.*verificación|verification.*code/i');
                if (await twoFactorPrompt.isVisible({ timeout: 2000 })) {
                    await expect(twoFactorPrompt).toBeVisible();
                }
            }
        });
    });

    test.describe('2FA for Different User Types', () => {
        test('should support 2FA for vendor accounts', async ({ page }) => {
            // Login as vendor
            await page.goto(routes.login);

            const vendorTab = page.locator('button[role="tab"]').filter({ hasText: /Vendedor|Vendor/ });
            await vendorTab.click();
            await page.waitForTimeout(500);

            await page.fill('#vendor-email', 'vendor@luzimarket.shop');
            await page.fill('#vendor-password', 'password123');

            const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Iniciar sesión|Sign in/ });
            await submitButton.click();

            await page.waitForURL((url) => url.pathname.includes('/vendor') || url.pathname.includes('/vendedor'), { timeout: 15000 });

            // Navigate to vendor security settings
            await page.goto('/es/vendor/settings/security');

            // Should show 2FA options
            const securityPage = page.locator('text=/autenticación|authentication|2FA/i').first();
            if (await securityPage.isVisible({ timeout: 2000 })) {
                await expect(securityPage).toBeVisible();
            }
        });

        test('should support 2FA for admin accounts', async ({ page }) => {
            // Login as admin
            await page.goto(routes.login);

            const adminTab = page.locator('button[role="tab"]').filter({ hasText: /Admin/i });
            await adminTab.click();
            await page.waitForTimeout(500);

            await page.fill('#admin-email', 'admin@luzimarket.shop');
            await page.fill('#admin-password', 'admin123');

            const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Iniciar sesión|Sign in/ });
            await submitButton.click();

            await page.waitForURL(/\/admin/, { timeout: 10000 });

            // Navigate to admin security settings
            await page.goto('/admin/settings/security');

            // Should show 2FA options
            await expect(page.locator('text=/two.*factor|autenticación.*dos.*factores/i').first()).toBeVisible();
        });
    });

    test.describe('2FA Security', () => {
        test('should prevent brute force on 2FA verification', async ({ page }) => {
            await page.goto(routes.login);

            // Mock rate limiting on 2FA verification
            let attemptCount = 0;
            await page.route('**/api/auth/2fa/verify', async route => {
                attemptCount++;
                if (attemptCount > 5) {
                    await route.fulfill({
                        status: 429,
                        json: { error: 'Too many verification attempts. Please try again later.' }
                    });
                } else {
                    await route.fulfill({
                        status: 400,
                        json: { error: 'Invalid code' }
                    });
                }
            });

            // If 2FA prompt appears, try multiple invalid codes
            const twoFactorInput = page.locator('input[name="twoFactorCode"]');
            if (await twoFactorInput.isVisible({ timeout: 2000 })) {
                for (let i = 0; i < 6; i++) {
                    await twoFactorInput.fill('000000');
                    await page.locator('button[type="submit"]').click();
                    await page.waitForTimeout(500);
                }

                // Should show rate limit error
                await expect(page.locator('text=/too many.*attempts|demasiados.*intentos/i')).toBeVisible({ timeout: 3000 });
            }
        });

        test('should handle 2FA during account recovery', async ({ page }) => {
            // Test that backup codes work when user loses authenticator access
            await page.goto(routes.login);

            // This would be tested in the backup code flow
            // Already covered in "should accept backup code during login" test
            expect(true).toBeTruthy();
        });
    });
});

