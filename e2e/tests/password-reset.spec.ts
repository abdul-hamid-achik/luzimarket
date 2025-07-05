import { test, expect } from '../fixtures/test';
import { routes } from '../helpers/navigation';

test.describe('Password Reset Flow', () => {
  let testEmail: string;
  let resetToken: string;
  
  test.beforeEach(async ({ page }) => {
    testEmail = `reset-test-${Date.now()}@example.com`;
    
    // Create a test user first
    await page.goto(routes.register);
    await page.fill('input[name="name"]', 'Reset Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'OldPassword123!');
    await page.fill('input[name="confirmPassword"]', 'OldPassword123!');
    await page.locator('label[for="acceptTerms"]').click();
    
    // Mock successful registration
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        json: {
          success: true,
          message: 'Registration successful'
        }
      });
    });
    
    await page.getByRole('button', { name: /registrarse/i }).click();
    await page.waitForURL('**/iniciar-sesion');
  });

  test('should complete full password reset flow', async ({ page }) => {
    // Step 1: Navigate to forgot password
    await page.goto(routes.login);
    await page.getByRole('link', { name: /¿olvidaste tu contraseña\?/i }).click();
    await page.waitForURL('**/forgot-password');

    // Step 2: Request password reset
    await page.fill('input[name="email"]', testEmail);
    
    // Mock email sending
    let resetEmailSent = false;
    await page.route('**/api/auth/forgot-password', async route => {
      const body = await route.request().postDataJSON();
      if (body.email === testEmail) {
        resetEmailSent = true;
        resetToken = 'test-reset-token-' + Date.now();
        await route.fulfill({
          json: {
            success: true,
            message: 'Reset email sent'
          }
        });
      }
    });
    
    await page.getByRole('button', { name: /enviar correo de recuperación/i }).click();
    
    // Verify success message
    await expect(page.getByText(/correo.*enviado|email.*sent/i)).toBeVisible();
    expect(resetEmailSent).toBe(true);

    // Step 3: Click reset link (simulate email click)
    await page.goto(`/reset-password?token=${resetToken}&email=${encodeURIComponent(testEmail)}`);
    
    // Step 4: Set new password
    const newPassword = 'NewPassword123!';
    await page.fill('input[name="password"]', newPassword);
    await page.fill('input[name="confirmPassword"]', newPassword);
    
    // Mock password reset
    await page.route('**/api/auth/reset-password', async route => {
      const body = await route.request().postDataJSON();
      if (body.token === resetToken && body.password === newPassword) {
        await route.fulfill({
          json: {
            success: true,
            message: 'Password reset successful'
          }
        });
      }
    });
    
    await page.getByRole('button', { name: /restablecer contraseña/i }).click();
    
    // Should redirect to login with success message
    await page.waitForURL('**/iniciar-sesion');
    await expect(page.getByText(/contraseña.*restablecida|password.*reset/i)).toBeVisible();

    // Step 5: Login with new password
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', newPassword);
    
    // Mock successful login
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/'
        }
      });
    });
    
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Verify logged in (redirect to home)
    await page.waitForURL('**/');
  });

  test('should validate email exists before sending reset', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // Try with non-existent email
    const nonExistentEmail = 'nonexistent@example.com';
    await page.fill('input[name="email"]', nonExistentEmail);
    
    await page.route('**/api/auth/forgot-password', async route => {
      const body = await route.request().postDataJSON();
      if (body.email === nonExistentEmail) {
        await route.fulfill({
          status: 404,
          json: {
            error: 'Email not found'
          }
        });
      }
    });
    
    await page.getByRole('button', { name: /enviar correo/i }).click();
    
    // Should show error
    await expect(page.getByText(/correo.*no.*encontrado|email.*not.*found/i)).toBeVisible();
  });

  test('should handle expired reset tokens', async ({ page }) => {
    // Request reset first
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', testEmail);
    
    await page.route('**/api/auth/forgot-password', async route => {
      await route.fulfill({
        json: { success: true }
      });
    });
    
    await page.getByRole('button', { name: /enviar correo/i }).click();
    
    // Try to use expired token
    const expiredToken = 'expired-token-123';
    await page.goto(`/reset-password?token=${expiredToken}&email=${encodeURIComponent(testEmail)}`);
    
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    
    await page.route('**/api/auth/reset-password', async route => {
      await route.fulfill({
        status: 400,
        json: {
          error: 'Token expired or invalid'
        }
      });
    });
    
    await page.getByRole('button', { name: /restablecer/i }).click();
    
    // Should show error
    await expect(page.getByText(/token.*expirado|token.*expired/i)).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    // Go directly to reset page with valid token
    const validToken = 'valid-token-' + Date.now();
    await page.goto(`/reset-password?token=${validToken}&email=${encodeURIComponent(testEmail)}`);
    
    // Try weak password
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    await page.getByRole('button', { name: /restablecer/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/contraseña.*debe.*tener|password.*must/i)).toBeVisible();
    
    // Try passwords that don't match
    await page.fill('input[name="password"]', 'StrongPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.getByRole('button', { name: /restablecer/i }).click();
    
    // Should show mismatch error
    await expect(page.getByText(/contraseñas.*no.*coinciden|passwords.*don't.*match/i)).toBeVisible();
  });

  test('should prevent using old password', async ({ page }) => {
    // Request reset
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', testEmail);
    
    let resetToken = '';
    await page.route('**/api/auth/forgot-password', async route => {
      resetToken = 'token-' + Date.now();
      await route.fulfill({
        json: { success: true }
      });
    });
    
    await page.getByRole('button', { name: /enviar correo/i }).click();
    
    // Try to reset with same password
    await page.goto(`/reset-password?token=${resetToken}&email=${encodeURIComponent(testEmail)}`);
    await page.fill('input[name="password"]', 'OldPassword123!'); // Same as original
    await page.fill('input[name="confirmPassword"]', 'OldPassword123!');
    
    await page.route('**/api/auth/reset-password', async route => {
      await route.fulfill({
        status: 400,
        json: {
          error: 'Cannot use previous password'
        }
      });
    });
    
    await page.getByRole('button', { name: /restablecer/i }).click();
    
    // Should show error
    await expect(page.getByText(/no.*puede.*usar.*contraseña.*anterior|cannot.*use.*previous/i)).toBeVisible();
  });

  test('should handle multiple reset requests', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/api/auth/forgot-password', async route => {
      requestCount++;
      if (requestCount > 3) {
        await route.fulfill({
          status: 429,
          json: {
            error: 'Too many requests'
          }
        });
      } else {
        await route.fulfill({
          json: { success: true }
        });
      }
    });
    
    await page.goto('/forgot-password');
    
    // Make multiple requests
    for (let i = 0; i < 4; i++) {
      await page.fill('input[name="email"]', testEmail);
      await page.getByRole('button', { name: /enviar correo/i }).click();
      
      if (i < 3) {
        await expect(page.getByText(/correo.*enviado/i)).toBeVisible();
        await page.reload(); // Reset form
      }
    }
    
    // Fourth request should be rate limited
    await expect(page.getByText(/demasiadas.*solicitudes|too.*many.*requests/i)).toBeVisible();
  });

  test('should show resend verification link for unverified users', async ({ page }) => {
    const unverifiedEmail = `unverified-${Date.now()}@example.com`;
    
    await page.goto('/forgot-password');
    await page.fill('input[name="email"]', unverifiedEmail);
    
    await page.route('**/api/auth/forgot-password', async route => {
      await route.fulfill({
        status: 403,
        json: {
          error: 'Email not verified',
          needsVerification: true
        }
      });
    });
    
    await page.getByRole('button', { name: /enviar correo/i }).click();
    
    // Should show verification needed message
    await expect(page.getByText(/correo.*no.*verificado|email.*not.*verified/i)).toBeVisible();
    
    // Should show resend verification link
    await expect(page.getByRole('link', { name: /reenviar.*verificación|resend.*verification/i })).toBeVisible();
  });

  test('should clear reset token after successful use', async ({ page }) => {
    // Complete a successful reset
    const token = 'one-time-token-' + Date.now();
    await page.goto(`/reset-password?token=${token}&email=${encodeURIComponent(testEmail)}`);
    
    await page.fill('input[name="password"]', 'FirstNewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'FirstNewPassword123!');
    
    let tokenUsed = false;
    await page.route('**/api/auth/reset-password', async route => {
      if (!tokenUsed) {
        tokenUsed = true;
        await route.fulfill({
          json: { success: true }
        });
      } else {
        await route.fulfill({
          status: 400,
          json: { error: 'Token already used' }
        });
      }
    });
    
    await page.getByRole('button', { name: /restablecer/i }).click();
    await page.waitForURL('**/iniciar-sesion');
    
    // Try to use same token again
    await page.goto(`/reset-password?token=${token}&email=${encodeURIComponent(testEmail)}`);
    await page.fill('input[name="password"]', 'SecondNewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecondNewPassword123!');
    await page.getByRole('button', { name: /restablecer/i }).click();
    
    // Should show error
    await expect(page.getByText(/token.*ya.*usado|token.*already.*used/i)).toBeVisible();
  });
});