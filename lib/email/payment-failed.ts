import { Resend } from 'resend';
import { PaymentFailedEmail } from '@/emails/payment-failed';
import { db } from '@/db';
import { orders, orderItems, products } from '@/db/schema';
import { eq } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPaymentFailedEmailParams {
  orderId: string;
  retryUrl?: string;
}

export async function sendPaymentFailedEmail({ orderId, retryUrl }: SendPaymentFailedEmailParams) {
  try {
    // Skip if email sending is disabled
    if (process.env.SEND_EMAILS === 'false') {
      console.log('Email sending disabled, skipping payment failed email');
      return { success: true, skipped: true };
    }

    // Fetch order details
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      console.error('Order not found for payment failed email:', orderId);
      return { success: false, error: 'Order not found' };
    }

    // Determine customer email and name
    const customerEmail = order.user?.email || order.guestEmail;
    const customerName = order.user?.name || order.guestName || 'Customer';

    if (!customerEmail) {
      console.error('No email address found for order:', orderId);
      return { success: false, error: 'No email address found' };
    }

    // Prepare email items
    const emailItems = order.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.price.toString(),
    }));

    // Generate retry URL if not provided
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luzimarket.shop';
    const finalRetryUrl = retryUrl || `${baseUrl}/checkout/retry?order=${order.orderNumber}`;

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Luzimarket <noreply@luzimarket.com>',
      to: customerEmail,
      subject: `Payment Failed - Order ${order.orderNumber}`,
      react: PaymentFailedEmail({
        orderNumber: order.orderNumber,
        customerName,
        amount: order.total.toString(),
        currency: order.currency,
        items: emailItems,
        retryUrl: finalRetryUrl,
      }),
    });

    if (error) {
      console.error('Failed to send payment failed email:', error);
      return { success: false, error: error.message };
    }

    console.log('Payment failed email sent successfully:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Error sending payment failed email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}