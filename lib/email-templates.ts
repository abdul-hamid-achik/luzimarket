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