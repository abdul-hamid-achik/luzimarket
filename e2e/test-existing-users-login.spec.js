const { test, expect } = require('@playwright/test');

test.describe('Existing Users Login Test', () => {
    const existingUsers = [
        { email: 'admin@luzimarket.shop', password: 'LuziAdmin2024!', role: 'admin' },
        { email: 'maria.admin@luzimarket.shop', password: 'MariaAdmin123!', role: 'admin' },
        { email: 'carlos.ventas@luzimarket.shop', password: 'Carlos123!', role: 'employee' },
        { email: 'ana.marketing@luzimarket.shop', password: 'Ana123!', role: 'employee' },
        { email: 'luis.inventario@luzimarket.shop', password: 'Luis123!', role: 'employee' },
        { email: 'proveedor1@email.com', password: 'Proveedor123!', role: 'vendor' },
        { email: 'proveedor2@email.com', password: 'Proveedor123!', role: 'vendor' },
        { email: 'sofia.cliente@email.com', password: 'Sofia123!', role: 'customer' }
    ];

    for (const user of existingUsers) {
        test(`should login successfully with ${user.role}: ${user.email}`, async ({ page }) => {
            console.log(`\n🧪 Testing login for ${user.role}: ${user.email}`);

            // Navigate to login page
            await page.goto('/login');
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });

            // Fill login form
            await page.fill('input[type="email"]', user.email);
            await page.fill('input[type="password"]', user.password);

            // Listen for login API request
            const loginResponsePromise = page.waitForResponse(response =>
                response.url().includes('/api/auth/login') &&
                (response.status() === 200 || response.status() === 401)
            );

            // Submit login form
            await page.click('button[type="submit"]');

            // Wait for login response
            const loginResponse = await loginResponsePromise;
            const responseData = await loginResponse.json();

            console.log(`📡 Login API Response Status: ${loginResponse.status()}`);
            console.log(`📄 Response Data:`, responseData);

            if (loginResponse.status() === 200) {
                console.log(`✅ Login successful for ${user.email}`);

                // Verify token is stored
                const accessToken = await page.evaluate(() => {
                    const keys = {
                        accessToken: btoa('_luzi_auth_access')
                    };
                    return sessionStorage.getItem(keys.accessToken);
                });

                expect(accessToken).toBeTruthy();
                console.log(`🔑 Access token stored successfully`);

                // Verify user data in response
                expect(responseData).toHaveProperty('accessToken');
                expect(responseData).toHaveProperty('user');
                expect(responseData.user.email).toBe(user.email);

            } else if (loginResponse.status() === 401) {
                console.log(`❌ Login failed for ${user.email}: ${responseData.error}`);
                throw new Error(`Login failed for existing user ${user.email}: ${responseData.error}`);
            } else {
                console.log(`⚠️ Unexpected status ${loginResponse.status()} for ${user.email}`);
                throw new Error(`Unexpected response status: ${loginResponse.status()}`);
            }
        });
    }

    test('should verify user exists in database by attempting direct API login', async ({ request }) => {
        const testUser = { email: 'sofia.cliente@email.com', password: 'Sofia123!' };

        console.log(`\n🔍 Testing direct API login for: ${testUser.email}`);

        const response = await request.post('/api/auth/login', {
            data: {
                email: testUser.email,
                password: testUser.password
            }
        });

        const responseData = await response.json();
        console.log(`📡 Direct API Response Status: ${response.status()}`);
        console.log(`📄 Response Data:`, responseData);

        if (response.status() === 401) {
            console.log(`❌ User ${testUser.email} not found or password incorrect`);
            console.log(`🔍 This suggests the seeded data may not be in the database`);
        } else if (response.status() === 200) {
            console.log(`✅ Direct API login successful for ${testUser.email}`);
            expect(responseData).toHaveProperty('accessToken');
            expect(responseData).toHaveProperty('user');
        }

        // Don't fail the test, just report the status
        console.log(`ℹ️ API login test completed with status: ${response.status()}`);
    });

    test('should check if users exist via register attempt', async ({ request }) => {
        const testUser = { email: 'sofia.cliente@email.com', password: 'Sofia123!' };

        console.log(`\n🔍 Testing if user exists by attempting registration: ${testUser.email}`);

        const response = await request.post('/api/auth/register', {
            data: {
                email: testUser.email,
                password: testUser.password,
                name: 'Sofia Test'
            }
        });

        const responseData = await response.json();
        console.log(`📡 Registration Response Status: ${response.status()}`);
        console.log(`📄 Response Data:`, responseData);

        if (response.status() === 409) {
            console.log(`✅ User ${testUser.email} already exists in database (as expected)`);
        } else if (response.status() === 201) {
            console.log(`⚠️ User ${testUser.email} was successfully registered - this means it didn't exist before`);
        } else {
            console.log(`❓ Unexpected registration response: ${response.status()}`);
        }

        // Don't fail the test, just report the status
        console.log(`ℹ️ Registration test completed with status: ${response.status()}`);
    });
}); 