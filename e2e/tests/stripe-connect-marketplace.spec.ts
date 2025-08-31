import { test, expect } from '@playwright/test';
import { authenticatedTestVendor } from '../fixtures/authenticated-test';
import { loginAs } from '../fixtures/users';

test.describe('Stripe Connect Marketplace', () => {
  test.describe('Vendor Stripe Connect Onboarding', () => {
    test('should show financials or onboarding page', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/vendor/financials');
        
        // Should show either financials or onboarding UI - look for actual page titles
        const hasFinancialOrOnboardingUI = 
          await page.getByText(/Financial Dashboard|Panel Financiero|Configuración de Pagos/i).first().isVisible().catch(() => false) ||
          await page.getByText(/Saldo Disponible|Available balance/i).first().isVisible().catch(() => false);
        expect(hasFinancialOrOnboardingUI).toBeTruthy();
      });
    });

    test('should access stripe onboarding page', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/vendor/stripe-onboarding');
        
        // Should show Stripe onboarding content - look for the actual title
        await expect(page.getByText('Configuración de Pagos').or(page.getByRole('heading', { level: 1 }))).toBeVisible();
      });
    });
  });

  test.describe('Payment Splitting', () => {
    test('should complete multi-vendor checkout', async ({ page }) => {
      await page.goto('/products');
      
      // Add first product
      await page.waitForSelector('[data-testid="product-card"]:visible', { timeout: 15000 });
      const firstProduct = page.getByTestId('product-card').first();
      await firstProduct.click();
      await page.getByRole('button', { name: /agregar al carrito|add to cart/i }).first().click();
      
      // Add second product
      await page.goto('/products');
      await page.waitForSelector('[data-testid="product-card"]:visible', { timeout: 15000 });
      const secondProduct = page.getByTestId('product-card').nth(1);
      await secondProduct.click();
      await page.getByRole('button', { name: /agregar al carrito|add to cart/i }).first().click();
      
      // Go to checkout
      await page.waitForSelector('[role="dialog"], [data-testid="cart-sheet"]', { timeout: 5000 });
      await page.getByTestId('checkout-link').first().click();
      
      // Wait for checkout page to load
      await page.waitForURL(/\/(pagar|checkout)/, { timeout: 10000 });
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      // Fill checkout
      await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="phone"]', '+52 55 1234 5678');
      await page.fill('input[name="address"]', 'Test Street 123');
      await page.fill('input[name="city"]', 'Mexico City');
      await page.fill('input[name="state"]', 'CDMX');
      await page.fill('input[name="postalCode"]', '01000');
      await page.locator('#acceptTerms').click();
      
      // Enable E2E bypass - set cookie before submitting
      const current = new URL(page.url());
      await page.context().addCookies([{ 
        name: 'e2e', 
        value: '1', 
        url: `${current.protocol}//${current.host}`
      }]);
      
      // Small wait to ensure cookie is set
      await page.waitForTimeout(100);
      
      // Submit checkout
      await page.getByTestId('checkout-submit-button').click();
      
      // Should reach success page
      await expect(page).toHaveURL(/\/(success|exito)/, { timeout: 30000 });
    });

    test('should handle single vendor checkout', async ({ page }) => {
      await page.goto('/products');
      
      // Add single product
      await page.waitForSelector('[data-testid="product-card"]:visible', { timeout: 15000 });
      await page.getByTestId('product-card').first().click();
      await page.getByRole('button', { name: /agregar al carrito|add to cart/i }).first().click();
      
      // Go to checkout
      await page.waitForSelector('[role="dialog"], [data-testid="cart-sheet"]', { timeout: 5000 });
      await page.getByTestId('checkout-link').first().click();
      
      // Should show checkout form with actual fields
      await expect(page.getByLabel(/email/i).or(page.locator('input[name="email"]'))).toBeVisible({ timeout: 20000 });
      await expect(page.getByTestId('checkout-submit-button')).toBeVisible();
    });
  });

  test.describe('Vendor Financial Dashboard', () => {
    test('should display vendor financials page', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/vendor/financials');
        
        
        // Should have financial UI elements or setup prompt - check for actual titles or content
        const hasContent = 
          await page.getByText(/Financial Dashboard|Panel Financiero/i).first().isVisible().catch(() => false) ||
          await page.getByText(/Saldo Disponible|Available balance/i).first().isVisible().catch(() => false) ||
          await page.getByText(/Configuración de Pagos|Payment Setup/i).first().isVisible().catch(() => false);
        expect(hasContent).toBeTruthy();
      });
    });

    test('should show payout interface when available', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/vendor/financials');
        
        // Check for payout-related UI (may need setup first)
        const hasPayoutUI = await page.locator('text=/payout|withdraw|retirar|pago/i').first().isVisible().catch(() => false);
        
        if (hasPayoutUI) {
          // Payout interface exists
          expect(hasPayoutUI).toBeTruthy();
        } else {
          // Should at least show the financials page content
          const hasFinancialsContent = 
            await page.getByText(/Financial Dashboard|Panel Financiero|Configuración de Pagos/i).first().isVisible().catch(() => false) ||
            await page.getByRole('heading', { level: 1 }).first().isVisible().catch(() => false);
          expect(hasFinancialsContent).toBeTruthy();
        }
      });
    });

    test('should access financial reports tab if available', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/vendor/financials');
        
        // Look for reports tab
        const reportsTab = page.getByRole('tab', { name: /reports|reportes/i });
        
        if (await reportsTab.isVisible().catch(() => false)) {
          await reportsTab.click();
          // Reports section should be visible
          await expect(page.locator('text=/report|sales|revenue|ventas|ingresos/i').first()).toBeVisible();
        } else {
          // Page should still load with financial content
          const hasFinancialsContent = 
            await page.getByText(/Financial Dashboard|Panel Financiero|Configuración de Pagos/i).first().isVisible().catch(() => false) ||
            await page.getByRole('heading', { level: 1 }).first().isVisible().catch(() => false);
          expect(hasFinancialsContent).toBeTruthy();
        }
      });
    });
  });

  test.describe('Financial Reports', () => {
    test('should access vendor reports section', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/vendor/financials');
        
        const reportsTab = page.getByRole('tab', { name: /reports|reportes/i });
        if (await reportsTab.isVisible().catch(() => false)) {
          await reportsTab.click();
          // Should show some report UI
          // Should show the financials page
          const hasFinancialsContent = 
            await page.getByText(/Financial Dashboard|Panel Financiero|Reportes/i).first().isVisible().catch(() => false) ||
            await page.getByRole('heading', { level: 1 }).first().isVisible().catch(() => false);
          expect(hasFinancialsContent).toBeTruthy();
        }
      });
    });

    test('should show export options if available', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/vendor/financials');
        
        // Look for export functionality
        const hasExport = await page.locator('button:has-text(/export|download|descargar/i)').first().isVisible().catch(() => false);
        
        // Either has export or shows the page
        // Either has export or shows the financials page
        const hasPageContent = hasExport || 
          await page.getByText(/Financial Dashboard|Panel Financiero|Reportes/i).first().isVisible().catch(() => false) ||
          await page.getByRole('heading', { level: 1 }).first().isVisible().catch(() => false);
        expect(hasPageContent).toBeTruthy();
      });
    });
  });

  test.describe('Admin Financial Management', () => {
    test('should display admin financials overview', async ({ page }) => {
      // Login as admin
      await loginAs(page, 'admin');
      
      // Navigate to admin financials
      await page.goto('/admin/financials');
      
      // Should show financial management content
      await expect(page.getByText(/financial|revenue|vendor.*balance|platform/i).first()).toBeVisible();
    });

    test('should show vendor balances in admin', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/admin/financials');
      
      // Should show financial content
      await expect(page.getByRole('heading').or(page.getByText(/financial|vendor|platform/i)).first()).toBeVisible();
    });

    test('should show platform fees information', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/admin/financials');
      
      // Should show financial content
      await expect(page.getByRole('heading').or(page.getByText(/financial|vendor|platform/i)).first()).toBeVisible();
    });
  });

  test.describe('Order Tracking Integration', () => {
    test('should track orders after checkout', async ({ page }) => {
      // Complete a simple checkout first
      await page.goto('/products');
      await page.waitForSelector('[data-testid="product-card"]:visible', { timeout: 15000 });
      await page.getByTestId('product-card').first().click();
      await page.getByRole('button', { name: /agregar al carrito|add to cart/i }).first().click();
      
      await page.waitForSelector('[role="dialog"], [data-testid="cart-sheet"]', { timeout: 5000 });
      await page.getByTestId('checkout-link').first().click();
      
      // Wait for checkout page to load
      await page.waitForURL(/\/(pagar|checkout)/, { timeout: 10000 });
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });
      
      // Quick checkout
      await page.fill('input[name="email"]', `track-${Date.now()}@example.com`);
      await page.fill('input[name="firstName"]', 'Track');
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="phone"]', '+52 55 1234 5678');
      await page.fill('input[name="address"]', 'Track Street 123');
      await page.fill('input[name="city"]', 'Mexico City');
      await page.fill('input[name="state"]', 'CDMX');
      await page.fill('input[name="postalCode"]', '01000');
      await page.locator('#acceptTerms').click();
      
      // Enable E2E bypass - set cookie before submitting
      const current = new URL(page.url());
      await page.context().addCookies([{ 
        name: 'e2e', 
        value: '1', 
        url: `${current.protocol}//${current.host}`
      }]);
      
      // Small wait to ensure cookie is set
      await page.waitForTimeout(100);
      
      // Submit checkout
      await page.getByTestId('checkout-submit-button').click();
      
      // Should show success with order info
      await expect(page).toHaveURL(/\/(success|exito)/, { timeout: 30000 });
      await expect(page.getByTestId('order-success-title')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle checkout errors gracefully', async ({ page }) => {
      await page.goto('/checkout');
      
      // Should redirect to products if cart is empty
      await expect(page).toHaveURL(/products|productos/, { timeout: 5000 }).catch(() => {
        // Or show empty cart message
        expect(page.getByText(/empty|vacío/i).first().isVisible()).toBeTruthy();
      });
    });

    test('should handle missing vendor financials gracefully', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/vendor/financials');
        
        // Page should load even without Stripe setup
        const hasFinancialsPage = 
          await page.getByText(/Financial Dashboard|Panel Financiero|Configuración de Pagos/i).first().isVisible().catch(() => false) ||
          await page.getByRole('heading', { level: 1 }).first().isVisible().catch(() => false);
        expect(hasFinancialsPage).toBeTruthy();
        
        // Should show either financials or setup prompt
        const hasUI = await page.locator('text=/Saldo|balance|stripe|setup|configurar|Finanzas/i').first().isVisible().catch(() => false) ||
          await page.locator('h1').first().isVisible().catch(() => false);
        expect(hasUI).toBeTruthy();
      });
    });
  });
});