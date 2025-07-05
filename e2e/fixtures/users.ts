import { Page, Route } from '@playwright/test';

/**
 * Test user credentials and helpers for e2e tests
 * These users should be created by the seed script
 */

export const testUsers = {
  admin: {
    email: 'admin@luzimarket.shop',
    password: 'Admin123!@#',
    role: 'admin' as const
  },
  vendor: {
    email: 'vendor1@example.com',
    password: 'password123',
    role: 'vendor' as const
  },
  customer: {
    email: 'customer1@example.com',
    password: 'password123', 
    role: 'customer' as const
  },
  // Additional test users for specific scenarios
  unverifiedCustomer: {
    email: 'unverified@example.com',
    password: 'password123',
    role: 'customer' as const,
    verified: false
  },
  lockedUser: {
    email: 'locked@example.com',
    password: 'password123',
    role: 'customer' as const,
    locked: true
  }
};

/**
 * Helper to login as a specific user type
 */
export async function loginAs(page: Page, userType: keyof typeof testUsers) {
  const user = testUsers[userType];
  
  // Navigate to login page
  await page.goto('/iniciar-sesion');
  
  // Click the appropriate tab for user type
  if (user.role === 'vendor') {
    await page.getByRole('tab', { name: 'Vendedor' }).click();
  } else if (user.role === 'admin') {
    await page.getByRole('tab', { name: 'Admin' }).click();
  }
  // Customer tab is selected by default
  
  // Fill credentials
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  
  // Submit login
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  
  // Wait for navigation
  if (user.role === 'admin') {
    await page.waitForURL('**/admin**');
  } else if (user.role === 'vendor') {
    await page.waitForURL('**/vendor/**');
  } else {
    await page.waitForURL('**/');
  }
}

/**
 * Create a test user via API (for tests that need fresh users)
 */
export async function createTestUser(page: Page, options: {
  email: string;
  password: string;
  role?: 'customer' | 'vendor';
  verified?: boolean;
}) {
  const { email, password, role = 'customer', verified = true } = options;
  
  // Mock user creation API
  await page.route('**/api/test/create-user', async (route: Route) => {
    await route.fulfill({
      json: {
        success: true,
        user: {
          email,
          role,
          verified
        }
      }
    });
  });
  
  // In real implementation, this would call your API
  // For now, we'll use registration flow
  if (role === 'customer') {
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.locator('label[for="acceptTerms"]').click();
    
    await page.route('**/api/auth/register', async (route: Route) => {
      await route.fulfill({
        json: { success: true, requiresVerification: !verified }
      });
    });
    
    await page.getByRole('button', { name: /registrarse/i }).click();
  } else if (role === 'vendor') {
    await page.goto('/vendor/register');
    await page.fill('input[name="businessName"]', 'Test Vendor');
    await page.fill('input[name="contactName"]', 'Test Contact');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="phone"]', '+52 55 1234 5678');
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    // Fill other required fields...
    
    await page.route('**/api/vendor/register', async (route: Route) => {
      await route.fulfill({
        json: { success: true }
      });
    });
    
    await page.getByRole('button', { name: /registrar negocio/i }).click();
  }
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  await page.getByTestId('user-menu').click();
  await page.getByRole('button', { name: /cerrar sesión|logout/i }).click();
  await page.waitForURL('**/');
}