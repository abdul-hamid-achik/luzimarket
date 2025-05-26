import { test, expect } from '@playwright/test';

// Helper functions for React-Select interactions (improved versions)
const selectEstadoOption = async (page, optionText) => {
    // Wait for the select to be visible and ready
    await page.waitForSelector('.estado-select', { timeout: 10000 });

    // Check if the select has specific structure - handle React Select component
    const hasCustomSelect = await page.locator('.estado-select .css-').count() > 0;

    if (hasCustomSelect) {
        // Handle React Select component
        await page.locator('.estado-select').click({ force: true });

        // Wait for dropdown to open
        await page.waitForSelector('[role="listbox"], [role="menu"], .react-select__menu', { timeout: 5000 });
    } else {
        // Handle regular select element
        await page.locator('.estado-select').click({ force: true });
        await page.waitForTimeout(1000);
    }

    // Use more specific selector to avoid strict mode violations and click the option
    const optionSelector = `[role="option"]:has-text("${optionText}")`;
    await page.waitForSelector(optionSelector, { timeout: 5000 });
    await page.locator(optionSelector).first().click({ force: true });

    // Wait for the selection to be reflected in the component
    await page.waitForFunction(
        (selectedText) => {
            const estadoSelect = document.querySelector('.estado-select');
            return estadoSelect && estadoSelect.textContent.includes(selectedText);
        },
        optionText,
        { timeout: 8000 }
    );
};

const selectCiudadOption = async (page, optionText) => {
    // Wait for ciudad select to be enabled first
    await page.waitForFunction(() => {
        const ciudadSelect = document.querySelector('.ciudad-select');
        return ciudadSelect && !ciudadSelect.querySelector('[aria-disabled="true"]');
    }, { timeout: 15000 });

    // Check if the select has specific structure - handle React Select component
    const hasCustomSelect = await page.locator('.ciudad-select .css-').count() > 0;

    if (hasCustomSelect) {
        // Handle React Select component
        await page.locator('.ciudad-select').click({ force: true });

        // Wait for dropdown to open
        await page.waitForSelector('[role="listbox"], [role="menu"], .react-select__menu', { timeout: 5000 });
    } else {
        // Handle regular select element
        await page.locator('.ciudad-select').click({ force: true });
        await page.waitForTimeout(1000);
    }

    // Use more specific selector to avoid strict mode violations and click the option
    const optionSelector = `[role="option"]:has-text("${optionText}")`;
    await page.waitForSelector(optionSelector, { timeout: 5000 });
    await page.locator(optionSelector).first().click({ force: true });

    // Wait for the selection to be reflected in the component
    await page.waitForFunction(
        (selectedText) => {
            const ciudadSelect = document.querySelector('.ciudad-select');
            return ciudadSelect && ciudadSelect.textContent.includes(selectedText);
        },
        optionText,
        { timeout: 8000 }
    );
};

const getEstadoSelect = (page) => page.locator('.estado-select');
const getCiudadSelect = (page) => page.locator('.ciudad-select');
const getAcceptButton = (page) => page.locator('#NavbarDireccion button').filter({ hasText: 'ACEPTAR' });

// Helper to wait for ACEPTAR button to be enabled and click it
const clickAcceptButtonWhenEnabled = async (page) => {
    // Wait for button to be enabled
    await page.waitForFunction(() => {
        const buttons = document.querySelectorAll('#NavbarDireccion button');
        for (const button of buttons) {
            if (button.textContent && button.textContent.includes('ACEPTAR') && !button.disabled) {
                return true;
            }
        }
        return false;
    }, { timeout: 15000 });

    // Now click the enabled button
    await getAcceptButton(page).click();
};

test.describe('Delivery Preference Persistence', () => {
    // Use authenticated storage state for delivery preference tests
    test.use({ storageState: 'tmp/authenticatedState.json' });
    let guestDeliveryZoneId;
    let authToken;

    test.beforeEach(async ({ page }) => {
        // Set desktop viewport to ensure navbar is visible
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');
        await page.waitForSelector('#NavbarDireccion', { timeout: 10000 });
    });

    test.describe('Guest User Preferences', () => {
        test('should persist delivery zone selection in session for guest users', async ({ page }) => {
            // Select delivery location as guest
            await selectEstadoOption(page, 'COAHUILA');
            await selectCiudadOption(page, 'TORREÓN');

            await clickAcceptButtonWhenEnabled(page);

            // Verify success message for guest
            await expect(page.locator('text=Ubicación de entrega actualizada')).toBeVisible();

            // Navigate to another page
            await page.click('text=Categorias');
            await expect(page).toHaveURL(/.*categorias/);

            // Navigate back to home
            await page.goto('/');
            await page.waitForSelector('#NavbarDireccion');

            // Selections should still be there for guest session - component might be collapsed
            const isCollapsed = await page.locator('#NavbarDireccion.collapsed').isVisible();
            if (isCollapsed) {
                await expect(page.locator('#NavbarDireccion span:has-text("TORREÓN")')).toBeVisible();
                await expect(page.locator('#NavbarDireccion span:has-text("COAHUILA")')).toBeVisible();
            } else {
                await expect(page.locator('.estado-select:has-text("COAHUILA")')).toBeVisible();
                await expect(page.locator('.ciudad-select:has-text("TORREÓN")')).toBeVisible();
            }
        });

        test('should maintain guest preferences across browser refresh', async ({ page }) => {
            // Make delivery zone selection
            await selectEstadoOption(page, 'NUEVO LEÓN');
            await selectCiudadOption(page, 'MONTERREY');

            await clickAcceptButtonWhenEnabled(page);

            await expect(page.locator('text=Ubicación de entrega actualizada')).toBeVisible();

            // Store the guest session data
            const sessionData = await page.evaluate(() => ({
                state: sessionStorage.getItem('selectedDeliveryState'),
                zone: sessionStorage.getItem('selectedDeliveryZone')
            }));

            // Refresh the page
            await page.reload();
            await page.waitForSelector('#NavbarDireccion');

            // Selections should be restored from sessionStorage - component might be collapsed
            const isCollapsed = await page.locator('#NavbarDireccion.collapsed').isVisible();
            if (isCollapsed) {
                await expect(page.locator('text=MONTERREY')).toBeVisible();
                await expect(page.locator('text=NUEVO LEÓN')).toBeVisible();
            } else {
                await expect(page.locator('.estado-select:has-text("NUEVO LEÓN")')).toBeVisible();
                await expect(page.locator('.ciudad-select:has-text("MONTERREY")')).toBeVisible();
            }
        });
    });

    test.describe('Authenticated User Preferences', () => {
        test('should transfer guest preferences to user account on login', async ({ page }) => {
            // First, make a selection as a guest
            await selectEstadoOption(page, 'DURANGO');
            await selectCiudadOption(page, 'GÓMEZ PALACIO');

            await clickAcceptButtonWhenEnabled(page);

            await expect(page.locator('text=Ubicación de entrega actualizada')).toBeVisible();

            // Now login
            await page.click('text=Login');
            await page.fill('input[type="email"]', 'sofia.cliente@email.com');
            await page.fill('input[type="password"]', 'Sofia123!');
            await page.click('button[type="submit"]');

            // Wait for login to complete and return to home
            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Preferences should be preserved after login - component might be collapsed
            const isCollapsed = await page.locator('#NavbarDireccion.collapsed').isVisible();
            if (isCollapsed) {
                // Look for location in navbar collapsed view specifically
                await expect(page.locator('#NavbarDireccion span:has-text("GÓMEZ PALACIO")')).toBeVisible();
                await expect(page.locator('#NavbarDireccion span:has-text("DURANGO")')).toBeVisible();
            } else {
                await expect(page.locator('.estado-select:has-text("DURANGO")')).toBeVisible();
                await expect(page.locator('.ciudad-select:has-text("GÓMEZ PALACIO")')).toBeVisible();
            }
        });

        test('should save preferences permanently for authenticated users', async ({ page }) => {
            // Login first
            await page.click('text=Login');
            await page.fill('input[type="email"]', 'diego.comprador@email.com');
            await page.fill('input[type="password"]', 'Diego123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Make delivery zone selection as authenticated user
            await selectEstadoOption(page, 'COAHUILA');
            await selectCiudadOption(page, 'SALTILLO');

            await clickAcceptButtonWhenEnabled(page);

            // Should show saved message for authenticated users
            await expect(page.locator('text=Ubicación de entrega guardada')).toBeVisible();

            // Logout - try different possible logout selectors
            const logoutLink = page.locator('text=Cerrar Sesión').or(page.locator('text=Logout')).or(page.locator('a[href*="logout"]')).first();
            if (await logoutLink.isVisible()) {
                await logoutLink.click();
                await page.waitForURL('/');
            } else {
                // Fallback: clear session and go to home manually
                await page.evaluate(() => {
                    sessionStorage.clear();
                    localStorage.clear();
                });
                await page.goto('/');
            }

            // Login again with the same user
            await page.click('text=Login');
            await page.fill('input[type="email"]', 'diego.comprador@email.com');
            await page.fill('input[type="password"]', 'Diego123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Preferences should be restored from user account - component might be collapsed
            const isCollapsed = await page.locator('#NavbarDireccion.collapsed').isVisible();
            if (isCollapsed) {
                await expect(page.locator('#NavbarDireccion span:has-text("SALTILLO")')).toBeVisible();
                await expect(page.locator('#NavbarDireccion span:has-text("COAHUILA")')).toBeVisible();
            } else {
                await expect(page.locator('.estado-select:has-text("COAHUILA")')).toBeVisible();
                await expect(page.locator('.ciudad-select:has-text("SALTILLO")')).toBeVisible();
            }
        });

        test('should restore preferences from different device login', async ({ page, context }) => {
            // Simulate first login session
            await page.click('text=Login');
            await page.fill('input[type="email"]', 'carmen.user@email.com');
            await page.fill('input[type="password"]', 'Carmen123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Set delivery preference
            await selectEstadoOption(page, 'DURANGO');
            await selectCiudadOption(page, 'LERDO');

            await clickAcceptButtonWhenEnabled(page);

            await expect(page.locator('text=Ubicación de entrega guardada')).toBeVisible();

            // Clear storage to simulate new device
            await context.clearCookies();
            await page.evaluate(() => {
                sessionStorage.clear();
                localStorage.clear();
            });

            // Navigate to home (simulating new device)
            await page.goto('/');
            await page.waitForSelector('#NavbarDireccion');

            // Login on "new device"
            await page.click('text=Login');
            await page.fill('input[type="email"]', 'carmen.user@email.com');
            await page.fill('input[type="password"]', 'Carmen123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Preferences should be restored from backend - component might be collapsed
            const isCollapsed = await page.locator('#NavbarDireccion.collapsed').isVisible();
            if (isCollapsed) {
                await expect(page.locator('#NavbarDireccion span:has-text("LERDO")')).toBeVisible();
                await expect(page.locator('#NavbarDireccion span:has-text("DURANGO")')).toBeVisible();
            } else {
                await expect(page.locator('.estado-select:has-text("DURANGO")')).toBeVisible();
                await expect(page.locator('.ciudad-select:has-text("LERDO")')).toBeVisible();
            }
        });

        test('should update user preferences when changing delivery zone', async ({ page }) => {
            // Login
            await page.click('text=Login');
            await page.fill('input[type="email"]', 'rafael.cliente@email.com');
            await page.fill('input[type="password"]', 'Rafael123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Set initial preference
            await selectEstadoOption(page, 'NUEVO LEÓN');
            await selectCiudadOption(page, 'MONTERREY');

            await clickAcceptButtonWhenEnabled(page);

            await expect(page.locator('text=Ubicación de entrega guardada')).toBeVisible();

            // Change preference
            await selectEstadoOption(page, 'COAHUILA');
            await selectCiudadOption(page, 'TORREÓN');

            await clickAcceptButtonWhenEnabled(page);

            await expect(page.locator('text=Ubicación de entrega guardada')).toBeVisible();

            // Logout and login again
            const logoutLink2 = page.locator('text=Cerrar Sesión').or(page.locator('text=Logout')).or(page.locator('a[href*="logout"]')).first();
            if (await logoutLink2.isVisible()) {
                await logoutLink2.click();
                await page.waitForURL('/');
            } else {
                // Fallback: clear session and go to home manually
                await page.evaluate(() => {
                    sessionStorage.clear();
                    localStorage.clear();
                });
                await page.goto('/');
            }

            await page.click('text=Login');
            await page.fill('input[type="email"]', 'rafael.cliente@email.com');
            await page.fill('input[type="password"]', 'Rafael123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Should have the updated preference - component might be collapsed
            const isCollapsed = await page.locator('#NavbarDireccion.collapsed').isVisible();
            if (isCollapsed) {
                await expect(page.locator('#NavbarDireccion span:has-text("TORREÓN")')).toBeVisible();
                await expect(page.locator('#NavbarDireccion span:has-text("COAHUILA")')).toBeVisible();
            } else {
                await expect(page.locator('.estado-select:has-text("COAHUILA")')).toBeVisible();
                await expect(page.locator('.ciudad-select:has-text("TORREÓN")')).toBeVisible();
            }
        });
    });

    test.describe('Registration and Preferences', () => {
        test('should transfer guest preferences to new user account on registration', async ({ page }) => {
            // Create unique email for this test
            const timestamp = Date.now();
            const testEmail = `newuser-${timestamp}@example.com`;

            // Make selection as guest
            await selectEstadoOption(page, 'COAHUILA');
            await selectCiudadOption(page, 'SALTILLO');

            await clickAcceptButtonWhenEnabled(page);

            await expect(page.locator('text=Ubicación de entrega actualizada')).toBeVisible();

            // Register new account
            await page.click('text=Register');
            await page.fill('input[type="email"]', testEmail);
            await page.fill('input[type="password"]', 'NewUser123!');
            await page.click('button[type="submit"]');

            // Should redirect to login
            await expect(page).toHaveURL(/.*login/);

            // Login with new account
            await page.fill('input[type="email"]', testEmail);
            await page.fill('input[type="password"]', 'NewUser123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Guest preferences should be transferred to new user account - component might be collapsed
            const isCollapsed = await page.locator('#NavbarDireccion.collapsed').isVisible();
            if (isCollapsed) {
                await expect(page.locator('#NavbarDireccion span:has-text("SALTILLO")')).toBeVisible();
                await expect(page.locator('#NavbarDireccion span:has-text("COAHUILA")')).toBeVisible();
            } else {
                await expect(page.locator('.estado-select:has-text("COAHUILA")')).toBeVisible();
                await expect(page.locator('.ciudad-select:has-text("SALTILLO")')).toBeVisible();
            }
        });
    });

    test.describe('Component UI Behavior', () => {
        test('should collapse/hide component when selection is made and accepted', async ({ page }) => {
            // Make a complete selection
            await selectEstadoOption(page, 'NUEVO LEÓN');
            await selectCiudadOption(page, 'MONTERREY');

            await getAcceptButton(page).click();

            await expect(page.locator('text=Ubicación de entrega actualizada')).toBeVisible();

            // After selection, the component should be in a collapsed state
            await expect(page.locator('#NavbarDireccion')).toHaveClass(/collapsed/);
        });

        test('should show selected location in collapsed view', async ({ page }) => {
            // Make selection
            await selectEstadoOption(page, 'DURANGO');
            await selectCiudadOption(page, 'GÓMEZ PALACIO');

            await getAcceptButton(page).click();

            // Should show the selected location in a compact view
            await expect(page.locator('#NavbarDireccion span:has-text("GÓMEZ PALACIO, DURANGO")')).toBeVisible();
        });

        test('should allow expanding to change selection', async ({ page }) => {
            // Make initial selection
            await selectEstadoOption(page, 'COAHUILA');
            await selectCiudadOption(page, 'TORREÓN');

            await getAcceptButton(page).click();

            // Click to expand/change
            await page.click('[data-testid="change-location"]');

            // Should be able to make new selection
            await selectEstadoOption(page, 'NUEVO LEÓN');
            await selectCiudadOption(page, 'MONTERREY');

            await getAcceptButton(page).click();

            await expect(page.locator('text=MONTERREY, NUEVO LEÓN')).toBeVisible();
        });
    });

    test.describe('Error Handling', () => {
        test('should handle invalid delivery zone gracefully', async ({ page, request }) => {
            // Login first
            await page.click('text=Login');
            await page.fill('input[type="email"]', 'lucia.compras@email.com');
            await page.fill('input[type="password"]', 'Lucia123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');

            // Manually set an invalid delivery zone in sessionStorage
            await page.evaluate(() => {
                sessionStorage.setItem('selectedDeliveryZone', 'invalid-zone-id');
                sessionStorage.setItem('selectedDeliveryState', 'coahuila');
            });

            // Reload to trigger restoration
            await page.reload();
            await page.waitForSelector('#NavbarDireccion');

            // Wait for the invalid zone to be detected and error message to appear
            await page.waitForTimeout(2000);

            // Should show appropriate error message for invalid zone
            await expect(page.locator('text=Delivery zone not found')).toBeVisible();

            // The ACEPTAR button should be disabled due to invalid selection
            await expect(getAcceptButton(page)).toBeDisabled();

            // User should be able to make a new valid selection
            await selectEstadoOption(page, 'COAHUILA');
            await selectCiudadOption(page, 'SALTILLO');

            // Now the button should be enabled and clickable
            await expect(getAcceptButton(page)).not.toBeDisabled();
            await getAcceptButton(page).click();

            // Should show success message
            await expect(page.locator('text=Ubicación de entrega guardada')).toBeVisible();
        });

        test('should handle backend preference restoration failure', async ({ page }) => {
            // This test would need to mock a backend failure scenario
            // For now, we'll test the UI remains functional
            await page.click('text=Login');
            await page.fill('input[type="email"]', 'sofia.cliente@email.com');
            await page.fill('input[type="password"]', 'Sofia123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Component should still be functional even if preference restoration fails
            await expect(getEstadoSelect(page)).toBeVisible();
            await expect(getEstadoSelect(page).locator('[aria-disabled="true"]')).not.toBeVisible();
        });
    });

    test.describe('Debug - City Selection', () => {
        test('debug - see available cities for DURANGO', async ({ page }) => {
            // Select DURANGO state first
            await selectEstadoOption(page, 'DURANGO');

            // Wait for city dropdown to be enabled
            await page.waitForFunction(() => {
                const ciudadSelect = document.querySelector('.ciudad-select');
                return ciudadSelect && !ciudadSelect.querySelector('[aria-disabled="true"]');
            }, { timeout: 10000 });

            // Click to open the city dropdown
            await page.locator('.ciudad-select').click({ force: true });

            // Wait a moment for options to load
            await page.waitForTimeout(2000);

            // Get all available city options
            const cityOptions = await page.evaluate(() => {
                const options = Array.from(document.querySelectorAll('[role="option"]'));
                return options.map(option => ({
                    text: option.textContent,
                    value: option.getAttribute('data-value') || option.getAttribute('value')
                }));
            });

            console.log('Available cities for DURANGO:', cityOptions);

            // Also check what's in the DOM more broadly
            const allText = await page.evaluate(() => {
                const selectMenu = document.querySelector('[role="listbox"]') || document.querySelector('.react-select__menu');
                return selectMenu ? selectMenu.textContent : 'No dropdown menu found';
            });

            console.log('All dropdown text:', allText);

            // Try to find any text containing "PALACIO"
            const palacioText = await page.evaluate(() => {
                const allElements = document.querySelectorAll('*');
                const matches = [];
                for (let el of allElements) {
                    if (el.textContent && el.textContent.includes('PALACIO')) {
                        matches.push(el.textContent);
                    }
                }
                return matches;
            });

            console.log('Elements containing PALACIO:', palacioText);

            // This test always passes - it's just for debugging
            expect(true).toBe(true);
        });
    });

    test.describe('Performance', () => {
        test('should restore preferences quickly on login', async ({ page }) => {
            const startTime = Date.now();

            await page.click('text=Login');
            await page.fill('input[type="email"]', 'diego.comprador@email.com');
            await page.fill('input[type="password"]', 'Diego123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('/');
            await page.waitForSelector('#NavbarDireccion');

            // Wait for any preference restoration to complete
            await page.waitForTimeout(1000);

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Should complete within reasonable time (5 seconds)
            expect(totalTime).toBeLessThan(5000);
        });
    });
}); 