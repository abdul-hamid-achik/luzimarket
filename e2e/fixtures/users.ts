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
  
  // Wait for loading state to appear and disappear
  await page.waitForTimeout(500); // Small delay to let loading state appear
  await page.waitForFunction(() => {
    // Wait for "Signing in..." to disappear
    const signingIn = document.body.textContent?.includes('Signing in') || 
                      document.body.textContent?.includes('Iniciando sesión');
    return !signingIn;
  }, { timeout: 10000 }).catch(() => {});

  // Wait for either successful navigation or for loading to finish
  try {
    if (user.role === 'admin') {
      // Admin goes to dashboard after login
      await Promise.race([
        page.waitForURL('**/admin/**', { timeout: 10000 }),
        page.waitForURL('**/admin', { timeout: 10000 })
      ]);
    } else if (user.role === 'vendor') {
      // Vendor goes to vendor dashboard after login - handle various URL patterns
      await Promise.race([
        page.waitForURL('**/vendor/**', { timeout: 10000 }),
        page.waitForURL('**/vendedor/**', { timeout: 10000 }),
        page.waitForFunction(() => {
          // Check if we're on a vendor page by looking for vendor-specific elements
          return document.querySelector('[href*="/vendor/"]') !== null ||
                 document.querySelector('[href*="/vendedor/"]') !== null ||
                 window.location.pathname.includes('/vendor/') ||
                 window.location.pathname.includes('/vendedor/');
        }, { timeout: 10000 })
      ]);
    } else {
      // Customer - wait for navigation away from login page
      await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 });
    }
  } catch (error) {
    // If waiting fails, check if we're at least logged in by looking for user menu
    const isLoggedIn = await page.locator('[data-testid="user-menu"], button[aria-label*="account" i], button[aria-label*="cuenta" i]').isVisible().catch(() => false);
    if (!isLoggedIn) {
      throw new Error(`Failed to login as ${user.role}: ${error}`);
    }
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
    await page.goto('/vendor-register');
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