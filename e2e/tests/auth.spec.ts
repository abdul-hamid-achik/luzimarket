import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check page elements
    await expect(page.locator('h1')).toContainText(/Sign In|Iniciar Sesión|Login/);
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show user type selection', async ({ page }) => {
    await page.goto('/login');
    
    // Check for user type selector
    const userTypeSelector = page.locator('select[name="userType"], input[name="userType"]').first();
    await expect(userTypeSelector).toBeVisible();
    
    // Should have customer, vendor, and admin options
    if (await userTypeSelector.isVisible()) {
      const options = await userTypeSelector.locator('option').allTextContents();
      expect(options).toContain('customer');
      expect(options).toContain('vendor');
      expect(options).toContain('admin');
    }
  });

  test('should validate login form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    const errors = page.locator('.error, [role="alert"], text=/required|requerido/i');
    await expect(errors.first()).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Select user type if needed
    const userTypeSelector = page.locator('select[name="userType"]').first();
    if (await userTypeSelector.isVisible()) {
      await userTypeSelector.selectOption('customer');
    }
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should show error message
    const errorMessage = page.locator('text=/Invalid|Inválido|Incorrect|Incorrecto/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should login as customer', async ({ page }) => {
    await page.goto('/login');
    
    // Use credentials from seed data
    await page.fill('input[type="email"]', 'maria.garcia@email.com');
    await page.fill('input[type="password"]', 'customer123');
    
    // Select customer type
    const userTypeSelector = page.locator('select[name="userType"]').first();
    if (await userTypeSelector.isVisible()) {
      await userTypeSelector.selectOption('customer');
    }
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect after successful login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    
    // User menu should be visible
    const userMenu = page.locator('text=/María|Profile|Perfil/').first();
    await expect(userMenu).toBeVisible();
  });

  test('should login as admin', async ({ page }) => {
    await page.goto('/login');
    
    // Use admin credentials from seed data
    await page.fill('input[type="email"]', 'admin@luzimarket.shop');
    await page.fill('input[type="password"]', 'admin123');
    
    // Select admin type
    const userTypeSelector = page.locator('select[name="userType"]').first();
    if (await userTypeSelector.isVisible()) {
      await userTypeSelector.selectOption('admin');
    }
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('should logout', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'maria.garcia@email.com');
    await page.fill('input[type="password"]', 'customer123');
    
    const userTypeSelector = page.locator('select[name="userType"]').first();
    if (await userTypeSelector.isVisible()) {
      await userTypeSelector.selectOption('customer');
    }
    
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'));
    
    // Find and click logout
    const userMenu = page.locator('button').filter({ hasText: /María|Profile|Account/ }).first();
    await userMenu.click();
    
    const logoutButton = page.locator('text=/Logout|Cerrar Sesión|Sign Out/').first();
    await logoutButton.click();
    
    // Should redirect to home or login
    await expect(page).toHaveURL(/\/(login)?$/);
  });

  test('should show register link', async ({ page }) => {
    await page.goto('/login');
    
    // Check for register link
    const registerLink = page.locator('a').filter({ hasText: /Register|Registrar|Create Account/ }).first();
    await expect(registerLink).toBeVisible();
    
    // Click should navigate to register page
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should show forgot password link', async ({ page }) => {
    await page.goto('/login');
    
    // Check for forgot password link
    const forgotLink = page.locator('a').filter({ hasText: /Forgot|Olvidé|Reset/ }).first();
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Registration', () => {
  test('should display registration form', async ({ page }) => {
    await page.goto('/register');
    
    // Check form fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('should validate password match', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with mismatched passwords
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'different123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should show password mismatch error
    const error = page.locator('text=/match|coincidir|same/i').first();
    await expect(error).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with unique email
    const uniqueEmail = `test${Date.now()}@example.com`;
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!');
    
    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"][name="terms"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect or show success
    await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 10000 })
      .catch(() => {
        expect(page.locator('text=/Success|Welcome|Bienvenido/')).toBeVisible();
      });
  });
});