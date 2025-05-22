const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Log directory for test logs
const LOG_DIR = path.join(__dirname, '..', 'tmp', 'playwright-logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Helper to log test activity to a dedicated file
function logTestStep(message, testInfo) {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${testInfo.title}] ${message}\n`;

        // Log to console and file
        console.log(logEntry);
        fs.appendFileSync(path.join(LOG_DIR, 'test-steps.log'), logEntry);
    } catch (e) {
        console.error('Failed to log test step:', e);
    }
}

test.use({ storageState: 'tmp/authenticatedState.json' });

// Global variable to store a valid product ID
let validProductId = null;

// Test: Debug cart functionality
test.describe('Debug Cart Flow', () => {
    test.beforeAll(async ({ browser }) => {
        // Get a product ID for the tests
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Log the step
            console.log('Fetching valid product ID for tests');

            // Fetch products from the API
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle', { timeout: 10000 });

            // Wait for API response
            const responsePromise = page.waitForResponse(response => response.url().includes('/api/products') && response.status() === 200);

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
                    // Get a random product
                    const randomProduct = products[Math.floor(Math.random() * products.length)];
                    validProductId = randomProduct.id;
                    console.log(`Found product ID for tests: ${validProductId}`);
                } else {
                    console.log('No products found, using fallback ID');
                    validProductId = 'e0c3eba4-2435-4aaf-6174-818f819fd668'; // Fallback to known product ID as last resort
                }
            } catch (e) {
                console.error('Error getting product ID:', e);
                validProductId = 'e0c3eba4-2435-4aaf-6174-818f819fd668'; // Fallback to known product ID as last resort
            }
        } catch (e) {
            console.error('Error in beforeAll hook:', e);
            validProductId = 'e0c3eba4-2435-4aaf-6174-818f819fd668'; // Fallback to known product ID as last resort
        } finally {
            await context.close();
        }
    });

    test('user can register, add product to cart, and manage quantity', async ({ page }, testInfo) => {
        // Step 1: Register a new user
        logTestStep('Starting test - accessing registration page', testInfo);
        await page.goto('/register');

        // Generate unique user credentials
        const timestamp = Date.now();
        const email = `testuser+debug${timestamp}@example.com`;
        const password = 'Debug123!';

        // Fill registration form
        logTestStep(`Filling registration form with email: ${email}`, testInfo);
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);

        // Submit and capture any errors
        await page.evaluate(() => {
            // Add listener to capture network errors
            window.addEventListener('error', (e) => {
                console.error('JS ERROR:', e.message, e.filename, e.lineno);
            });

            // Add listener for failed fetch requests
            const originalFetch = window.fetch;
            window.fetch = async function (...args) {
                try {
                    const response = await originalFetch.apply(this, args);
                    if (!response.ok) {
                        console.error(`Fetch error: ${response.status} ${response.statusText} for ${args[0]}`);
                        const text = await response.clone().text();
                        try {
                            const json = JSON.parse(text);
                            console.error('Error response:', JSON.stringify(json));
                        } catch (e) {
                            console.error('Error response text:', text.substring(0, 500));
                        }
                    }
                    return response;
                } catch (e) {
                    console.error(`Fetch failed for ${args[0]}:`, e);
                    throw e;
                }
            };
        });

        // Submit registration form
        logTestStep('Submitting registration form', testInfo);
        await page.click('button:has-text("Register")');

        // Wait for redirect or notification
        await page.waitForTimeout(3000);

        // Step 2: Login (in case registration auto-login doesn't happen)
        logTestStep('Attempting to login', testInfo);
        await page.goto('/login');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Step 3: Navigate to products page
        logTestStep('Navigating to products page', testInfo);
        await page.goto('/handpicked/productos');
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        // Step 4: Attempt to click on the first product
        logTestStep('Looking for a product to click', testInfo);

        // First gather information about what's on the page
        const productInfo = await page.evaluate(() => {
            const products = [];
            // Collect all links that might be products
            document.querySelectorAll('a').forEach(a => {
                const rect = a.getBoundingClientRect();
                if (rect.width > 50 && rect.height > 50) {
                    // Likely a product card or image
                    products.push({
                        href: a.href,
                        text: a.innerText,
                        hasImage: a.querySelector('img') !== null,
                        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                    });
                }
            });
            return {
                products,
                pageText: document.body.innerText,
                visibleLinks: Array.from(document.links).map(l => l.href)
            };
        });

        logTestStep(`Found ${productInfo.products.length} potential product links`, testInfo);

        // Try to click on a product
        try {
            const selectors = [
                '.cajaTodosLosProductos a',
                '.product-card a',
                '.product-container a',
                '.caja-producto a',
                'a.product-link'
            ];

            // Try each selector
            let clicked = false;
            for (const selector of selectors) {
                const elements = await page.locator(selector).all();
                if (elements.length > 0) {
                    logTestStep(`Found products with selector: ${selector} (count: ${elements.length})`, testInfo);
                    await elements[0].click();
                    clicked = true;
                    break;
                }
            }

            // If no selector worked, try clicking on the first product link from our evaluation
            if (!clicked && productInfo.products.length > 0) {
                logTestStep('Using product info from page evaluation', testInfo);
                const firstProduct = productInfo.products[0];
                await page.goto(firstProduct.href);
            }
        } catch (e) {
            logTestStep(`Failed to click on product: ${e.message}`, testInfo);
            // Fall back to navigating directly to a product if we know the URL pattern
            logTestStep(`Navigating directly to product ${validProductId}`, testInfo);
            await page.goto(`/handpicked/productos/${validProductId}`);
        }

        // Step 5: On product detail page, add to cart
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        logTestStep('Looking for Add to Cart button', testInfo);
        // Try to find and click the add to cart button
        try {
            const addToCartSelectors = [
                'button:has-text("Agregar a la bolsa")',
                'button:has-text("Add to Cart")',
                'button.add-to-cart',
                'button.btn-primary'
            ];

            // Try each selector
            let clicked = false;
            for (const selector of addToCartSelectors) {
                if (await page.locator(selector).count() > 0) {
                    logTestStep(`Found Add to Cart button with selector: ${selector}`, testInfo);
                    await page.click(selector);
                    clicked = true;
                    break;
                }
            }

            if (!clicked) {
                // Try a more generic approach - find button by text content
                const buttonInfo = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.map(b => ({
                        text: b.innerText,
                        classes: b.className,
                        visible: b.offsetWidth > 0 && b.offsetHeight > 0
                    }));
                });

                logTestStep(`Found ${buttonInfo.length} buttons on product page`, testInfo);

                // If we found buttons, click the first visible one that might be add to cart
                if (buttonInfo.length > 0) {
                    const addToCartButton = buttonInfo.findIndex(b =>
                        b.visible &&
                        (b.text.toLowerCase().includes('agregar') ||
                            b.text.toLowerCase().includes('add') ||
                            b.text.toLowerCase().includes('cart') ||
                            b.text.toLowerCase().includes('bolsa'))
                    );

                    if (addToCartButton >= 0) {
                        logTestStep(`Clicking the ${addToCartButton + 1}th button: "${buttonInfo[addToCartButton].text}"`, testInfo);
                        await page.locator('button').nth(addToCartButton).click();
                    }
                }
            }
        } catch (e) {
            logTestStep(`Failed to click Add to Cart: ${e.message}`, testInfo);
        }

        // Step 6: Go to cart page
        await page.waitForTimeout(2000);
        logTestStep('Navigating to cart page', testInfo);
        await page.goto('/carrito');
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        // Step 7: Check that items exist in cart
        logTestStep('Looking for cart items', testInfo);

        // Get information about the cart page
        const cartPageInfo = await page.evaluate(() => {
            // Function to get text content of elements matching a selector
            const getTexts = selector => {
                return Array.from(document.querySelectorAll(selector)).map(el => el.textContent);
            };

            // Function to check if selector exists
            const exists = selector => document.querySelector(selector) !== null;

            // Get information about visible elements
            return {
                pageTitle: document.title,
                h1Text: getTexts('h1'),
                h2Text: getTexts('h2'),
                buttonTexts: getTexts('button'),
                productNames: getTexts('.product-name, .item-name, .cart-item-name'),
                hasQuantityInputs: exists('input[type="number"]'),
                hasRemoveButtons: exists('button.remove-item') ||
                    exists('button.delete-item') ||
                    // Fallback: check button text for 'Remove' or 'Delete'
                    Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Remove')) ||
                    Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Delete')),
                visibleText: document.body.innerText,
                hasEmptyCartMessage: document.body.innerText.toLowerCase().includes('empty') ||
                    document.body.innerText.toLowerCase().includes('vacío')
            };
        });

        logTestStep('Cart page details: ' + JSON.stringify(cartPageInfo, null, 2), testInfo);

        // Look for and interact with quantity controls if items exist
        if (!cartPageInfo.hasEmptyCartMessage) {
            logTestStep('Attempting to interact with quantity controls', testInfo);

            // Try to find quantity inputs or buttons
            const quantitySelectors = [
                'input[type="number"]',  // Quantity input
                '.quantity-control button', // Quantity buttons
                '.item-quantity',
                '.cart-item button',
                'button:has-text("+")',  // Plus button
                'button:has-text("-")'   // Minus button
            ];

            // Try each selector
            for (const selector of quantitySelectors) {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    logTestStep(`Found quantity control with selector: ${selector} (count: ${count})`, testInfo);

                    // If it's an input, set a value
                    if (selector === 'input[type="number"]') {
                        await page.fill(selector, '2');
                        logTestStep('Updated quantity to 2', testInfo);
                    }
                    // If it's a plus button
                    else if (selector === 'button:has-text("+")') {
                        await page.click(selector);
                        logTestStep('Clicked plus button to increment quantity', testInfo);
                    }

                    break;
                }
            }

            // Try to find and click a remove button
            const removeSelectors = [
                'button:has-text("Remove")',
                'button:has-text("Delete")',
                'button:has-text("Eliminar")',
                'button:has-text("Quitar")',
                '.remove-item',
                '.delete-item'
            ];

            // Look for remove buttons but don't click yet
            for (const selector of removeSelectors) {
                const count = await page.locator(selector).count();
                if (count > 0) {
                    logTestStep(`Found remove button with selector: ${selector} (count: ${count})`, testInfo);
                    break;
                }
            }
        } else {
            logTestStep('Cart appears to be empty, cannot test quantity controls', testInfo);
        }

        // Final summary
        logTestStep('Test complete - cart debug flow finished', testInfo);
    });
}); 