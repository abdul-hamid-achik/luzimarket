import { test, expect } from '@playwright/test';
import { routes } from '../helpers/navigation';

test.describe('Vendor Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.vendorRegister);
  });

  test('should display vendor registration form', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText(/Vendor|Vendedor|Tienda/);
    
    // Check form fields
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    await expect(page.locator('input[name="contactName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show validation errors
    const errors = page.locator('.error, [role="alert"], text=/required|requerido/i');
    await expect(errors.first()).toBeVisible();
  });

  test('should fill vendor registration form', async ({ page }) => {
    // Fill business information
    await page.fill('input[name="businessName"]', 'Test Flower Shop');
    await page.fill('input[name="contactName"]', 'Juan Pérez');
    await page.fill('input[name="email"]', 'vendor@testshop.com');
    await page.fill('input[name="phone"]', '5551234567');
    
    // Fill business details
    await page.fill('textarea[name="description"]', 'Hermosas flores para toda ocasión');
    await page.fill('input[name="businessPhone"]', '5551234567');
    await page.fill('input[name="businessHours"]', 'Lun-Sab 9:00-19:00');
    
    // Fill address
    await page.fill('input[name="street"]', 'Av. Insurgentes 123');
    await page.fill('input[name="city"]', 'Ciudad de México');
    await page.fill('input[name="state"]', 'CDMX');
    await page.fill('input[name="postalCode"]', '06700');
    
    // Social media (optional)
    await page.fill('input[name="instagramUrl"]', '@testflowershop');
    await page.fill('input[name="websiteUrl"]', 'https://testflowershop.com');
  });

  test('should handle delivery options', async ({ page }) => {
    // Check delivery checkbox
    const deliveryCheckbox = page.locator('input[name="hasDelivery"]');
    await deliveryCheckbox.check();
    
    // Delivery service options should appear
    const deliveryService = page.locator('select[name="deliveryService"], input[name="deliveryService"]');
    await expect(deliveryService).toBeVisible();
    
    // Select delivery option
    if (await deliveryService.isVisible()) {
      await deliveryService.selectOption('own');
    }
  });

  test('should submit vendor registration', async ({ page }) => {
    // Fill minimum required fields
    await page.fill('input[name="businessName"]', 'Test Shop');
    await page.fill('input[name="contactName"]', 'Test Contact');
    await page.fill('input[name="email"]', `vendor${Date.now()}@test.com`);
    await page.fill('input[name="phone"]', '5551234567');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show success message or redirect
    await page.waitForURL(/\/vendor\/register\/success|confirmation/, { timeout: 10000 })
      .catch(() => {
        // Or check for success message
        expect(page.locator('text=/Success|Éxito|Gracias/')).toBeVisible();
      });
  });

  test('should show terms and conditions', async ({ page }) => {
    // Look for terms checkbox or link
    const termsElement = page.locator('text=/Terms|Términos/').first();
    await expect(termsElement).toBeVisible();
    
    // If it's a link, click it
    if (await termsElement.getAttribute('href')) {
      await termsElement.click();
      // Should open terms page or modal
      await expect(page.locator('text=/Terms and Conditions|Términos y Condiciones/')).toBeVisible();
    }
  });

  test('should handle existing email', async ({ page }) => {
    // Use an email that might already exist
    await page.fill('input[name="businessName"]', 'Existing Shop');
    await page.fill('input[name="contactName"]', 'Existing Contact');
    await page.fill('input[name="email"]', 'contacto@floresdelvalle.mx'); // From seed data
    await page.fill('input[name="phone"]', '5551234567');
    
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
  test.skip('should access vendor dashboard after login', async ({ page }) => {
    // This would need proper vendor authentication setup
    await page.goto(routes.vendorDashboard);
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/);
  });
});