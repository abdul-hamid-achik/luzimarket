import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('Password Reset Flow', () => {
  test('should navigate to forgot password from login', async ({ page }) => {
    await page.goto(routes.login);
    
    // Find and click forgot password link
    const forgotLink = page.getByRole('link', { name: /¿olvidaste tu contraseña\?/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('should show forgot password form', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // Should show form elements
    await expect(page.getByText(/recuperar contraseña/i)).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar correo/i })).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // Try invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.getByRole('button', { name: /enviar correo/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/correo.*inválido|email.*invalid/i)).toBeVisible();
  });

  test('should handle forgot password request', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // Fill valid email
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Mock API response
    await page.route('**/api/auth/forgot-password', async route => {
      await route.fulfill({
        status: 200,
        json: { success: true, message: 'Email sent' }
      });
    });
    
    // Submit form
    await page.getByRole('button', { name: /enviar correo/i }).click();
    
    // Should show success message
    await expect(page.getByText(/correo.*enviado|email.*sent/i)).toBeVisible();
  });

  test('should handle non-existent email', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    
    // Mock API error
    await page.route('**/api/auth/forgot-password', async route => {
      await route.fulfill({
        status: 404,
        json: { error: 'Email not found' }
      });
    });
    
    await page.getByRole('button', { name: /enviar correo/i }).click();
    
    // Should show error message
    await expect(page.getByText(/correo.*no.*encontrado|email.*not.*found/i)).toBeVisible();
  });

  test('should show reset password form with valid token', async ({ page }) => {
    const token = 'valid-token-123';
    const email = 'test@example.com';
    
    await page.goto(`/reset-password?token=${token}&email=${email}`);
    
    // Should show reset form
    await expect(page.getByText(/restablecer contraseña/i)).toBeVisible();
    await expect(page.getByLabel(/nueva contraseña/i)).toBeVisible();
    await expect(page.getByLabel(/confirmar contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /restablecer/i })).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/reset-password?token=test&email=test@example.com');
    
    // Try weak password
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    await page.getByRole('button', { name: /restablecer/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/contraseña.*debe.*tener|password.*must/i)).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/reset-password?token=test&email=test@example.com');
    
    // Fill mismatched passwords
    await page.fill('input[name="password"]', 'StrongPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.getByRole('button', { name: /restablecer/i }).click();
    
    // Should show mismatch error
    await expect(page.getByText(/contraseñas.*no.*coinciden|passwords.*don't.*match/i)).toBeVisible();
  });

  test('should handle successful password reset', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token&email=test@example.com');
    
    // Fill new password
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    
    // Mock successful reset
    await page.route('**/api/auth/reset-password', async route => {
      await route.fulfill({
        status: 200,
        json: { success: true }
      });
    });
    
    await page.getByRole('button', { name: /restablecer/i }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Should show success message
    await expect(page.getByText(/contraseña.*restablecida|password.*reset/i)).toBeVisible();
  });

  test('should handle expired token', async ({ page }) => {
    await page.goto('/reset-password?token=expired-token&email=test@example.com');
    
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    
    // Mock expired token error
    await page.route('**/api/auth/reset-password', async route => {
      await route.fulfill({
        status: 400,
        json: { error: 'Token expired' }
      });
    });
    
    await page.getByRole('button', { name: /restablecer/i }).click();
    
    // Should show error
    await expect(page.getByText(/token.*expirado|token.*expired/i)).toBeVisible();
  });

  test('should have back to login links', async ({ page }) => {
    // Check forgot password page
    await page.goto('/forgot-password');
    const backLink1 = page.getByRole('link', { name: /volver.*inicio.*sesión|back.*login/i });
    await expect(backLink1).toBeVisible();
    
    // Check reset password page
    await page.goto('/reset-password?token=test&email=test@example.com');
    const backLink2 = page.getByRole('link', { name: /volver.*inicio.*sesión|back.*login/i });
    await expect(backLink2).toBeVisible();
  });

  test('should disable form during submission', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Mock slow API
    await page.route('**/api/auth/forgot-password', async route => {
      await page.waitForTimeout(1000);
      await route.fulfill({
        status: 200,
        json: { success: true }
      });
    });
    
    // Click submit
    const submitButton = page.getByRole('button', { name: /enviar correo/i });
    await submitButton.click();
    
    // Button should show loading state
    await expect(page.getByText(/enviando/i)).toBeVisible();
    
    // Input should be disabled
    await expect(page.getByRole('textbox')).toBeDisabled();
  });
});