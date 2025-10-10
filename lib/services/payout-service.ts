"use server";

import { db } from "@/db";
import { payouts, vendorBalances, vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuditLogger } from "@/lib/middleware/security";
import { sendEmail } from "@/lib/email";

/**
 * Payout Service
 * Tracks vendor payout status and sends notifications
 */

/**
 * Sync payout status from Stripe webhook
 */
export async function syncPayoutStatus(
    stripePayoutId: string,
    status: 'pending' | 'paid' | 'failed' | 'canceled'
): Promise<void> {
    try {
        // Find payout record
        const payout = await db.query.payouts.findFirst({
            where: eq(payouts.stripePayoutId, stripePayoutId),
        });

        if (!payout) {
            console.log(`No payout record found for Stripe payout ${stripePayoutId}`);
            return;
        }

        // Map Stripe status to our status
        const mappedStatus = status === 'paid' ? 'completed' : status;

        // Update payout status
        await db
            .update(payouts)
            .set({
                status: mappedStatus,
                paidAt: status === 'paid' ? new Date() : undefined,
                failureReason: status === 'failed' ? 'Payout failed' : undefined,
            })
            .where(eq(payouts.id, payout.id));

        // Log payout status change
        await AuditLogger.log({
            action: `payout.${status}`,
            category: "payout",
            severity: status === 'failed' ? 'warning' : 'info',
            userId: undefined,
            userType: "system",
            ip: "stripe-webhook",
            resourceType: "payout",
            resourceId: payout.id,
            details: {
                stripePayoutId,
                vendorId: payout.vendorId,
                amount: payout.amount,
                status: mappedStatus,
            },
        });

    } catch (error) {
        console.error('Error syncing payout status:', error);
    }
}

/**
 * Notify vendor when payout is completed
 */
export async function notifyPayoutCompleted(
    vendorId: string,
    amount: number
): Promise<void> {
    try {
        const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, vendorId),
        });

        if (!vendor?.email) {
            console.log(`No vendor found or email missing for vendor ${vendorId}`);
            return;
        }

        const emailContent = `
      <h2>💰 Pago Procesado - Luzimarket</h2>
      <p>Hola ${vendor.businessName},</p>
      <p>Te informamos que tu pago ha sido procesado exitosamente.</p>
      
      <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <h3>Detalles del pago:</h3>
        <p><strong>Monto:</strong> $${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</p>
      </div>
      
      <p>El dinero debería estar disponible en tu cuenta bancaria en 1-3 días hábiles.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/financials" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Ver mis finanzas
        </a>
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
      <p style="font-size: 12px; color: #6c757d; text-align: center;">
        Luzimarket - Plataforma de ventas para artesanos mexicanos 🇲🇽
      </p>
    `;

        await sendEmail({
            to: vendor.email,
            subject: `Pago procesado - $${amount.toFixed(2)} MXN - Luzimarket`,
            html: emailContent,
        });

    } catch (error) {
        console.error('Error sending payout notification:', error);
    }
}

/**
 * Handle payout failure and notify vendor
 */
export async function handlePayoutFailure(
    stripePayoutId: string,
    failureMessage?: string | null
): Promise<void> {
    try {
        const payout = await db.query.payouts.findFirst({
            where: eq(payouts.stripePayoutId, stripePayoutId),
            with: {
                vendor: true,
            },
        });

        if (!payout) {
            console.log(`No payout record found for Stripe payout ${stripePayoutId}`);
            return;
        }

        // Send failure notification to vendor
        if (payout.vendor?.email) {
            const emailContent = `
        <h2>⚠️ Error en Pago - Luzimarket</h2>
        <p>Hola ${payout.vendor.businessName},</p>
        <p>Lamentamos informarte que hubo un problema al procesar tu pago.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Detalles:</h3>
          <p><strong>Monto afectado:</strong> $${Number(payout.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</p>
          <p><strong>Razón:</strong> ${failureMessage || 'No especificada'}</p>
        </div>
        
        <p><strong>¿Qué hacer ahora?</strong></p>
        <ul>
          <li>Verifica que tu información bancaria esté actualizada</li>
          <li>Contacta a nuestro equipo de soporte si el problema persiste</li>
          <li>Intentaremos procesar el pago nuevamente en breve</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings/payments" 
             style="background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
            Actualizar info bancaria
          </a>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" 
             style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Contactar soporte
          </a>
        </div>
      `;

            await sendEmail({
                to: payout.vendor.email,
                subject: '⚠️ Error en tu pago - Luzimarket',
                html: emailContent,
            });
        }

        // Log payout failure
        await AuditLogger.log({
            action: "payout.failed",
            category: "payout",
            severity: "error",
            userId: undefined,
            userType: "system",
            ip: "stripe-webhook",
            resourceType: "payout",
            resourceId: payout.id,
            details: {
                stripePayoutId,
                vendorId: payout.vendorId,
                amount: payout.amount,
                failureMessage,
            },
            errorMessage: failureMessage || undefined,
        });

    } catch (error) {
        console.error('Error handling payout failure:', error);
    }
}

/**
 * Reverse vendor balance (for refunds)
 */
async function reverseVendorBalance(
    vendorId: string,
    amount: number,
    orderId: string,
    orderNumber: string,
    refundId: string | null
): Promise<void> {
    const vendorBalance = await db.query.vendorBalances.findFirst({
        where: eq(vendorBalances.vendorId, vendorId),
    });

    if (!vendorBalance) {
        console.error(`Vendor balance not found for vendor ${vendorId}`);
        return;
    }

    const newAvailableBalance = parseFloat(vendorBalance.availableBalance) - amount;

    await db
        .update(vendorBalances)
        .set({
            availableBalance: newAvailableBalance.toString(),
            lastUpdated: new Date(),
        })
        .where(eq(vendorBalances.vendorId, vendorId));
}

