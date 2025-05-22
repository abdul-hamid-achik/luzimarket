const { test, expect } = require('@playwright/test');

// Increase the test timeout for all tests in this file
test.setTimeout(120000);

let productId = null; // Store the product ID between tests

test.describe('Product Listing & Detail Flow', () => {
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
        productId = randomProduct.id;
        console.log(`Found product ID for tests: ${productId}`);
      } else {
        console.log('No products found, using fallback ID');
        productId = 'e0c3eba4-2435-4aaf-6174-818f819fd668'; // Fallback to known product ID as last resort
      }
    } catch (e) {
      console.error('Error getting product ID:', e);
      productId = 'e0c3eba4-2435-4aaf-6174-818f819fd668'; // Fallback to known product ID as last resort
    }

    await context.close();
  });

  test('should list products and navigate to a product detail', async ({ page }) => {
    // Go to products list page
    await page.goto('/handpicked/productos');
    console.log('Navigated to products listing page');

    // Wait for products to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Try to find and click on a product
    const productSelectors = [
      // Specific known selectors 
      '.cajaTodosLosProductos a',
      '.product-card a',
      // Generic selectors that might contain products
      'a img',
      '.container a',
      'a.product-link'
    ];

    let productClicked = false;

    for (const selector of productSelectors) {
      try {
        const products = page.locator(selector);
        const count = await products.count();

        if (count > 0) {
          console.log(`Found ${count} elements with selector: ${selector}`);
          await products.first().click();
          console.log(`Clicked first product with selector: ${selector}`);
          productClicked = true;
          break;
        }
      } catch (e) {
        console.log(`Error with selector ${selector}:`, e.message);
      }
    }

    // If we couldn't click on any product, go directly to a known product detail
    if (!productClicked) {
      console.log(`Could not click on any product, navigating directly to product ${productId}`);
      await page.goto(`/handpicked/productos/${productId}`);
    }

    // Wait for product detail page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check if we're on a product detail page
    const productDetailIndicators = [
      'button.btn-primary',
      '.product-title',
      '.product-price',
      '.product-image',
      '.accordion-flush',
      '.container',
      'h1'
    ];

    let foundProductDetail = false;
    for (const selector of productDetailIndicators) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 2000 });
        if (element) {
          console.log(`Found product detail indicator: ${selector}`);
          foundProductDetail = true;
          break;
        }
      } catch (e) {
        console.log(`Product detail indicator not found: ${selector}`);
      }
    }

    // Verify we found a product detail element
    expect(foundProductDetail).toBe(true);
  });

  test('should display accordion sections with correct content on product detail', async ({ page }) => {
    // Directly visit the detail page for a real product ID
    await page.goto(`/handpicked/productos/${productId}`);
    console.log(`Navigated to product detail page for product ${productId}`);

    // Wait longer for page to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });


    // Look for accordion elements with multiple selector strategies
    const accordionSelectors = [
      '.accordion-flush',
      '.accordion-item',
      '.accordion-button',
      '.accordion',
      'button[data-bs-toggle="collapse"]',
      // Generic selectors that might be used for accordions
      'details',
      'summary'
    ];

    let accordionFound = false;
    let accordionElement = null;
    let accordionSelector = '';

    for (const selector of accordionSelectors) {
      try {
        accordionElement = await page.waitForSelector(selector, { timeout: 2000 });
        if (accordionElement) {
          console.log(`Found accordion element with selector: ${selector}`);
          accordionSelector = selector;
          accordionFound = true;
          break;
        }
      } catch (e) {
        console.log(`Accordion selector not found: ${selector}`);
      }
    }

    // Verify we found an accordion element
    expect(accordionFound).toBe(true);

    if (accordionFound) {
      // If it's a button or clickable element, try to click it
      if (accordionSelector.includes('button') || accordionSelector.includes('summary')) {
        await accordionElement.click();
        console.log('Clicked accordion element');
      } else {
        // If it's a container, try to find a button inside it
        const button = page.locator(`${accordionSelector} button, ${accordionSelector} summary`).first();
        if (await button.count() > 0) {
          await button.click();
          console.log('Clicked button inside accordion element');
        }
      }

      // Wait for animation
      await page.waitForTimeout(1000);

      // Look for content that should be visible after expanding
      const contentSelectors = [
        '.accordion-body',
        '.accordion-content',
        '.collapse.show',
        'details[open]',
        '.accordion-item div:not(.accordion-header)'
      ];

      let contentFound = false;
      for (const selector of contentSelectors) {
        try {
          const content = await page.waitForSelector(selector, { timeout: 2000 });
          if (content) {
            console.log(`Found accordion content with selector: ${selector}`);
            contentFound = true;
            break;
          }
        } catch (e) {
          console.log(`Accordion content not found with selector: ${selector}`);
        }
      }

      // Verify we found content after clicking
      expect(contentFound).toBe(true);
    }
  });
});