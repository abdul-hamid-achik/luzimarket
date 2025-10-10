import { getTranslations } from 'next-intl/server';

interface OrderEmailData {
  order: {
    id: string;
    orderNumber: string;
    total: string;
    subtotal: string;
    tax: string;
    shipping: string;
    currency: string;
    createdAt: Date | null;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    vendor: {
      businessName: string;
    };
    user?: {
      name: string;
    };
    items: Array<{
      product: { name: string };
      quantity: number;
      total: string;
    }>;
  };
  trackingNumber?: string;
  locale?: string;
}

export async function generateVendorNewOrderEmail(data: OrderEmailData): Promise<{ subject: string; html: string }> {
  const locale = data.locale || 'es';
  const t = await getTranslations({ locale, namespace: 'Emails.vendor' });

  const itemsList = data.order.items.map(item =>
    `- ${item.product.name} (${t('../Vendor.orderManagement.quantity')}: ${item.quantity}) - $${Number(item.total).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2 })} ${data.order.currency}`
  ).join('\n');

  const subject = t('newOrderSubject', { orderNumber: data.order.orderNumber });

  const html = `
    <h2>${t('newOrderTitle')}</h2>
    <p>${t('newOrderGreeting', { businessName: data.order.vendor?.businessName || 'Vendor' })}</p>
    <p>${t('newOrderMessage')}</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>${t('orderDetailsTitle')}</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>${t('orderNumber')}</strong> ${data.order.orderNumber}</li>
        <li><strong>${t('orderTotal')}</strong> $${Number(data.order.total).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2 })} ${data.order.currency}</li>
        <li><strong>${t('orderDate')}</strong> ${data.order.createdAt?.toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) || new Date().toLocaleDateString(locale === 'es' ? 'es-MX' : 'en-US')}</li>
      </ul>
    </div>
    
    <h3>${t('productsTitle')}</h3>
    <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px;">
      <pre style="margin: 0; font-family: Arial, sans-serif;">${itemsList}</pre>
    </div>
    
    <h3>${t('shippingTitle')}</h3>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
      <p style="margin: 0;">
        ${data.order.shippingAddress?.street || ''}<br>
        ${data.order.shippingAddress?.city || ''}, ${data.order.shippingAddress?.state || ''}<br>
        ${locale === 'es' ? 'C.P.' : 'ZIP'} ${data.order.shippingAddress?.postalCode || ''}<br>
        ${data.order.shippingAddress?.country || ''}
      </p>
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
      <p style="margin: 0;"><strong>${t('actionRequired')}</strong> ${t('actionMessage')}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/orders/${data.order.id}" 
         style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        ${t('viewOrderButton')}
      </a>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
    <p style="font-size: 12px; color: #6c757d; text-align: center;">
      ${t('emailFooter')}
    </p>
  `;

  return { subject, html };
}

export async function generateCustomerConfirmationEmail(data: OrderEmailData): Promise<{ subject: string; html: string }> {
  const locale = data.locale || 'es';
  const t = await getTranslations({ locale, namespace: 'Emails.customer' });

  const itemsList = data.order.items.map(item =>
    `- ${item.product.name} (${t('../Vendor.orderManagement.quantity')}: ${item.quantity}) - $${Number(item.total).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2 })} ${data.order.currency}`
  ).join('\n');

  const subject = t('confirmationSubject', { orderNumber: data.order.orderNumber });

  const html = `
    <h2>${t('confirmationTitle')}</h2>
    <p>${t('confirmationGreeting', { customerName: data.order.user?.name || 'Cliente' })}</p>
    <p>${t('confirmationMessage')}</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>${t('orderSummaryTitle')}</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td><strong>${t('../Vendor.orderManagement.orderNumber')}</strong></td><td>${data.order.orderNumber}</td></tr>
        <tr><td><strong>${t('vendor')}</strong></td><td>${data.order.vendor?.businessName || 'Vendor'}</td></tr>
        <tr><td><strong>${t('subtotal')}</strong></td><td>$${Number(data.order.subtotal).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2 })} ${data.order.currency}</td></tr>
        <tr><td><strong>${t('tax')}</strong></td><td>$${Number(data.order.tax).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2 })} ${data.order.currency}</td></tr>
        <tr><td><strong>${t('shipping')}</strong></td><td>$${Number(data.order.shipping).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2 })} ${data.order.currency}</td></tr>
        <tr style="border-top: 2px solid #007bff; font-size: 18px; font-weight: bold;">
          <td><strong>${t('total')}</strong></td>
          <td><strong>$${Number(data.order.total).toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2 })} ${data.order.currency}</strong></td>
        </tr>
      </table>
    </div>
    
    <h3>${t('../Emails.vendor.productsTitle')}</h3>
    <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px;">
      <pre style="margin: 0; font-family: Arial, sans-serif;">${itemsList}</pre>
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
      <p style="margin: 0;"><strong>${t('whatNext')}</strong></p>
      <p style="margin: 5px 0 0 0;">${t('whatNextMessage')}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.order.id}" 
         style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
        ${t('trackOrderButton')}
      </a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" 
         style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        ${t('supportButton')}
      </a>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
    <p style="font-size: 12px; color: #6c757d; text-align: center;">
      ${t('thankYouMessage')}<br>
      ${t('brandMessage')}
    </p>
  `;

  return { subject, html };
}

export async function generateShippingNotificationEmail(data: OrderEmailData): Promise<{ subject: string; html: string }> {
  const locale = data.locale || 'es';
  const t = await getTranslations({ locale, namespace: 'Emails.customer' });

  const trackingInfo = data.trackingNumber
    ? `<p><strong>${t('trackingNumber')}</strong> ${data.trackingNumber}</p>`
    : '';

  const subject = t('shippingSubject', { orderNumber: data.order.orderNumber });

  const html = `
    <h2>${t('shippingTitle')}</h2>
    <p>${t('confirmationGreeting', { customerName: data.order.user?.name || 'Cliente' })}</p>
    <p>${t('shippingMessage', {
    orderNumber: data.order.orderNumber,
    vendorName: data.order.vendor?.businessName || 'Vendor'
  })}</p>
    
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
      <h3>${t('shippingInfoTitle')}</h3>
      ${trackingInfo}
      <p style="margin: 10px 0 0 0;"><strong>${t('estimatedDelivery')}</strong> ${t('estimatedDeliveryTime')}</p>
      <p style="margin: 5px 0 0 0;"><strong>${t('destination')}</strong> ${data.order.shippingAddress.city}, ${data.order.shippingAddress.state}</p>
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
      <p style="margin: 0;"><strong>${t('stayInformed')}</strong></p>
      <p style="margin: 5px 0 0 0;">${t('stayInformedMessage')}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.order.id}" 
         style="background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
        ${t('trackOrderButton')}
      </a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" 
         style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        ${t('needHelpButton')}
      </a>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
    <p style="font-size: 12px; color: #6c757d; text-align: center;">
      ${t('mexicanProducts')}<br>
      ${t('connectingMessage')}
    </p>
  `;

  return { subject, html };
}

/**
 * Refund request notification (to vendor)
 */
export async function generateRefundRequestEmail(data: {
  order: {
    orderNumber: string;
    total: string;
    currency: string;
  };
  vendor: {
    businessName: string;
  };
  customer: {
    name: string;
    email: string;
  };
  reason: string;
  locale?: string;
}): Promise<{ subject: string; html: string }> {
  const subject = `⚠️ Solicitud de Cancelación - Orden #${data.order.orderNumber}`;

  const html = `
    <h2>⚠️ Solicitud de Cancelación</h2>
    <p>Hola ${data.vendor.businessName},</p>
    <p>Un cliente ha solicitado la cancelación de una orden.</p>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3>Detalles de la orden:</h3>
      <p><strong>📦 Número de orden:</strong> ${data.order.orderNumber}</p>
      <p><strong>💰 Monto:</strong> $${Number(data.order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.order.currency}</p>
      <p><strong>👤 Cliente:</strong> ${data.customer.name}</p>
      <p><strong>📧 Email:</strong> ${data.customer.email}</p>
    </div>
    
    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
      <p><strong>Razón de cancelación:</strong></p>
      <p>${data.reason}</p>
    </div>
    
    <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
      <p><strong>⏰ Acción requerida:</strong></p>
      <p>Por favor revisa la solicitud y decide si aprobar o rechazar la cancelación.</p>
      <ul>
        <li>Si apruebas: Se procesará un reembolso automático y se restaurará el inventario</li>
        <li>Si rechazas: La orden continuará normalmente y se notificará al cliente</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/orders" 
         style="background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        📋 Ver Solicitud
      </a>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
    <p style="font-size: 12px; color: #6c757d; text-align: center;">
      Luzimarket - Plataforma de ventas 🇲🇽
    </p>
  `;

  return { subject, html };
}

/**
 * Refund approved notification (to customer)
 */
export async function generateRefundApprovedEmail(data: {
  order: {
    orderNumber: string;
    total: string;
    currency: string;
  };
  customer: {
    name: string;
  };
  vendor: {
    businessName: string;
  };
  refundId: string;
  locale?: string;
}): Promise<{ subject: string; html: string }> {
  const subject = `✅ Reembolso Aprobado - Orden #${data.order.orderNumber}`;

  const html = `
    <h2>✅ Tu reembolso ha sido aprobado</h2>
    <p>Hola ${data.customer.name},</p>
    <p>Buenas noticias! ${data.vendor.businessName} ha aprobado tu solicitud de cancelación.</p>
    
    <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <h3>✅ Detalles del reembolso:</h3>
      <p><strong>📦 Orden:</strong> ${data.order.orderNumber}</p>
      <p><strong>💰 Monto:</strong> $${Number(data.order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.order.currency}</p>
      <p><strong>🏪 Vendedor:</strong> ${data.vendor.businessName}</p>
      <p><strong>🆔 ID de reembolso:</strong> ${data.refundId}</p>
    </div>
    
    <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
      <p><strong>⏰ ¿Cuándo recibiré mi dinero?</strong></p>
      <p>El reembolso aparecerá en tu método de pago original en <strong>5-10 días hábiles</strong>.</p>
      <p>El tiempo exacto depende de tu banco o institución financiera.</p>
    </div>
    
    <p>Lamentamos que no hayas podido completar tu compra. Esperamos verte de nuevo pronto! 💙</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/products" 
         style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
        🛍️ Seguir Comprando
      </a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" 
         style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        💬 Contactar Soporte
      </a>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
    <p style="font-size: 12px; color: #6c757d; text-align: center;">
      Gracias por tu comprensión 🇲🇽<br>
      Luzimarket - Productos únicos mexicanos
    </p>
  `;

  return { subject, html };
}

/**
 * Refund rejected notification (to customer)
 */
export async function generateRefundRejectedEmail(data: {
  order: {
    orderNumber: string;
    total: string;
    currency: string;
  };
  customer: {
    name: string;
  };
  vendor: {
    businessName: string;
  };
  rejectionReason: string;
  locale?: string;
}): Promise<{ subject: string; html: string }> {
  const subject = `ℹ️ Solicitud de Cancelación - Orden #${data.order.orderNumber}`;

  const html = `
    <h2>Actualización sobre tu solicitud de cancelación</h2>
    <p>Hola ${data.customer.name},</p>
    <p>Te informamos que ${data.vendor.businessName} no pudo aprobar tu solicitud de cancelación para la orden ${data.order.orderNumber}.</p>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p><strong>Razón:</strong></p>
      <p>${data.rejectionReason}</p>
    </div>
    
    <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
      <p><strong>🚚 Tu orden continúa en proceso</strong></p>
      <p>Tu orden #${data.order.orderNumber} será procesada y enviada normalmente.</p>
      <p>Monto: $${Number(data.order.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.order.currency}</p>
    </div>
    
    <p><strong>¿Necesitas ayuda?</strong></p>
    <p>Si tienes dudas sobre esta decisión o necesitas asistencia, nuestro equipo de soporte está disponible para ayudarte.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.order.orderNumber}" 
         style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
        📱 Ver Orden
      </a>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact" 
         style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        💬 Contactar Soporte
      </a>
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e9ecef;">
    <p style="font-size: 12px; color: #6c757d; text-align: center;">
      Gracias por tu comprensión 🇲🇽<br>
      Luzimarket
    </p>
  `;

  return { subject, html };
}