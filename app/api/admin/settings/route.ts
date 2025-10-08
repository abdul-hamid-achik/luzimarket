import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { AuditLogger } from "@/lib/middleware/security";
import { headers } from "next/headers";

const settingsSchema = z.object({
    // General settings
    siteName: z.string().optional(),
    adminEmail: z.string().email().optional(),
    maintenanceMode: z.boolean().optional(),

    // Payment settings
    platformCommission: z.number().min(0).max(100).optional(),
    testMode: z.boolean().optional(),

    // Email settings
    fromEmail: z.string().email().optional(),
    fromName: z.string().optional(),
    orderNotifications: z.boolean().optional(),

    // Shipping settings
    defaultShippingCost: z.number().min(0).optional(),
    freeShippingThreshold: z.number().min(0).optional(),
    automaticCalculation: z.boolean().optional(),

    // Localization
    defaultLocale: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
});

// Helper function to get or create setting
async function getOrCreateSetting(key: string, defaultValue: any, category: string, description?: string) {
    const existing = await db
        .select()
        .from(platformSettings)
        .where(eq(platformSettings.key, key))
        .limit(1);

    if (existing.length > 0) {
        return existing[0];
    }

    // Create default setting
    const [newSetting] = await db
        .insert(platformSettings)
        .values({
            key,
            value: defaultValue,
            category,
            description,
        })
        .returning();

    return newSetting;
}

// GET - Fetch all settings
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Define default settings
        const defaultSettings = {
            // General
            siteName: { value: "Luzimarket", category: "general", description: "Site name" },
            adminEmail: { value: process.env.ADMIN_EMAIL || "admin@luzimarket.shop", category: "general", description: "Admin email" },
            maintenanceMode: { value: false, category: "general", description: "Maintenance mode" },

            // Payment
            platformCommission: { value: parseFloat(process.env.PLATFORM_COMMISSION_RATE || "15"), category: "payment", description: "Platform commission percentage" },
            testMode: { value: true, category: "payment", description: "Payment test mode" },

            // Email
            fromEmail: { value: process.env.EMAIL_FROM || "noreply@luzimarket.shop", category: "email", description: "From email address" },
            fromName: { value: "Luzimarket", category: "email", description: "From name" },
            orderNotifications: { value: true, category: "email", description: "Send order notifications" },

            // Shipping
            defaultShippingCost: { value: parseFloat(process.env.DEFAULT_SHIPPING_COST || "99"), category: "shipping", description: "Default shipping cost" },
            freeShippingThreshold: { value: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || "599"), category: "shipping", description: "Free shipping threshold" },
            automaticCalculation: { value: false, category: "shipping", description: "Automatic shipping calculation" },

            // Localization
            defaultLocale: { value: "es", category: "localization", description: "Default language" },
            timezone: { value: "America/Mexico_City", category: "localization", description: "Timezone" },
            currency: { value: "MXN", category: "localization", description: "Currency" },
        };

        // Get or create all settings
        const settingsPromises = Object.entries(defaultSettings).map(([key, config]) =>
            getOrCreateSetting(key, config.value, config.category, config.description)
        );

        const settingsArray = await Promise.all(settingsPromises);

        // Convert to key-value object
        const settings: Record<string, any> = {};
        settingsArray.forEach((setting) => {
            settings[setting.key] = setting.value;
        });

        return NextResponse.json({ settings });
    } catch (error: any) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = settingsSchema.parse(body);

        // Update each setting
        const updates = Object.entries(validated).filter(([_, value]) => value !== undefined);

        for (const [key, value] of updates) {
            // Check if setting exists
            const existing = await db
                .select()
                .from(platformSettings)
                .where(eq(platformSettings.key, key))
                .limit(1);

            if (existing.length > 0) {
                // Update existing
                await db
                    .update(platformSettings)
                    .set({
                        value: value as any,
                        updatedBy: session.user.id,
                        updatedAt: new Date(),
                    })
                    .where(eq(platformSettings.key, key));
            } else {
                // Create new
                const category =
                    ["siteName", "adminEmail", "maintenanceMode"].includes(key) ? "general" :
                        ["platformCommission", "testMode"].includes(key) ? "payment" :
                            ["fromEmail", "fromName", "orderNotifications"].includes(key) ? "email" :
                                ["defaultShippingCost", "freeShippingThreshold", "automaticCalculation"].includes(key) ? "shipping" :
                                    "localization";

                await db.insert(platformSettings).values({
                    key,
                    value: value as any,
                    category,
                    updatedBy: session.user.id,
                });
            }
        }

        // Log the settings update
        const headersList = await headers();
        await AuditLogger.log({
            action: "settings.update",
            category: "admin",
            severity: "info",
            userId: session.user.id,
            userType: "admin",
            userEmail: session.user.email || undefined,
            ip: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown",
            userAgent: headersList.get("user-agent") || undefined,
            details: {
                updatedSettings: Object.keys(validated),
                updateCount: updates.length,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Settings updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating settings:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid settings data", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to update settings" },
            { status: 500 }
        );
    }
}
