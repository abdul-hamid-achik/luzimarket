"use server";

import { sendEmail } from "@/lib/email";

/**
 * EmailService
 * Centralized service for all email sending operations
 * Consolidates email templates from across the application
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || '3000'}`;

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Base email template wrapper
 */
function baseEmailTemplate(content: string): string {
    return `
    <div style="font-family: 'Univers', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">LUZIMARKET</h1>
      </div>
      
      <div style="padding: 40px 20px;">
        ${content}
      </div>
      
      <div style="background: linear-gradient(to right, #86efac, #fde047, #5eead4); padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LUZIMARKET - Plataforma de ventas para artesanos mexicanos 🇲🇽</p>
      </div>
    </div>
  `;
}

// ============================================================================
// AUTH EMAILS
// ============================================================================

export async function sendVerificationEmail(user: { email: string; name: string }, token: string): Promise<void> {
    const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">¡Bienvenido ${user.name}!</h2>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Gracias por registrarte en LUZIMARKET. Para completar tu registro, por favor verifica tu correo electrónico.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background-color: #000; color: #fff; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 4px;">
        Verificar correo electrónico
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
      Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
    </p>
    <p style="font-size: 14px; color: #666; word-break: break-all;">
      ${verificationUrl}
    </p>
    
    <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
      Este enlace expirará en 24 horas. Si no creaste esta cuenta, puedes ignorar este mensaje.
    </p>
  `;

    await sendEmail({
        to: user.email,
        subject: "Verifica tu correo electrónico - LUZIMARKET",
        html: baseEmailTemplate(content),
    });
}

export async function sendPasswordResetEmail(user: { email: string; name: string }, token: string): Promise<void> {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">Restablecer tu contraseña</h2>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${user.name},
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú quien realizó esta solicitud, puedes ignorar este correo.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="display: inline-block; background-color: #000; color: #fff; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 4px;">
        Restablecer contraseña
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
      Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
    </p>
    <p style="font-size: 14px; color: #666; word-break: break-all;">
      ${resetUrl}
    </p>
    
    <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px;">
      Este enlace expirará en 1 hora por razones de seguridad.
    </p>
  `;

    await sendEmail({
        to: user.email,
        subject: "Restablecer tu contraseña - LUZIMARKET",
        html: baseEmailTemplate(content),
    });
}

export async function sendAccountLockoutEmail(user: { email: string; name: string }, lockoutMinutes: number = 30): Promise<void> {
    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px; color: #d10000;">Cuenta temporalmente bloqueada</h2>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${user.name},
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Tu cuenta ha sido temporalmente bloqueada debido a múltiples intentos de inicio de sesión fallidos.
    </p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; font-size: 16px; line-height: 1.6;">
        <strong>Tu cuenta se desbloqueará automáticamente en ${lockoutMinutes} minutos.</strong>
      </p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Si no reconoces esta actividad, contacta inmediatamente a nuestro equipo de soporte.
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Si olvidaste tu contraseña, puedes restablecerla usando el enlace a continuación:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/forgot-password" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 500;">
        Restablecer contraseña
      </a>
    </div>
  `;

    await sendEmail({
        to: user.email,
        subject: "⚠️ Cuenta temporalmente bloqueada - LUZIMARKET",
        html: baseEmailTemplate(content),
    });
}

export async function send2FAEnabledEmail(user: { email: string; name: string }): Promise<void> {
    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">🔒 Autenticación de dos factores activada</h2>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${user.name},
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      La autenticación de dos factores (2FA) ha sido activada exitosamente en tu cuenta.
    </p>
    
    <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <p style="margin: 0; font-size: 16px; line-height: 1.6;">
        <strong>Tu cuenta ahora está más segura.</strong> Necesitarás tu aplicación de autenticación para iniciar sesión.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666; line-height: 1.6;">
      Si no activaste la autenticación de dos factores, contacta inmediatamente a nuestro equipo de soporte.
    </p>
  `;

    await sendEmail({
        to: user.email,
        subject: "Autenticación de dos factores activada - LUZIMARKET",
        html: baseEmailTemplate(content),
    });
}

// ============================================================================
// ORDER EMAILS
// ============================================================================

interface OrderEmailData {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    vendorName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    currency?: string;
    shippingAddress?: any;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
    const itemsList = data.items.map(item =>
        `- ${item.name} (Cantidad: ${item.quantity}) - $${(item.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.currency || 'MXN'}`
    ).join('\n');

    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">🎉 ¡Gracias por tu compra!</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Estimado(a) ${data.customerName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Tu orden ha sido confirmada exitosamente y está siendo procesada por nuestro vendedor. ¡Estamos emocionados de que hayas elegido productos únicos de México!
    </p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">📋 Resumen de tu orden:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td><strong>🔢 Número de orden:</strong></td><td>${data.orderNumber}</td></tr>
        <tr><td><strong>🏪 Vendedor:</strong></td><td>${data.vendorName}</td></tr>
        <tr><td><strong>💵 Subtotal:</strong></td><td>$${data.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.currency || 'MXN'}</td></tr>
        <tr><td><strong>🧾 IVA (16%):</strong></td><td>$${data.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.currency || 'MXN'}</td></tr>
        <tr><td><strong>📦 Envío:</strong></td><td>$${data.shipping.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.currency || 'MXN'}</td></tr>
        <tr style="border-top: 2px solid #007bff; font-size: 18px; font-weight: bold;">
          <td><strong>💰 Total:</strong></td>
          <td><strong>$${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.currency || 'MXN'}</strong></td>
        </tr>
      </table>
    </div>
    
    <h3>🛍️ Productos ordenados:</h3>
    <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px;">
      <pre style="margin: 0; font-family: Arial, sans-serif; white-space: pre-wrap;">${itemsList}</pre>
    </div>
    
    <div style="margin: 30px 0; padding: 20px; background-color: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
      <p style="margin: 0;"><strong>📱 ¿Qué sigue?</strong></p>
      <p style="margin: 5px 0 0 0;">Te notificaremos por correo cuando tu orden sea enviada. Normalmente esto ocurre dentro de 1-2 días hábiles.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/orders/${data.orderNumber}" 
         style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px; display: inline-block;">
        📱 Rastrear mi orden
      </a>
    </div>
  `;

    await sendEmail({
        to: data.customerEmail,
        subject: `Confirmación de orden #${data.orderNumber} - Luzimarket`,
        html: baseEmailTemplate(content),
    });
}

export async function sendVendorNewOrderNotificationEmail(data: OrderEmailData & { vendorEmail: string }): Promise<void> {
    const itemsList = data.items.map(item =>
        `- ${item.name} (Cantidad: ${item.quantity}) - $${(item.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.currency || 'MXN'}`
    ).join('\n');

    const addressText = data.shippingAddress ? `
    ${data.shippingAddress.street}<br>
    ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
    ${data.shippingAddress.country}
  ` : 'No especificada';

    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">🎉 ¡Nueva orden recibida!</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${data.vendorName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Has recibido una nueva orden. Por favor, prepara los productos para envío.
    </p>
    
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
      <h3 style="margin-top: 0;">📋 Detalles de la orden:</h3>
      <p><strong>🔢 Número de orden:</strong> ${data.orderNumber}</p>
      <p><strong>👤 Cliente:</strong> ${data.customerName}</p>
      <p><strong>💰 Total:</strong> $${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.currency || 'MXN'}</p>
    </div>
    
    <h3>📦 Productos ordenados:</h3>
    <div style="background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
      <pre style="margin: 0; font-family: Arial, sans-serif; white-space: pre-wrap;">${itemsList}</pre>
    </div>
    
    <h3>📍 Dirección de envío:</h3>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      ${addressText}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/vendor/orders/${data.orderNumber}" 
         style="background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Ver detalles de la orden
      </a>
    </div>
  `;

    await sendEmail({
        to: data.vendorEmail,
        subject: `Nueva orden #${data.orderNumber} - Luzimarket`,
        html: baseEmailTemplate(content),
    });
}

export async function sendShippingNotificationEmail(data: OrderEmailData & { trackingNumber?: string }): Promise<void> {
    const trackingInfo = data.trackingNumber
        ? `<p><strong>Número de rastreo:</strong> ${data.trackingNumber}</p>`
        : '';

    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">📦 ¡Tu orden está en camino!</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Estimado(a) ${data.customerName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      ¡Excelentes noticias! Tu orden #${data.orderNumber} ha sido enviada por <strong>${data.vendorName}</strong> y está en camino hacia ti.
    </p>
    
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
      <h3 style="margin-top: 0;">🚚 Información de envío:</h3>
      ${trackingInfo}
      <p style="margin: 10px 0 0 0;"><strong>⏰ Tiempo estimado de entrega:</strong> 3-5 días hábiles</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/orders/${data.orderNumber}" 
         style="background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        📱 Rastrear mi orden
      </a>
    </div>
  `;

    await sendEmail({
        to: data.customerEmail,
        subject: `Tu orden #${data.orderNumber} ha sido enviada - Luzimarket`,
        html: baseEmailTemplate(content),
    });
}

export async function sendDeliveryNotificationEmail(data: OrderEmailData): Promise<void> {
    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">✅ ¡Tu orden ha sido entregada!</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${data.customerName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Tu orden #${data.orderNumber} ha sido entregada exitosamente.
    </p>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Esperamos que disfrutes tus productos de ${data.vendorName}.
    </p>
    
    <h3>¿Te gustó tu experiencia?</h3>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Nos encantaría conocer tu opinión sobre los productos que compraste.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/orders/${data.orderNumber}/review" 
         style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Escribir reseña
      </a>
    </div>
  `;

    await sendEmail({
        to: data.customerEmail,
        subject: `Tu orden #${data.orderNumber} ha sido entregada - Luzimarket`,
        html: baseEmailTemplate(content),
    });
}

export async function sendOrderCancelledNotificationEmail(data: OrderEmailData, reason?: string): Promise<void> {
    const reasonText = reason ? `<p><strong>Razón:</strong> ${reason}</p>` : '';

    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">❌ Orden cancelada</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${data.customerName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Tu orden #${data.orderNumber} ha sido cancelada.
    </p>
    
    ${reasonText ? `<div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">${reasonText}</div>` : ''}
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Si se realizó algún cargo, será reembolsado en los próximos 3-5 días hábiles.
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Si tienes alguna pregunta, no dudes en contactarnos.
    </p>
  `;

    await sendEmail({
        to: data.customerEmail,
        subject: `Orden cancelada #${data.orderNumber} - Luzimarket`,
        html: baseEmailTemplate(content),
    });
}

export async function sendRefundNotificationEmail(data: OrderEmailData): Promise<void> {
    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">💰 Reembolso procesado</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${data.customerName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      El reembolso de tu orden #${data.orderNumber} ha sido procesado.
    </p>
    
    <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <p style="margin: 0;"><strong>Monto reembolsado:</strong> $${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${data.currency || 'MXN'}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      El reembolso aparecerá en tu método de pago original en los próximos 3-5 días hábiles.
    </p>
  `;

    await sendEmail({
        to: data.customerEmail,
        subject: `Reembolso procesado #${data.orderNumber} - Luzimarket`,
        html: baseEmailTemplate(content),
    });
}

// ============================================================================
// PAYMENT EMAILS
// ============================================================================

export async function sendPaymentFailedEmail(order: { orderNumber: string; customerEmail: string; customerName: string; total: number; currency?: string }, retryUrl?: string): Promise<void> {
    const retryButton = retryUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${retryUrl}" 
         style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Intentar de nuevo
      </a>
    </div>
  ` : '';

    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px; color: #dc3545;">⚠️ Error al procesar el pago</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${order.customerName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Lamentamos informarte que hubo un problema al procesar el pago de tu orden #${order.orderNumber}.
    </p>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0;"><strong>Monto:</strong> $${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${order.currency || 'MXN'}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Por favor, verifica tu método de pago e intenta nuevamente. Si el problema persiste, contacta a tu banco o prueba con otro método de pago.
    </p>
    
    ${retryButton}
  `;

    await sendEmail({
        to: order.customerEmail,
        subject: `⚠️ Error al procesar pago - Orden #${order.orderNumber} - Luzimarket`,
        html: baseEmailTemplate(content),
    });
}

// ============================================================================
// PAYOUT EMAILS
// ============================================================================

export async function sendPayoutCompletedEmail(vendor: { email: string; businessName: string }, amount: number): Promise<void> {
    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">💰 Pago Procesado</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${vendor.businessName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Te informamos que tu pago ha sido procesado exitosamente.
    </p>
    
    <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <h3 style="margin-top: 0;">Detalles del pago:</h3>
      <p><strong>Monto:</strong> $${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      El dinero debería estar disponible en tu cuenta bancaria en 1-3 días hábiles.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/vendor/financials" 
         style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Ver mis finanzas
      </a>
    </div>
  `;

    await sendEmail({
        to: vendor.email,
        subject: `Pago procesado - $${amount.toFixed(2)} MXN - Luzimarket`,
        html: baseEmailTemplate(content),
    });
}

export async function sendPayoutFailedEmail(vendor: { email: string; businessName: string }, amount: number, failureMessage?: string): Promise<void> {
    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px; color: #dc3545;">⚠️ Error en Pago</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${vendor.businessName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Lamentamos informarte que hubo un problema al procesar tu pago.
    </p>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h3 style="margin-top: 0;">Detalles:</h3>
      <p><strong>Monto afectado:</strong> $${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</p>
      <p><strong>Razón:</strong> ${failureMessage || 'No especificada'}</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;"><strong>¿Qué hacer ahora?</strong></p>
    <ul style="font-size: 16px; line-height: 1.6;">
      <li>Verifica que tu información bancaria esté actualizada</li>
      <li>Contacta a nuestro equipo de soporte si el problema persiste</li>
      <li>Intentaremos procesar el pago nuevamente en breve</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/vendor/settings/payments" 
         style="background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px; display: inline-block;">
        Actualizar info bancaria
      </a>
      <a href="${APP_URL}/contact" 
         style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Contactar soporte
      </a>
    </div>
  `;

    await sendEmail({
        to: vendor.email,
        subject: '⚠️ Error en tu pago - Luzimarket',
        html: baseEmailTemplate(content),
    });
}

// ============================================================================
// VENDOR EMAILS
// ============================================================================

export async function sendVendorLowStockAlert(vendor: { email: string; businessName: string }, product: { name: string; stock: number; id: string }): Promise<void> {
    const content = `
    <h2 style="font-size: 24px; margin-bottom: 20px;">⚠️ Alerta de inventario bajo</h2>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Hola ${vendor.businessName},
    </p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      El siguiente producto tiene inventario bajo:
    </p>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p><strong>Producto:</strong> ${product.name}</p>
      <p><strong>Stock actual:</strong> ${product.stock} unidades</p>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Te recomendamos actualizar tu inventario pronto para evitar quedarte sin stock.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/vendor/products/${product.id}" 
         style="background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Actualizar inventario
      </a>
    </div>
  `;

    await sendEmail({
        to: vendor.email,
        subject: `⚠️ Inventario bajo: ${product.name} - Luzimarket`,
        html: baseEmailTemplate(content),
    });
}

