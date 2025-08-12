import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🌱 Setting up test environment...');

  // Setup test database with minimal required data
  if (process.env.SETUP_TEST_DB !== 'false') {
    console.log('📦 Ensuring test database is properly configured...');
    try {
      const { setupTestDatabase } = await import('./setup/test-database');
      await setupTestDatabase();
    } catch (error) {
      console.error('❌ Failed to setup test database:', error);
      console.log('💡 You can skip database setup by setting SETUP_TEST_DB=false');
      console.log('💡 Or run manually: npx tsx e2e/setup/test-database.ts');
    }
  } else {
    console.log('⏭️  Skipping database setup (SETUP_TEST_DB=false)');
  }

  // Save authentication states for different user types
  const { baseURL } = config.projects[0].use;
  
  // You can enable this block to pre-authenticate users and save their state
  // This speeds up tests by avoiding login in each test
  if (process.env.PREAUTH === '1') {
    // Admin authentication
    const adminBrowser = await chromium.launch();
    const adminPage = await adminBrowser.newPage();
    await adminPage.goto(baseURL + '/login');
    await adminPage.click('button[role="tab"]:has-text("Admin")');
    await adminPage.fill('#admin-email', 'admin@luzimarket.shop');
    await adminPage.fill('#admin-password', 'admin123');
    await adminPage.click('button[type="submit"]:has-text("Iniciar sesión")');
    await adminPage.waitForURL(/\/admin$/);
    await adminPage.context().storageState({ path: 'e2e/.auth/admin.json' });
    await adminBrowser.close();
    console.log('✅ Admin authentication state saved');

    // Vendor authentication
    const vendorBrowser = await chromium.launch();
    const vendorPage = await vendorBrowser.newPage();
    await vendorPage.goto(baseURL + '/login');
    await vendorPage.click('button[role="tab"]:has-text("Vendedor")');
    await vendorPage.fill('#vendor-email', 'vendor@luzimarket.shop');
    await vendorPage.fill('#vendor-password', 'password123');
    await vendorPage.click('button[type="submit"]:has-text("Iniciar sesión")');
    await vendorPage.waitForURL(/\/vendor$/);
    await vendorPage.context().storageState({ path: 'e2e/.auth/vendor.json' });
    await vendorBrowser.close();
    console.log('✅ Vendor authentication state saved');
  }

  console.log('✅ Global setup completed');
}

export default globalSetup;