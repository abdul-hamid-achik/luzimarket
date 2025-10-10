"use server";

import { db } from "@/db";
import { vendors, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { createVendorStripeAccount } from "@/lib/actions/stripe-connect.action";
import { logVendorEvent } from "@/lib/audit-helpers";

export async function approveVendor(vendorId: string) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  try {
    // Get vendor details
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1);

    if (!vendor.length) {
      throw new Error("Vendor not found");
    }

    const vendorData = vendor[0];

    // Update vendor status
    await db
      .update(vendors)
      .set({
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, vendorId));

    // Create or update user account for vendor
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, vendorData.email))
      .limit(1);

    if (!existingUser.length && vendorData.passwordHash) {
      // Create new user with vendor role
      await db.insert(users).values({
        email: vendorData.email,
        name: vendorData.contactName,
        passwordHash: vendorData.passwordHash,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
    }

    // Create Stripe Connect account for the vendor
    try {
      const res = await createVendorStripeAccount({
        vendorId: vendorId,
        email: vendorData.email,
        businessName: vendorData.businessName,
        country: "MX",
        type: "express",
      });
      if (!res.success) {
        console.error("Stripe account creation returned error:", res.error);
      }
    } catch (stripeError) {
      // Log the error but don't fail the approval
      console.error("Error creating Stripe account for vendor:", stripeError);
    }

    // Send approval email
    if (process.env.NODE_ENV === 'production' || process.env.SEND_EMAILS === 'true') {
      try {
        const t = await getTranslations('VendorRegistration.approval');
        const tCommon = await getTranslations('VendorRegistration');

        const emailHtml = `
          <h1>${t('title')}</h1>
          <p>${t('greeting', { name: vendorData.contactName })}</p>
          <p>${t('message')}</p>
          <p>${t('accessInfo')}</p>
          <ul>
            <li><strong>${t('email')}:</strong> ${vendorData.email}</li>
            <li><strong>${t('password')}:</strong> ${t('passwordInfo')}</li>
          </ul>
          <p>${t('accessPanel')}: <a href="${process.env.NEXTAUTH_URL}/vendor/dashboard">${t('panelLink')}</a></p>
          <p>${t('questions')}</p>
          <p>${t('welcome')}</p>
        `;

      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
      }
    }

    // Log vendor approval
    await logVendorEvent({
      action: 'approved',
      vendorId: vendorData.id,
      vendorEmail: vendorData.email,
      vendorName: vendorData.businessName,
      adminUserId: session.user.id,
      adminEmail: session.user.email!,
      details: {
        approvedAt: new Date().toISOString(),
        userAccountCreated: !existingUser.length,
      },
    });

    revalidatePath("/admin/vendors");
    return { success: true };
  } catch (error) {
    console.error("Error approving vendor:", error);
    return { success: false, error: "Failed to approve vendor" };
  }
}

export async function rejectVendor(vendorId: string) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  try {
    // Get vendor details
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId))
      .limit(1);

    if (!vendor.length) {
      throw new Error("Vendor not found");
    }

    const vendorData = vendor[0];

    // Update vendor status
    await db
      .update(vendors)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, vendorId));

    // Send rejection email
    if (process.env.NODE_ENV === 'production' || process.env.SEND_EMAILS === 'true') {
      try {
        const t = await getTranslations('VendorRegistration.rejection');

        const emailHtml = `
          <h1>${t('title')}</h1>
          <p>${t('greeting', { name: vendorData.contactName })}</p>
          <p>${t('thanks')}</p>
          <p>${t('decision')}</p>
          <p>${t('reason')}</p>
          <p>${t('invitation')}</p>
          <p>${t('questions')}</p>
          <p>${t('thanks2')}</p>
        `;

      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
      }
    }

    // Log vendor rejection
    await logVendorEvent({
      action: 'rejected',
      vendorId: vendorData.id,
      vendorEmail: vendorData.email,
      vendorName: vendorData.businessName,
      adminUserId: session.user.id,
      adminEmail: session.user.email!,
      details: {
        rejectedAt: new Date().toISOString(),
      },
    });

    revalidatePath("/admin/vendors");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting vendor:", error);
    return { success: false, error: "Failed to reject vendor" };
  }
}