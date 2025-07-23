import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('Password Reset Flow', () => {
  test('should navigate to forgot password from login', async ({ page }) => {
    await page.goto(routes.login);
    
    // Find and click forgot password link
    const forgotLink = page.getByRole('link', { name: /¿olvidaste tu contraseña\?/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    
    // Should navigate to forgot password page (with i18n routing)
    await expect(page).toHaveURL(/\/(es\/)?olvide-contrasena|\/(en\/)?forgot-password/);
  });

  test('should show forgot password form', async ({ page }) => {
    await page.goto('/es/olvide-contrasena');
    
    // Should show form elements
    await expect(page.getByText(/restablecer contraseña/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar enlace/i })).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/es/olvide-contrasena');
    
    // Try invalid email
    await page.fill('input[id="email"]', 'invalid-email');
    await page.getByRole('button', { name: /enviar enlace/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/email.*inválido/i)).toBeVisible();
  });

  test('should handle forgot password request', async ({ page }) => {
    await page.goto('/es/olvide-contrasena');
    
    // Fill valid email
    await page.fill('input[id="email"]', 'test@example.com');
    
    // Mock API response
    await page.route('**/api/auth/request-password-reset', async route => {
      await route.fulfill({
        status: 200,
        json: { success: true, message: 'Email sent' }
      });
    });
    
    // Submit form
    await page.getByRole('button', { name: /enviar enlace/i }).click();
    
    // Should show success message
    await expect(page.getByText(/revisa tu correo/i)).toBeVisible();
  });

  test('should handle non-existent email', async ({ page }) => {
    await page.goto('/es/olvide-contrasena');
    
    await page.fill('input[id="email"]', 'nonexistent@example.com');
    
    // Mock API error
    await page.route('**/api/auth/request-password-reset', async route => {
      await route.fulfill({
        status: 400,
        json: { success: false, error: 'Email no encontrado' }
      });
    });
    
    await page.getByRole('button', { name: /enviar enlace/i }).click();
    
    // Should show error toast message
    await expect(page.getByText(/email.*no.*encontrado|ocurrió.*error/i)).toBeVisible();
  });

  test('should show reset password form with valid token', async ({ page }) => {
    // Mock the token validation to return valid
    await page.route('**/api/auth/validate-reset-token*', async route => {
      await route.fulfill({
        status: 200,
        json: { valid: true }
      });
    });
    
    const token = 'valid-token-123';
    await page.goto(`/es/restablecer-contrasena?token=${token}`);
    
    // Should show reset form
    await expect(page.getByText(/nueva contraseña/i)).toBeVisible();
    await expect(page.getByLabel(/nueva contraseña/i)).toBeVisible();
    await expect(page.getByLabel(/confirmar contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /actualizar contraseña/i })).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/auth/validate-reset-token*', async route => {
      await route.fulfill({
        status: 200,
        json: { valid: true }
      });
    });
    
    await page.goto('/es/restablecer-contrasena?token=test-token');
    
    // Try weak password
    await page.fill('input[id="password"]', 'weak');
    await page.fill('input[id="confirmPassword"]', 'weak');
    await page.getByRole('button', { name: /actualizar contraseña/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/contraseña.*debe.*tener.*6.*caracteres/i)).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/auth/validate-reset-token*', async route => {
      await route.fulfill({
        status: 200,
        json: { valid: true }
      });
    });
    
    await page.goto('/es/restablecer-contrasena?token=test-token');
    
    // Fill mismatched passwords
    await page.fill('input[id="password"]', 'StrongPassword123!');
    await page.fill('input[id="confirmPassword"]', 'DifferentPassword123!');
    await page.getByRole('button', { name: /actualizar contraseña/i }).click();
    
    // Should show mismatch error
    await expect(page.getByText(/contraseñas.*no.*coinciden/i)).toBeVisible();
  });

  test('should handle successful password reset', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/auth/validate-reset-token*', async route => {
      await route.fulfill({
        status: 200,
        json: { valid: true }
      });
    });
    
    await page.goto('/es/restablecer-contrasena?token=valid-token');
    
    // Fill new password
    await page.fill('input[id="password"]', 'NewPassword123!');
    await page.fill('input[id="confirmPassword"]', 'NewPassword123!');
    
    // Mock successful reset
    await page.route('**/api/auth/reset-password', async route => {
      await route.fulfill({
        status: 200,
        json: { success: true, message: 'Contraseña actualizada correctamente' }
      });
    });
    
    await page.getByRole('button', { name: /actualizar contraseña/i }).click();
    
    // Should show success toast
    await expect(page.getByText(/contraseña.*actualizada/i)).toBeVisible();
  });

  test('should handle expired token', async ({ page }) => {
    // Mock invalid/expired token
    await page.route('**/api/auth/validate-reset-token*', async route => {
      await route.fulfill({
        status: 400,
        json: { valid: false, error: 'Token inválido o expirado' }
      });
    });
    
    await page.goto('/es/restablecer-contrasena?token=expired-token');
    
    // For expired token, the page should show error message instead of form
    await expect(page.getByText(/enlace.*inválido.*expirado/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /solicitar nuevo enlace/i })).toBeVisible();
  });

  test('should have back to login links', async ({ page }) => {
    // Check forgot password page
    await page.goto('/es/olvide-contrasena');
    const backLink1 = page.getByRole('link', { name: /volver.*inicio.*sesión/i });
    await expect(backLink1).toBeVisible();
    
    // Reset password page with invalid token should show link to request new one
    await page.route('**/api/auth/validate-reset-token*', async route => {
      await route.fulfill({
        status: 400,
        json: { valid: false, error: 'Token inválido' }
      });
    });
    
    await page.goto('/es/restablecer-contrasena?token=invalid-token');
    const backLink2 = page.getByRole('link', { name: /solicitar nuevo enlace/i });
    await expect(backLink2).toBeVisible();
  });

  test('should disable form during submission', async ({ page }) => {
    await page.goto('/es/olvide-contrasena');
    
    await page.fill('input[id="email"]', 'test@example.com');
    
    // Mock slow API
    await page.route('**/api/auth/request-password-reset', async route => {
      await page.waitForTimeout(1000);
      await route.fulfill({
        status: 200,
        json: { success: true }
      });
    });
    
    // Click submit
    const submitButton = page.getByRole('button', { name: /enviar enlace/i });
    await submitButton.click();
    
    // Button should show loading state
    await expect(page.getByText(/enviando/i)).toBeVisible();
    
    // Input should be disabled
    await expect(page.locator('input[id="email"]')).toBeDisabled();
  });
});