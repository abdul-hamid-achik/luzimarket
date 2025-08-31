import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('Vendor Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.vendorRegister);
    // Wait for form to load - use data-testid for specificity
    await page.waitForSelector('[data-testid="vendor-businessName"]', { timeout: 20000 });
  });

  test('should display vendor registration form', async ({ page }) => {
    // Check page title
    await expect(page.locator('h2').first()).toBeVisible();

    // Check form fields using data-testid for specificity
    await expect(page.getByTestId('vendor-businessName')).toBeVisible();
    await expect(page.getByTestId('vendor-contactName')).toBeVisible();
    await expect(page.getByTestId('vendor-email')).toBeVisible();
    await expect(page.getByTestId('vendor-businessPhone')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.getByTestId('vendor-submit');
    await submitButton.click();

    // Should show validation errors - look for form message elements
    const errors = page.locator('[role="alert"], .text-destructive, .text-red-500').first();
    await expect(errors).toBeVisible();
  });

  test('should fill vendor registration form', async ({ page }) => {
    // Fill business information
    await page.getByTestId('vendor-businessName').fill('Test Flower Shop');
    await page.getByTestId('vendor-contactName').fill('Juan Pérez');
    await page.getByTestId('vendor-email').fill('vendor@testshop.com');
    await page.getByTestId('vendor-businessPhone').fill('5551234567');
    await page.getByTestId('vendor-password').fill('SecurePassword123!');

    // Fill business details
    await page.getByTestId('vendor-description').fill('Hermosas flores para toda ocasión');

    // Fill address
    await page.getByTestId('vendor-street').fill('Av. Insurgentes 123');
    await page.getByTestId('vendor-city').fill('Ciudad de México');
    await page.getByTestId('vendor-state').fill('CDMX');
    await page.getByTestId('vendor-country').fill('México');

    // Check that values are filled
    await expect(page.getByTestId('vendor-businessName')).toHaveValue('Test Flower Shop');
  });

  test('should handle delivery options', async ({ page }) => {
    // Click delivery option yes
    const deliveryYes = page.getByTestId('vendor-hasDelivery-yes');
    await deliveryYes.click();

    // Delivery service field should appear
    await expect(page.getByTestId('vendor-deliveryService')).toBeVisible();

    // Fill delivery service
    await page.getByTestId('vendor-deliveryService').fill('DHL Express, FedEx');
  });

  test('should submit vendor registration', async ({ page }) => {
    // Fill minimum required fields
    await page.getByTestId('vendor-businessName').fill('Test Shop');
    await page.getByTestId('vendor-contactName').fill('Test Contact');
    await page.getByTestId('vendor-email').fill(`vendor${Date.now()}@test.com`);
    await page.getByTestId('vendor-businessPhone').fill('5551234567');
    await page.getByTestId('vendor-password').fill('SecurePassword123!');
    await page.getByTestId('vendor-description').fill('Test description');
    await page.getByTestId('vendor-street').fill('123 Street');
    await page.getByTestId('vendor-city').fill('CDMX');
    await page.getByTestId('vendor-state').fill('CDMX');
    await page.getByTestId('vendor-country').fill('México');

    // Submit form
    const submitButton = page.getByTestId('vendor-submit');
    await submitButton.click();

    // Should show success state message on the same page
    await expect(page.locator('text=/Gracias|Thank you|Éxito|Success/i')).toBeVisible({ timeout: 10000 });
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
    // Use an email that might already exist from seed data
    await page.getByTestId('vendor-businessName').fill('Existing Shop');
    await page.getByTestId('vendor-contactName').fill('Existing Contact');
    await page.getByTestId('vendor-email').fill('vendor@luzimarket.shop'); // From seed data
    await page.getByTestId('vendor-businessPhone').fill('5551234567');
    await page.getByTestId('vendor-password').fill('SecurePassword123!');
    await page.getByTestId('vendor-description').fill('Test description');
    await page.getByTestId('vendor-street').fill('123 Street');
    await page.getByTestId('vendor-city').fill('CDMX');
    await page.getByTestId('vendor-state').fill('CDMX');
    await page.getByTestId('vendor-country').fill('México');

    // Submit
    const submitButton = page.getByTestId('vendor-submit');
    await submitButton.click();

    // Should show either error toast or stay on the same page (not success)
    // Check that we don't see success message
    const successMessage = page.locator('text=/Gracias|Thank you/i');
    const hasSuccess = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);
    
    // If the email already exists, we shouldn't see success
    expect(hasSuccess).toBeFalsy();
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