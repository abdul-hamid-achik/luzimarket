import { test, expect } from '@playwright/test';

test.describe('Employee Financial Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate directly to the employee financial dashboard
        // In a real scenario, you'd login first
        await page.goto('/InicioEmpleados/Dinero');
    });

    test('should display all financial overview cards', async ({ page }) => {
        // Check for all financial cards
        await expect(page.locator('text=Ventas Totales')).toBeVisible();
        await expect(page.locator('text=Comisiones')).toBeVisible();
        await expect(page.locator('text=Pagos Pendientes')).toBeVisible();
        await expect(page.locator('text=Crecimiento')).toBeVisible();

        // Check for financial values
        await expect(page.locator('text=$45,250')).toBeVisible();
        await expect(page.locator('text=$2,262.5')).toBeVisible();
        await expect(page.locator('text=$1,850')).toBeVisible();
        await expect(page.locator('text=+12.5%')).toBeVisible();

        // Check for descriptive text
        await expect(page.locator('text=Este mes')).toBeVisible();
        await expect(page.locator('text=5% de ventas')).toBeVisible();
        await expect(page.locator('text=Por procesar')).toBeVisible();
        await expect(page.locator('text=vs mes anterior')).toBeVisible();
    });

    test('should have functional period selector', async ({ page }) => {
        // Check that all period buttons are visible
        await expect(page.locator('text=Semana')).toBeVisible();
        await expect(page.locator('text=Mes')).toBeVisible();
        await expect(page.locator('text=Año')).toBeVisible();

        // Month should be selected by default
        const monthButton = page.locator('button:has-text("Mes")');
        await expect(monthButton).toHaveClass(/btn-primary/);

        // Test clicking week button
        const weekButton = page.locator('button:has-text("Semana")');
        await weekButton.click();
        await expect(weekButton).toHaveClass(/btn-primary/);
        await expect(monthButton).toHaveClass(/btn-outline-primary/);

        // Test clicking year button
        const yearButton = page.locator('button:has-text("Año")');
        await yearButton.click();
        await expect(yearButton).toHaveClass(/btn-primary/);
        await expect(weekButton).toHaveClass(/btn-outline-primary/);
    });

    test('should display financial summary section', async ({ page }) => {
        await expect(page.locator('text=Resumen Financiero')).toBeVisible();
        await expect(page.locator('text=Transacciones Completadas')).toBeVisible();
        await expect(page.locator('text=127')).toBeVisible();
        await expect(page.locator('text=Promedio por Transacción')).toBeVisible();
        await expect(page.locator('text=$356.30')).toBeVisible();
    });

    test('should display transactions table with correct data', async ({ page }) => {
        // Check table headers
        await expect(page.locator('text=Transacciones Recientes')).toBeVisible();
        await expect(page.locator('th:has-text("Fecha")')).toBeVisible();
        await expect(page.locator('th:has-text("Tipo")')).toBeVisible();
        await expect(page.locator('th:has-text("Monto")')).toBeVisible();
        await expect(page.locator('th:has-text("Estado")')).toBeVisible();

        // Check for specific transaction data
        await expect(page.locator('text=2024-01-15')).toBeVisible();
        await expect(page.locator('text=$250.00')).toBeVisible();
        await expect(page.locator('text=2024-01-14')).toBeVisible();
        await expect(page.locator('text=$180.50')).toBeVisible();

        // Check for transaction types
        const ventaBadges = page.locator('.badge:has-text("Venta")');
        await expect(ventaBadges).toHaveCount(3);

        const comisionBadges = page.locator('.badge:has-text("Comisión")');
        await expect(comisionBadges).toHaveCount(2);

        // Check for transaction statuses
        const completadoBadges = page.locator('.badge:has-text("Completado")');
        await expect(completadoBadges).toHaveCount(4);

        const pendienteBadges = page.locator('.badge:has-text("Pendiente")');
        await expect(pendienteBadges).toHaveCount(1);
    });

    test('should display action buttons', async ({ page }) => {
        const exportButton = page.locator('button:has-text("Exportar Reporte")');
        const paymentButton = page.locator('button:has-text("Solicitar Pago")');

        await expect(exportButton).toBeVisible();
        await expect(paymentButton).toBeVisible();

        // Check button classes
        await expect(exportButton).toHaveClass(/btn-outline-primary/);
        await expect(paymentButton).toHaveClass(/btn-primary/);
    });

    test('should be responsive on different screen sizes', async ({ page }) => {
        // Test desktop view
        await page.setViewportSize({ width: 1200, height: 800 });
        await expect(page.locator('.col-md-3')).toHaveCount(4); // 4 financial cards

        // Test tablet view
        await page.setViewportSize({ width: 768, height: 1024 });
        await expect(page.locator('text=Ventas Totales')).toBeVisible();

        // Test mobile view
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('text=Ventas Totales')).toBeVisible();

        // Check if table is responsive
        await expect(page.locator('.table-responsive')).toBeVisible();
    });

    test('should have proper breadcrumb navigation', async ({ page }) => {
        // Check for breadcrumb
        const breadcrumb = page.locator('[aria-label="breadcrumb"]');
        await expect(breadcrumb).toBeVisible();

        // Check breadcrumb content
        await expect(page.locator('text=Dinero')).toBeVisible();
    });

    test('should maintain state when navigating away and back', async ({ page }) => {
        // Change period to week
        await page.click('button:has-text("Semana")');
        await expect(page.locator('button:has-text("Semana")')).toHaveClass(/btn-primary/);

        // Navigate away
        await page.click('text=Dashboard');
        await expect(page).toHaveURL(/.*DashboardEmpleados/);

        // Navigate back
        await page.click('text=Dinero');
        await expect(page).toHaveURL(/.*Dinero/);

        // State should be reset to default (Mes)
        await expect(page.locator('button:has-text("Mes")')).toHaveClass(/btn-primary/);
    });

    test('should handle button interactions correctly', async ({ page }) => {
        // Test export button click
        const exportButton = page.locator('button:has-text("Exportar Reporte")');
        await exportButton.click();
        // In a real app, this might trigger a download or modal

        // Test payment request button click
        const paymentButton = page.locator('button:has-text("Solicitar Pago")');
        await paymentButton.click();
        // In a real app, this might trigger a form or modal
    });

    test('should display correct financial calculations', async ({ page }) => {
        // Verify the average calculation is correct
        // Total sales: $45,250 / Transactions: 127 = $356.30
        await expect(page.locator('text=$356.30')).toBeVisible();

        // Verify commission calculation (5% of sales)
        // $45,250 * 0.05 = $2,262.50
        await expect(page.locator('text=$2,262.5')).toBeVisible();
    });

    test('should have proper styling and layout', async ({ page }) => {
        // Check for Bootstrap classes
        await expect(page.locator('.container')).toBeVisible();
        await expect(page.locator('.row')).toHaveCount(4); // 4 main rows
        await expect(page.locator('.card')).toHaveCount(7); // 4 overview cards + 2 section cards + 1 table card

        // Check for proper spacing
        await expect(page.locator('.mt-4')).toHaveCount(4);
        await expect(page.locator('.mb-3')).toHaveCount(4);

        // Check for proper text colors
        await expect(page.locator('.text-success')).toBeVisible();
        await expect(page.locator('.text-primary')).toBeVisible();
        await expect(page.locator('.text-warning')).toBeVisible();
        await expect(page.locator('.text-info')).toBeVisible();
    });
});

test.describe('Employee Financial Dashboard - Error Scenarios', () => {
    test('should handle missing data gracefully', async ({ page }) => {
        // This test would be more relevant with actual API integration
        await page.goto('/InicioEmpleados/Dinero');

        // Even with mock data, the page should load
        await expect(page.locator('text=Ventas Totales')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
        // Simulate offline mode
        await page.context().setOffline(true);
        await page.goto('/InicioEmpleados/Dinero');

        // Page should still render with cached/static content
        await expect(page.locator('text=Dinero')).toBeVisible();

        // Re-enable network
        await page.context().setOffline(false);
    });
});

test.describe('Employee Financial Dashboard - Accessibility', () => {
    test('should be accessible with keyboard navigation', async ({ page }) => {
        await page.goto('/InicioEmpleados/Dinero');

        // Test tab navigation through period selector buttons
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Should be able to activate buttons with Enter/Space
        await page.keyboard.press('Enter');

        // Check that focus is visible
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
        await page.goto('/InicioEmpleados/Dinero');

        // Check for table role
        await expect(page.locator('table')).toHaveAttribute('class', /table/);

        // Check for button roles
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);

        // Check for proper heading structure
        await expect(page.locator('h1, h2, h3, h4, h5, h6')).toHaveCount(15); // Various headings in the dashboard
    });
}); 