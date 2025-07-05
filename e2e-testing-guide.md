# E2E Testing Guide for LuziMarket

## How Tests Handle Different User Roles

### User Role Architecture

The application uses **three separate database tables** for different user types:
- **Customers**: `users` table - Regular shoppers
- **Vendors**: `vendors` table - Business accounts selling products  
- **Admins**: `admin_users` table - Platform administrators

### Test User Credentials (from seed data)

```bash
# Admin Users
admin@luzimarket.shop / admin123 (super_admin role)
support@luzimarket.shop / admin123 (admin role)
manager@luzimarket.shop / admin123 (admin role)

# Vendor Users  
vendor1@example.com / password123
vendor2@example.com / password123
# ... all seeded vendors use password123

# Customer Users
customer1@example.com / password123
customer2@example.com / password123
# ... all seeded customers use password123
```

### Authentication in Tests

Tests handle role-based authentication by:
1. Navigating to `/iniciar-sesion` (login page)
2. Clicking the appropriate tab (Cliente/Vendedor/Admin)
3. Using role-specific form IDs (#customer-email, #vendor-email, #admin-email)

## Running the Complete Test Suite

### 1. Basic Test Commands

```bash
# Run all tests (this is the main command you'll use)
npm test

# Run with UI mode (recommended for debugging)
npm run test:ui

# Run specific test file
npx playwright test e2e/tests/checkout.spec.ts

# Run in headed mode (see browser)
npm run test:headed

# Debug a specific test
npm run test:debug
```

### 2. CI/CD Testing

For CI environments, use the standard test command with reporter flags:

```bash
# Run tests for CI
npx playwright test --reporter=html,github
```

## Common Test Issues & Solutions

### Issue 1: Authentication Failures

**Problem**: Tests fail with "Invalid credentials"
**Solution**: 
```bash
# Ensure database is seeded with test users
npm run db:seed

# Or reset and reseed
npm run db:reset
```

### Issue 2: Missing Environment Variables

**Problem**: Tests fail due to missing env vars
**Solution**:
```bash
# Pull environment variables from Vercel
npm run vercel:env:pull
```

### Issue 3: Timeout Errors

**Problem**: Tests timeout waiting for elements
**Solutions**:
1. Increase timeout in specific tests:
```typescript
await page.waitForLoadState('networkidle', { timeout: 30000 });
```

2. Run tests with extended timeout:
```bash
npx playwright test --timeout=60000
```

### Issue 4: Flaky Tests

**Problem**: Tests pass/fail inconsistently
**Solutions**:
1. Add explicit waits:
```typescript
await page.waitForSelector('[data-testid="element"]');
await page.waitForTimeout(500); // For animations
```

2. Use retry strategy:
```bash
npx playwright test --retries=2
```

## Test Organization Best Practices

### 1. Use Test Fixtures for Authentication

```typescript
import { test } from './e2e/fixtures/authenticated-test';

// Pre-authenticated pages
test('admin feature', async ({ adminPage }) => {
  // adminPage is already logged in as admin
  await adminPage.goto('/admin/orders');
});

test('vendor feature', async ({ vendorPage }) => {
  // vendorPage is already logged in as vendor
  await vendorPage.goto('/vendor/products');
});
```

### 2. Test Data Management

```typescript
import { testUsers } from './e2e/fixtures/users';

// Use consistent test users
await loginAs(page, 'customer');
await loginAs(page, 'vendor');
await loginAs(page, 'admin');
```

### 3. Multi-Role Testing Pattern

```typescript
test('order flow across roles', async ({ page }) => {
  // Customer places order
  await loginAs(page, 'customer');
  // ... place order
  
  // Vendor processes order
  await switchUser(page, 'vendor');
  // ... fulfill order
  
  // Admin monitors
  await switchUser(page, 'admin');
  // ... check analytics
});
```

## Debugging Failed Tests

### 1. Use Playwright UI Mode

```bash
npm run test:ui
```
- See test execution step-by-step
- Time travel through test steps
- Inspect DOM at each step

### 2. Debug Specific Test

```bash
npx playwright test path/to/test.spec.ts --debug
```
- Opens Playwright Inspector
- Step through test line by line
- See browser state at each step

### 3. Generate Test Report

```bash
# After test run
npm run test:report
```
- Opens HTML report with screenshots
- Shows failure details
- Includes test artifacts

### 4. Check Test Traces

```bash
# Run with trace on failure
npx playwright test --trace on-first-retry

# View trace
npx playwright show-trace trace.zip
```

## Running Tests in Different Environments

### Local Development
```bash
# IMPORTANT: Tests require the dev server to be running!

# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm test
```

### Against Production
```bash
# Set production URL
PLAYWRIGHT_BASE_URL=https://luzimarket.shop npm test
```

### With Different Locales
```bash
# Test Spanish (default)
npm test

# Test English
PLAYWRIGHT_LOCALE=en npm test
```

## Test Coverage Analysis

### Current Coverage
- ✅ Authentication (all user types)
- ✅ Product browsing and search
- ✅ Shopping cart and checkout
- ✅ Order management
- ✅ Vendor dashboard
- ✅ Admin dashboard
- ✅ Multi-vendor orders
- ✅ Inventory management
- ✅ Email verification
- ✅ Password reset

### Running Coverage Report
```bash
# Generate coverage report
npx playwright test --reporter=html

# Open report
npm run test:report
```

## Maintenance Tips

1. **Keep Test Data Consistent**
   - Always use seeded test users
   - Don't hardcode dynamic data
   - Use data-testid attributes

2. **Update Tests with Features**
   - Add tests for new features
   - Update selectors when UI changes
   - Keep test users in sync with seed data

3. **Monitor Test Performance**
   - Track test execution time
   - Identify slow tests
   - Optimize wait strategies

4. **Regular Test Audits**
   - Remove obsolete tests
   - Update deprecated patterns
   - Consolidate duplicate tests

## Quick Reference

```bash
# Essential commands
npm run dev              # Start dev server (required for tests)
npm test                 # Run all tests
npm run test:ui          # Debug with UI
npm run test:report      # View last test results

# Database setup
npm run db:seed          # Seed test data
npm run db:reset         # Reset and reseed database

# Test specific files
npx playwright test e2e/tests/checkout.spec.ts
npx playwright test e2e/tests/vendor-dashboard.spec.ts
npx playwright test e2e/tests/admin-dashboard.spec.ts
```