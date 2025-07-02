import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";

// Load environment variables
config({ path: ".env.local" });

async function createTestVendor() {
  try {
    // Check if test vendor already exists
    const existingVendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.email, "vendor@luzimarket.shop"))
      .limit(1);

    if (existingVendor.length > 0) {
      console.log("✅ Test vendor already exists");
      return;
    }

    // Create test vendor
    const passwordHash = await bcrypt.hash("password123", 10);
    
    await db.insert(vendors).values({
      businessName: "Test Vendor Shop",
      slug: "test-vendor-shop",
      contactName: "Test Vendor",
      email: "vendor@luzimarket.shop",
      passwordHash,
      phone: "+52 555 123 4567",
      whatsapp: "+52 555 123 4567",
      businessPhone: "+52 555 123 4567",
      businessHours: "Lun-Vie 9:00-18:00",
      street: "Calle Test 123",
      city: "Ciudad de México",
      state: "CDMX",
      country: "México",
      postalCode: "01000",
      websiteUrl: "https://testvendor.com",
      description: "Test vendor for e2e tests",
      hasDelivery: true,
      deliveryService: "own",
      instagramUrl: "@testvendor",
      facebookUrl: "testvendor",
      tiktokUrl: "@testvendor",
      isActive: true
    });

    console.log("✅ Test vendor created successfully");
  } catch (error) {
    console.error("❌ Error creating test vendor:", error);
  } finally {
    process.exit();
  }
}

createTestVendor();