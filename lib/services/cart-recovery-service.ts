import { db } from "@/db";
import { cartAbandonment, users } from "@/db/schema";
import { and, isNull, lte, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export interface AbandonedCartData {
    sessionId: string;
    userId?: string;
    userEmail?: string;
    products: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
    cartTotal: number;
}

/**
 * Records an abandoned cart
 */
export async function recordAbandonedCart(data: AbandonedCartData) {
    try {
        // Check if abandonment already exists for this session
        const [existing] = await db
            .select()
            .from(cartAbandonment)
            .where(sql`${cartAbandonment.sessionId} = ${data.sessionId}`)
            .limit(1);

        if (existing) {
            // Update existing record
            await db
                .update(cartAbandonment)
                .set({
                    productsData: data.products,
                    cartTotal: data.cartTotal.toString(),
                    userEmail: data.userEmail,
                })
                .where(sql`${cartAbandonment.id} = ${existing.id}`);

            return { success: true };
        }

        // Create new record
        await db.insert(cartAbandonment).values({
            sessionId: data.sessionId,
            userId: data.userId,
            userEmail: data.userEmail,
            productsData: data.products,
            cartTotal: data.cartTotal.toString(),
        });

        return { success: true };
    } catch (error) {
        console.error("Error recording abandoned cart:", error);
        return {
            success: false,
            error: "Failed to record abandoned cart",
        };
    }
}

/**
 * Sends recovery emails for abandoned carts
 * Called by cron job
 */
export async function sendCartRecoveryEmails() {
    try {
        // Get abandoned carts from 1-24 hours ago that haven't been recovered or emailed
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const abandonedCarts = await db
            .select({
                cart: cartAbandonment,
                user: users,
            })
            .from(cartAbandonment)
            .leftJoin(users, sql`${cartAbandonment.userId} = ${users.id}`)
            .where(
                and(
                    lte(cartAbandonment.createdAt, oneHourAgo),
                    sql`${cartAbandonment.createdAt} >= ${oneDayAgo.toISOString()}`,
                    isNull(cartAbandonment.recoveredAt),
                    sql`${cartAbandonment.recoveryEmailSent} = false`
                )
            )
            .limit(100); // Process max 100 at a time

        let sentCount = 0;

        for (const { cart, user } of abandonedCarts) {
            const email = user?.email || cart.userEmail;
            const name = user?.name || "Cliente";

            if (!email) continue;

            try {
                await sendCartRecoveryEmail({
                    email,
                    name,
                    products: cart.productsData as any[],
                    cartTotal: Number(cart.cartTotal),
                    sessionId: cart.sessionId,
                });

                // Mark as sent
                await db
                    .update(cartAbandonment)
                    .set({ recoveryEmailSent: true })
                    .where(sql`${cartAbandonment.id} = ${cart.id}`);

                sentCount++;
            } catch (error) {
                console.error(`Error sending recovery email for cart ${cart.id}:`, error);
            }
        }

        return {
            success: true,
            sent: sentCount,
            total: abandonedCarts.length,
        };
    } catch (error) {
        console.error("Error sending cart recovery emails:", error);
        return {
            success: false,
            error: "Failed to send recovery emails",
        };
    }
}

/**
 * Sends a cart recovery email
 */
async function sendCartRecoveryEmail(params: {
    email: string;
    name: string;
    products: Array<{ productName: string; quantity: number; price: number }>;
    cartTotal: number;
    sessionId: string;
}) {
    const { email, name, products, cartTotal, sessionId } = params;

    const subject = "🛒 Olvidaste algo en tu carrito - Luzimarket";

    const productsHtml = products
        .map(
            (p) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
          ${p.productName} × ${p.quantity}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          $${(p.price * p.quantity).toFixed(2)}
        </td>
      </tr>
    `
        )
        .join("");

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ec4899;">🛒 ¡No olvides tu carrito!</h2>
      
      <p>Hola ${name},</p>
      
      <p>Notamos que dejaste algunos productos en tu carrito. ¡Todavía están disponibles!</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #991b1b;">Tu carrito:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${productsHtml}
          <tr>
            <td style="padding: 12px 8px 8px 8px; font-weight: bold;">Total:</td>
            <td style="padding: 12px 8px 8px 8px; text-align: right; font-weight: bold; font-size: 18px;">
              $${cartTotal.toFixed(2)}
            </td>
          </tr>
        </table>
      </div>
      
      <p style="margin: 24px 0;">Completa tu compra ahora y recibe tus productos en 3-5 días hábiles.</p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/cart?session=${sessionId}" 
         style="display: inline-block; background-color: #ec4899; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
        Completar mi compra →
      </a>
      
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        Este es un recordatorio amigable. Si ya completaste tu compra, ignora este correo.
      </p>
    </div>
  `;

    await sendEmail({
        to: email,
        subject,
        html,
    });
}

/**
 * Marks a cart as recovered
 */
export async function markCartAsRecovered(sessionId: string) {
    try {
        await db
            .update(cartAbandonment)
            .set({ recoveredAt: new Date() })
            .where(sql`${cartAbandonment.sessionId} = ${sessionId}`);

        return { success: true };
    } catch (error) {
        console.error("Error marking cart as recovered:", error);
        return {
            success: false,
            error: "Failed to mark cart as recovered",
        };
    }
}

/**
 * Gets cart recovery stats
 */
export async function getCartRecoveryStats() {
    try {
        const [stats] = await db
            .select({
                totalAbandoned: sql<number>`COUNT(*)`,
                recovered: sql<number>`COUNT(*) FILTER (WHERE ${cartAbandonment.recoveredAt} IS NOT NULL)`,
                emailsSent: sql<number>`COUNT(*) FILTER (WHERE ${cartAbandonment.recoveryEmailSent} = true)`,
                avgCartValue: sql<number>`AVG(${cartAbandonment.cartTotal}::numeric)`,
            })
            .from(cartAbandonment);

        const totalAbandoned = stats?.totalAbandoned || 0;
        const recovered = stats?.recovered || 0;
        const recoveryRate = totalAbandoned > 0 ? (recovered / totalAbandoned) * 100 : 0;

        return {
            success: true,
            stats: {
                totalAbandoned,
                recovered,
                recoveryRate: Math.round(recoveryRate * 10) / 10,
                emailsSent: stats?.emailsSent || 0,
                avgCartValue: Number(stats?.avgCartValue || 0),
            },
        };
    } catch (error) {
        console.error("Error fetching cart recovery stats:", error);
        return {
            success: false,
            error: "Failed to fetch stats",
        };
    }
}

