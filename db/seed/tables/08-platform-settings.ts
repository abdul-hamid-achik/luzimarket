import { db } from "../../index";
import { platformSettings } from "../../schema";
import { SeedLogger } from "../utils/logger";

const logger = new SeedLogger();

export async function seedPlatformSettings() {
    logger.info("Seeding platform settings", true);

    const defaultSettings = [
        // General Settings
        {
            key: "siteName",
            value: "Luzimarket",
            category: "general",
            description: "Site name displayed across the platform",
        },
        {
            key: "adminEmail",
            value: process.env.ADMIN_EMAIL || "admin@luzimarket.shop",
            category: "general",
            description: "Admin notification email address",
        },
        {
            key: "maintenanceMode",
            value: false,
            category: "general",
            description: "Enable maintenance mode (disables public access)",
        },

        // Payment Settings
        {
            key: "platformCommission",
            value: parseFloat(process.env.PLATFORM_COMMISSION_RATE || "15"),
            category: "payment",
            description: "Platform commission percentage",
        },
        {
            key: "testMode",
            value: process.env.NODE_ENV !== "production",
            category: "payment",
            description: "Payment test mode enabled",
        },

        // Email Settings
        {
            key: "fromEmail",
            value: process.env.EMAIL_FROM || "noreply@luzimarket.shop",
            category: "email",
            description: "Default from email address",
        },
        {
            key: "fromName",
            value: "Luzimarket",
            category: "email",
            description: "Default from name for emails",
        },
        {
            key: "orderNotifications",
            value: true,
            category: "email",
            description: "Send order notification emails",
        },

        // Shipping Settings
        {
            key: "defaultShippingCost",
            value: parseFloat(process.env.DEFAULT_SHIPPING_COST || "99"),
            category: "shipping",
            description: "Default shipping cost (MXN)",
        },
        {
            key: "freeShippingThreshold",
            value: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || "1000"),
            category: "shipping",
            description: "Free shipping threshold amount (MXN)",
        },
        {
            key: "automaticCalculation",
            value: false,
            category: "shipping",
            description: "Enable automatic shipping cost calculation",
        },

        // Localization Settings
        {
            key: "defaultLocale",
            value: "es",
            category: "localization",
            description: "Default language (es or en)",
        },
        {
            key: "timezone",
            value: "America/Mexico_City",
            category: "localization",
            description: "Default timezone",
        },
        {
            key: "currency",
            value: "MXN",
            category: "localization",
            description: "Default currency",
        },
    ];

    // Insert all default settings
    for (const setting of defaultSettings) {
        await db
            .insert(platformSettings)
            .values(setting as any)
            .onConflictDoNothing();
    }

    logger.info(`${defaultSettings.length} platform settings seeded`, true);
}
