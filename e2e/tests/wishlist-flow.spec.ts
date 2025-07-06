import { test, expect } from '../fixtures/test';
import { routes } from '../helpers/navigation';

test.describe('Wishlist Complete Flow', () => {
  let userEmail: string;
  let userPassword: string;

  test.beforeEach(async ({ page }) => {
    userEmail = `wishlist-${Date.now()}@example.com`;
    userPassword = 'WishlistTest123!';
    
    // Create a test user
    await page.goto(routes.register);
    await page.fill('input[name="name"]', 'Wishlist Test User');
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.fill('input[name="confirmPassword"]', userPassword);
    await page.locator('label[for="acceptTerms"]').click();
    
    // Mock successful registration
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        json: { success: true }
      });
    });
    
    // Wait for form to be fully loaded and stable
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await page.getByRole('button', { name: /crear cuenta/i }).click();
  });

  test('should redirect guest to login when trying to add to wishlist', async ({ page }) => {
    // Browse as guest
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    
    // Click on first product
    await page.getByTestId('product-card').first().click();
    await page.waitForLoadState('networkidle');
    
    // Try to add to wishlist from product detail page
    await page.getByTestId('wishlist-button').click();
    
    // Should redirect to login
    await page.waitForURL('**/iniciar-sesion**');
    
    // Should show message about needing to login
    await expect(page.getByText(/iniciar sesión.*favoritos|login.*wishlist/i)).toBeVisible();
  });

  test('should add multiple products to wishlist and manage them', async ({ page }) => {
    // Login first
    await page.goto(routes.login);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL('**/');
    
    // Browse products
    await page.goto(routes.products);
    await page.waitForLoadState('networkidle');
    
    // Add first product to wishlist
    const product1 = await page.getByTestId('product-card').first();
    const product1Name = await product1.getByTestId('product-name').textContent() || '';
    await product1.click();
    
    await page.getByRole('button', { name: /agregar a favoritos|add to wishlist/i }).click();
    await expect(page.getByText(/agregado a favoritos|added to wishlist/i)).toBeVisible();
    
    // Heart icon should be filled
    await expect(page.getByTestId('wishlist-button-filled')).toBeVisible();
    
    // Go back and add second product
    await page.goto(routes.products);
    const product2 = await page.getByTestId('product-card').nth(1);
    const product2Name = await product2.getByTestId('product-name').textContent() || '';
    await product2.click();
    
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    await expect(page.getByText(/agregado a favoritos/i)).toBeVisible();
    
    // Go to wishlist page
    await page.goto(routes.wishlist);
    await page.waitForLoadState('networkidle');
    
    // Verify both products are in wishlist
    await expect(page.getByText(product1Name)).toBeVisible();
    await expect(page.getByText(product2Name)).toBeVisible();
    await expect(page.getByTestId('wishlist-item')).toHaveCount(2);
    
    // Remove first product from wishlist
    await page.getByTestId('wishlist-item').filter({ hasText: product1Name })
      .getByRole('button', { name: /eliminar|remove/i }).click();
    
    // Confirm removal
    await expect(page.getByText(product1Name)).not.toBeVisible();
    await expect(page.getByTestId('wishlist-item')).toHaveCount(1);
  });

  test('should move items from wishlist to cart', async ({ page }) => {
    // Login
    await page.goto(routes.login);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL('**/');
    
    // Add products to wishlist
    await page.goto(routes.products);
    
    // Add first product
    const product1 = await page.getByTestId('product-card').first();
    const product1Name = await product1.getByTestId('product-name').textContent() || '';
    const product1Price = await product1.getByTestId('product-price').textContent() || '';
    await product1.click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    
    // Add second product
    await page.goto(routes.products);
    const product2 = await page.getByTestId('product-card').nth(1);
    const product2Name = await product2.getByTestId('product-name').textContent() || '';
    await product2.click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    
    // Go to wishlist
    await page.goto(routes.wishlist);
    
    // Move first item to cart
    await page.getByTestId('wishlist-item').filter({ hasText: product1Name })
      .getByRole('button', { name: /mover al carrito|move to cart/i }).click();
    
    // Should show success message
    await expect(page.getByText(/movido al carrito|moved to cart/i)).toBeVisible();
    
    // Item should be removed from wishlist
    await expect(page.getByText(product1Name)).not.toBeVisible();
    await expect(page.getByTestId('wishlist-item')).toHaveCount(1);
    
    // Check cart has the item
    await page.getByTestId('cart-trigger').click();
    await page.waitForSelector('[role="dialog"]');
    await expect(page.getByText(product1Name)).toBeVisible();
    
    // Close cart and move all remaining items
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /mover todo al carrito|move all to cart/i }).click();
    
    // Wishlist should be empty
    await expect(page.getByText(/favoritos.*vacío|wishlist.*empty/i)).toBeVisible();
    await expect(page.getByTestId('wishlist-item')).toHaveCount(0);
    
    // Cart should have both items
    await page.getByTestId('cart-trigger').click();
    await expect(page.getByTestId('cart-item')).toHaveCount(2);
  });

  test('should persist wishlist across sessions', async ({ page, context }) => {
    // Login and add to wishlist
    await page.goto(routes.login);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Add product to wishlist
    await page.goto(routes.products);
    const product = await page.getByTestId('product-card').first();
    const productName = await product.getByTestId('product-name').textContent() || '';
    await product.click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    
    // Logout
    await page.getByTestId('user-menu').click();
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    
    // Clear cookies/session
    await context.clearCookies();
    
    // Login again
    await page.goto(routes.login);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Check wishlist
    await page.goto(routes.wishlist);
    await expect(page.getByText(productName)).toBeVisible();
    await expect(page.getByTestId('wishlist-item')).toHaveCount(1);
  });

  test('should show wishlist count in header', async ({ page }) => {
    // Login
    await page.goto(routes.login);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Initially should show 0 or no count
    const wishlistIcon = page.getByTestId('wishlist-icon');
    await expect(wishlistIcon).toBeVisible();
    
    // Add products to wishlist
    await page.goto(routes.products);
    
    // Add first product
    await page.getByTestId('product-card').first().click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    
    // Check count updated to 1
    await expect(page.getByTestId('wishlist-count')).toHaveText('1');
    
    // Add second product
    await page.goto(routes.products);
    await page.getByTestId('product-card').nth(1).click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    
    // Check count updated to 2
    await expect(page.getByTestId('wishlist-count')).toHaveText('2');
  });

  test('should handle out of stock items in wishlist', async ({ page }) => {
    // Login
    await page.goto(routes.login);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Add product to wishlist
    await page.goto(routes.products);
    const product = await page.getByTestId('product-card').first();
    const productName = await product.getByTestId('product-name').textContent() || '';
    await product.click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    
    // Mock product going out of stock
    await page.route('**/api/products/**', async route => {
      const json = await route.fetch().then(r => r.json());
      json.stock = 0;
      json.isAvailable = false;
      await route.fulfill({ json });
    });
    
    // Go to wishlist
    await page.goto(routes.wishlist);
    
    // Product should show as out of stock
    const wishlistItem = page.getByTestId('wishlist-item').filter({ hasText: productName });
    await expect(wishlistItem.getByText(/agotado|out of stock/i)).toBeVisible();
    
    // Move to cart button should be disabled
    const moveToCartButton = wishlistItem.getByRole('button', { name: /mover al carrito/i });
    await expect(moveToCartButton).toBeDisabled();
    
    // Should show notification option
    await expect(wishlistItem.getByRole('button', { name: /notificar.*disponible|notify.*available/i })).toBeVisible();
  });

  test('should allow sharing wishlist', async ({ page }) => {
    // Login
    await page.goto(routes.login);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Add products to wishlist
    await page.goto(routes.products);
    await page.getByTestId('product-card').first().click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    
    await page.goto(routes.products);
    await page.getByTestId('product-card').nth(1).click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    
    // Go to wishlist
    await page.goto(routes.wishlist);
    
    // Click share button
    await page.getByRole('button', { name: /compartir lista|share list/i }).click();
    
    // Should show share modal/options
    await expect(page.getByText(/compartir.*favoritos|share.*wishlist/i)).toBeVisible();
    
    // Copy link option
    const copyLinkButton = page.getByRole('button', { name: /copiar enlace|copy link/i });
    await copyLinkButton.click();
    
    // Should show success message
    await expect(page.getByText(/enlace copiado|link copied/i)).toBeVisible();
    
    // Should have shareable URL format
    const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(shareUrl).toContain('/wishlist/shared/');
  });

  test('should filter and sort wishlist items', async ({ page }) => {
    // Login
    await page.goto(routes.login);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Add multiple products from different categories
    await page.goto(routes.products);
    
    // Add products
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('product-card').nth(i).click();
      await page.getByRole('button', { name: /agregar a favoritos/i }).click();
      await page.goto(routes.products);
    }
    
    // Go to wishlist
    await page.goto(routes.wishlist);
    await expect(page.getByTestId('wishlist-item')).toHaveCount(4);
    
    // Sort by price
    await page.selectOption('select[name="sort"]', 'price-low-high');
    await page.waitForTimeout(500);
    
    // Verify items are sorted
    const prices = await page.getByTestId('wishlist-item-price').allTextContents();
    const numericPrices = prices.map(p => parseFloat(p.replace(/[^0-9.]/g, '')));
    const isSorted = numericPrices.every((price, i) => i === 0 || price >= numericPrices[i - 1]);
    expect(isSorted).toBe(true);
    
    // Filter by category (if available)
    const categoryFilter = page.locator('select[name="category"]');
    if (await categoryFilter.isVisible()) {
      const options = await categoryFilter.locator('option').allTextContents();
      if (options.length > 1) {
        await categoryFilter.selectOption({ index: 1 });
        await page.waitForTimeout(500);
        
        // Should show filtered results
        const filteredCount = await page.getByTestId('wishlist-item').count();
        expect(filteredCount).toBeLessThanOrEqual(4);
      }
    }
  });

  test('should show price alerts for wishlist items', async ({ page }) => {
    // Login
    await page.goto(routes.login);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', userPassword);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Add product to wishlist
    await page.goto(routes.products);
    const product = await page.getByTestId('product-card').first();
    const originalPrice = await product.getByTestId('product-price').textContent() || '';
    await product.click();
    await page.getByRole('button', { name: /agregar a favoritos/i }).click();
    
    // Go to wishlist
    await page.goto(routes.wishlist);
    
    // Set price alert
    const wishlistItem = page.getByTestId('wishlist-item').first();
    await wishlistItem.getByRole('button', { name: /alerta de precio|price alert/i }).click();
    
    // Set target price
    const targetPriceModal = page.getByRole('dialog');
    await targetPriceModal.fill('input[name="targetPrice"]', '100');
    await targetPriceModal.getByRole('button', { name: /establecer alerta|set alert/i }).click();
    
    // Should show alert set confirmation
    await expect(page.getByText(/alerta.*establecida|alert.*set/i)).toBeVisible();
    
    // Should show active alert indicator
    await expect(wishlistItem.getByTestId('price-alert-active')).toBeVisible();
  });
});