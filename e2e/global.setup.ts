import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import { execFileSync } from 'child_process';

async function globalSetup(config: FullConfig) {
  console.log('🌱 Setting up test environment...');

  // Seed the database via npm script in auto mode (drizzle-seed)
  console.log('📦 Seeding database via npm run db:seed -- --auto... (with reset)');
  try {
    const projectRoot = path.resolve(__dirname, '..');
    execFileSync('npm', ['run', 'db:seed', '--', '--auto', '--images', 'placeholders', '--seed', '42'], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, NEON_LOCAL: '1', PGSSLMODE: 'no-verify' },
    });
    console.log('✅ Seeding completed');
  } catch (error) {
    console.warn('⚠️  Skipping database seeding (unreachable or misconfigured DB). Set DATABASE_URL to enable seeding.');
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