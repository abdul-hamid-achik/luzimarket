import { Page, Route } from '@playwright/test';

/**
 * Test user credentials and helpers for e2e tests
 * These users should be created by the seed script
 */

export const testUsers = {
  admin: {
    email: 'admin@luzimarket.shop',
    password: 'admin123',
    role: 'admin' as const
  },
  vendor: {
    email: 'vendor@luzimarket.shop',
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
  await page.goto('/login');

  // Click the appropriate tab for user type
  if (user.role === 'vendor') {
    await page.getByRole('tab', { name: /vendor|vendedor/i }).click();
  } else if (user.role === 'admin') {
    await page.getByRole('tab', { name: /admin|administrador/i }).click();
  }
  // Customer tab is selected by default

  // Fill credentials
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);

  // Submit login
  await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();

  // Wait for a post-login UI signal instead of strict URL
  if (user.role === 'admin') {
    await page.waitForSelector('nav [href*="/admin"]', { timeout: 5000 });
  } else if (user.role === 'vendor') {
    await page.waitForSelector('a[href*="/vendedor"], a[href*="/vendor"], [data-testid="vendor-dashboard"]', { timeout: 5000 });
  } else {
    await page.waitForSelector('header, nav', { timeout: 5000 });
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
  // Prefer clearing cookies to avoid relying on specific UI in different layouts
  await page.context().clearCookies();
  await page.goto('/');
}