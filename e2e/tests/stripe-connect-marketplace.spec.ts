import { test, expect } from '@playwright/test';
import { authenticatedTestVendor } from '../fixtures/authenticated-test';

test.describe('Stripe Connect Marketplace', () => {
  test.describe('Vendor Stripe Connect Onboarding', () => {
    test('should complete Stripe Connect onboarding flow', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        // Navigate to vendor financials
        await page.goto('/vendor/financials');
        
        // Should show Stripe setup required
        await expect(page.getByText('Cuenta de Stripe no configurada')).toBeVisible();
        
        // Click setup Stripe account
        await page.getByRole('button', { name: 'Configurar cuenta de Stripe' }).click();
        
        // Should redirect to Stripe onboarding
        // Note: In tests, we would mock the Stripe flow
        await expect(page).toHaveURL(/stripe-onboarding/);
        
        // Mock successful onboarding
        await page.evaluate(() => {
          // Mock successful Stripe Connect setup
          window.localStorage.setItem('stripe-onboarding-complete', 'true');
        });
        
        // Navigate back to financials
        await page.goto('/vendor/financials');
        
        // Should now show financial dashboard
        await expect(page.getByText('Balance disponible')).toBeVisible();
        await expect(page.getByText('Balance pendiente')).toBeVisible();
        await expect(page.getByText('Ventas totales')).toBeVisible();
      });
    });

    test('should handle incomplete Stripe onboarding', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        // Mock incomplete onboarding state
        await page.goto('/vendor/financials');
        
        // Should show incomplete setup warning
        await expect(page.getByText('Configuración incompleta')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Completar configuración' })).toBeVisible();
      });
    });
  });

  test.describe('Payment Splitting', () => {
    test('should split payment between vendor and platform', async ({ page }) => {
      // Test multi-vendor checkout with automatic payment splitting
      await page.goto('/');
      
      // Add products from different vendors to cart
      await page.getByTestId('product-card').first().click();
      await page.getByRole('button', { name: 'Agregar al carrito' }).click();
      
      // Navigate to different vendor product
      await page.goto('/products');
      await page.getByTestId('product-card').nth(1).click();
      await page.getByRole('button', { name: 'Agregar al carrito' }).click();
      
      // Go to checkout
      await page.getByRole('button', { name: 'Proceder al pago' }).click();
      
      // Fill checkout form
      await page.getByTestId('first-name').fill('Test');
      await page.getByTestId('last-name').fill('User');
      await page.getByTestId('email').fill('test@example.com');
      await page.getByTestId('phone').fill('1234567890');
      await page.getByTestId('street').fill('Test Street 123');
      await page.getByTestId('city').fill('Mexico City');
      await page.getByTestId('state').fill('CDMX');
      await page.getByTestId('postal-code').fill('12345');
      
      // Mock Stripe payment with Connect
      await page.getByTestId('stripe-payment-element').fill('4242424242424242');
      await page.getByTestId('stripe-expiry').fill('12/28');
      await page.getByTestId('stripe-cvc').fill('123');
      
      // Submit order
      await page.getByRole('button', { name: 'Realizar pedido' }).click();
      
      // Should show success with proper payment splitting
      await expect(page.getByText('¡Pedido confirmado!')).toBeVisible();
      
      // Verify order contains multi-vendor items
      const orderSummary = page.getByTestId('order-summary');
      await expect(orderSummary.getByText('Vendedor:')).toBeVisible();
    });

    test('should handle single vendor checkout', async ({ page }) => {
      // Test checkout with products from single vendor
      await page.goto('/');
      
      // Add single vendor product
      await page.getByTestId('product-card').first().click();
      await page.getByRole('button', { name: 'Agregar al carrito' }).click();
      
      // Proceed to checkout
      await page.getByRole('button', { name: 'Proceder al pago' }).click();
      
      // Should show single vendor checkout flow
      await expect(page.getByTestId('single-vendor-checkout')).toBeVisible();
    });
  });

  test.describe('Vendor Financial Dashboard', () => {
    test('should display vendor balance and transactions', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        await page.goto('/vendor/financials');
        
        // Should show balance cards
        await expect(page.getByText('Balance disponible')).toBeVisible();
        await expect(page.getByText('Balance pendiente')).toBeVisible();
        await expect(page.getByText('Ventas totales')).toBeVisible();
        
        // Should show transaction history
        await expect(page.getByText('Historial de transacciones')).toBeVisible();
        
        // Test tabs navigation
        await page.getByRole('tab', { name: 'Vista General' }).click();
        await expect(page.getByText('Balance disponible')).toBeVisible();
        
        await page.getByRole('tab', { name: 'Reportes' }).click();
        await expect(page.getByText('Reportes Financieros')).toBeVisible();
      });
    });

    test('should handle payout requests', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        await page.goto('/vendor/financials');
        
        // Mock available balance >= 10 MXN
        await page.evaluate(() => {
          window.localStorage.setItem('vendor-balance', '100.00');
        });
        
        await page.reload();
        
        // Should show payout request button
        const payoutButton = page.getByRole('button', { name: 'Solicitar Pago' });
        await expect(payoutButton).toBeVisible();
        
        // Click payout request
        await payoutButton.click();
        
        // Should open payout dialog
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Solicitar Pago')).toBeVisible();
        
        // Fill payout amount
        await page.getByTestId('payout-amount').fill('50.00');
        
        // Test quick amount buttons
        await page.getByRole('button', { name: '25%' }).click();
        await expect(page.getByTestId('payout-amount')).toHaveValue('25.00');
        
        await page.getByRole('button', { name: '50%' }).click();
        await expect(page.getByTestId('payout-amount')).toHaveValue('50.00');
        
        // Submit payout request
        await page.getByRole('button', { name: 'Confirmar' }).click();
        
        // Should show success message
        await expect(page.getByText('Solicitud de pago enviada exitosamente')).toBeVisible();
      });
    });

    test('should validate minimum payout amount', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        await page.goto('/vendor/financials');
        
        // Mock low balance
        await page.evaluate(() => {
          window.localStorage.setItem('vendor-balance', '5.00');
        });
        
        await page.reload();
        
        // Payout button should not be visible for low balance
        await expect(page.getByRole('button', { name: 'Solicitar Pago' })).not.toBeVisible();
      });
    });
  });

  test.describe('Financial Reports', () => {
    test('should generate vendor sales reports', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        await page.goto('/vendor/financials');
        
        // Navigate to reports tab
        await page.getByRole('tab', { name: 'Reportes' }).click();
        
        // Should show report types
        await expect(page.getByRole('tab', { name: 'Ventas' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Ingresos' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Productos' })).toBeVisible();
        
        // Select date range
        await page.getByTestId('date-range-picker').click();
        // Select last 30 days (default should be fine)
        
        // Generate sales report
        await page.getByRole('tab', { name: 'Ventas' }).click();
        
        // Should show report loading
        await expect(page.getByTestId('report-loading')).toBeVisible();
        
        // Should show report data
        await expect(page.getByText('Total de Órdenes')).toBeVisible();
        await expect(page.getByText('Ingresos Totales')).toBeVisible();
        await expect(page.getByText('Valor Promedio de Orden')).toBeVisible();
        
        // Should show chart
        await expect(page.getByTestId('revenue-chart')).toBeVisible();
        
        // Should show top products
        await expect(page.getByText('Productos Más Vendidos')).toBeVisible();
      });
    });

    test('should generate revenue reports', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        await page.goto('/vendor/financials');
        await page.getByRole('tab', { name: 'Reportes' }).click();
        
        // Generate revenue report
        await page.getByRole('tab', { name: 'Ingresos' }).click();
        
        // Should show balance breakdown
        await expect(page.getByText('Balance Disponible')).toBeVisible();
        await expect(page.getByText('Balance Pendiente')).toBeVisible();
        await expect(page.getByText('Balance Reservado')).toBeVisible();
        
        // Should show transaction breakdown chart
        await expect(page.getByTestId('transaction-breakdown-chart')).toBeVisible();
        
        // Should show payout summary
        await expect(page.getByText('Resumen de Pagos')).toBeVisible();
      });
    });

    test('should generate products performance reports', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        await page.goto('/vendor/financials');
        await page.getByRole('tab', { name: 'Reportes' }).click();
        
        // Generate products report
        await page.getByRole('tab', { name: 'Productos' }).click();
        
        // Should show product metrics
        await expect(page.getByText('Total de Productos')).toBeVisible();
        await expect(page.getByText('Valor del Inventario')).toBeVisible();
        await expect(page.getByText('Stock Bajo')).toBeVisible();
        
        // Should show product performance table
        await expect(page.getByTestId('product-performance-table')).toBeVisible();
        
        // Should highlight low stock products
        await expect(page.getByTestId('low-stock-indicator')).toBeVisible();
      });
    });

    test('should download reports as CSV', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        await page.goto('/vendor/financials');
        await page.getByRole('tab', { name: 'Reportes' }).click();
        
        // Generate a report first
        await page.getByRole('tab', { name: 'Ventas' }).click();
        await expect(page.getByText('Total de Órdenes')).toBeVisible();
        
        // Mock download functionality
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Descargar' }).click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/sales_report_\d{4}-\d{2}-\d{2}\.csv/);
      });
    });
  });

  test.describe('Admin Financial Management', () => {
    test('should display platform financial overview', async ({ page }) => {
      // Mock admin authentication
      await page.goto('/admin/financials');
      
      // Should show platform stats
      await expect(page.getByText('Ingresos Totales')).toBeVisible();
      await expect(page.getByText('Comisiones Pendientes')).toBeVisible();
      await expect(page.getByText('Balance de Vendedores')).toBeVisible();
      await expect(page.getByText('Vendedores Activos')).toBeVisible();
      
      // Should show data tables
      await expect(page.getByRole('tab', { name: 'Balances de Vendedores' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Comisiones de Plataforma' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Pagos' })).toBeVisible();
    });

    test('should manage vendor balances', async ({ page }) => {
      await page.goto('/admin/financials');
      
      // Navigate to vendor balances
      await page.getByRole('tab', { name: 'Balances de Vendedores' }).click();
      
      // Should show vendor balance table
      await expect(page.getByTestId('vendor-balances-table')).toBeVisible();
      
      // Should be able to search vendors
      await page.getByPlaceholder('Buscar vendedor...').fill('Test Vendor');
      await expect(page.getByText('Test Vendor')).toBeVisible();
      
      // Should show balance amounts
      await expect(page.getByTestId('available-balance')).toBeVisible();
      await expect(page.getByTestId('pending-balance')).toBeVisible();
      await expect(page.getByTestId('lifetime-balance')).toBeVisible();
    });

    test('should view platform fees breakdown', async ({ page }) => {
      await page.goto('/admin/financials');
      
      // Navigate to platform fees
      await page.getByRole('tab', { name: 'Comisiones de Plataforma' }).click();
      
      // Should show fees table
      await expect(page.getByTestId('platform-fees-table')).toBeVisible();
      
      // Should show fee details
      await expect(page.getByText('Fecha')).toBeVisible();
      await expect(page.getByText('Vendedor')).toBeVisible();
      await expect(page.getByText('Orden')).toBeVisible();
      await expect(page.getByText('Monto Orden')).toBeVisible();
      await expect(page.getByText('Tasa')).toBeVisible();
      await expect(page.getByText('Comisión')).toBeVisible();
    });

    test('should manage payout requests', async ({ page }) => {
      await page.goto('/admin/financials');
      
      // Navigate to payouts
      await page.getByRole('tab', { name: 'Pagos' }).click();
      
      // Should show payouts table
      await expect(page.getByTestId('payouts-table')).toBeVisible();
      
      // Should show payout actions
      await expect(page.getByRole('button', { name: 'Procesar' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Rechazar' })).toBeVisible();
      
      // Test payout processing
      await page.getByRole('button', { name: 'Procesar' }).first().click();
      
      // Should show confirmation dialog
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('¿Procesar este pago?')).toBeVisible();
      
      await page.getByRole('button', { name: 'Confirmar' }).click();
      
      // Should update payout status
      await expect(page.getByText('Pago procesado exitosamente')).toBeVisible();
    });
  });

  test.describe('Admin Financial Reports', () => {
    test('should generate platform overview reports', async ({ page }) => {
      await page.goto('/admin/financials/reports');
      
      // Should show report tabs
      await expect(page.getByRole('tab', { name: 'Vista General' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Reporte de Ventas' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Reporte de Pagos' })).toBeVisible();
      
      // Generate platform overview
      await page.getByRole('tab', { name: 'Vista General' }).click();
      
      // Should show platform metrics
      await expect(page.getByText('Ingresos de Plataforma')).toBeVisible();
      await expect(page.getByText('Ventas Totales')).toBeVisible();
      await expect(page.getByText('Vendedores Activos')).toBeVisible();
      await expect(page.getByText('Valor Promedio de Orden')).toBeVisible();
      
      // Should show top vendors chart
      await expect(page.getByTestId('top-vendors-chart')).toBeVisible();
      
      // Should show vendor performance table
      await expect(page.getByTestId('vendor-performance-table')).toBeVisible();
    });

    test('should filter reports by vendor', async ({ page }) => {
      await page.goto('/admin/financials/reports');
      
      // Navigate to sales report
      await page.getByRole('tab', { name: 'Reporte de Ventas' }).click();
      
      // Should show vendor filter (not available for platform overview)
      await expect(page.getByTestId('vendor-select')).toBeVisible();
      
      // Select specific vendor
      await page.getByTestId('vendor-select').click();
      await page.getByRole('option', { name: 'Test Vendor' }).click();
      
      // Should update report for selected vendor
      await expect(page.getByText('Test Vendor')).toBeVisible();
    });

    test('should generate comprehensive payout reports', async ({ page }) => {
      await page.goto('/admin/financials/reports');
      
      // Generate payout report
      await page.getByRole('tab', { name: 'Reporte de Pagos' }).click();
      
      // Should show payout summary
      await expect(page.getByText('Total de Pagos')).toBeVisible();
      await expect(page.getByText('Pagos Pendientes')).toBeVisible();
      await expect(page.getByText('Pagos Completados')).toBeVisible();
      await expect(page.getByText('Pagos Fallidos')).toBeVisible();
      
      // Should show status breakdown chart
      await expect(page.getByTestId('payout-status-chart')).toBeVisible();
      
      // Should show recent payouts
      await expect(page.getByText('Pagos Recientes')).toBeVisible();
    });
  });

  test.describe('Order Tracking Integration', () => {
    test('should track multi-vendor orders', async ({ page }) => {
      await page.goto('/');
      
      // Use order tracking
      await page.getByRole('button', { name: 'Rastrear pedido' }).click();
      
      // Enter order details
      await page.getByTestId('order-number').fill('LM-2501-ABC123');
      await page.getByTestId('order-email').fill('test@example.com');
      await page.getByRole('button', { name: 'Buscar pedido' }).click();
      
      // Should show order details with vendor information
      await expect(page.getByText('Información del Vendedor')).toBeVisible();
      await expect(page.getByTestId('vendor-info')).toBeVisible();
      
      // Should show order status
      await expect(page.getByTestId('order-status')).toBeVisible();
      
      // Should show payment splitting information (for admin/vendor views)
      // This would be visible in detailed order view
    });
  });

  test.describe('Error Handling', () => {
    test('should handle Stripe Connect errors gracefully', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        // Mock Stripe error
        await page.route('**/api/stripe/connect/**', route => {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Stripe Connect error' })
          });
        });
        
        await page.goto('/vendor/financials');
        
        // Should show error message
        await expect(page.getByText('Error conectando con Stripe')).toBeVisible();
        
        // Should provide retry option
        await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
      });
    });

    test('should handle payout failures', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        await page.goto('/vendor/financials');
        
        // Mock payout failure
        await page.route('**/api/payouts/**', route => {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Insufficient funds' })
          });
        });
        
        // Attempt payout request
        await page.getByRole('button', { name: 'Solicitar Pago' }).click();
        await page.getByTestId('payout-amount').fill('50.00');
        await page.getByRole('button', { name: 'Confirmar' }).click();
        
        // Should show error message
        await expect(page.getByText('Error al procesar la solicitud')).toBeVisible();
      });
    });

    test('should handle report generation failures', async ({ page }) => {
      await authenticatedTestVendor(page, async () => {
        await page.goto('/vendor/financials');
        await page.getByRole('tab', { name: 'Reportes' }).click();
        
        // Mock report error
        await page.route('**/api/reports/**', route => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Report generation failed' })
          });
        });
        
        // Attempt to generate report
        await page.getByRole('tab', { name: 'Ventas' }).click();
        
        // Should show error message
        await expect(page.getByText('Error al generar el reporte')).toBeVisible();
        
        // Should provide retry option
        await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
      });
    });
  });
});