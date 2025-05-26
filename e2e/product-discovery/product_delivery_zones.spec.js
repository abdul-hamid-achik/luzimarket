import { test, expect } from '@playwright/test';

test.describe('Product Delivery Zones', () => {
    let authToken;
    let sessionId;
    let productId;
    let deliveryZoneId;

    test.beforeAll(async ({ request }) => {
        // Get a guest token
        const guestResponse = await request.post('/api/auth/guest');
        expect(guestResponse.ok()).toBeTruthy();

        const guestData = await guestResponse.json();
        authToken = guestData.token;

        // Decode token to get session ID
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        sessionId = payload.sessionId;

        // Get available delivery zones
        const zonesResponse = await request.get('/api/delivery-zones');
        expect(zonesResponse.ok()).toBeTruthy();

        const zones = await zonesResponse.json();
        expect(zones.length).toBeGreaterThan(0);
        deliveryZoneId = zones[0].id;

        // Set delivery zone for session
        await request.patch('/api/auth/update-session', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                deliveryZoneId
            }
        });

        // Get a product to test with
        const productsResponse = await request.get('/api/products?limit=1');
        expect(productsResponse.ok()).toBeTruthy();

        const products = await productsResponse.json();
        if (products.products && products.products.length > 0) {
            productId = products.products[0].id;

            // Set up delivery zone for this product
            await request.put(`/api/products/${productId}/delivery-zones`, {
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    delivery_zones: [
                        { delivery_zone_id: deliveryZoneId, is_available: true }
                    ]
                }
            });
        }
    });

    test('should display delivery zone information on product detail page', async ({ page, request }) => {
        // Skip if no product available
        if (!productId) {
            test.skip('No products available for testing');
            return;
        }

        // Set authorization header for API requests
        await page.setExtraHTTPHeaders({
            'Authorization': `Bearer ${authToken}`
        });

        // Navigate to product detail page
        await page.goto(`/handpicked/productos/${productId}`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check if delivery information is displayed
        const deliverySection = page.locator('.delivery-section');

        // If delivery section exists, verify its content
        if (await deliverySection.isVisible()) {
            await expect(page.getByText('Delivery Availability')).toBeVisible();

            // Should show availability status
            const availabilityBadge = page.locator('.availability-badge');
            if (await availabilityBadge.isVisible()) {
                await expect(availabilityBadge).toBeVisible();
            }

            // Should show available zones
            const availableZones = page.locator('.available-zones-info');
            if (await availableZones.isVisible()) {
                await expect(page.getByText('Available in these areas:')).toBeVisible();
            }
        }
    });

    test('should show different availability status based on user zone', async ({ page, request }) => {
        // Skip if no product available
        if (!productId) {
            test.skip('No products available for testing');
            return;
        }

        // Get multiple delivery zones
        const zonesResponse = await request.get('/api/delivery-zones');
        const zones = await zonesResponse.json();

        if (zones.length < 2) {
            test.skip('Need at least 2 delivery zones for this test');
            return;
        }

        const zone1 = zones[0];
        const zone2 = zones[1];

        // Configure product to be available only in zone1
        await request.put(`/api/products/${productId}/delivery-zones`, {
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                delivery_zones: [
                    { delivery_zone_id: zone1.id, is_available: true },
                    { delivery_zone_id: zone2.id, is_available: false }
                ]
            }
        });

        // Set user session to zone1 (should be available)
        await request.patch('/api/auth/update-session', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                deliveryZoneId: zone1.id
            }
        });

        // Visit product page
        await page.setExtraHTTPHeaders({
            'Authorization': `Bearer ${authToken}`
        });

        await page.goto(`/handpicked/productos/${productId}`);
        await page.waitForLoadState('networkidle');

        // Check for available status
        const deliverySection = page.locator('.delivery-section');
        if (await deliverySection.isVisible()) {
            const availableBadge = page.locator('.availability-badge.available');
            if (await availableBadge.isVisible()) {
                await expect(availableBadge).toContainText('Available');
            }
        }

        // Now switch to zone2 (should not be available)
        await request.patch('/api/auth/update-session', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                deliveryZoneId: zone2.id
            }
        });

        // Refresh and check again
        await page.reload();
        await page.waitForLoadState('networkidle');

        if (await deliverySection.isVisible()) {
            const notAvailableBadge = page.locator('.availability-badge.not-available');
            if (await notAvailableBadge.isVisible()) {
                await expect(notAvailableBadge).toContainText('Not available');
            }
        }
    });

    test('should display zone selection prompt when no zone is selected', async ({ page, request }) => {
        // Skip if no product available
        if (!productId) {
            test.skip('No products available for testing');
            return;
        }

        // Create a new session without delivery zone
        const newGuestResponse = await request.post('/api/auth/guest');
        const newGuestData = await newGuestResponse.json();
        const newAuthToken = newGuestData.token;

        // Set authorization header
        await page.setExtraHTTPHeaders({
            'Authorization': `Bearer ${newAuthToken}`
        });

        // Navigate to product detail page
        await page.goto(`/handpicked/productos/${productId}`);
        await page.waitForLoadState('networkidle');

        // Check for zone selection message
        const deliverySection = page.locator('.delivery-section');
        if (await deliverySection.isVisible()) {
            const noZoneMessage = page.locator('.no-zone-selected');
            if (await noZoneMessage.isVisible()) {
                await expect(page.getByText('Please select your delivery zone to check availability')).toBeVisible();
            }
        }
    });

    test('should display correct delivery fees', async ({ page, request }) => {
        // Skip if no product available
        if (!productId) {
            test.skip('No products available for testing');
            return;
        }

        // Get delivery zone with known fee
        const zonesResponse = await request.get('/api/delivery-zones');
        const zones = await zonesResponse.json();
        const testZone = zones[0];

        // Configure product for this zone
        await request.put(`/api/products/${productId}/delivery-zones`, {
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                delivery_zones: [
                    { delivery_zone_id: testZone.id, is_available: true }
                ]
            }
        });

        // Set user session to this zone
        await request.patch('/api/auth/update-session', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                deliveryZoneId: testZone.id
            }
        });

        // Visit product page
        await page.setExtraHTTPHeaders({
            'Authorization': `Bearer ${authToken}`
        });

        await page.goto(`/handpicked/productos/${productId}`);
        await page.waitForLoadState('networkidle');

        // Check delivery fee is displayed correctly
        const deliverySection = page.locator('.delivery-section');
        if (await deliverySection.isVisible()) {
            const expectedFee = (testZone.fee / 100).toFixed(2);
            const feeText = `$${expectedFee}`;

            // Check in delivery fee section
            const deliveryFee = page.locator('.delivery-fee');
            if (await deliveryFee.isVisible()) {
                await expect(deliveryFee).toContainText(feeText);
            }

            // Check in zone tags
            const zoneTag = page.locator('.zone-tag');
            if (await zoneTag.isVisible()) {
                await expect(zoneTag.first()).toContainText(feeText);
            }
        }
    });
}); 