# E2E Testing Documentation

> **Note:** This document contains detailed technical information for developers working with the test suite. For a general overview, see the [main README](../README.md#testing--quality-assurance).

## Overview

The Luzimarket E2E test suite uses [Playwright](https://playwright.dev/) to provide comprehensive testing across the entire application stack, ensuring functionality works end-to-end from the user's perspective.

## Quick Start

**Prerequisites:**
```bash
# Install dependencies and browsers
npm install
npx playwright install

# Start the local database (required for tests)
npm run compose:up
```

**Run Tests:**
```bash
# Interactive UI (recommended for development)
npm run test:ui

# Headless (CI/production)
npm test

# Debug mode
npm run test:debug
```

## Test Database & Data

Tests use isolated test data that's automatically set up:

**Database Setup:** Tests require a running database. Use `npm run compose:up` to start the local Neon database via Docker Compose before running tests.

**Automatic Setup:** Database is seeded automatically when tests run
**Manual Setup:** `npm run db:seed -- --images placeholders`

**Test Accounts:** All accounts use predictable credentials for testing:
- **Admin**: `admin@luzimarket.shop` / `admin123`
- **Vendors**: `vendor@luzimarket.shop` / `password123`  
- **Customers**: `customer1@example.com` / `password123`

## Test Structure

```
e2e/
├── fixtures/
│   ├── test.ts          # Custom test fixtures
│   ├── test-product.jpg # Test images
│   └── users.ts         # Test user data
├── setup/
│   ├── test-database.ts # Database setup script
│   └── test-vendor.ts   # Vendor setup (legacy)
├── helpers/
│   ├── navigation.ts    # Navigation helpers
│   └── i18n.ts         # Internationalization helpers
├── tests/
│   ├── homepage.spec.ts      # Homepage tests
│   ├── products.spec.ts      # Product catalog tests
│   ├── checkout.spec.ts      # Checkout flow tests
│   ├── vendor.spec.ts        # Vendor registration tests
│   ├── auth.spec.ts          # Authentication tests
│   └── mockup-compliance.spec.ts  # Design mockup compliance
├── .auth/               # Saved authentication states (gitignored)
├── global.setup.ts      # Global setup (auth, test data)
└── README.md           # This file
```

## Known Issues

1. **Category Names**: The seed.ts uses Spanish names like "Flores y Arreglos" but the UI shows "Flores & Amores"
2. **Email Verification**: Customer users must have `emailVerified=true` to login
3. **Missing Translations**: Some admin email template translations may show errors
4. **Foreign Key Constraints**: Product creation tests fail if categories don't exist in test DB

## Test Categories

### Homepage Tests
- Hero section and navigation
- Category links
- Language switching
- Footer links

### Product Tests
- Product grid display
- Filtering by category/price
- Sorting products
- Quick view modal
- Add to cart functionality

### Checkout Tests
- Cart management
- Checkout form validation
- Guest checkout
- Payment integration

### Vendor Tests
- Registration form
- Field validation
- Delivery options
- Terms acceptance
- Product management
- Dashboard analytics

### Authentication Tests
- Login for customers/vendors/admins
- Registration flow
- Password validation
- Logout functionality
- Account lockout protection

### Admin Tests
- Dashboard statistics
- Product approval workflow
- Vendor management
- Order management
- Email templates

### Mockup Compliance Tests
- Design system adherence
- Typography verification
- Responsive design
- Brand colors

## Writing New Tests

1. Create a new file in `e2e/tests/` with `.spec.ts` extension
2. Import test utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Group related tests:
   ```typescript
   test.describe('Feature Name', () => {
     test('should do something', async ({ page }) => {
       await page.goto('/');
       await expect(page.locator('h1')).toBeVisible();
     });
   });
   ```

## Common Test Patterns

### Login Helpers
```typescript
// Login as vendor
await page.goto('/login');
await page.click('button[role="tab"]:has-text("Vendedor")');
await page.fill('#vendor-email', 'vendor@luzimarket.shop');
await page.fill('#vendor-password', 'password123');
await page.click('button[type="submit"]');
await page.waitForURL('**/vendor');

// Login as admin
await page.goto('/login');
await page.click('button[role="tab"]:has-text("Admin")');
await page.fill('#admin-email', 'admin@luzimarket.shop');
await page.fill('#admin-password', 'admin123');
await page.click('button[type="submit"]');
await page.waitForURL('**/admin');
```

### Working with shadcn/ui Components

```typescript
// Select from dropdown
await page.getByRole('combobox').click();
await page.waitForTimeout(300); // Wait for animation
await page.getByRole('option', { name: 'Option Text' }).click();

// Handle checkboxes (they're buttons in shadcn/ui)
await page.locator('button[role="checkbox"]').click();

// Handle Sheet/Dialog components
await page.getByRole('dialog');

// Wait for toast notifications
await page.waitForSelector('[role="alert"]');
```

## Test Selectors

We use `data-testid` attributes throughout the application for reliable test selectors. Key selectors include:

### Navigation & Layout
- `data-testid="header"` - Main header
- `data-testid="logo-link"` - Logo/brand link
- `data-testid="mobile-menu-button"` - Mobile menu toggle
- `data-testid="cart-button"` - Cart toggle button

### Products
- `data-testid="product-card-{slug}"` - Product card
- `data-testid="wishlist-button-{slug}"` - Wishlist toggle
- `data-testid="quick-view-{slug}"` - Quick view button

### Cart
- `data-testid="cart-sheet"` - Cart sidebar
- `data-testid="cart-item-{id}"` - Cart item container
- `data-testid="remove-item-{id}"` - Remove item button
- `data-testid="decrease-quantity-{id}"` - Decrease quantity
- `data-testid="increase-quantity-{id}"` - Increase quantity
- `data-testid="checkout-link"` - Proceed to checkout

### Coming Soon Page
- `data-testid="affiliate-button"` - Vendor registration button

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** before interacting:
   ```typescript
   await page.waitForSelector('[data-testid="product-card"]');
   ```
3. **Use descriptive test names** that explain what is being tested
4. **Keep tests independent** - each test should run in isolation
5. **Use Page Object Model** for complex pages (create in `e2e/pages/`)
6. **Handle animations** - add small delays after UI interactions
7. **Check for Spanish text** - most UI is in Spanish by default

## Debugging Failed Tests

1. Run with `--debug` flag to step through tests
2. Use `page.pause()` to pause execution
3. Check screenshots in `test-results/` folder
4. View traces for failed tests in the HTML report
5. Check error context `.md` files for page structure
6. Verify test data exists: `pnpm tsx db/seed.ts --images placeholders`

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps
  
- name: Run Playwright tests
  run: npm run test:e2e
  
- uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

## Environment Variables

Tests use the same `.env.local` file as the application. For CI/CD, set:
- `CI=true` - Enables retries and disables test.only
- `NEXT_PUBLIC_APP_URL` - Base URL for tests
- `PLAYWRIGHT_PASS_THRESHOLD` - Minimum pass rate percentage for CI to succeed (default: 95)

### Pass Threshold Configuration

The test suite is configured to pass CI builds when **95% or more** of tests pass. This allows for some test flakiness while maintaining overall quality.

**Configuration:**
- Default threshold: 95%
- Override with: `PLAYWRIGHT_PASS_THRESHOLD=90` (for 90% threshold)
- Script location: `e2e/scripts/check-pass-threshold.js`

**How it works:**
1. Playwright runs all tests and generates JSON results
2. The threshold script analyzes the results 
3. If pass rate ≥ threshold: CI succeeds ✅
4. If pass rate < threshold: CI fails ❌ with detailed failure report

**Example output:**
```
📊 Checking test pass threshold: 95%

📈 Test Results Summary:
  Total tests: 120
  Passed: 115
  Failed: 5
  Flaky: 0
  Skipped: 0
  Pass rate: 95.8%
  Threshold: 95%

✅ PASS: Test suite meets 95% pass threshold (95.8%)
```

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify database is seeded with test data

### Element not found
- Use Playwright Inspector: `npx playwright test --debug`
- Check if element has different text in Spanish/English
- Add data-testid attributes to components
- For shadcn/ui components, use role selectors (e.g., `role="dialog"` for Sheet)

### Authentication issues
- Ensure test users exist and are verified: `pnpm tsx db/seed.ts --images placeholders`
- Check session handling in global.setup.ts
- Verify AUTH_SECRET and NEXTAUTH_SECRET are set in `.env.local`

### Cart state not persisting
- Cart uses local storage/cookies, ensure tests don't clear storage between navigations
- Use `test.beforeEach` to set up cart state for checkout tests
- Check if cart context is properly initialized

### Checkout tests failing
- Ensure products are added to cart before navigating to checkout
- For Radix UI checkboxes (like terms acceptance), click the label not the checkbox
- Submit button may have dynamic text with price - use regex matcher
- Stripe integration requires proper API keys in environment variables

### Foreign Key Constraint Errors
- Run seed: `pnpm tsx db/seed.ts --images placeholders`
- Ensure categories exist before creating products
- Check that vendor and user IDs are valid

### Testing shadcn/ui Components

When testing shadcn/ui components (which use Radix UI primitives):

1. **Sheet/Dialog Components**:
   - Use `role="dialog"` selector instead of looking for `aside` elements
   - Example: `await page.getByRole('dialog')`

2. **Checkbox Components**:
   - Not standard `<input type="checkbox">` elements
   - Click the label instead: `await page.locator('label[for="checkboxId"]').click()`
   - Or use: `await page.getByRole('checkbox', { name: 'Label text' })`

3. **Buttons with Lucide Icons**:
   - Don't search for text in buttons containing only SVG icons
   - Use parent selectors: `await page.locator('button:has(svg.h-3.w-3)').nth(1)`
   - Or use accessible names: `await page.getByRole('button', { name: 'aria-label value' })`

4. **Best Practices**:
   - Wait for animations: `await page.waitForTimeout(300)` after opening dialogs
   - Use role-based selectors when possible
   - Check for `data-slot` attributes added by shadcn components

### Common Patterns

#### Waiting for Elements
```typescript
// Wait for element with timeout
await page.waitForSelector('[data-testid="cart-sheet"]', { timeout: 5000 });

// Wait for multiple elements
await page.waitForSelector('[data-testid^="product-card-"]');
```

#### Handling Dynamic Content
```typescript
// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for specific API response
await page.waitForResponse(response => 
  response.url().includes('/api/products') && response.status() === 200
);
```

#### Testing Internationalization
```typescript
// Test with different locales
test.describe('Spanish locale', () => {
  test.use({ locale: 'es-MX' });
  
  test('should show Spanish content', async ({ page }) => {
    await page.goto('/es');
    // Test Spanish content
  });
});
```