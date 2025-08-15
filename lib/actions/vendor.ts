"use server";

import { db } from "@/db";
import { vendors } from "@/db/schema";
import { vendorRegistrationSchema } from "@/lib/schemas/vendor";
import { revalidatePath } from "next/cache";
import { sendVendorNotification } from "@/lib/email";
import { eq } from "drizzle-orm";
import { generateSlug } from "@/lib/utils/slug";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export async function registerVendor(data: unknown) {
  try {
    const validatedData = vendorRegistrationSchema.parse(data);

    // Check if email already exists
    const existingVendor = await db.select().from(vendors)
      .where(eq(vendors.email, validatedData.email))
      .limit(1);

    if (existingVendor.length > 0) {
      return { success: false, error: "emailExists" };
    }

    // Hash the password before storing
    const { password, ...vendorData } = validatedData;
    const passwordHash = await bcrypt.hash(password, 10);

    const [vendor] = await db.insert(vendors).values({
      ...vendorData,
      passwordHash,
      slug: generateSlug(validatedData.businessName),
      isActive: false, // Vendors need to be approved
    }).returning();

    // Send notification emails
    if (process.env.NODE_ENV === 'production' || process.env.SEND_EMAILS === 'true') {
      try {
        // Notify admin
        await sendVendorNotification({
          vendorEmail: process.env.ADMIN_EMAIL || 'admin@luzimarket.com',
          vendorName: 'Administrador',
          orderNumber: `REG-${vendor.id.slice(0, 8)}`,
          customerName: validatedData.contactName,
          items: [{
            name: 'Nueva solicitud de vendedor',
            quantity: 1,
            price: 0
          }],
          total: 0,
          shippingAddress: {
            street: validatedData.street || '',
            city: validatedData.city || '',
            state: validatedData.state || '',
            postalCode: validatedData.postalCode || ''
          }
        });

        // Send confirmation to vendor
        await sendVendorNotification({
          vendorEmail: validatedData.email,
          vendorName: validatedData.businessName,
          orderNumber: `REG-${vendor.id.slice(0, 8)}`,
          customerName: validatedData.contactName,
          items: [{
            name: 'Solicitud de registro recibida',
            quantity: 1,
            price: 0
          }],
          total: 0
        });
      } catch (emailError) {
        console.error("Error sending notification emails:", emailError);
        // Don't fail the registration if email fails
      }
    }

    revalidatePath("/");

    return { success: true, vendor };
  } catch (error) {
    console.error("Error registering vendor:", error);

    if (error instanceof Error && error.message.includes('unique')) {
      return { success: false, error: "emailExists" };
    }

    return { success: false, error: "tryAgain" };
  }
}

export async function getVendorFromSession() {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.role !== "vendor") {
      return { success: false, error: "Unauthorized" };
    }

    const vendorId = session.user.vendor?.id || session.user.id;
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1);

    if (!vendor.length) {
      return { success: false, error: "Vendor not found" };
    }

    return { success: true, data: vendor[0] };
  } catch (error) {
    console.error("Error getting vendor from session:", error);
    return { success: false, error: "Failed to get vendor information" };
  }
}