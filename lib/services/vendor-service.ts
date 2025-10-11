"use server";

import { db } from "@/db";
import { vendors, users, vendorBalances, orders, products } from "@/db/schema";
import { eq, desc, or, ilike, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { vendorRegistrationSchema } from "@/lib/schemas/vendor";
import { updateVendorProfileSchema } from "@/lib/services/validation-service";
import { sendEmail } from "@/lib/email";
import { generateSlug } from "@/lib/utils/slug";
import { logVendorEvent } from "@/lib/audit-helpers";
import { createVendorStripeAccount } from "@/lib/actions/stripe-connect.action";

/**
 * VendorService
 * Centralized service for vendor management operations
 * Handles vendor registration, approval, profile management
 */

export async function registerVendor(data: unknown): Promise<{
    success: boolean;
    vendor?: any;
    error?: string;
}> {
    try {
        const validatedData = vendorRegistrationSchema.parse(data);

        // Check if email already exists
        const existingVendor = await db.query.vendors.findFirst({
            where: eq(vendors.email, validatedData.email),
        });

        if (existingVendor) {
            return { success: false, error: "El correo electrónico ya está registrado" };
        }

        // Hash the password
        const { password, ...vendorData } = validatedData;
        const passwordHash = await bcrypt.hash(password, 10);

        // Create vendor
        const [vendor] = await db.insert(vendors).values({
            ...vendorData,
            passwordHash,
            slug: generateSlug(validatedData.businessName),
            isActive: false, // Vendors need to be approved by admin
        }).returning();

        // Create vendor balance record
        await db.insert(vendorBalances).values({
            vendorId: vendor.id,
            availableBalance: "0",
            pendingBalance: "0",
            reservedBalance: "0",
        });

        // Send notification emails
        try {
            // Notify admin
            if (process.env.ADMIN_EMAIL) {
                await sendEmail({
                    to: process.env.ADMIN_EMAIL,
                    subject: `Nueva solicitud de vendedor: ${validatedData.businessName}`,
                    html: `
            <h2>Nueva solicitud de vendedor</h2>
            <p><strong>Negocio:</strong> ${validatedData.businessName}</p>
            <p><strong>Contacto:</strong> ${validatedData.contactName}</p>
            <p><strong>Email:</strong> ${validatedData.email}</p>
            <p><strong>Teléfono:</strong> ${validatedData.businessPhone}</p>
            <p><strong>Ciudad:</strong> ${validatedData.city}, ${validatedData.state}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/vendors/${vendor.id}">Revisar solicitud</a></p>
          `,
                });
            }

            // Send confirmation to vendor
            await sendEmail({
                to: validatedData.email,
                subject: `Solicitud de registro recibida - ${validatedData.businessName}`,
                html: `
          <h2>¡Solicitud recibida!</h2>
          <p>Hola ${validatedData.contactName},</p>
          <p>Hemos recibido tu solicitud para unirte a Luzimarket como vendedor. Nuestro equipo la revisará pronto.</p>
          <p>Te notificaremos por correo cuando tu cuenta sea aprobada.</p>
          <p><strong>Información registrada:</strong></p>
          <ul>
            <li>Negocio: ${validatedData.businessName}</li>
            <li>Email: ${validatedData.email}</li>
            <li>Ciudad: ${validatedData.city}, ${validatedData.state}</li>
          </ul>
          <p>Gracias por tu interés en Luzimarket.</p>
        `,
            });
        } catch (emailError) {
            console.error("Error sending notification emails:", emailError);
            // Don't fail the registration if email fails
        }

        // Log vendor registration
        await logVendorEvent({
            action: 'registered',
            vendorId: vendor.id,
            vendorEmail: vendor.email,
            vendorName: vendor.businessName,
            details: {
                registeredAt: new Date().toISOString(),
                city: validatedData.city,
                state: validatedData.state,
            },
        });

        return { success: true, vendor };
    } catch (error: any) {
        console.error("Error registering vendor:", error);

        if (error.message && error.message.includes('unique')) {
            return { success: false, error: "El correo electrónico ya está registrado" };
        }

        return { success: false, error: error.message || "Error al registrar el vendedor" };
    }
}

export async function approveVendor(vendorId: string, adminUserId: string, adminEmail: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Get vendor details
        const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, vendorId),
        });

        if (!vendor) {
            return { success: false, error: "Vendedor no encontrado" };
        }

        // Update vendor status
        await db
            .update(vendors)
            .set({
                isActive: true,
                updatedAt: new Date(),
            })
            .where(eq(vendors.id, vendorId));

        // Create Stripe Connect account for the vendor
        try {
            const res = await createVendorStripeAccount({
                vendorId: vendorId,
                email: vendor.email,
                businessName: vendor.businessName,
                country: "MX",
                type: "express",
            });

            if (!res.success) {
                console.error("Stripe account creation returned error:", res.error);
            }
        } catch (stripeError) {
            console.error("Error creating Stripe account for vendor:", stripeError);
            // Log but don't fail the approval
        }

        // Send approval email
        try {
            await sendEmail({
                to: vendor.email,
                subject: '¡Tu cuenta ha sido aprobada! - Luzimarket',
                html: `
          <h2>¡Cuenta aprobada!</h2>
          <p>Hola ${vendor.contactName},</p>
          <p>¡Excelentes noticias! Tu solicitud para vender en Luzimarket ha sido aprobada.</p>
          <p><strong>Información de acceso:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${vendor.email}</li>
            <li><strong>Contraseña:</strong> La que configuraste durante el registro</li>
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/dashboard">Acceder al panel de vendedor</a></p>
          <p>Ya puedes comenzar a subir tus productos y gestionar tus ventas.</p>
          <p>¡Bienvenido a Luzimarket!</p>
        `,
            });
        } catch (emailError) {
            console.error("Error sending approval email:", emailError);
        }

        // Log vendor approval
        await logVendorEvent({
            action: 'approved',
            vendorId: vendor.id,
            vendorEmail: vendor.email,
            vendorName: vendor.businessName,
            adminUserId,
            adminEmail,
            details: {
                approvedAt: new Date().toISOString(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error approving vendor:", error);
        return { success: false, error: "Error al aprobar el vendedor" };
    }
}

export async function rejectVendor(vendorId: string, adminUserId: string, adminEmail: string, reason?: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Get vendor details
        const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, vendorId),
        });

        if (!vendor) {
            return { success: false, error: "Vendedor no encontrado" };
        }

        // Update vendor status
        await db
            .update(vendors)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(vendors.id, vendorId));

        // Send rejection email
        try {
            await sendEmail({
                to: vendor.email,
                subject: 'Actualización sobre tu solicitud - Luzimarket',
                html: `
          <h2>Actualización de solicitud</h2>
          <p>Hola ${vendor.contactName},</p>
          <p>Gracias por tu interés en vender en Luzimarket.</p>
          <p>Lamentamos informarte que en este momento no podemos aprobar tu solicitud.</p>
          ${reason ? `<p><strong>Razón:</strong> ${reason}</p>` : ''}
          <p>Te invitamos a postularte nuevamente en el futuro.</p>
          <p>Si tienes preguntas, no dudes en contactarnos.</p>
          <p>Gracias por tu comprensión.</p>
        `,
            });
        } catch (emailError) {
            console.error("Error sending rejection email:", emailError);
        }

        // Log vendor rejection
        await logVendorEvent({
            action: 'rejected',
            vendorId: vendor.id,
            vendorEmail: vendor.email,
            vendorName: vendor.businessName,
            adminUserId,
            adminEmail,
            details: {
                rejectedAt: new Date().toISOString(),
                reason: reason || 'Not specified',
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error rejecting vendor:", error);
        return { success: false, error: "Error al rechazar el vendedor" };
    }
}

export async function updateVendorProfile(vendorId: string, data: unknown): Promise<{
    success: boolean;
    vendor?: any;
    error?: string;
}> {
    try {
        const validatedData = updateVendorProfileSchema.parse(data);

        const [updated] = await db
            .update(vendors)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(vendors.id, vendorId))
            .returning();

        if (!updated) {
            return { success: false, error: "Error al actualizar el perfil" };
        }

        // Log profile update
        await logVendorEvent({
            action: 'profile_updated',
            vendorId: updated.id,
            vendorEmail: updated.email,
            vendorName: updated.businessName,
            details: {
                updatedAt: new Date().toISOString(),
                updatedFields: Object.keys(validatedData),
            },
        });

        return { success: true, vendor: updated };
    } catch (error: any) {
        console.error("Error updating vendor profile:", error);
        return { success: false, error: error.message || "Error al actualizar el perfil" };
    }
}

export async function getVendorDetails(vendorId: string) {
    try {
        const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, vendorId),
        });

        if (!vendor) {
            return { success: false, error: "Vendedor no encontrado" };
        }

        // Remove sensitive fields
        const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...vendorData } = vendor;

        return { success: true, vendor: vendorData };
    } catch (error) {
        console.error("Error getting vendor details:", error);
        return { success: false, error: "Error al obtener detalles del vendedor" };
    }
}

export async function deactivateVendor(vendorId: string, adminUserId: string, adminEmail: string, reason?: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, vendorId),
        });

        if (!vendor) {
            return { success: false, error: "Vendedor no encontrado" };
        }

        await db
            .update(vendors)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(eq(vendors.id, vendorId));

        // Log deactivation
        await logVendorEvent({
            action: 'deactivated',
            vendorId: vendor.id,
            vendorEmail: vendor.email,
            vendorName: vendor.businessName,
            adminUserId,
            adminEmail,
            details: {
                deactivatedAt: new Date().toISOString(),
                reason: reason || 'Not specified',
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error deactivating vendor:", error);
        return { success: false, error: "Error al desactivar el vendedor" };
    }
}

export async function getVendorStatistics(vendorId: string) {
    try {
        const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, vendorId),
        });

        if (!vendor) {
            return { success: false, error: "Vendedor no encontrado" };
        }

        // Get vendor balance
        const balance = await db.query.vendorBalances.findFirst({
            where: eq(vendorBalances.vendorId, vendorId),
        });

    // Get product count
    const productStats = await db
      .select({
        totalProducts: sql<number>`count(*)`,
        activeProducts: sql<number>`count(*) filter (where is_active = true)`,
      })
      .from(products)
      .where(eq(products.vendorId, vendorId));

    // Get order statistics
    const orderStats = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(cast(total as decimal))`,
        pendingOrders: sql<number>`count(*) filter (where status = 'pending')`,
        processingOrders: sql<number>`count(*) filter (where status = 'processing')`,
      })
      .from(orders)
      .where(eq(orders.vendorId, vendorId));

        return {
            success: true,
            statistics: {
                balance: {
                    available: balance?.availableBalance || "0",
                    pending: balance?.pendingBalance || "0",
                    reserved: balance?.reservedBalance || "0",
                },
                products: productStats[0] || { totalProducts: 0, activeProducts: 0 },
                orders: orderStats[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, processingOrders: 0 },
            },
        };
    } catch (error) {
        console.error("Error getting vendor statistics:", error);
        return { success: false, error: "Error al obtener estadísticas del vendedor" };
    }
}

export async function listVendors(filters?: {
    search?: string;
    status?: 'active' | 'inactive' | 'pending' | 'all';
    page?: number;
    limit?: number;
}) {
    try {
        const { search, status = 'all', page = 1, limit = 20 } = filters || {};
        const offset = (page - 1) * limit;

        const conditions = [];

        if (status === 'active') {
            conditions.push(eq(vendors.isActive, true));
        } else if (status === 'inactive') {
            conditions.push(eq(vendors.isActive, false));
        } else if (status === 'pending') {
            conditions.push(eq(vendors.isActive, false));
        }

        if (search) {
            conditions.push(
                or(
                    ilike(vendors.businessName, `%${search}%`),
                    ilike(vendors.email, `%${search}%`),
                    ilike(vendors.contactName, `%${search}%`)
                )
            );
        }

        const vendorsList = await db
            .select({
                id: vendors.id,
                businessName: vendors.businessName,
                contactName: vendors.contactName,
                email: vendors.email,
                phone: vendors.phone,
                city: vendors.city,
                state: vendors.state,
                isActive: vendors.isActive,
                createdAt: vendors.createdAt,
            })
            .from(vendors)
            .where(conditions.length > 0 ? sql`${conditions.join(' AND ')}` : undefined)
            .orderBy(desc(vendors.createdAt))
            .limit(limit)
            .offset(offset);

        return { success: true, vendors: vendorsList, total: vendorsList.length };
    } catch (error) {
        console.error("Error listing vendors:", error);
        return { success: false, error: "Error al listar vendedores", vendors: [], total: 0 };
    }
}

