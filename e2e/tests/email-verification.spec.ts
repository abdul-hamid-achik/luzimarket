import { test, expect } from '../fixtures/test';
import { routes } from '../helpers/navigation';

test.describe('Email Verification Flow', () => {
  let testEmail: string;
  let verificationToken: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `verify-${Date.now()}@example.com`;
  });

  test('should complete full email verification flow', async ({ page }) => {
    // Step 1: Register new user
    await page.goto(routes.register);
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.locator('label[for="acceptTerms"]').click();
    
    // Mock registration and email sending
    let verificationEmailSent = false;
    await page.route('**/api/auth/register', async route => {
      const body = await route.request().postDataJSON();
      if (body.email === testEmail) {
        verificationEmailSent = true;
        verificationToken = 'verify-token-' + Date.now();
        await route.fulfill({
          json: {
            success: true,
            message: 'Registration successful. Please check your email.',
            requiresVerification: true
          }
        });
      }
    });
    
    await page.getByRole('button', { name: /registrarse/i }).click();
    
    // Should show verification message
    await expect(page.getByText(/verifica.*correo|verify.*email|enviamos.*enlace/i)).toBeVisible();
    expect(verificationEmailSent).toBe(true);
    
    // Step 2: Try to login without verification
    await page.goto(routes.login);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Password123!');
    
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 401,
        json: {
          error: 'Email not verified'
        }
      });
    });
    
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Should show verification required message
    await expect(page.getByText(/correo.*no.*verificado|email.*not.*verified/i)).toBeVisible();
    
    // Should show resend link
    await expect(page.getByRole('link', { name: /reenviar.*verificación|resend.*verification/i })).toBeVisible();
    
    // Step 3: Click verification link
    await page.goto(`/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(testEmail)}`);
    
    // Mock verification
    await page.route('**/api/auth/verify-email**', async route => {
      if (route.request().url().includes(verificationToken)) {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': '/iniciar-sesion?verified=true'
          }
        });
      }
    });
    
    // Should redirect to login with success message
    await page.waitForURL('**/iniciar-sesion**');
    await expect(page.getByText(/correo.*verificado|email.*verified/i)).toBeVisible();
    
    // Step 4: Login with verified account
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Password123!');
    
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/'
        }
      });
    });
    
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Should successfully login
    await page.waitForURL('**/');
    await expect(page.getByTestId('user-menu')).toBeVisible();
  });

  test('should handle expired verification tokens', async ({ page }) => {
    // Try to verify with expired token
    const expiredToken = 'expired-verify-token-123';
    await page.goto(`/api/auth/verify-email?token=${expiredToken}&email=${encodeURIComponent(testEmail)}`);
    
    await page.route('**/api/auth/verify-email**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/resend-verification?error=expired'
        }
      });
    });
    
    // Should redirect to resend page
    await page.waitForURL('**/resend-verification**');
    await expect(page.getByText(/enlace.*expirado|link.*expired/i)).toBeVisible();
    
    // Should show resend form
    await expect(page.getByRole('button', { name: /reenviar|resend/i })).toBeVisible();
  });

  test('should resend verification email', async ({ page }) => {
    // Go to resend verification page
    await page.goto('/resend-verification');
    
    // Enter email
    await page.fill('input[name="email"]', testEmail);
    
    // Mock resend
    let resendCount = 0;
    await page.route('**/api/auth/resend-verification', async route => {
      const body = await route.request().postDataJSON();
      if (body.email === testEmail) {
        resendCount++;
        await route.fulfill({
          json: {
            success: true,
            message: 'Verification email resent'
          }
        });
      }
    });
    
    await page.getByRole('button', { name: /reenviar|resend/i }).click();
    
    // Should show success message
    await expect(page.getByText(/correo.*reenviado|email.*resent/i)).toBeVisible();
    expect(resendCount).toBe(1);
  });

  test('should limit verification email resends', async ({ page }) => {
    await page.goto('/resend-verification');
    
    let resendAttempts = 0;
    await page.route('**/api/auth/resend-verification', async route => {
      resendAttempts++;
      if (resendAttempts > 3) {
        await route.fulfill({
          status: 429,
          json: {
            error: 'Too many requests. Please try again later.'
          }
        });
      } else {
        await route.fulfill({
          json: { success: true }
        });
      }
    });
    
    // Make multiple resend attempts
    for (let i = 0; i < 4; i++) {
      await page.fill('input[name="email"]', testEmail);
      await page.getByRole('button', { name: /reenviar|resend/i }).click();
      
      if (i < 3) {
        await expect(page.getByText(/correo.*reenviado/i)).toBeVisible();
        await page.reload(); // Reset form
      }
    }
    
    // Fourth attempt should be rate limited
    await expect(page.getByText(/demasiadas.*solicitudes|too.*many.*requests/i)).toBeVisible();
  });

  test('should restrict access for unverified users', async ({ page }) => {
    // Create unverified user session
    await page.goto(routes.register);
    const unverifiedEmail = `unverified-${Date.now()}@example.com`;
    
    await page.fill('input[name="name"]', 'Unverified User');
    await page.fill('input[name="email"]', unverifiedEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.locator('label[for="acceptTerms"]').click();
    
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        json: {
          success: true,
          requiresVerification: true,
          limitedAccess: true
        }
      });
    });
    
    await page.getByRole('button', { name: /registrarse/i }).click();
    
    // Mock limited access login
    await page.goto(routes.login);
    await page.fill('input[name="email"]', unverifiedEmail);
    await page.fill('input[name="password"]', 'Password123!');
    
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/?unverified=true'
        }
      });
    });
    
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Should show limited access banner
    await expect(page.getByTestId('unverified-banner')).toBeVisible();
    await expect(page.getByText(/acceso limitado|limited access/i)).toBeVisible();
    
    // Try to access restricted features
    await page.goto(routes.checkout);
    await expect(page.getByText(/verifica.*correo.*continuar|verify.*email.*continue/i)).toBeVisible();
    
    // Try to add to wishlist
    await page.goto(routes.products);
    await page.getByTestId('product-card').first().click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    await expect(page.getByText(/verifica.*correo|verify.*email/i)).toBeVisible();
  });

  test('should handle invalid verification tokens', async ({ page }) => {
    // Try with malformed token
    await page.goto('/api/auth/verify-email?token=invalid-token&email=notanemail');
    
    await page.route('**/api/auth/verify-email**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/resend-verification?error=invalid'
        }
      });
    });
    
    await page.waitForURL('**/resend-verification**');
    await expect(page.getByText(/enlace.*inválido|link.*invalid/i)).toBeVisible();
  });

  test('should verify email through account settings', async ({ page }) => {
    // Login with unverified account (limited access)
    const unverifiedEmail = `settings-verify-${Date.now()}@example.com`;
    
    // Mock unverified user session
    await page.goto(routes.login);
    await page.fill('input[name="email"]', unverifiedEmail);
    await page.fill('input[name="password"]', 'Password123!');
    
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/account?unverified=true'
        }
      });
    });
    
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Go to account settings
    await page.waitForURL('**/account**');
    
    // Should show verification status
    await expect(page.getByText(/correo no verificado|email not verified/i)).toBeVisible();
    
    // Should have verify button
    await page.getByRole('button', { name: /verificar ahora|verify now/i }).click();
    
    // Mock sending verification
    await page.route('**/api/auth/resend-verification', async route => {
      await route.fulfill({
        json: {
          success: true,
          message: 'Verification email sent'
        }
      });
    });
    
    // Should show email sent message
    await expect(page.getByText(/correo.*enviado|email.*sent/i)).toBeVisible();
  });

  test('should handle verification for social login users', async ({ page }) => {
    // Mock OAuth login that requires email verification
    await page.goto(routes.login);
    
    // Click social login button
    await page.getByRole('button', { name: /continuar con google|continue with google/i }).click();
    
    // Mock OAuth callback with unverified email
    await page.route('**/api/auth/callback/google**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/account?provider=google&verify_email=true'
        }
      });
    });
    
    await page.waitForURL('**/account**');
    
    // Should show that email needs verification even for social login
    await expect(page.getByText(/confirma.*correo|confirm.*email/i)).toBeVisible();
    
    // Should explain why verification is needed
    await expect(page.getByText(/seguridad|security|proteger|protect/i)).toBeVisible();
  });

  test('should auto-verify trusted email domains', async ({ page }) => {
    const trustedEmail = `user@trusted-company.com`;
    
    await page.goto(routes.register);
    await page.fill('input[name="name"]', 'Trusted User');
    await page.fill('input[name="email"]', trustedEmail);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.locator('label[for="acceptTerms"]').click();
    
    // Mock registration with auto-verification
    await page.route('**/api/auth/register', async route => {
      const body = await route.request().postDataJSON();
      if (body.email.endsWith('@trusted-company.com')) {
        await route.fulfill({
          json: {
            success: true,
            message: 'Account created successfully',
            autoVerified: true
          }
        });
      }
    });
    
    await page.getByRole('button', { name: /registrarse/i }).click();
    
    // Should redirect to login without verification message
    await page.waitForURL('**/iniciar-sesion');
    await expect(page.getByText(/cuenta creada|account created/i)).toBeVisible();
    
    // Should be able to login immediately
    await page.fill('input[name="email"]', trustedEmail);
    await page.fill('input[name="password"]', 'Password123!');
    
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 302,
        headers: { 'Location': '/' }
      });
    });
    
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL('**/');
  });

  test('should handle email change verification', async ({ page }) => {
    // Login as verified user
    await page.goto(routes.login);
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 302,
        headers: { 'Location': '/account' }
      });
    });
    
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Go to account settings
    await page.waitForURL('**/account');
    
    // Change email
    await page.getByRole('button', { name: /cambiar correo|change email/i }).click();
    
    const newEmail = `new-email-${Date.now()}@example.com`;
    await page.fill('input[name="newEmail"]', newEmail);
    await page.fill('input[name="confirmEmail"]', newEmail);
    await page.fill('input[name="currentPassword"]', 'Password123!');
    
    // Mock email change request
    await page.route('**/api/account/change-email', async route => {
      await route.fulfill({
        json: {
          success: true,
          message: 'Verification sent to new email'
        }
      });
    });
    
    await page.getByRole('button', { name: /confirmar cambio|confirm change/i }).click();
    
    // Should show verification sent to new email
    await expect(page.getByText(new RegExp(`verificación.*${newEmail}`, 'i'))).toBeVisible();
    
    // Should show that old email is still active
    await expect(page.getByText(/correo actual.*activo|current email.*active/i)).toBeVisible();
  });
});