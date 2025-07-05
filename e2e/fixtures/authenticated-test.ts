import { test as base, expect, Browser, Page } from '@playwright/test';
import { testUsers, loginAs, logout } from './users';

/**
 * Extended test fixtures with pre-authenticated pages for each user role
 */
export const test = base.extend<{
  adminPage: Page;
  vendorPage: Page;
  customerPage: Page;
  guestPage: Page;
}>({
  // Admin authenticated page
  adminPage: async ({ browser }: { browser: Browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as admin
    await loginAs(page, 'admin');
    
    // Use the authenticated page
    await use(page);
    
    // Cleanup
    await context.close();
  },
  
  // Vendor authenticated page
  vendorPage: async ({ browser }: { browser: Browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as vendor
    await loginAs(page, 'vendor');
    
    // Use the authenticated page
    await use(page);
    
    // Cleanup
    await context.close();
  },
  
  // Customer authenticated page
  customerPage: async ({ browser }: { browser: Browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as customer
    await loginAs(page, 'customer');
    
    // Use the authenticated page
    await use(page);
    
    // Cleanup
    await context.close();
  },
  
  // Guest (unauthenticated) page
  guestPage: async ({ browser }: { browser: Browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // No login needed
    await use(page);
    
    // Cleanup
    await context.close();
  }
});

export { expect };

/**
 * Helper to switch between user contexts in a single test
 */
export async function switchUser(currentPage: any, newUserType: keyof typeof testUsers) {
  // Logout current user
  await logout(currentPage);
  
  // Login as new user
  await loginAs(currentPage, newUserType);
}

/**
 * Example usage:
 * 
 * test('admin can approve vendors', async ({ adminPage }) => {
 *   // adminPage is already logged in as admin
 *   await adminPage.goto('/admin/vendors');
 *   // ... test logic
 * });
 * 
 * test('multi-role flow', async ({ page }) => {
 *   // Customer places order
 *   await loginAs(page, 'customer');
 *   // ... place order
 *   
 *   // Switch to vendor
 *   await switchUser(page, 'vendor');
 *   // ... process order
 *   
 *   // Switch to admin
 *   await switchUser(page, 'admin');
 *   // ... verify order
 * });
 */