import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('Vendor Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.vendorRegister);
    // Ensure form is rendered before interactions (SSR + i18n redirects)
    await page.getByTestId('vendor-businessName').first().waitFor({ state: 'visible', timeout: 20000 });
  });

  test('should display vendor registration form', async ({ page }) => {
    // Check page title
    await expect(page.locator('h2')).toBeVisible();

    // Check form fields
    await expect(page.getByTestId('vendor-businessName')).toBeVisible();
    await expect(page.getByTestId('vendor-contactName')).toBeVisible();
    await expect(page.getByTestId('vendor-email')).toBeVisible();
    await expect(page.getByTestId('vendor-whatsapp')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: '¡Listo!' });
    await submitButton.click();

    // Should show validation errors
    const errors = page.locator('.error, [role="alert"], text=/required|requerido/i');
    await expect(errors.first()).toBeVisible();
  });

  test('should fill vendor registration form', async ({ page }) => {
    // Fill business information
    await page.getByTestId('vendor-businessName').fill('Test Flower Shop');
    await page.getByTestId('vendor-contactName').fill('Juan Pérez');
    await page.getByTestId('vendor-email').fill('vendor@testshop.com');
    await page.getByTestId('vendor-whatsapp').fill('5551234567');

    // Fill business details
    await page.getByTestId('vendor-description').fill('Hermosas flores para toda ocasión');
    await page.getByTestId('vendor-businessPhone').fill('5551234567');
    await page.getByTestId('vendor-businessHours').fill('Lun-Sab 9:00-19:00');

    // Fill address
    await page.getByTestId('vendor-street').fill('Av. Insurgentes 123');
    await page.getByTestId('vendor-city').fill('Ciudad de México');
    await page.getByTestId('vendor-state').fill('CDMX');
    await page.fill('input[name="postalCode"]', '06700');

    // Social media (optional)
    await page.getByTestId('vendor-instagramUrl').fill('@testflowershop');
    await page.getByTestId('vendor-websiteUrl').fill('https://testflowershop.com');
  });

  test('should handle delivery options', async ({ page }) => {
    // Check delivery checkbox
    const deliveryYes = page.getByTestId('vendor-hasDelivery-yes');
    await deliveryYes.click();

    // Delivery service options should appear
    const deliveryService = page.getByTestId('vendor-deliveryService');
    await expect(deliveryService).toBeVisible();

    // Select delivery option
    if (await deliveryService.isVisible()) {
      await deliveryService.selectOption('own');
    }
  });

  test('should submit vendor registration', async ({ page }) => {
    // Fill minimum required fields
    await page.getByTestId('vendor-businessName').fill('Test Shop');
    await page.getByTestId('vendor-contactName').fill('Test Contact');
    await page.getByTestId('vendor-email').fill(`vendor${Date.now()}@test.com`);
    await page.getByTestId('vendor-whatsapp').fill('5551234567');

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show success state message on the same page
    await expect(page.locator('text=/Gracias|Thank you|Éxito|Success/i')).toBeVisible();
  });

  test('should show terms and conditions', async ({ page }) => {
    // Look for terms checkbox or link
    const termsElement = page.locator('text=/Términos|Terms/').first();
    await expect(termsElement).toBeVisible();

    // If it's a link, click it
    if (await termsElement.getAttribute('href')) {
      await termsElement.click();
      // Should open terms page or modal (assert on heading to avoid strict mode)
      await expect(page.getByRole('heading', { name: /Terms and Conditions|Términos y Condiciones/i })).toBeVisible();
    }
  });

  test('should handle existing email', async ({ page }) => {
    // Use an email that might already exist
    await page.getByTestId('vendor-businessName').fill('Existing Shop');
    await page.getByTestId('vendor-contactName').fill('Existing Contact');
    await page.getByTestId('vendor-email').fill('contacto@floresdelvalle.mx'); // From seed data
    await page.getByTestId('vendor-whatsapp').fill('5551234567');

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show error about existing email
    const errorMessage = await page.locator('text=/already exists|ya existe|already registered/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Vendor Dashboard', () => {
  // These tests would require authentication
  test('should access vendor dashboard after login', async ({ page }) => {
    // This would need proper vendor authentication setup
    await page.goto(routes.vendorDashboard);

    // Should redirect to localized login if not authenticated
    await expect(page).toHaveURL(/\/(iniciar-sesion|login)/);
  });
});