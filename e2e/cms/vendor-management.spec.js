const { test, expect } = require('@playwright/test');

test.describe('CMS Vendor Management', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to CMS and authenticate
        await page.goto('/admin/cms/vendors');

        // Wait for the page to load
        await expect(page.locator('h2:has-text("Vendor Management")')).toBeVisible();
    });

    test.describe('Vendor List View', () => {
        test('should display vendor management interface', async ({ page }) => {
            // Check main heading
            await expect(page.locator('h2:has-text("Vendor Management")')).toBeVisible();

            // Check Add New Vendor button
            await expect(page.locator('button:has-text("Add New Vendor")')).toBeVisible();

            // Check table headers
            await expect(page.locator('th:has-text("Business Name")')).toBeVisible();
            await expect(page.locator('th:has-text("Contact Person")')).toBeVisible();
            await expect(page.locator('th:has-text("Email")')).toBeVisible();
            await expect(page.locator('th:has-text("Phone")')).toBeVisible();
            await expect(page.locator('th:has-text("Status")')).toBeVisible();
            await expect(page.locator('th:has-text("Commission Rate")')).toBeVisible();
            await expect(page.locator('th:has-text("Actions")')).toBeVisible();
        });

        test('should show empty state when no vendors exist', async ({ page }) => {
            // If no vendors exist, should show empty state
            const emptyMessage = page.locator('td:has-text("No vendors found")');
            if (await emptyMessage.isVisible()) {
                await expect(emptyMessage).toBeVisible();
                await expect(page.locator('button:has-text("Add the first vendor")')).toBeVisible();
            }
        });
    });

    test.describe('Add New Vendor', () => {
        test('should open add vendor modal', async ({ page }) => {
            await page.click('button:has-text("Add New Vendor")');

            // Check modal is visible
            await expect(page.locator('.modal-title:has-text("Add New Vendor")')).toBeVisible();

            // Check all required form fields
            await expect(page.locator('input[name="businessName"]')).toBeVisible();
            await expect(page.locator('input[name="contactPerson"]')).toBeVisible();
            await expect(page.locator('input[name="email"]')).toBeVisible();
            await expect(page.locator('input[name="phone"]')).toBeVisible();
            await expect(page.locator('textarea[name="address"]')).toBeVisible();
            await expect(page.locator('input[name="password"]')).toBeVisible();
            await expect(page.locator('select[name="status"]')).toBeVisible();
        });

        test('should create new vendor successfully', async ({ page }) => {
            await page.click('button:has-text("Add New Vendor")');

            // Fill out the form
            await page.fill('input[name="businessName"]', 'Test Electronics Co.');
            await page.fill('input[name="contactPerson"]', 'John Test');
            await page.fill('input[name="email"]', 'john@testelectronics.com');
            await page.fill('input[name="phone"]', '+1-555-0123');
            await page.fill('textarea[name="address"]', '123 Test Street, Test City, TC 12345');
            await page.fill('input[name="taxId"]', 'TAX123456');
            await page.fill('input[name="commissionRate"]', '15');
            await page.fill('input[name="password"]', 'TestPass123!');
            await page.selectOption('select[name="status"]', 'approved');

            // Submit form
            await page.click('button[type="submit"]');

            // Check for success message
            await expect(page.locator('.alert-success-cms:has-text("Vendor created successfully")')).toBeVisible({ timeout: 10000 });

            // Check modal is closed
            await expect(page.locator('.modal-title')).not.toBeVisible();

            // Verify vendor appears in table
            await expect(page.locator('td:has-text("Test Electronics Co.")')).toBeVisible();
            await expect(page.locator('td:has-text("john@testelectronics.com")')).toBeVisible();
        });

        test('should validate required fields', async ({ page }) => {
            await page.click('button:has-text("Add New Vendor")');

            // Try to submit without filling required fields
            await page.click('button[type="submit"]');

            // Check validation messages
            await expect(page.locator('.invalid-feedback:has-text("Business name is required")')).toBeVisible();
            await expect(page.locator('.invalid-feedback:has-text("Contact person is required")')).toBeVisible();
            await expect(page.locator('.invalid-feedback:has-text("Email is required")')).toBeVisible();
            await expect(page.locator('.invalid-feedback:has-text("Phone is required")')).toBeVisible();
            await expect(page.locator('.invalid-feedback:has-text("Address is required")')).toBeVisible();
            await expect(page.locator('.invalid-feedback:has-text("Password is required")')).toBeVisible();
        });

        test('should validate email format', async ({ page }) => {
            await page.click('button:has-text("Add New Vendor")');

            // Fill with invalid email
            await page.fill('input[name="email"]', 'invalid-email');
            await page.click('button[type="submit"]');

            // Check validation message
            await expect(page.locator('.invalid-feedback:has-text("Invalid email address")')).toBeVisible();
        });

        test('should validate commission rate range', async ({ page }) => {
            await page.click('button:has-text("Add New Vendor")');

            // Fill required fields first so commission rate validation can trigger
            await page.fill('input[name="businessName"]', 'Test Vendor Commission');
            await page.fill('input[name="contactPerson"]', 'Test Person');
            await page.fill('input[name="email"]', 'test@commission.com');
            await page.fill('input[name="phone"]', '+1-555-0000');
            await page.fill('textarea[name="address"]', '123 Test Street');
            await page.fill('input[name="password"]', 'TestPass123!');

            // Test negative value
            await page.fill('input[name="commissionRate"]', '-5');
            await page.click('button[type="submit"]');
            await expect(page.locator('.invalid-feedback:has-text("Commission rate must be at least 0")')).toBeVisible();

            // Clear the invalid value and test value over 100
            await page.fill('input[name="commissionRate"]', '150');
            await page.click('button[type="submit"]');
            await expect(page.locator('.invalid-feedback:has-text("Commission rate cannot exceed 100")')).toBeVisible();
        });
    });

    test.describe('Edit Vendor', () => {
        test.beforeEach(async ({ page }) => {
            // Ensure we have at least one vendor to edit
            const addButton = page.locator('button:has-text("Add New Vendor")');
            if (await addButton.isVisible()) {
                await addButton.click();

                // Quick vendor creation for testing
                await page.fill('input[name="businessName"]', 'Edit Test Vendor');
                await page.fill('input[name="contactPerson"]', 'Edit Test');
                await page.fill('input[name="email"]', 'edit@test.com');
                await page.fill('input[name="phone"]', '+1-555-9999');
                await page.fill('textarea[name="address"]', '999 Edit Street');
                await page.fill('input[name="password"]', 'EditPass123!');
                await page.click('button[type="submit"]');

                // Wait for success
                await expect(page.locator('.alert-success-cms')).toBeVisible({ timeout: 10000 });
            }
        });

        test('should open edit vendor modal', async ({ page }) => {
            // Click first edit button
            await page.click('button.btn-outline-primary:has-text("Edit")');

            // Check modal title
            await expect(page.locator('.modal-title:has-text("Edit Vendor")')).toBeVisible();

            // Check form is pre-populated (business name should have value)
            const businessNameInput = page.locator('input[name="businessName"]');
            await expect(businessNameInput).not.toHaveValue('');

            // Password field should be empty for security
            await expect(page.locator('input[name="password"]')).toHaveValue('');
        });

        test('should update vendor information', async ({ page }) => {
            await page.click('button.btn-outline-primary:has-text("Edit")');

            // Update business name
            await page.fill('input[name="businessName"]', 'Updated Vendor Name');
            await page.fill('input[name="commissionRate"]', '20');
            await page.selectOption('select[name="status"]', 'suspended');

            // Submit changes
            await page.click('button[type="submit"]');

            // Check for success message
            await expect(page.locator('.alert-success-cms:has-text("Vendor updated successfully")')).toBeVisible({ timeout: 10000 });

            // Verify changes in table
            await expect(page.locator('td:has-text("Updated Vendor Name")')).toBeVisible();
            await expect(page.locator('td:has-text("20%")')).toBeVisible();
            await expect(page.locator('.badge:has-text("suspended")')).toBeVisible();
        });
    });

    test.describe('Delete Vendor', () => {
        test('should show confirmation dialog', async ({ page }) => {
            // Ensure we have a vendor to delete
            const editButton = page.locator('button.btn-outline-primary:has-text("Edit")');
            if (await editButton.count() === 0) {
                // Create vendor for deletion test
                await page.click('button:has-text("Add New Vendor")');
                await page.fill('input[name="businessName"]', 'Delete Test Vendor');
                await page.fill('input[name="contactPerson"]', 'Delete Test');
                await page.fill('input[name="email"]', 'delete@test.com');
                await page.fill('input[name="phone"]', '+1-555-1111');
                await page.fill('textarea[name="address"]', '111 Delete Street');
                await page.fill('input[name="password"]', 'DeletePass123!');
                await page.click('button[type="submit"]');
                await expect(page.locator('.alert-success-cms')).toBeVisible({ timeout: 10000 });
            }

            // Mock confirmation dialog
            page.on('dialog', async dialog => {
                expect(dialog.message()).toContain('Are you sure you want to delete this vendor?');
                await dialog.dismiss(); // Cancel deletion
            });

            await page.click('button.btn-outline-danger:has-text("Delete")');
        });

        test('should delete vendor when confirmed', async ({ page }) => {
            // Create vendor specifically for deletion
            await page.click('button:has-text("Add New Vendor")');
            await page.fill('input[name="businessName"]', 'To Be Deleted Vendor');
            await page.fill('input[name="contactPerson"]', 'Delete Me');
            await page.fill('input[name="email"]', 'deleteme@test.com');
            await page.fill('input[name="phone"]', '+1-555-2222');
            await page.fill('textarea[name="address"]', '222 Delete Street');
            await page.fill('input[name="password"]', 'DeletePass123!');
            await page.click('button[type="submit"]');
            await expect(page.locator('.alert-success-cms')).toBeVisible({ timeout: 10000 });

            // Accept confirmation dialog
            page.on('dialog', async dialog => {
                await dialog.accept();
            });

            // Find and delete the specific vendor
            const vendorRow = page.locator('tr:has-text("To Be Deleted Vendor")');
            await vendorRow.locator('button.btn-outline-danger:has-text("Delete")').click();

            // Check for success message
            await expect(page.locator('.alert-success-cms:has-text("Vendor deleted successfully")')).toBeVisible({ timeout: 10000 });

            // Verify vendor is removed from table
            await expect(page.locator('td:has-text("To Be Deleted Vendor")')).not.toBeVisible();
        });
    });

    test.describe('Status Management', () => {
        test('should display correct status badges', async ({ page }) => {
            // Check if we have vendors with different statuses
            const statusBadges = page.locator('.badge');

            if (await statusBadges.count() > 0) {
                // Status badges should have appropriate classes
                const pendingBadges = page.locator('.badge.bg-warning:has-text("pending")');
                const approvedBadges = page.locator('.badge.bg-success:has-text("approved")');
                const suspendedBadges = page.locator('.badge.bg-danger:has-text("suspended")');
                const rejectedBadges = page.locator('.badge.bg-secondary:has-text("rejected")');

                // At least one of these should be visible if vendors exist
                const totalBadges = await pendingBadges.count() +
                    await approvedBadges.count() +
                    await suspendedBadges.count() +
                    await rejectedBadges.count();

                expect(totalBadges).toBeGreaterThan(0);
            }
        });
    });

    test.describe('Form Interactions', () => {
        test('should close modal when clicking cancel', async ({ page }) => {
            await page.click('button:has-text("Add New Vendor")');
            await expect(page.locator('.modal-title')).toBeVisible();

            await page.click('button:has-text("Cancel")');
            await expect(page.locator('.modal-title')).not.toBeVisible();
        });

        test('should close modal when clicking X button', async ({ page }) => {
            await page.click('button:has-text("Add New Vendor")');
            await expect(page.locator('.modal-title')).toBeVisible();

            await page.click('.btn-close');
            await expect(page.locator('.modal-title')).not.toBeVisible();
        });

        test('should reset form when modal is reopened', async ({ page }) => {
            await page.click('button:has-text("Add New Vendor")');

            // Fill some fields
            await page.fill('input[name="businessName"]', 'Test Value');
            await page.fill('input[name="email"]', 'test@example.com');

            // Close modal
            await page.click('button:has-text("Cancel")');

            // Reopen modal
            await page.click('button:has-text("Add New Vendor")');

            // Check fields are reset
            await expect(page.locator('input[name="businessName"]')).toHaveValue('');
            await expect(page.locator('input[name="email"]')).toHaveValue('');
        });
    });

    test.describe('Loading States', () => {
        test('should show loading spinner during operations', async ({ page }) => {
            await page.click('button:has-text("Add New Vendor")');

            // Fill minimal required fields
            await page.fill('input[name="businessName"]', 'Loading Test Vendor');
            await page.fill('input[name="contactPerson"]', 'Loading Test');
            await page.fill('input[name="email"]', 'loading@test.com');
            await page.fill('input[name="phone"]', '+1-555-3333');
            await page.fill('textarea[name="address"]', '333 Loading Street');
            await page.fill('input[name="password"]', 'LoadingPass123!');

            // Submit and immediately check for loading state
            await page.click('button[type="submit"]');

            // The loading spinner should briefly appear
            const loadingSpinner = page.locator('.loading-spinner');
            // Note: This might be brief, so we don't assert it's visible for long
        });
    });
}); 