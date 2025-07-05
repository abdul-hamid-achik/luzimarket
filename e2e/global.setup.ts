import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';

async function globalSetup(config: FullConfig) {
  // You can perform global setup here, such as:
  // - Setting up test data
  // - Performing authentication and saving state
  // - Starting external services

  console.log('🌱 Setting up test environment...');

  // Skip database seeding - assume data already exists
  console.log('⏭️  Skipping database seeding (assuming data exists)');
  console.log('💡 If you need to seed manually, run: npm run db:seed -- --no-images');

  // Example: Save authentication state for reuse in tests
  const { baseURL, storageState } = config.projects[0].use;

  // Uncomment to perform login once and save state
  // const browser = await chromium.launch();
  // const page = await browser.newPage();
  // await page.goto(baseURL + '/login');
  // await page.fill('[name="email"]', 'admin@luzimarket.shop');
  // await page.fill('[name="password"]', 'admin123');
  // await page.click('button[type="submit"]');
  // await page.waitForURL('**/dashboard');
  // await page.context().storageState({ path: storageState as string });
  // await browser.close();

  console.log('Global setup completed');
}

export default globalSetup;