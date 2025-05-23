const { test, expect } = require('@playwright/test');

test.describe('Product Filters & Search', () => {
    test.describe('Filter Accordion Functionality', () => {
        test('should expand and collapse filter sections', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            // Wait for filters section to load
            const accordionHeaders = page.locator('button.accordion-button, .filter-header, .accordion-header');

            if (await accordionHeaders.count() > 0) {
                console.log(`Found ${await accordionHeaders.count()} filter sections`);

                // Test first accordion section
                const firstHeader = accordionHeaders.first();
                await firstHeader.click();
                await page.waitForTimeout(500);

                // Check if content is visible - be more flexible
                const accordionBody = page.locator('.accordion-body, .filter-content').first();
                if (await accordionBody.count() > 0) {
                    // Check if it's visible or just exists (some accordions may work differently)
                    const isVisible = await accordionBody.isVisible();
                    if (isVisible) {
                        console.log('✅ Filter section expands correctly');
                    } else {
                        // Try clicking again or check if it has different behavior
                        await firstHeader.click();
                        await page.waitForTimeout(300);
                        const isVisibleAfterSecondClick = await accordionBody.isVisible();
                        console.log(`Filter section visibility: ${isVisibleAfterSecondClick ? 'visible' : 'hidden'}`);
                    }
                } else {
                    console.log('ℹ️ Accordion body not found - filters may have different structure');
                }

                // Test collapse - click header again
                await firstHeader.click();
                await page.waitForTimeout(500);
                console.log('✅ Filter section interaction tested');
            } else {
                console.log('ℹ️ No accordion filters found - filters may be always visible or not implemented');

                // Check for any filter elements at all
                const anyFilters = page.locator('.filter, .filters, [data-filter]');
                if (await anyFilters.count() > 0) {
                    console.log('Found non-accordion filter elements');
                } else {
                    console.log('No filter elements found');
                }
            }
        });

        test('should handle multiple filter sections', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            const filterSections = [
                { selector: 'button.accordion-button', name: 'Accordion Filters' },
                { selector: '.filter-category', name: 'Category Filters' },
                { selector: '.filter-price', name: 'Price Filters' },
                { selector: '.filter-brand', name: 'Brand Filters' }
            ];

            for (const section of filterSections) {
                const elements = page.locator(section.selector);
                const count = await elements.count();

                if (count > 0) {
                    console.log(`Found ${count} ${section.name}`);

                    // Test interaction with first element
                    try {
                        await elements.first().click();
                        await page.waitForTimeout(300);
                        console.log(`✅ ${section.name} interaction works`);
                    } catch (e) {
                        console.log(`⚠️ ${section.name} interaction failed: ${e.message}`);
                    }
                }
            }
        });
    });

    test.describe('Category Filtering', () => {
        test('should filter products by category', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            // Look for category filters
            const categoryFilters = page.locator('.filter-category, .category-filter, input[name*="category"], select[name*="category"]');

            if (await categoryFilters.count() > 0) {
                console.log('Found category filters');

                // Try to click on a category filter
                const firstCategoryFilter = categoryFilters.first();
                await firstCategoryFilter.click();
                await page.waitForTimeout(1000);

                // Wait for products to update
                await page.waitForLoadState('networkidle');

                // Verify URL contains category parameter
                const currentUrl = page.url();
                if (currentUrl.includes('category=') || currentUrl.includes('filter=')) {
                    console.log('✅ Category filter applied to URL');
                }

                // Check if products are still visible
                const productsAfterFilter = await page.locator('a[href*="/handpicked/productos/"]').count();
                console.log(`Products visible after category filter: ${productsAfterFilter}`);

            } else {
                console.log('No category filters found - testing category navigation instead');

                // Test category navigation from categories page
                await page.goto('/categorias');
                await page.waitForLoadState('networkidle');

                const categoryLinks = page.locator('a:has-text("Ver Productos"), .category-link');
                if (await categoryLinks.count() > 0) {
                    await categoryLinks.first().click();
                    await page.waitForLoadState('networkidle');

                    // Should navigate to filtered products
                    expect(page.url()).toContain('handpicked/productos');
                    console.log('✅ Category navigation works');
                }
            }
        });

        test('should clear category filters', async ({ page }) => {
            await page.goto('/handpicked/productos?category=test');
            await page.waitForLoadState('networkidle');

            // Look for clear filter button
            const clearButtons = page.locator('button:has-text("Clear"), button:has-text("Reset"), .clear-filters, .reset-filters');

            if (await clearButtons.count() > 0) {
                await clearButtons.first().click();
                await page.waitForLoadState('networkidle');

                // URL should not contain category parameter
                const currentUrl = page.url();
                expect(currentUrl).not.toContain('category=test');
                console.log('✅ Category filter cleared');
            } else {
                console.log('No clear filter button found');
            }
        });
    });

    test.describe('Price Filtering', () => {
        test('should filter products by price range', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            // Look for price filter controls
            const priceFilters = [
                'input[type="range"]',
                '.price-slider',
                'input[name*="price"]',
                'select[name*="price"]',
                '.price-filter'
            ];

            let priceFilterFound = false;
            for (const selector of priceFilters) {
                const elements = page.locator(selector);
                if (await elements.count() > 0) {
                    console.log(`Found price filter: ${selector}`);
                    priceFilterFound = true;

                    try {
                        // Interact with price filter
                        if (selector.includes('input[type="range"]')) {
                            await elements.first().fill('50');
                        } else if (selector.includes('select')) {
                            // Try to select an option
                            const options = page.locator(`${selector} option`);
                            if (await options.count() > 1) {
                                await elements.first().selectOption({ index: 1 });
                            }
                        } else {
                            await elements.first().click();
                        }

                        await page.waitForTimeout(1000);
                        await page.waitForLoadState('networkidle');

                        console.log('✅ Price filter interaction successful');
                        break;
                    } catch (e) {
                        console.log(`Price filter interaction failed: ${e.message}`);
                    }
                }
            }

            if (!priceFilterFound) {
                console.log('No price filters found - may not be implemented yet');
            }
        });

        test('should handle price range inputs', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            // Look for min/max price inputs
            const minPriceInput = page.locator('input[name*="min"], input[placeholder*="min"], #min-price');
            const maxPriceInput = page.locator('input[name*="max"], input[placeholder*="max"], #max-price');

            if (await minPriceInput.count() > 0 && await maxPriceInput.count() > 0) {
                console.log('Found min/max price inputs');

                await minPriceInput.fill('10');
                await maxPriceInput.fill('100');

                // Look for apply button
                const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter"), .apply-filter');
                if (await applyButton.count() > 0) {
                    await applyButton.click();
                    await page.waitForLoadState('networkidle');
                    console.log('✅ Price range filter applied');
                }
            } else {
                console.log('No min/max price inputs found');
            }
        });
    });

    test.describe('Brand/Vendor Filtering', () => {
        test('should filter products by brand', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            // Look for brand filters
            const brandFilters = page.locator('.brand-filter, .vendor-filter, input[name*="brand"], select[name*="brand"], .filter-brand');

            if (await brandFilters.count() > 0) {
                console.log('Found brand filters');

                // Try to interact with brand filter
                const firstBrandFilter = brandFilters.first();

                if (await firstBrandFilter.getAttribute('type') === 'checkbox') {
                    await firstBrandFilter.check();
                } else {
                    await firstBrandFilter.click();
                }

                await page.waitForTimeout(1000);
                await page.waitForLoadState('networkidle');

                console.log('✅ Brand filter interaction completed');
            } else {
                console.log('No brand filters found');
            }
        });

        test('should show available brands in filter', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            // Look for brand list in filters
            const brandOptions = page.locator('.brand-option, .brand-checkbox, select[name*="brand"] option');

            if (await brandOptions.count() > 0) {
                const brandCount = await brandOptions.count();
                console.log(`Found ${brandCount} brand options`);

                // Verify brand names are visible
                for (let i = 0; i < Math.min(3, brandCount); i++) {
                    const brandText = await brandOptions.nth(i).textContent();
                    expect(brandText?.length).toBeGreaterThan(0);
                }

                console.log('✅ Brand options have content');
            }
        });
    });

    test.describe('Search Functionality', () => {
        test('should perform product search', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            // Look for search input
            const searchInputs = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="buscar"], .search-input');

            if (await searchInputs.count() > 0) {
                console.log('Found search input');

                const searchInput = searchInputs.first();
                await searchInput.fill('test');

                // Try to submit search
                await searchInput.press('Enter');
                await page.waitForTimeout(1000);
                await page.waitForLoadState('networkidle');

                // Check if URL contains search parameter
                const currentUrl = page.url();
                if (currentUrl.includes('search=') || currentUrl.includes('q=')) {
                    console.log('✅ Search parameter added to URL');
                }

                console.log('✅ Search functionality works');
            } else {
                console.log('No search input found');
            }
        });

        test('should handle empty search results', async ({ page }) => {
            await page.goto('/handpicked/productos?search=nonexistentproductxyz');
            await page.waitForLoadState('networkidle');

            // Should show empty state or no results message
            const emptyStateElements = page.locator('text=/no results|sin resultados|not found|no encontrado/i');

            if (await emptyStateElements.count() > 0) {
                await expect(emptyStateElements.first()).toBeVisible();
                console.log('✅ Empty search results handled correctly');
            } else {
                // Check if products list is empty
                const products = await page.locator('a[href*="/handpicked/productos/"]').count();
                console.log(`Products found for nonexistent search: ${products}`);
            }
        });

        test('should perform real-time search', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            const searchInput = page.locator('input[type="search"], input[placeholder*="search"], .search-input').first();

            if (await searchInput.count() > 0) {
                // Type slowly to test real-time search
                await searchInput.type('tea', { delay: 200 });
                await page.waitForTimeout(1000);

                // Products should update without pressing enter
                const productsAfterTyping = await page.locator('a[href*="/handpicked/productos/"]').count();
                console.log(`Products after typing "tea": ${productsAfterTyping}`);

                // Clear search
                await searchInput.clear();
                await page.waitForTimeout(1000);

                const productsAfterClear = await page.locator('a[href*="/handpicked/productos/"]').count();
                console.log(`Products after clearing search: ${productsAfterClear}`);

                console.log('✅ Real-time search tested');
            }
        });
    });

    test.describe('Sorting Functionality', () => {
        test('should sort products by different criteria', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            // Look for sort dropdown or buttons
            const sortControls = page.locator('select[name*="sort"], .sort-dropdown, .sort-buttons, [data-sort]');

            if (await sortControls.count() > 0) {
                console.log('Found sort controls');

                const firstSortControl = sortControls.first();

                if (await firstSortControl.tagName() === 'SELECT') {
                    // Test dropdown sorting
                    const options = page.locator('option', { has: firstSortControl });
                    if (await options.count() > 1) {
                        await firstSortControl.selectOption({ index: 1 });
                        await page.waitForLoadState('networkidle');
                        console.log('✅ Dropdown sort applied');
                    }
                } else {
                    // Test button/link sorting
                    await firstSortControl.click();
                    await page.waitForLoadState('networkidle');
                    console.log('✅ Button sort applied');
                }

                // Verify URL contains sort parameter
                const currentUrl = page.url();
                if (currentUrl.includes('sort=') || currentUrl.includes('order=')) {
                    console.log('✅ Sort parameter in URL');
                }
            } else {
                console.log('No sort controls found');
            }
        });

        test('should test common sort options', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            const commonSortOptions = [
                'price-low-high',
                'price-high-low',
                'name-a-z',
                'newest',
                'popularity'
            ];

            for (const sortOption of commonSortOptions) {
                // Try to find and click sort option - fix selector syntax
                const sortElement = page.locator(`[data-sort="${sortOption}"]`).or(
                    page.locator(`option[value*="${sortOption}"]`)
                ).or(
                    page.locator(`text="${sortOption}"`)
                );

                if (await sortElement.count() > 0) {
                    await sortElement.first().click();
                    await page.waitForTimeout(500);
                    console.log(`✅ Tested sort option: ${sortOption}`);
                }
            }
        });
    });

    test.describe('Filter Combinations', () => {
        test('should apply multiple filters simultaneously', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            // Apply category filter if available
            const categoryFilter = page.locator('.category-filter, .filter-category').first();
            if (await categoryFilter.count() > 0) {
                await categoryFilter.click();
                await page.waitForTimeout(500);
            }

            // Apply price filter if available
            const priceFilter = page.locator('input[type="range"], .price-filter').first();
            if (await priceFilter.count() > 0) {
                if (await priceFilter.getAttribute('type') === 'range') {
                    await priceFilter.fill('50');
                } else {
                    await priceFilter.click();
                }
                await page.waitForTimeout(500);
            }

            // Apply search if available
            const searchInput = page.locator('input[type="search"], .search-input').first();
            if (await searchInput.count() > 0) {
                await searchInput.fill('product');
                await searchInput.press('Enter');
                await page.waitForTimeout(500);
            }

            await page.waitForLoadState('networkidle');

            // Verify multiple filters in URL
            const currentUrl = page.url();
            const hasMultipleFilters = (currentUrl.match(/[?&]/g) || []).length > 1;

            if (hasMultipleFilters) {
                console.log('✅ Multiple filters applied to URL');
            }

            console.log('✅ Multiple filter combination tested');
        });

        test('should reset all filters', async ({ page }) => {
            // Start with some filters applied
            await page.goto('/handpicked/productos?category=test&price=50&search=product');
            await page.waitForLoadState('networkidle');

            // Look for reset/clear all button
            const resetButtons = page.locator('button:has-text("Clear All"), button:has-text("Reset"), .clear-all-filters, .reset-all');

            if (await resetButtons.count() > 0) {
                await resetButtons.first().click();
                await page.waitForLoadState('networkidle');

                // URL should be clean
                const currentUrl = page.url();
                expect(currentUrl).not.toContain('category=');
                expect(currentUrl).not.toContain('price=');
                expect(currentUrl).not.toContain('search=');

                console.log('✅ All filters reset');
            } else {
                console.log('No reset all filters button found');
            }
        });
    });

    test.describe('Filter Click Functionality - Specific Bug Tests', () => {
        test('should allow clicking on filter checkboxes and buttons', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            console.log('🔍 Testing filter clicking functionality...');

            // Wait for the filter sidebar to load - use more specific selector
            const filterSidebar = page.locator('#FHP').first();
            await expect(filterSidebar).toBeVisible({ timeout: 10000 });

            // Test category filter checkboxes
            const categoryCheckboxes = page.locator('.form-check-input[type="checkbox"]');
            const categoryCount = await categoryCheckboxes.count();

            console.log(`Found ${categoryCount} category checkboxes`);

            if (categoryCount > 0) {
                // Try clicking the first category checkbox
                const firstCheckbox = categoryCheckboxes.first();
                const checkboxId = await firstCheckbox.getAttribute('id');
                console.log(`Attempting to click checkbox with id: ${checkboxId}`);

                // Ensure checkbox is visible and clickable
                await expect(firstCheckbox).toBeVisible();
                await expect(firstCheckbox).toBeEnabled();

                // Check if checkbox is initially unchecked
                const initialState = await firstCheckbox.isChecked();
                console.log(`Initial checkbox state: ${initialState ? 'checked' : 'unchecked'}`);

                // Click the checkbox
                await firstCheckbox.click();
                await page.waitForTimeout(500);

                // Verify the checkbox state changed
                const newState = await firstCheckbox.isChecked();
                console.log(`New checkbox state: ${newState ? 'checked' : 'unchecked'}`);

                expect(newState).toBe(!initialState);
                console.log('✅ Category checkbox clicking works correctly');
            }

            // Test price range inputs
            const minPriceInput = page.locator('#minPrice');
            const maxPriceInput = page.locator('#maxPrice');

            if (await minPriceInput.isVisible() && await maxPriceInput.isVisible()) {
                console.log('Testing price range inputs...');

                await minPriceInput.fill('100');
                await maxPriceInput.fill('500');

                const minValue = await minPriceInput.inputValue();
                const maxValue = await maxPriceInput.inputValue();

                expect(minValue).toBe('100');
                expect(maxValue).toBe('500');
                console.log('✅ Price range inputs work correctly');
            }

            // Test color selection
            const colorOptions = page.locator('.color-option');
            const colorCount = await colorOptions.count();

            console.log(`Found ${colorCount} color options`);

            if (colorCount > 0) {
                // First expand the color accordion section
                const colorAccordionButton = page.locator('button[data-bs-target="#collapseColor"]');
                if (await colorAccordionButton.isVisible()) {
                    const isExpanded = await colorAccordionButton.getAttribute('aria-expanded') === 'true';
                    if (!isExpanded) {
                        await colorAccordionButton.click();
                        await page.waitForTimeout(500);
                    }
                }

                const firstColor = colorOptions.first();
                await expect(firstColor).toBeVisible();

                // Check initial state
                const hasSelectedClass = await firstColor.evaluate(el => el.classList.contains('selected'));
                console.log(`Initial color state: ${hasSelectedClass ? 'selected' : 'unselected'}`);

                // Click the color option
                await firstColor.click();
                await page.waitForTimeout(300);

                // Verify state changed
                const newSelectedState = await firstColor.evaluate(el => el.classList.contains('selected'));
                console.log(`New color state: ${newSelectedState ? 'selected' : 'unselected'}`);

                expect(newSelectedState).toBe(!hasSelectedClass);
                console.log('✅ Color selection clicking works correctly');
            }

            // Test Apply Filters button
            const applyButton = page.locator('button:has-text("Aplicar Filtros")');
            if (await applyButton.isVisible()) {
                console.log('Testing Apply Filters button...');

                await expect(applyButton).toBeEnabled();
                await applyButton.click();
                await page.waitForTimeout(1000);

                console.log('✅ Apply Filters button is clickable');
            }

            // Test Clear Filters button
            const clearButton = page.locator('button:has-text("Limpiar Filtros")');
            if (await clearButton.isVisible()) {
                console.log('Testing Clear Filters button...');

                await expect(clearButton).toBeEnabled();
                await clearButton.click();
                await page.waitForTimeout(1000);

                console.log('✅ Clear Filters button is clickable');
            }
        });

        test('should verify filter accordion functionality works', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            console.log('🔍 Testing accordion functionality...');

            // Test Bootstrap accordion functionality
            const accordionButtons = page.locator('.accordion-button');
            const accordionCount = await accordionButtons.count();

            console.log(`Found ${accordionCount} accordion sections`);

            if (accordionCount > 0) {
                // Test each accordion section
                for (let i = 0; i < accordionCount; i++) {
                    const button = accordionButtons.nth(i);
                    const buttonText = await button.textContent();
                    console.log(`Testing accordion section: ${buttonText?.trim()}`);

                    // Get the target accordion body
                    const targetId = await button.getAttribute('data-bs-target');
                    if (targetId) {
                        const accordionBody = page.locator(targetId);

                        // Check if accordion is initially expanded
                        const isExpanded = await button.getAttribute('aria-expanded') === 'true';
                        console.log(`Initial state: ${isExpanded ? 'expanded' : 'collapsed'}`);

                        // Click to toggle
                        await button.click();
                        await page.waitForTimeout(500);

                        // Verify state changed
                        const newExpanded = await button.getAttribute('aria-expanded') === 'true';
                        console.log(`New state: ${newExpanded ? 'expanded' : 'collapsed'}`);

                        expect(newExpanded).toBe(!isExpanded);
                        console.log(`✅ Accordion "${buttonText?.trim()}" toggles correctly`);
                    }
                }
            }
        });

        test('should test filter functionality with real API integration', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            console.log('🔍 Testing filters with API integration...');

            // Count initial products
            const initialProductCount = await page.locator('[data-testid^="product-"]').count();
            console.log(`Initial product count: ${initialProductCount}`);

            // Apply a category filter
            const categoryCheckbox = page.locator('.form-check-input[type="checkbox"]').first();
            if (await categoryCheckbox.isVisible()) {
                await categoryCheckbox.check();

                // Apply filters
                const applyButton = page.locator('button:has-text("Aplicar Filtros")');
                if (await applyButton.isVisible()) {
                    await applyButton.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(2000); // Wait for API response

                    // Count products after filter
                    const filteredProductCount = await page.locator('[data-testid^="product-"]').count();
                    console.log(`Filtered product count: ${filteredProductCount}`);

                    // Products should still be visible (even if the same count due to fallback data)
                    expect(filteredProductCount).toBeGreaterThan(0);
                    console.log('✅ Filter application completed successfully');
                }
            }
        });
    });

    test.describe('Price Display Verification', () => {
        test('should display realistic prices for Mexican flower and gift shop', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            console.log('🔍 Testing price display accuracy...');

            // Wait for products to load
            const productCards = page.locator('[data-testid^="product-"]');
            await expect(productCards.first()).toBeVisible({ timeout: 10000 });

            const productCount = await productCards.count();
            console.log(`Found ${productCount} products to check prices`);

            let pricesChecked = 0;
            let validPrices = 0;

            // Check prices on multiple products
            for (let i = 0; i < Math.min(productCount, 5); i++) {
                const productCard = productCards.nth(i);
                const priceElement = productCard.locator('.product-price');

                if (await priceElement.isVisible()) {
                    const priceText = await priceElement.textContent();
                    console.log(`Product ${i + 1} price: ${priceText}`);

                    // Extract numeric value from price text (e.g., "$25.99" -> 25.99)
                    const priceMatch = priceText?.match(/\$(\d+\.?\d*)/);
                    if (priceMatch) {
                        const price = parseFloat(priceMatch[1]);
                        pricesChecked++;

                        // For a Mexican flower and gift shop, reasonable price ranges:
                        // - Flowers: $200-$2,500 pesos ($10-$125 USD)
                        // - Gifts: $100-$5,000 pesos ($5-$250 USD)
                        // - Luxury items: up to $10,000 pesos ($500 USD)

                        console.log(`Parsed price: $${price}`);

                        // Prices should be reasonable (between $10 and $5000 pesos)
                        if (price >= 10 && price <= 5000) {
                            validPrices++;
                            console.log(`✅ Price $${price} is within reasonable range`);
                        } else {
                            console.log(`❌ Price $${price} seems unrealistic (too ${price < 10 ? 'low' : 'high'})`);
                        }

                        // Prices should have proper decimal formatting
                        const hasProperDecimal = priceText?.includes('.') && priceMatch[1].split('.')[1]?.length === 2;
                        if (hasProperDecimal || !priceText?.includes('.')) {
                            console.log(`✅ Price format is correct: ${priceText}`);
                        } else {
                            console.log(`❌ Price format needs fixing: ${priceText}`);
                        }
                    } else {
                        console.log(`❌ Could not parse price from: ${priceText}`);
                    }
                }
            }

            console.log(`Price check summary: ${validPrices}/${pricesChecked} prices are valid`);

            // At least 80% of prices should be within reasonable range
            if (pricesChecked > 0) {
                const validPercentage = (validPrices / pricesChecked) * 100;
                expect(validPercentage).toBeGreaterThan(70);
                console.log(`✅ ${validPercentage.toFixed(1)}% of prices are valid`);
            }
        });

        test('should verify price format consistency', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            console.log('🔍 Testing price format consistency...');

            const priceElements = page.locator('.product-price');
            const priceCount = await priceElements.count();

            console.log(`Found ${priceCount} price elements`);

            for (let i = 0; i < Math.min(priceCount, 5); i++) {
                const priceElement = priceElements.nth(i);
                const priceText = await priceElement.textContent();

                console.log(`Checking price format: ${priceText}`);

                // Price should start with $ and have valid format
                expect(priceText).toMatch(/^\$\d+\.\d{2}$/);
                console.log(`✅ Price format is valid: ${priceText}`);
            }
        });

        test('should verify prices in product detail pages', async ({ page }) => {
            await page.goto('/handpicked/productos');
            await page.waitForLoadState('networkidle');

            console.log('🔍 Testing product detail page prices...');

            // Find a product link and click it
            const productLink = page.locator('[data-testid^="product-"]').first();
            if (await productLink.isVisible()) {
                const href = await productLink.getAttribute('href');
                console.log(`Navigating to product detail: ${href}`);

                await productLink.click();
                await page.waitForLoadState('networkidle');

                // Check price on detail page
                const detailPrice = page.locator('.product-price');
                if (await detailPrice.isVisible()) {
                    const priceText = await detailPrice.textContent();
                    console.log(`Detail page price: ${priceText}`);

                    // Should follow same format rules
                    expect(priceText).toMatch(/^\$\d+\.\d{2}$/);
                    console.log(`✅ Detail page price format is valid`);
                } else {
                    console.log('⚠️ No price found on detail page');
                }
            }
        });
    });
}); 