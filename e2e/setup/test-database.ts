import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";
import slugify from "slugify";

// Load environment variables
config({ path: ".env.local" });

/**
 * Setup test database with minimal data required for tests to pass
 * This script ensures:
 * 1. Categories exist with the correct names used in UI
 * 2. Test users are properly verified
 * 3. Test vendors exist
 * 4. No images are regenerated if they already exist
 */

// Categories that match the UI (not the seed file)
const TEST_CATEGORIES = [
  {
    name: "Flores & Amores",
    slug: "flores-amores",
    description: "Hermosos arreglos florales para toda ocasión",
    displayOrder: 1
  },
  {
    name: "Dulces & Postres",
    slug: "dulces-postres", 
    description: "Deliciosos dulces y postres gourmet",
    displayOrder: 2
  },
  {
    name: "Eventos & Cenas",
    slug: "eventos-cenas",
    description: "Servicios para eventos especiales y cenas románticas",
    displayOrder: 3
  },
  {
    name: "Tienda de Regalos",
    slug: "tienda-regalos",
    description: "Regalos únicos para toda ocasión",
    displayOrder: 4
  }
];

async function setupTestDatabase() {
  console.log("🧪 Setting up test database...");

  try {
    // 1. Ensure test categories exist
    console.log("📁 Ensuring test categories...");
    for (const categoryData of TEST_CATEGORIES) {
      const existing = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.slug, categoryData.slug))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.categories).values({
          ...categoryData,
          imageUrl: `/placeholder-${categoryData.slug}.jpg` // Use placeholder images
        });
        console.log(`✅ Created category: ${categoryData.name}`);
      } else {
        // Update name to match UI if different
        if (existing[0].name !== categoryData.name) {
          await db
            .update(schema.categories)
            .set({ name: categoryData.name })
            .where(eq(schema.categories.id, existing[0].id));
          console.log(`✅ Updated category name: ${categoryData.name}`);
        }
      }
    }

    // 2. Ensure test users exist with proper verification
    console.log("👤 Ensuring test users...");
    const userPassword = await bcrypt.hash("password123", 10);
    
    const testUsers = [
      {
        email: "customer1@example.com",
        name: "Test Customer",
        passwordHash: userPassword,
        stripeCustomerId: `cus_test_customer1`,
        isActive: true,
        emailVerified: true, // Important for login
        emailVerifiedAt: new Date()
      },
      {
        email: "customer2@example.com", 
        name: "Test Customer 2",
        passwordHash: userPassword,
        stripeCustomerId: `cus_test_customer2`,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    ];

    for (const userData of testUsers) {
      const existing = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, userData.email))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.users).values(userData);
        console.log(`✅ Created verified user: ${userData.email}`);
      } else if (!existing[0].emailVerified) {
        // Update existing user to be verified
        await db
          .update(schema.users)
          .set({ 
            emailVerified: true,
            emailVerifiedAt: new Date(),
            passwordHash: userPassword
          })
          .where(eq(schema.users.id, existing[0].id));
        console.log(`✅ Verified existing user: ${userData.email}`);
      }
    }

    // 3. Ensure test vendor exists
    console.log("🏪 Ensuring test vendor...");
    const vendorPassword = await bcrypt.hash("password123", 10);
    
    const testVendor = {
      businessName: "Test Vendor Shop",
      slug: "test-vendor-shop",
      contactName: "Test Vendor",
      email: "vendor@luzimarket.shop",
      passwordHash: vendorPassword,
      phone: "+52 555 123 4567",
      businessPhone: "+52 555 123 4567",
      businessHours: "Lun-Vie 9:00-18:00",
      street: "Calle Test 123",
      city: "Ciudad de México",
      state: "CDMX",
      country: "México",
      postalCode: "01000",
      description: "Test vendor for e2e tests",
      hasDelivery: true,
      deliveryService: "own" as const,
      isActive: true,
      shippingOriginState: "CDMX"
    };

    const existingVendor = await db
      .select()
      .from(schema.vendors)
      .where(eq(schema.vendors.email, testVendor.email))
      .limit(1);

    if (existingVendor.length === 0) {
      await db.insert(schema.vendors).values(testVendor);
      console.log(`✅ Created test vendor: ${testVendor.email}`);
    } else {
      // Ensure vendor is active
      await db
        .update(schema.vendors)
        .set({ isActive: true, passwordHash: vendorPassword })
        .where(eq(schema.vendors.id, existingVendor[0].id));
      console.log(`✅ Updated test vendor: ${testVendor.email}`);
    }

    // 4. Ensure admin user exists
    console.log("👮 Ensuring admin user...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    
    const adminUser = {
      email: "admin@luzimarket.shop",
      name: "Administrador Principal",
      passwordHash: adminPassword,
      role: "super_admin" as const,
      isActive: true
    };

    const existingAdmin = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, adminUser.email))
      .limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(schema.adminUsers).values(adminUser);
      console.log(`✅ Created admin user: ${adminUser.email}`);
    } else {
      // Update password in case it changed
      await db
        .update(schema.adminUsers)
        .set({ 
          passwordHash: adminPassword,
          isActive: true
        })
        .where(eq(schema.adminUsers.id, existingAdmin[0].id));
      console.log(`✅ Updated admin user: ${adminUser.email}`);
    }

    console.log("\n✅ Test database setup completed!");
    console.log("\n🔐 Test credentials:");
    console.log("Admin: admin@luzimarket.shop / admin123");
    console.log("Vendor: vendor@luzimarket.shop / password123");
    console.log("Customer: customer1@example.com / password123");

  } catch (error) {
    console.error("❌ Test database setup failed:", error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupTestDatabase().then(() => process.exit(0));
}

export { setupTestDatabase };