import { Resend } from 'resend';

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    // During build time, RESEND_API_KEY might not be available
    // In that case, just log and return without throwing
    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY not available - email sending skipped during build');
      return { id: 'build-time-placeholder' };
    }

    const resendClient = getResendClient();
    const { data, error } = await resendClient.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@luzimarket.shop',
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendOrderConfirmation(orderDetails: {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  vendorName: string;
}) {
  const { orderNumber, customerEmail, customerName, items, total, vendorName } = orderDetails;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Univers', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LUZIMARKET</h1>
      </div>
      
      <div style="padding: 40px 20px;">
        <h2 style="font-size: 24px; margin-bottom: 20px;">¡Gracias por tu compra, ${customerName}!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Tu orden #${orderNumber} ha sido confirmada y será procesada por ${vendorName}.
        </p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 18px; margin-bottom: 15px;">Detalles de la orden:</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #333;">Producto</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #333;">Cantidad</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #333;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Recibirás actualizaciones sobre el estado de tu orden en este correo electrónico.
          Si tienes alguna pregunta, no dudes en contactarnos.
        </p>
      </div>
      
      <div style="background: linear-gradient(to right, #86efac, #fde047, #5eead4); padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 12px;">© 2024 MOMENTO ESPECIAL SAPI DE CV</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Confirmación de orden #${orderNumber} - LUZIMARKET`,
    html,
  });
}

export async function sendVendorNotification(vendorDetails: {
  vendorEmail: string;
  vendorName: string;
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
}) {
  const { vendorEmail, vendorName, orderNumber, customerName, items, total, shippingAddress } = vendorDetails;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const addressHtml = shippingAddress ? `
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="margin-bottom: 10px;">Dirección de envío:</h4>
      <p style="margin: 0; line-height: 1.6;">
        ${shippingAddress.street}<br>
        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}
      </p>
    </div>
  ` : '';

  const html = `
    <div style="font-family: 'Univers', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LUZIMARKET</h1>
      </div>
      
      <div style="padding: 40px 20px;">
        <h2 style="font-size: 24px; margin-bottom: 20px;">¡Nueva orden recibida!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Hola ${vendorName}, has recibido una nueva orden #${orderNumber} de ${customerName}.
        </p>
        
        ${addressHtml}
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 18px; margin-bottom: 15px;">Productos ordenados:</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #333;">Producto</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #333;">Cantidad</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #333;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/orders/${orderNumber}" 
             style="display: inline-block; background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; font-weight: bold;">
            Ver orden completa
          </a>
        </div>
      </div>
      
      <div style="background: linear-gradient(to right, #86efac, #fde047, #5eead4); padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 12px;">© 2024 MOMENTO ESPECIAL SAPI DE CV</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: vendorEmail,
    subject: `Nueva orden #${orderNumber} - LUZIMARKET`,
    html,
  });
}