import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('Email Verification Flow', () => {
  test('should show resend verification page', async ({ page }) => {
    await page.goto('/resend-verification');

    // Should show the resend verification form
    await expect(page.getByText('Reenviar enlace de verificación')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar enlace de verificación/i })).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/resend-verification');

    // Try with invalid email
    await page.locator('input[id="email"]').fill('invalid-email');
    await page.getByRole('button', { name: /enviar enlace de verificación/i }).click();

    // Should show validation error (check for any validation error text)
    await expect(page.locator('text=/inválido|invalido|invalid/i')).toBeVisible();
  });

  test('should handle resend verification request', async ({ page }) => {
    await page.goto('/resend-verification');

    // Fill valid email
    await page.locator('input[id="email"]').fill('test@example.com');

    // Mock API response
    await page.route('**/api/auth/resend-verification', async route => {
      await route.fulfill({
        status: 200,
        json: { success: true }
      });
    });

    // Submit form
    await page.getByRole('button', { name: /enviar enlace de verificación/i }).click();

    // Should show success message
    await expect(page.getByText('¡Enlace enviado!')).toBeVisible();
    await expect(page.getByText(/Si existe una cuenta con ese correo/)).toBeVisible();
  });

  test('should handle API errors', async ({ page }) => {
    await page.goto('/resend-verification');

    await page.fill('input[type="email"]', 'test@example.com');

    // Mock API error
    await page.route('**/api/auth/resend-verification', async route => {
      await route.fulfill({
        status: 429,
        json: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
      });
    });

    await page.getByRole('button', { name: /enviar enlace de verificación/i }).click();

    // Should show error message
    await expect(page.getByText(/Demasiadas solicitudes/)).toBeVisible();
  });

  test('should have back to login link', async ({ page }) => {
    await page.goto('/resend-verification');

    // Check back link
    const backLink = page.getByRole('link', { name: /volver al inicio de sesión/i });
    await expect(backLink).toBeVisible();

    // Click should navigate to login
    await backLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show success page with login link', async ({ page }) => {
    await page.goto('/resend-verification');

    await page.fill('input[type="email"]', 'test@example.com');

    // Mock success response
    await page.route('**/api/auth/resend-verification', async route => {
      await route.fulfill({
        status: 200,
        json: { success: true }
      });
    });

    await page.getByRole('button', { name: /enviar enlace de verificación/i }).click();

    // Success page should have login link
    const loginLink = page.getByRole('link', { name: /volver al inicio de sesión/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', /\/login$/);
  });

  test('should disable form during submission', async ({ page }) => {
    await page.goto('/resend-verification');

    await page.locator('input[id="email"]').fill('test@example.com');

    // Mock slow API without awaiting after test end
    await page.route('**/api/auth/resend-verification', async route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          json: { success: true }
        }).catch(() => { });
      }, 1000);
    });

    // Click submit
    const submitButton = page.getByRole('button', { name: /enviar enlace de verificación/i });
    await submitButton.click();

    // Button should show loading state
    await expect(page.getByText('Enviando enlace...')).toBeVisible();

    // Input should be disabled
    await expect(page.locator('input[id="email"]')).toBeDisabled();
  });

  test('should handle network errors', async ({ page }) => {
    await page.goto('/resend-verification');

    await page.locator('input[id="email"]').fill('test@example.com');

    // Mock network error
    await page.route('**/api/auth/resend-verification', async route => {
      await route.abort('failed');
    });

    await page.getByRole('button', { name: /enviar enlace de verificación/i }).click();

    // Should show connection error
    await expect(page.getByText(/Error de conexión/)).toBeVisible();
  });

  test('should navigate from URL params', async ({ page }) => {
    // Test with error param
    await page.goto('/resend-verification?error=expired');

    // Page should load normally (error handling would be in the actual component)
    await expect(page.getByText('Reenviar enlace de verificación')).toBeVisible();
  });

  test('should have proper form accessibility', async ({ page }) => {
    await page.goto('/resend-verification');

    // Check form has proper labels
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toBeVisible();

    // Check input has proper attributes
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('placeholder', 'tu@email.com');

    // Form should be keyboard navigable
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab'); // Focus submit button
    const submitButton = page.getByRole('button', { name: /enviar enlace de verificación/i });
    await expect(submitButton).toBeFocused();
  });
});