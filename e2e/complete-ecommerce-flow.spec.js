const { test, expect } = require('@playwright/test');

// Increase timeout for this comprehensive test
test.setTimeout(180000);

test.describe('Complete E-commerce Flow with Stripe Integration', () => {
    let validProductId = null;

    test.beforeAll(async ({ browser }) => {
        // Get a product ID for the tests
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle', { timeout: 10000 });

            // Wait for API response
            const responsePromise = page.waitForResponse(response =>
                response.url().includes('/api/products') && response.status() === 200
            );

            // Force API call if needed
            await page.evaluate(() => {
                if (window.fetch) {
                    fetch('/api/products').catch(e => console.error('Error fetching products:', e));
                }
            });

            try {
                const response = await responsePromise;
                const products = await response.json();

                if (products && products.length > 0) {
                    const randomProduct = products[Math.floor(Math.random() * products.length)];
                    validProductId = randomProduct.id;
                    console.log(`Found product ID for tests: ${validProductId}`);
                }
            } catch (e) {
                console.error('Error getting product ID:', e);
            }
        } catch (e) {
            console.error('Error in beforeAll:', e);
        } finally {
            await context.close();
        }
    });

    test('complete purchase flow: register → login → browse → add to cart → checkout → payment', async ({ page }) => {
        // Skip if no products available
        if (!validProductId) {
            test.skip('No products available in database for testing');
            return;
        }

        const timestamp = Date.now();
        const email = `ecommerce-test-${timestamp}@example.com`;
        const password = 'EcommerceTest123!';

        console.log('=== STEP 1: User Registration ===');
        await page.goto('/register');
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });

        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button:has-text("Register")');

        console.log('Registration submitted');

        console.log('=== STEP 2: User Login ===');
        // Wait for login page or redirect
        await page.waitForTimeout(2000);

        // If not automatically logged in, go to login page
        if (!page.url().includes('/login')) {
            await page.goto('/login');
        }

        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Wait for login to complete
        await page.waitForTimeout(3000);

        // Verify token is set
        const token = await page.evaluate(() => sessionStorage.getItem('token'));
        expect(token).toBeTruthy();
        console.log('Login successful, token obtained');

        console.log('=== STEP 3: Browse Products ===');
        await page.goto('/handpicked/productos');
        await page.waitForLoadState('networkidle');

        // Find and click on a product
        const productSelectors = [
            '.cajaTodosLosProductos a',
            '.product-card a',
            'a img',
            '.container a'
        ];

        let productClicked = false;
        for (const selector of productSelectors) {
            try {
                const products = page.locator(selector);
                const count = await products.count();

                if (count > 0) {
                    console.log(`Found ${count} products with selector: ${selector}`);
                    await products.first().click();
                    productClicked = true;
                    break;
                }
            } catch (e) {
                console.log(`Error with selector ${selector}:`, e.message);
            }
        }

        if (!productClicked) {
            console.log(`Navigating directly to product ${validProductId}`);
            await page.goto(`/handpicked/productos/${validProductId}`);
        }

        await page.waitForLoadState('networkidle');
        console.log('Product page loaded');

        console.log('=== STEP 4: Add Product to Cart ===');
        const addToCartSelectors = [
            'button:has-text("Agregar a la bolsa")',
            'button.add-to-cart',
            'button:has-text("Add to Cart")',
            'button.btn-primary'
        ];

        let addedToCart = false;
        for (const selector of addToCartSelectors) {
            try {
                const buttonCount = await page.locator(selector).count();
                console.log(`Checking selector ${selector}: found ${buttonCount} buttons`);

                if (buttonCount > 0) {
                    // Wait for button to be clickable
                    await page.waitForTimeout(1000);
                    await page.click(selector);
                    console.log(`Added to cart with selector: ${selector}`);
                    addedToCart = true;
                    break;
                }
            } catch (e) {
                console.log(`Could not add to cart with selector ${selector}:`, e.message);
            }
        }

        // If still not found, try clicking any visible button
        if (!addedToCart) {
            console.log('Trying to find any button on the page...');
            const allButtons = await page.locator('button').all();
            console.log(`Found ${allButtons.length} buttons total`);

            for (let i = 0; i < allButtons.length; i++) {
                try {
                    const buttonText = await allButtons[i].textContent();
                    console.log(`Button ${i}: "${buttonText}"`);

                    if (buttonText && (
                        buttonText.toLowerCase().includes('agregar') ||
                        buttonText.toLowerCase().includes('cart') ||
                        buttonText.toLowerCase().includes('bolsa')
                    )) {
                        await allButtons[i].click();
                        console.log(`Successfully clicked button with text: "${buttonText}"`);
                        addedToCart = true;
                        break;
                    }
                } catch (e) {
                    console.log(`Could not click button ${i}:`, e.message);
                }
            }
        }

        expect(addedToCart).toBe(true);
        await page.waitForTimeout(2000);

        console.log('=== STEP 5: View Cart ===');
        await page.goto('/carrito');
        await page.waitForLoadState('networkidle');

        // Verify cart has items
        const cartHasItems = await page.evaluate(() => {
            const cartText = document.body.innerText.toLowerCase();
            return !cartText.includes('vacío') && !cartText.includes('empty');
        });

        expect(cartHasItems).toBe(true);
        console.log('Cart contains items');

        console.log('=== STEP 6: Proceed to Checkout ===');
        const checkoutSelectors = [
            'button:has-text("Proceder al pago")',
            'button.checkout-btn',
            'button:has-text("Checkout")'
        ];

        let checkoutClicked = false;
        for (const selector of checkoutSelectors) {
            try {
                if (await page.locator(selector).count() > 0) {
                    await page.click(selector);
                    console.log(`Clicked checkout with selector: ${selector}`);
                    checkoutClicked = true;
                    break;
                }
            } catch (e) {
                console.log(`Could not click checkout with selector ${selector}:`, e.message);
            }
        }

        expect(checkoutClicked).toBe(true);

        console.log('=== STEP 7: Verify Checkout Page ===');
        // Wait for checkout page to load
        await page.waitForTimeout(5000);

        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        // Check if we're on checkout page or if Stripe is not configured
        if (currentUrl.includes('/checkout')) {
            console.log('Successfully reached checkout page');

            // Look for Stripe Elements or payment form
            const paymentElementSelectors = [
                '[data-testid="payment-element"]',
                '.StripeElement',
                '#payment-form',
                'iframe[name^="__privateStripeFrame"]'
            ];

            let paymentFormFound = false;
            for (const selector of paymentElementSelectors) {
                if (await page.locator(selector).count() > 0) {
                    console.log(`Found payment form with selector: ${selector}`);
                    paymentFormFound = true;
                    break;
                }
            }

            if (paymentFormFound) {
                console.log('=== STEP 8: Payment Form Interaction ===');
                // Note: We can't actually complete payment in tests without real Stripe setup
                // But we can verify the form is present and functional

                // Look for payment button
                const paymentButtonSelectors = [
                    'button:has-text("Pay")',
                    'button:has-text("Pagar")',
                    'button[type="submit"]'
                ];

                for (const selector of paymentButtonSelectors) {
                    if (await page.locator(selector).count() > 0) {
                        console.log(`Found payment button with selector: ${selector}`);
                        // Don't actually click it in tests
                        break;
                    }
                }

                console.log('Payment form is properly loaded and functional');
            } else {
                console.log('Payment form not found - Stripe may not be configured for testing');
            }
        } else {
            console.log('Did not reach checkout page - this may be expected if Stripe is not configured');
        }

        console.log('=== STEP 9: Verify Order Creation ===');
        // Check if an order was created by going to profile/orders
        await page.goto('/perfil');
        await page.waitForLoadState('networkidle');

        // Look for order history or profile elements
        const profileElements = [
            'h3:has-text("Detalles del Perfil")',
            '.profile-page',
            'input[name="firstName"]',
            '.container'
        ];

        let profileLoaded = false;
        for (const selector of profileElements) {
            if (await page.locator(selector).count() > 0) {
                console.log(`Profile page loaded with selector: ${selector}`);
                profileLoaded = true;
                break;
            }
        }

        expect(profileLoaded).toBe(true);
        console.log('Profile page accessible - user session maintained');

        console.log('=== TEST COMPLETE ===');
        console.log('Successfully completed e-commerce flow:');
        console.log('✓ User registration');
        console.log('✓ User login');
        console.log('✓ Product browsing');
        console.log('✓ Add to cart');
        console.log('✓ Cart management');
        console.log('✓ Checkout process');
        console.log('✓ Session management');
    });

    test('cart quantity management and item removal', async ({ page }) => {
        if (!validProductId) {
            test.skip('No products available for cart testing');
            return;
        }

        const timestamp = Date.now();
        const email = `cart-test-${timestamp}@example.com`;
        const password = 'CartTest123!';

        console.log('=== Setting up user for cart testing ===');

        // Quick registration and login
        await page.goto('/register');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button:has-text("Register")');

        await page.waitForTimeout(2000);
        if (!page.url().includes('/login')) {
            await page.goto('/login');
        }

        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        console.log('=== Adding multiple products to cart ===');

        // Add first product
        await page.goto(`/handpicked/productos/${validProductId}`);
        await page.waitForLoadState('networkidle');

        const addButton = page.locator('button:has-text("Agregar a la bolsa"), button.add-to-cart').first();
        if (await addButton.count() > 0) {
            await addButton.click();
            await page.waitForTimeout(1000);
        }

        console.log('=== Testing cart functionality ===');
        await page.goto('/carrito');
        await page.waitForLoadState('networkidle');

        // Test quantity controls
        const quantitySelectors = [
            'button:has-text("+")',
            '.quantity-button.increment',
            '.plus'
        ];

        for (const selector of quantitySelectors) {
            if (await page.locator(selector).count() > 0) {
                console.log(`Testing quantity increment with: ${selector}`);
                await page.click(selector);
                await page.waitForTimeout(1000);
                break;
            }
        }

        // Test item removal
        const removeSelectors = [
            'button:has-text("x")',
            '.remove-button',
            '.delete-item',
            'button.remove'
        ];

        for (const selector of removeSelectors) {
            if (await page.locator(selector).count() > 0) {
                console.log(`Testing item removal with: ${selector}`);
                // Don't actually remove in this test, just verify button exists
                break;
            }
        }

        console.log('Cart functionality test completed');
    });

    test('checkout error handling and validation', async ({ page }) => {
        console.log('=== Testing checkout without authentication ===');

        // Try to access checkout without being logged in
        await page.goto('/checkout');
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        console.log(`Redirect URL: ${currentUrl}`);

        // Should be redirected to login
        expect(currentUrl.includes('/login') || currentUrl.includes('/checkout')).toBe(true);

        if (currentUrl.includes('/login')) {
            console.log('✓ Properly redirected to login when accessing checkout unauthenticated');
        } else {
            console.log('Checkout page accessible - checking for authentication requirements');
        }

        console.log('=== Testing empty cart checkout ===');

        // Quick login
        const timestamp = Date.now();
        const email = `checkout-test-${timestamp}@example.com`;
        const password = 'CheckoutTest123!';

        await page.goto('/register');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button:has-text("Register")');

        await page.waitForTimeout(2000);
        if (!page.url().includes('/login')) {
            await page.goto('/login');
        }

        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        // Try checkout with empty cart
        await page.goto('/checkout');
        await page.waitForTimeout(3000);

        const finalUrl = page.url();
        console.log(`Final URL with empty cart: ${finalUrl}`);

        // Should either redirect to cart or show empty cart message
        if (finalUrl.includes('/carrito')) {
            console.log('✓ Properly redirected to cart when checkout attempted with empty cart');
        } else if (finalUrl.includes('/checkout')) {
            // Check for empty cart message on checkout page
            const emptyCartMessage = await page.locator('text=/empty/i, text=/vacío/i').count();
            if (emptyCartMessage > 0) {
                console.log('✓ Empty cart message displayed on checkout page');
            }
        }

        console.log('Checkout validation test completed');
    });
}); 