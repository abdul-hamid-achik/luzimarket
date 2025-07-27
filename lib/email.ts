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
        <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LUZIMARKET</p>
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
        <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LUZIMARKET</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: vendorEmail,
    subject: `Nueva orden #${orderNumber} - LUZIMARKET`,
    html,
  });
}

export async function sendImageApprovalNotification(vendorDetails: {
  vendorEmail: string;
  vendorName: string;
  productName: string;
  productSlug: string;
  approvedImageCount: number;
  totalImageCount: number;
}) {
  const { vendorEmail, vendorName, productName, productSlug, approvedImageCount, totalImageCount } = vendorDetails;

  const html = `
    <div style="font-family: 'Univers', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LUZIMARKET</h1>
      </div>
      
      <div style="padding: 40px 20px;">
        <h2 style="font-size: 24px; margin-bottom: 20px; color: #16a34a;">✅ Imágenes Aprobadas</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Hola ${vendorName}, te informamos que las imágenes de tu producto han sido aprobadas.
        </p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 18px; margin-bottom: 15px; color: #16a34a;">Producto:</h3>
          <p style="margin: 0; font-size: 16px; font-weight: bold;">${productName}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;">
            ${approvedImageCount} de ${totalImageCount} imágenes aprobadas
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 30px;">
          ${approvedImageCount === totalImageCount ? 
            'Todas las imágenes han sido aprobadas. Tu producto ya está visible para los clientes.' :
            'Algunas imágenes han sido aprobadas. Las imágenes restantes están pendientes de revisión.'
          }
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/products/${productSlug}" 
             style="display: inline-block; background-color: #16a34a; color: #fff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 6px;">
            Ver producto
          </a>
        </div>
      </div>
      
      <div style="background: linear-gradient(to right, #86efac, #fde047, #5eead4); padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LUZIMARKET</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: vendorEmail,
    subject: `Imágenes aprobadas para "${productName}" - LUZIMARKET`,
    html,
  });
}

export async function sendImageRejectionNotification(vendorDetails: {
  vendorEmail: string;
  vendorName: string;
  productName: string;
  productSlug: string;
  rejectedImageCount: number;
  totalImageCount: number;
  rejectionReason: string;
  rejectionCategory: string;
  notes?: string;
}) {
  const { vendorEmail, vendorName, productName, productSlug, rejectedImageCount, totalImageCount, rejectionReason, rejectionCategory, notes } = vendorDetails;

  const categoryMap: Record<string, string> = {
    quality: "Calidad de imagen",
    inappropriate: "Contenido inapropiado",
    copyright: "Problemas de derechos de autor",
    misleading: "Información engañosa",
    other: "Otros motivos"
  };

  const html = `
    <div style="font-family: 'Univers', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc2626; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LUZIMARKET</h1>
      </div>
      
      <div style="padding: 40px 20px;">
        <h2 style="font-size: 24px; margin-bottom: 20px; color: #dc2626;">❌ Imágenes Rechazadas</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
          Hola ${vendorName}, lamentamos informarte que algunas imágenes de tu producto han sido rechazadas.
        </p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="font-size: 18px; margin-bottom: 15px; color: #dc2626;">Producto:</h3>
          <p style="margin: 0; font-size: 16px; font-weight: bold;">${productName}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #991b1b;">
            ${rejectedImageCount} de ${totalImageCount} imágenes rechazadas
          </p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h4 style="font-size: 16px; margin-bottom: 10px; color: #374151;">Motivo del rechazo:</h4>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            <strong>Categoría:</strong> ${categoryMap[rejectionCategory] || rejectionCategory}
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
            <strong>Detalles:</strong> ${rejectionReason}
          </p>
          ${notes ? `
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
              <strong>Notas adicionales:</strong> ${notes}
            </p>
          ` : ''}
        </div>
        
        <p style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 30px;">
          Para que tu producto sea visible para los clientes, necesitas subir nuevas imágenes que cumplan con nuestras políticas.
          Puedes editar tu producto y subir nuevas imágenes en cualquier momento.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/products/${productSlug}/edit" 
             style="display: inline-block; background-color: #dc2626; color: #fff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 6px;">
            Editar producto
          </a>
        </div>
      </div>
      
      <div style="background: linear-gradient(to right, #86efac, #fde047, #5eead4); padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LUZIMARKET</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: vendorEmail,
    subject: `Imágenes rechazadas para "${productName}" - LUZIMARKET`,
    html,
  });
}