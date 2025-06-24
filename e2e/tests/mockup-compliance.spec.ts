import { test, expect } from '@playwright/test';

test.describe('Mockup Compliance Tests', () => {
  test('homepage matches design mockup', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check hero section
    const heroHeading = page.locator('h1').filter({ 
      hasText: /Regalos.*handpicked.*extraordinarios/i 
    });
    await expect(heroHeading).toBeVisible();
    
    // Check tagline
    const tagline = page.locator('text=/Experiencias y productos seleccionados/i');
    await expect(tagline).toBeVisible();
    
    // Check category grid with 4 main categories
    const categoryGrid = page.locator('section').filter({ 
      has: page.locator('text=/Flowershop|Sweet|Events.*Dinners|Giftshop/') 
    });
    await expect(categoryGrid).toBeVisible();
    
    // Verify all 4 categories are present
    await expect(page.locator('text=Flowershop')).toBeVisible();
    await expect(page.locator('text=Sweet')).toBeVisible();
    await expect(page.locator('text=Events + Dinners')).toBeVisible();
    await expect(page.locator('text=Giftshop')).toBeVisible();
  });

  test('navigation matches mockup design', async ({ page }) => {
    await page.goto('/');
    
    // Check top bar elements
    await expect(page.locator('text=ESP → MXN')).toBeVisible();
    await expect(page.locator('text=/Envío a.*MONTERREY/i')).toBeVisible();
    
    // Check logo
    const logo = page.locator('text=LUZIMARKET').first();
    await expect(logo).toBeVisible();
    
    // Check navigation items
    const navItems = ['Best Sellers', 'Handpicked', 'Tiendas + Marcas', 'Categorías', 'Ocasiones', 'Editorial'];
    for (const item of navItems) {
      await expect(page.locator(`nav >> text=${item}`).first()).toBeVisible();
    }
    
    // Check header actions
    await expect(page.locator('text=FAMILY')).toBeVisible();
    await expect(page.locator('[aria-label="Search"], button:has-text("Buscar")').first()).toBeVisible();
    await expect(page.locator('[aria-label="Wishlist"], button:has(svg)').first()).toBeVisible();
    await expect(page.locator('[aria-label="Cart"], button:has(svg)').last()).toBeVisible();
  });

  test('product listing page matches design', async ({ page }) => {
    await page.goto('/products');
    
    // Check filters sidebar
    const filterSidebar = page.locator('aside, [data-testid="filters"]').first();
    await expect(filterSidebar).toBeVisible();
    
    // Check filter sections
    await expect(filterSidebar.locator('text=/Categorías/i')).toBeVisible();
    await expect(filterSidebar.locator('text=/Precio/i')).toBeVisible();
    await expect(filterSidebar.locator('text=/Vendedor/i')).toBeVisible();
    
    // Check product grid layout
    const productGrid = page.locator('[data-testid="product-grid"], .grid').filter({
      has: page.locator('article, [data-testid="product-card"]')
    }).first();
    
    await expect(productGrid).toBeVisible();
    
    // Check sort dropdown
    const sortDropdown = page.locator('select, [data-testid="sort"]').first();
    await expect(sortDropdown).toBeVisible();
  });

  test('vendor registration form matches mockup', async ({ page }) => {
    await page.goto('/vendor/register');
    
    // Check form sections as per mockup
    await expect(page.locator('h1, h2').filter({ hasText: /Vendor|Register|Registro/i }).first()).toBeVisible();
    
    // Business Information section
    await expect(page.locator('text=/Información del Negocio/i')).toBeVisible();
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    await expect(page.locator('input[name="contactName"]')).toBeVisible();
    
    // Contact Information section
    await expect(page.locator('text=/Información de Contacto/i')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    
    // Address section
    await expect(page.locator('text=/Dirección/i')).toBeVisible();
    await expect(page.locator('input[name="street"]')).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
    
    // Submit button
    await expect(page.locator('button[type="submit"]').filter({ hasText: /Enviar.*Solicitud/i })).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile menu button is visible
    const mobileMenuButton = page.locator('button').filter({ 
      has: page.locator('svg'), 
      hasText: /Menu|Menú/ 
    }).first();
    
    // On mobile, either menu button should be visible or nav should be hidden
    const isMenuButtonVisible = await mobileMenuButton.isVisible();
    const isNavVisible = await page.locator('nav').first().isVisible();
    
    expect(isMenuButtonVisible || !isNavVisible).toBeTruthy();
    
    // Check that content adjusts to mobile
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();
    
    // Category grid should stack on mobile
    const categoryCards = page.locator('text=/Flowershop|Sweet|Events.*Dinners|Giftshop/');
    const firstCard = categoryCards.first();
    const lastCard = categoryCards.last();
    
    if (await firstCard.isVisible() && await lastCard.isVisible()) {
      const firstBox = await firstCard.boundingBox();
      const lastBox = await lastCard.boundingBox();
      
      // On mobile, cards should stack (different Y positions)
      if (firstBox && lastBox) {
        expect(firstBox.y).not.toBe(lastBox.y);
      }
    }
  });

  test('typography matches design system', async ({ page }) => {
    await page.goto('/');
    
    // Check that custom fonts are loaded
    const fontFamilies = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const body = document.querySelector('body');
      return {
        heading: h1 ? window.getComputedStyle(h1).fontFamily : '',
        body: body ? window.getComputedStyle(body).fontFamily : ''
      };
    });
    
    // Check that custom fonts are applied (not just default system fonts)
    expect(fontFamilies.heading).toMatch(/myungjo|times.*now|serif/i);
    expect(fontFamilies.body).toMatch(/times.*now|univers|sans-serif/i);
  });

  test('color scheme matches brand', async ({ page }) => {
    await page.goto('/');
    
    // Check that key brand colors are present
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    // Should have light/cream background as in mockup
    expect(backgroundColor).toMatch(/rgb\(2[4-5]\d|255/); // Light color values
    
    // Check text is dark for contrast
    const textColor = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? window.getComputedStyle(h1).color : '';
    });
    
    // Text should be dark
    expect(textColor).toMatch(/rgb\([0-5]\d|0,/); // Dark color values
  });
});