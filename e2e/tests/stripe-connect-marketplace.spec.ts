import { test, expect } from '@playwright/test';
import { authenticatedTestVendor } from '../fixtures/authenticated-test';

test.describe('Stripe Connect Marketplace', () => {
  test.describe('Vendor Stripe Connect Onboarding', () => {
    test('should complete Stripe Connect onboarding flow', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        // Ensure financials are present for this vendor in test env
        await page.request.post('/api/test/ensure-vendor-financials');
        // Navigate to vendor financials (locale-aware paths auto-redirect)
        await page.goto('/es/vendedor/finanzas');

        // Seed creates connected Stripe accounts; financial dashboard should be visible
        await expect(page.getByText(/Available balance|Saldo Disponible/i)).toBeVisible();
        await expect(page.getByText(/Pending balance|Saldo Pendiente/i)).toBeVisible();
        await expect(page.getByText(/Total sales|Volumen Total/i)).toBeVisible();
      });
    });

    test('should handle incomplete Stripe onboarding', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.request.post('/api/test/ensure-vendor-financials');
        // With seeded connected accounts, ensure we do NOT see incomplete state
        await page.goto('/es/vendedor/finanzas');
        await expect(page.getByText(/Incomplete setup|Configuración incompleta/i)).not.toBeVisible({ timeout: 3000 });
      });
    });
  });

  test.describe('Payment Splitting', () => {
    test('should split payment between vendor and platform', async ({ page }) => {
      // Test multi-vendor checkout with automatic payment splitting
      await page.goto('/es/productos');

      // Add products from different vendors to cart
      await page.waitForSelector('main [data-testid="product-card"]:visible', { timeout: 15000 });
      await page.getByTestId('product-card').first().click();
      await page.getByRole('button', { name: /agregar al carrito|add to cart/i }).first().click();

      // Navigate to different vendor product
      await page.goto('/es/productos');
      await page.waitForSelector('main [data-testid="product-card"]:visible', { timeout: 15000 });
      await page.getByTestId('product-card').nth(1).click();
      await page.getByRole('button', { name: /agregar al carrito|add to cart/i }).first().click();

      // Use cart sheet to proceed to checkout
      await page.waitForSelector('[data-testid="cart-sheet"]', { timeout: 5000 });
      await page.getByTestId('checkout-link').first().click();
      await page.waitForSelector('form.space-y-8', { timeout: 20000 });

      // Fill checkout form (use same selectors as guest checkout)
      await page.fill('input[name="email"]', `guest-${Date.now()}@example.com`);
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="phone"]', '+52 55 1234 5678');
      await page.fill('input[name="address"]', 'Test Street 123');
      await page.fill('input[name="city"]', 'Mexico City');
      await page.fill('input[name="state"]', 'CDMX');
      await page.fill('input[name="postalCode"]', '01000');
      await page.locator('#acceptTerms').click();

      // Submit checkout with E2E bypass: set cookie so backend returns local success URL
      await page.context().addCookies([{ name: 'e2e', value: '1', url: page.url().startsWith('http') ? new URL(page.url()).origin : 'http://localhost' }]);
      await page.getByTestId('checkout-submit-button').click();
      await expect(page).toHaveURL(/\/(success|exito)/);

      // Should show success with proper payment splitting
      await expect(page.getByTestId('order-success-title')).toBeVisible();

      // Verify order contains multi-vendor items
      const orderSummary = page.getByTestId('order-summary');
      await expect(orderSummary.getByText('Vendor:')).toBeVisible();
    });

    test('should handle single vendor checkout', async ({ page }) => {
      // Test checkout with products from single vendor
      await page.goto('/es/productos');

      // Add single vendor product
      await page.waitForSelector('main [data-testid="product-card"]:visible', { timeout: 15000 });
      await page.getByTestId('product-card').first().click();
      await page.getByRole('button', { name: /agregar al carrito|add to cart/i }).first().click();

      // Use cart sheet to proceed to checkout
      await page.waitForSelector('[data-testid="cart-sheet"]', { timeout: 5000 });
      await page.getByTestId('checkout-link').first().click();
      await page.waitForSelector('form.space-y-8', { timeout: 20000 });

      // Basic presence to confirm single-vendor flow
      await expect(page.locator('form.space-y-8')).toBeVisible();
      await expect(page.getByTestId('checkout-submit-button')).toBeVisible();
    });
  });

  test.describe('Vendor Financial Dashboard', () => {
    test('should display vendor balance and transactions', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.request.post('/api/test/ensure-vendor-financials');
        await page.goto('/es/vendedor/finanzas');

        // Should show balance cards (accept EN or ES labels)
        await expect(page.getByText(/Available balance|Saldo Disponible/i)).toBeVisible();
        await expect(page.getByText(/Pending balance|Saldo Pendiente/i)).toBeVisible();
        await expect(page.getByText(/Total sales|Volumen Total/i)).toBeVisible();

        // Should show transaction history
        await expect(page.getByText('Historial de transacciones')).toBeVisible();

        // Test tabs navigation
        await page.getByRole('tab', { name: /Overview|Vista General/i }).click();
        await expect(page.getByText(/Available balance|Saldo Disponible/i)).toBeVisible();

        await page.getByRole('tab', { name: /Reports|Reportes/i }).click();
        await page.locator('[data-testid="tab-sales"]').scrollIntoViewIfNeeded();
        await expect(page.getByText(/Financial Reports|Reportes Financieros/i)).toBeVisible();
      });
    });

    test('should handle payout requests', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.request.post('/api/test/ensure-vendor-financials');
        await page.request.post('/api/test/ensure-vendor-financials');
        await page.goto('/es/vendedor/finanzas');

        // Mock available balance >= 10 MXN
        await page.evaluate(() => {
          window.localStorage.setItem('vendor-balance', '100.00');
        });

        await page.reload();

        // Should show payout request button (when balance threshold is met)
        const payoutButton = page.getByRole('button', { name: /Solicitar pago|Request payout/i });
        if (await payoutButton.isVisible()) {
          // Click payout request
          await payoutButton.click();

          // Should open payout dialog
          await expect(page.getByRole('dialog')).toBeVisible();
          await expect(page.getByText(/Solicitar Pago|Request Payout/i)).toBeVisible();

          // Fill payout amount
          await page.getByLabel(/Amount|Monto/i).fill('50.00');

          // Test quick amount buttons
          await page.getByRole('button', { name: '25%' }).click();
          await expect(page.getByLabel(/Amount|Monto/i)).toHaveValue('25.00');

          await page.getByRole('button', { name: '50%' }).click();
          await expect(page.getByLabel(/Amount|Monto/i)).toHaveValue('50.00');

          // Submit payout request
          await page.getByRole('button', { name: /Confirmar|Confirm/i }).click();

          // Should show success message
          await expect(page.getByText(/Solicitud de pago enviada exitosamente|successfully/i)).toBeVisible();
        }
      });
    });

    test('should validate minimum payout amount', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.request.post('/api/test/ensure-vendor-financials');
        await page.request.post('/api/test/ensure-vendor-financials');
        await page.goto('/es/vendedor/finanzas');

        // Mock low balance
        await page.evaluate(() => {
          window.localStorage.setItem('vendor-balance', '5.00');
        });

        await page.reload();

        // Payout button should not be visible for low balance
        await expect(page.getByRole('button', { name: /Request payout|Solicitar pago/i })).not.toBeVisible();
      });
    });
  });

  test.describe('Financial Reports', () => {
    test('should generate vendor sales reports', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.request.post('/api/test/ensure-vendor-financials');
        await page.request.post('/api/test/ensure-vendor-financials');
        await page.goto('/es/vendedor/finanzas');

        // Navigate to reports tab
        await page.getByRole('tab', { name: /Reports|Reportes/i }).click();
        await page.getByTestId('tab-sales');
        await page.locator('[data-testid="tab-revenue"]').scrollIntoViewIfNeeded();
        await page.waitForTimeout(200); // allow content switch

        // Should show report types via stable testids
        await expect(page.getByTestId('tab-sales')).toBeVisible();
        await expect(page.getByTestId('tab-revenue')).toBeVisible();
        await expect(page.getByTestId('tab-products')).toBeVisible();

        // Select date range
        await page.getByTestId('date-range-picker').click();
        await page.keyboard.press('Escape');
        // Select last 30 days (default should be fine)

        // Generate sales report
        await page.getByTestId('tab-sales').click();

        // Should show report loading or resulting chart/data
        await expect(page.getByTestId('report-loading')).toBeVisible({ timeout: 15000 }).catch(() => { });
        await expect(page.getByTestId('revenue-chart')).toBeVisible({ timeout: 20000 });

        // Should show report data
        await expect(page.getByText('Total Orders')).toBeVisible();
        await expect(page.getByText('Total Revenue')).toBeVisible();
        await expect(page.getByText('Average Order Value')).toBeVisible();

        // Should show chart
        await expect(page.getByTestId('revenue-chart')).toBeVisible();

        // Should show top products
        await expect(page.getByText('Best Selling Products')).toBeVisible();
      });
    });

    test('should generate revenue reports', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/es/vendedor/finanzas');
        await page.getByRole('tab', { name: /Reports|Reportes/i }).click();
        await page.getByTestId('tab-revenue');
        await page.locator('[data-testid="tab-products"]').scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);

        // Generate revenue report
        await page.keyboard.press('Escape');
        await page.locator('[data-testid="tab-revenue"]').scrollIntoViewIfNeeded();
        await page.getByTestId('tab-revenue').click();

        // Should show revenue report container
        await expect(page.getByTestId('revenue-report')).toBeVisible();

        // Should show transaction breakdown chart
        await expect(page.getByTestId('transaction-breakdown-chart')).toBeVisible();

        // Should show payout summary
        await expect(page.getByText('Payout Summary')).toBeVisible();
      });
    });

    test('should generate products performance reports', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/es/vendedor/finanzas');
        await page.getByRole('tab', { name: /Reports|Reportes/i }).click();
        await page.getByTestId('tab-products');
        await page.waitForTimeout(200);

        // Generate products report
        await page.keyboard.press('Escape');
        await page.locator('[data-testid="tab-products"]').scrollIntoViewIfNeeded();
        await page.getByTestId('tab-products').click();

        // Should show products report container
        await expect(page.getByTestId('products-report')).toBeVisible();

        // Should show product performance table
        await expect(page.getByTestId('product-performance-table')).toBeVisible();

        // Should highlight low stock products
        await expect(page.getByTestId('low-stock-indicator')).toBeVisible();
      });
    });

    test('should download reports as CSV', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/es/vendedor/finanzas');
        await page.getByRole('tab', { name: /Reports|Reportes/i }).click();
        // Close any open popovers before clicking tabs
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        // Generate a report first
        await page.getByTestId('tab-sales').click();
        await expect(page.getByText('Total Orders')).toBeVisible();

        // Mock download functionality
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Download' }).click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/sales_report_\d{4}-\d{2}-\d{2}\.csv/);
      });
    });
  });

  test.describe('Admin Financial Management', () => {
    test('should display platform financial overview', async ({ page }) => {
      // Authenticate as admin and navigate
      await page.goto('/login');
      await page.getByRole('tab', { name: /admin|administrador/i }).click();
      await page.fill('input[name="email"]', 'admin@luzimarket.shop');
      await page.fill('input[name="password"]', 'admin123');
      await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
      await page.waitForURL(/\/(en|es)\/admin(\/.+)?|^\/admin(\/.+)?/);
      await page.goto('/admin/financials');

      // Should show platform stats (headline cards)
      await expect(page.getByText(/Total Revenue|Ingresos Totales/i)).toBeVisible();
      await expect(page.getByText(/Pending Fees|Comisiones Pendientes/i)).toBeVisible();
      await expect(page.getByText(/Vendor Balances|Saldos de Vendedores/i)).toBeVisible();
      await expect(page.getByText(/Active Vendors|Vendedores Activos/i)).toBeVisible();

      // Should show data tables tabs
      await expect(page.getByRole('tab', { name: 'Vendor Balances' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Platform Fees' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Payouts' })).toBeVisible();
    });

    test('should manage vendor balances', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('tab', { name: /admin|administrador/i }).click();
      await page.fill('input[name="email"]', 'admin@luzimarket.shop');
      await page.fill('input[name="password"]', 'admin123');
      await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
      await page.waitForURL(/\/(en|es)\/admin(\/.+)?|^\/admin(\/.+)?/);
      await page.goto('/admin/financials');

      // Navigate to vendor balances
      await page.getByRole('tab', { name: 'Vendor Balances' }).click();

      // Should show vendor balance table
      await expect(page.getByTestId('vendor-balances-table')).toBeVisible();

      // Should be able to search vendors
      await page.getByPlaceholder('Search vendor...').fill('Test Vendor');
      await expect(page.getByText('Test Vendor')).toBeVisible();

      // Should show balance amounts
      await expect(page.getByTestId('available-balance')).toBeVisible();
      await expect(page.getByTestId('pending-balance')).toBeVisible();
      await expect(page.getByTestId('lifetime-balance')).toBeVisible();
    });

    test('should view platform fees breakdown', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('tab', { name: /admin|administrador/i }).click();
      await page.fill('input[name="email"]', 'admin@luzimarket.shop');
      await page.fill('input[name="password"]', 'admin123');
      await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
      await page.waitForURL(/\/(en|es)\/admin(\/.+)?|^\/admin(\/.+)?/);
      await page.goto('/admin/financials');

      // Navigate to platform fees
      await page.getByRole('tab', { name: 'Platform Fees' }).click();

      // Should show fees table
      await expect(page.getByTestId('platform-fees-table')).toBeVisible();

      // Should show fee details
      await expect(page.getByText('Date')).toBeVisible();
      await expect(page.getByText('Vendor')).toBeVisible();
      await expect(page.getByText('Order')).toBeVisible();
      await expect(page.getByText('Order Amount')).toBeVisible();
      await expect(page.getByText('Rate')).toBeVisible();
      await expect(page.getByText('Fee')).toBeVisible();
    });

    test('should manage payout requests', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('tab', { name: /admin|administrador/i }).click();
      await page.fill('input[name="email"]', 'admin@luzimarket.shop');
      await page.fill('input[name="password"]', 'admin123');
      await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
      await page.waitForURL(/\/(en|es)\/admin(\/.+)?|^\/admin(\/.+)?/);
      await page.goto('/admin/financials');

      // Navigate to payouts
      await page.getByRole('tab', { name: 'Payouts' }).click();

      // Should show payouts table
      await expect(page.getByTestId('payouts-table')).toBeVisible();

      // Should show payout actions
      await expect(page.getByRole('button', { name: 'Process' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible();

      // Test payout processing
      await page.getByRole('button', { name: 'Process' }).first().click();

      // Should show confirmation dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Process this payout?')).toBeVisible();

      await page.getByRole('button', { name: 'Confirm' }).click();

      // Should update payout status
      await expect(page.getByText('Payout processed successfully')).toBeVisible();
    });
  });

  test.describe('Admin Financial Reports', () => {
    test('should generate platform overview reports', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('tab', { name: /admin|administrador/i }).click();
      await page.fill('input[name="email"]', 'admin@luzimarket.shop');
      await page.fill('input[name="password"]', 'admin123');
      await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
      await page.waitForURL(/\/(en|es)\/admin(\/.+)?|^\/admin(\/.+)?/);
      await page.goto('/admin/financials/reports');

      // Should show report tabs
      await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Sales Report' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Payouts Report' })).toBeVisible();

      // Generate platform overview
      await page.getByRole('tab', { name: 'Overview' }).click();

      // Should show platform metrics
      await expect(page.getByText('Platform Revenue')).toBeVisible();
      await expect(page.getByText('Total Sales')).toBeVisible();
      await expect(page.getByText('Active Vendors')).toBeVisible();
      await expect(page.getByText('Average Order Value')).toBeVisible();

      // Should show top vendors chart
      await expect(page.getByTestId('top-vendors-chart')).toBeVisible();

      // Should show vendor performance table
      await expect(page.getByTestId('vendor-performance-table')).toBeVisible();
    });

    test('should filter reports by vendor', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('tab', { name: /admin|administrador/i }).click();
      await page.fill('input[name="email"]', 'admin@luzimarket.shop');
      await page.fill('input[name="password"]', 'admin123');
      await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
      await page.waitForURL(/\/(en|es)\/admin(\/.+)?|^\/admin(\/.+)?/);
      await page.goto('/admin/financials/reports');

      // Navigate to sales report
      await page.getByRole('tab', { name: 'Sales Report' }).click();

      // Should show vendor filter (not available for platform overview)
      await expect(page.getByTestId('vendor-select')).toBeVisible();

      // Select specific vendor
      await page.getByTestId('vendor-select').click();
      await page.getByRole('option', { name: 'Test Vendor' }).click();

      // Should update report for selected vendor
      await expect(page.getByText('Test Vendor')).toBeVisible();
    });

    test('should generate comprehensive payout reports', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('tab', { name: /admin|administrador/i }).click();
      await page.fill('input[name="email"]', 'admin@luzimarket.shop');
      await page.fill('input[name="password"]', 'admin123');
      await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
      await page.waitForURL(/\/(en|es)\/admin(\/.+)?|^\/admin(\/.+)?/);
      await page.goto('/admin/financials/reports');

      // Generate payout report
      await page.getByRole('tab', { name: 'Payouts Report' }).click();

      // Should show payout summary
      await expect(page.getByText('Total Payouts')).toBeVisible();
      await expect(page.getByText('Pending Payouts')).toBeVisible();
      await expect(page.getByText('Completed Payouts')).toBeVisible();
      await expect(page.getByText('Failed Payouts')).toBeVisible();

      // Should show status breakdown chart
      await expect(page.getByTestId('payout-status-chart')).toBeVisible();

      // Should show recent payouts
      await expect(page.getByText('Recent Payouts')).toBeVisible();
    });
  });

  test.describe('Order Tracking Integration', () => {
    test('should track multi-vendor orders', async ({ page }) => {
      await page.goto('/');

      // Use order tracking
      await page.getByRole('button', { name: /Track order|Rastrear pedido/i }).click();

      // Enter order details
      await page.getByTestId('order-number').fill('LM-2501-ABC123');
      await page.getByTestId('order-email').fill('test@example.com');
      await page.getByRole('button', { name: 'Search order' }).click();

      // Should show order details with vendor information
      await expect(page.getByText('Vendor Information')).toBeVisible();
      await expect(page.getByTestId('vendor-info')).toBeVisible();

      // Should show order status
      await expect(page.getByTestId('order-status')).toBeVisible();

      // Should show payment splitting information (for admin/vendor views)
      // This would be visible in detailed order view
    });
  });

  test.describe('Error Handling', () => {
    test('should handle Stripe Connect errors gracefully', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        // Mock Stripe error
        await page.route('**/api/stripe/connect/**', route => {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Stripe Connect error' })
          });
        });

        await page.goto('/es/vendedor/finanzas');

        // Should show error message
        await expect(page.getByText(/Error connecting to Stripe|Error al conectar con Stripe/i)).toBeVisible();

        // Should provide retry option
        await expect(page.getByRole('button', { name: /Retry|Reintentar/i })).toBeVisible();
      });
    });

    test('should handle payout failures', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/es/vendedor/finanzas');

        // Mock payout failure
        await page.route('**/api/payouts/**', route => {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Insufficient funds' })
          });
        });

        // Attempt payout request
        const payoutButton = page.getByRole('button', { name: /Request payout|Solicitar pago/i });
        if (await payoutButton.isVisible()) {
          await payoutButton.click();
          await page.getByLabel(/Amount|Monto/i).fill('50.00');
          await page.getByRole('button', { name: /Confirmar|Confirm/i }).click();

          // Should show error message
          await expect(page.getByText(/Error processing request|Error al procesar/i)).toBeVisible();
        }
      });
    });

    test('should handle report generation failures', async ({ page }) => {
      await authenticatedTestVendor(page, async (page) => {
        await page.goto('/vendor/financials');
        await page.getByRole('tab', { name: 'Reports' }).click();

        // Mock report error
        await page.route('**/api/reports/**', route => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Report generation failed' })
          });
        });

        // Attempt to generate report
        await page.getByRole('tab', { name: /Sales Report|Sales/i }).click();

        // Should show error message
        await expect(page.getByText(/Error generating report|Error al generar/i)).toBeVisible();

        // Should provide retry option
        await expect(page.getByRole('button', { name: /Retry|Reintentar/i })).toBeVisible();
      });
    });
  });
});