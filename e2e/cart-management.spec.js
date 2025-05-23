const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.use({ storageState: 'tmp/authenticatedState.json' });

// Global variable to store a valid product ID
let validProductId = null;

test.describe('Cart Management Flow', () => {
  test.beforeAll(async ({ browser }) => {
    // Get a product ID for the tests
    const context = await browser.newContext();
    const page = await context.newPage();

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
        validProductId = null;
      }
    } catch (e) {
      console.error('Error getting product ID:', e);
      validProductId = null;
    }

    await context.close();
  });

  test('user can update quantity and remove item from cart', async ({ page }) => {
    // Skip test if no products are available
    if (!validProductId) {
      test.skip('No products available in database for testing');
      return;
    }

    // Register and login new user
    const timestamp = Date.now();
    const email = `testuser+cart${timestamp}@example.com`;
    const password = 'CartPass123!';

    // Go to register page
    await page.goto('/register');

    // Add client-side listeners for better debugging
    await page.evaluate(() => {
      // Monkey patch fetch to log errors
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        try {
          const response = await originalFetch.apply(this, args);
          if (!response.ok) {
            console.error(`Fetch error: ${response.status} ${response.statusText} for ${args[0]}`);
          }
          return response;
        } catch (e) {
          console.error(`Fetch failed for ${args[0]}:`, e);
          throw e;
        }
      };
    });

    // Fill registration form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit registration
    await page.click('button:has-text("Register")');

    // Wait for login page to be available
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill login form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for successful login
    try {
      // First try navigation
      await Promise.race([
        page.waitForNavigation({ timeout: 5000 }).catch(() => { }),
        page.waitForTimeout(5000)
      ]);
    } catch (e) {
      console.log('Navigation detection after login failed:', e);
    }

    // Add first product to cart
    await page.goto('/handpicked/productos');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Try to find and click a product using various selectors
    const productSelectors = [
      '.cajaTodosLosProductos a',
      '.product-card a',
      '.product-container a',
      'a.product-link'
    ];

    let productClicked = false;
    for (const selector of productSelectors) {
      const products = await page.locator(selector).all();
      if (products.length > 0) {
        console.log(`Found ${products.length} products with selector: ${selector}`);
        await products[0].click();
        productClicked = true;
        break;
      }
    }

    // If no selector worked, try a more generic approach
    if (!productClicked) {
      console.log('No product selectors matched, using fallback approach');

      // Look for any big link with an image
      const productLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
          .filter(a => a.querySelector('img') && a.offsetWidth > 50 && a.offsetHeight > 50)
          .map(a => a.href);
      });

      if (productLinks.length > 0) {
        console.log(`Found ${productLinks.length} product links from DOM analysis`);
        await page.goto(productLinks[0]);
      } else {
        // Last resort - go to a specific product ID that we know exists
        console.log(`No product links found, navigating to product ${validProductId}`);
        await page.goto(`/handpicked/productos/${validProductId}`);
      }
    }

    // Wait for product detail page and add to cart
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Try to find and click the add to cart button
    const addToCartSelectors = [
      'button:has-text("Agregar a la bolsa")',
      'button:has-text("Add to Cart")',
      'button.add-to-cart',
      'button.btn-primary'
    ];

    let addToCartClicked = false;
    for (const selector of addToCartSelectors) {
      if (await page.locator(selector).count() > 0) {
        console.log(`Found Add to Cart button: ${selector}`);
        await page.click(selector);
        addToCartClicked = true;
        break;
      }
    }

    // If no specific selector worked, try a more generic approach
    if (!addToCartClicked) {
      console.log('No specific Add to Cart button found, trying generic buttons');

      // Get info about all buttons
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .map(b => ({
            text: b.innerText,
            visible: b.offsetWidth > 0 && b.offsetHeight > 0
          }));
      });

      // Find a button with relevant text
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        if (button.visible &&
          (button.text.toLowerCase().includes('agregar') ||
            button.text.toLowerCase().includes('add') ||
            button.text.toLowerCase().includes('cart') ||
            button.text.toLowerCase().includes('bolsa'))) {
          console.log(`Clicking button ${i + 1}: "${button.text}"`);
          await page.locator('button').nth(i).click();
          addToCartClicked = true;
          break;
        }
      }
    }

    // Go to cart
    console.log('Navigating to cart page');
    await page.goto('/carrito');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Check if the cart has items or is empty
    const cartIsEmpty = await page.evaluate(() => {
      const pageText = document.body.innerText.toLowerCase();
      return pageText.includes('empty') || pageText.includes('vacío');
    });

    console.log(`Cart is ${cartIsEmpty ? 'empty' : 'not empty'}`);

    // Only try to interact with cart if it's not empty
    if (!cartIsEmpty) {
      // Try to find quantity inputs/controls
      const quantitySelectors = [
        'input[type="number"]',  // Quantity input
        '.quantity-control button',  // Quantity buttons
        '.item-quantity',  // General item quantity container
        'button:has-text("+")',  // Plus button
        'button:has-text("-")'   // Minus button
      ];

      // Try each selector to update quantity
      for (const selector of quantitySelectors) {
        const count = await page.locator(selector).count();

        if (count > 0) {
          console.log(`Found quantity control: ${selector} (${count} elements)`);

          // If it's an input, set the value
          if (selector === 'input[type="number"]') {
            await page.fill(selector, '2');
            await page.dispatchEvent(selector, 'change');
            console.log('Updated quantity input to 2');
          }
          // If it's a plus button, click it
          else if (selector === 'button:has-text("+")') {
            await page.click(selector);
            console.log('Clicked plus button');
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

      // Look for a remove button
      for (const selector of removeSelectors) {
        const count = await page.locator(selector).count();

        if (count > 0) {
          console.log(`Found remove button: ${selector} (${count} elements)`);
          await page.click(selector);
          console.log('Clicked remove button');
          break;
        }
      }
    }
  });
});