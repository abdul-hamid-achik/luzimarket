// e2e/favorites-simple.spec.js
// Simple test to verify favorites fix
const { test, expect } = require('@playwright/test');

test.describe('Favorites Fix Verification', () => {

    test('should NOT call /api/favorites when unauthenticated', async ({ page }) => {
        // Track all API requests
        const apiRequests = [];
        page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/')) {
                apiRequests.push({
                    url: url,
                    method: request.method()
                });
            }
        });

        // Navigate to favorites page without authenticating
        await page.goto('/favoritos');

        // Wait for page to be fully loaded
        await expect(page.locator('h1')).toHaveText(/Favoritos/);

        // Wait a bit more to ensure any pending API calls would complete
        await page.waitForTimeout(5000);

        // Filter for favorites API calls
        const favoritesRequests = apiRequests.filter(req =>
            req.url.includes('/api/favorites') &&
            !req.url.includes('.js') &&
            !req.url.includes('.jsx')
        );

        console.log('All API requests:', apiRequests.map(r => r.url));
        console.log('Favorites API requests:', favoritesRequests);

        // The main assertion - no favorites API calls should be made
        expect(favoritesRequests).toHaveLength(0);

        // Verify that the unauthenticated state is shown correctly
        await expect(page.getByText(/Inicia sesión para ver tus favoritos/)).toBeVisible();

        console.log('✅ SUCCESS: No /api/favorites requests made when unauthenticated');
    });

    test('should show correct unauthenticated UI', async ({ page }) => {
        await page.goto('/favoritos');

        // Should show the login prompt
        await expect(page.locator('h1')).toHaveText(/Favoritos/);
        await expect(page.getByText(/Inicia sesión para ver tus favoritos/)).toBeVisible();

        // Should have login and register buttons
        await expect(page.getByRole('link', { name: /Iniciar Sesión/ })).toBeVisible();
        await expect(page.getByRole('link', { name: /Registrarse/ })).toBeVisible();

        console.log('✅ SUCCESS: Unauthenticated favorites page displays correctly');
    });
}); 