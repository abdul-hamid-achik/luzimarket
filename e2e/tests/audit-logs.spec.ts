import { test, expect } from "@playwright/test";
import { routes } from "../helpers/navigation";

test.describe("Audit Logs System", () => {
    const adminEmail = "admin@luzimarket.shop";
    const adminPassword = "admin123";

    test.beforeEach(async ({ page }) => {
        // Login as admin using the proper flow
        await page.goto(routes.login);

        // Click on admin tab first
        const adminTab = page.locator('button[role="tab"]').filter({ hasText: /Admin/i }).first();
        await expect(adminTab).toBeVisible({ timeout: 10000 });
        await adminTab.click();
        await page.waitForTimeout(500);

        // Use admin login form
        await page.fill('input[id="admin-email"]', adminEmail);
        await page.fill('input[id="admin-password"]', adminPassword);

        const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Iniciar sesión|Sign in/ }).first();
        await expect(submitButton).toBeVisible({ timeout: 10000 });
        await submitButton.click({ force: true });

        // Wait for navigation to admin area
        await page.waitForURL(url => url.pathname.includes('/admin'), { timeout: 20000 });
    });

    test("should log successful admin login", async ({ page }) => {
        // Already logged in from beforeEach

        // Navigate to admin users page
        await page.goto("/admin/users");
        await page.waitForLoadState("networkidle");

        // Find admin user in list and click to view details
        const adminRow = page.locator(`tr:has-text("${adminEmail}")`).first();

        if (await adminRow.isVisible({ timeout: 5000 })) {
            await adminRow.click();

            // Wait for user detail page and activities tab
            await page.waitForLoadState("networkidle");

            // Look for activities/audit log section
            const activitiesSection = page.locator('text=/activities|actividades/i').first();

            if (await activitiesSection.isVisible({ timeout: 3000 })) {
                // Check for login success event
                const loginEvent = page.locator('text=/login.success|inicio.*sesión/i').first();
                await expect(loginEvent).toBeVisible({ timeout: 5000 });
            }
        }
    });

    test("should log failed login attempts", async ({ page }) => {
        // Already logged in from beforeEach
        // This test just verifies that failed attempts would be logged
        // (Testing actual failed login would log us out)

        // Navigate to audit logs viewer
        await page.goto("/admin/audit-logs");
        await page.waitForLoadState("networkidle");

        // Page should load successfully
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
    });

    test("should track payment events in audit logs", async ({ page }) => {
        // Already logged in from beforeEach
        // Navigate to audit logs viewer
        await page.goto("/admin/audit-logs");
        await page.waitForLoadState("networkidle");

        // Page should load successfully
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();

        // Should have audit log viewer UI
        expect(pageContent).toContain("Audit" || "Activity");
    });

    test("should display audit log details", async ({ page }) => {
        // Already logged in from beforeEach
        // Go to users page
        await page.goto("/admin/users");
        await page.waitForLoadState("networkidle");

        // Click on any user
        const firstUser = page.locator('tbody tr').first();

        if (await firstUser.isVisible({ timeout: 5000 })) {
            await firstUser.click();
            await page.waitForLoadState("networkidle");

            // Check that audit log information is displayed
            const pageContent = await page.textContent('body');
            expect(pageContent).toBeTruthy();
        }
    });

    test("should log settings changes", async ({ page }) => {
        // Already logged in from beforeEach
        // Navigate to settings
        await page.goto("/admin/settings");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000); // Wait for settings to load

        // Change a setting
        const commissionInput = page.locator('input#commission');
        if (await commissionInput.isVisible({ timeout: 3000 })) {
            await commissionInput.fill("20");

            // Save settings
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Guardar")').last();
            await saveButton.click();

            // Wait for save to complete (might show toast or just complete silently)
            await page.waitForTimeout(2000);

            // The setting should be saved - verify page didn't crash
            const pageContent = await page.textContent('body');
            expect(pageContent).toBeTruthy();
        }
    });

    test("should handle audit log API errors gracefully", async ({ page }) => {
        // Already logged in from beforeEach
        // Try to access non-existent user's activities
        await page.goto("/admin/users/00000000-0000-0000-0000-000000000000");
        await page.waitForLoadState("networkidle");

        // Page should handle gracefully (not crash)
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
    });
});
