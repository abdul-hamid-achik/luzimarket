import { headers } from 'next/headers';
import { AuditLogger } from './middleware/security';

/**
 * Helper to get request metadata for audit logging
 */
async function getRequestMetadata() {
    const headersList = await headers();
    return {
        ip: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown',
        userAgent: headersList.get('user-agent') || undefined,
    };
}

/**
 * Log authentication-related events
 */
export async function logAuthEvent(params: {
    action: 'registration' | 'email_verification' | '2fa_enabled' | '2fa_disabled' | '2fa_verified';
    userId: string;
    userEmail: string;
    userType?: string;
    details?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}) {
    const metadata = await getRequestMetadata();

    await AuditLogger.log({
        action: `auth.${params.action}`,
        category: 'auth',
        severity: params.severity || 'info',
        userId: params.userId,
        userType: params.userType || 'user',
        userEmail: params.userEmail,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        resourceType: 'user',
        resourceId: params.userId,
        details: params.details || {},
    });
}

/**
 * Log password-related events
 */
export async function logPasswordEvent(params: {
    action: 'password_changed' | 'password_reset' | 'password_reset_requested';
    userId: string;
    userEmail: string;
    userType?: string;
    details?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}) {
    const metadata = await getRequestMetadata();

    await AuditLogger.log({
        action: `auth.${params.action}`,
        category: 'security',
        severity: params.severity || 'info',
        userId: params.userId,
        userType: params.userType || 'user',
        userEmail: params.userEmail,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        resourceType: 'user',
        resourceId: params.userId,
        details: params.details || {},
    });
}

/**
 * Log order-related events
 */
export async function logOrderEvent(params: {
    action: 'created' | 'status_changed' | 'cancelled' | 'refunded' | 'payment_completed' | 'cancellation_requested' | 'refund_approved' | 'refund_rejected';
    orderId: string;
    orderNumber: string;
    userId?: string | null;
    userEmail?: string;
    vendorId?: string;
    details: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}) {
    const metadata = await getRequestMetadata();

    await AuditLogger.log({
        action: `order.${params.action}`,
        category: 'order',
        severity: params.severity || 'info',
        userId: params.userId || undefined,
        userType: params.userId ? 'user' : 'guest',
        userEmail: params.userEmail,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        resourceType: 'order',
        resourceId: params.orderId,
        details: {
            orderNumber: params.orderNumber,
            vendorId: params.vendorId,
            ...params.details,
        },
    });
}

/**
 * Log vendor-related events
 */
export async function logVendorEvent(params: {
    action: 'approved' | 'rejected' | 'status_changed' | 'stripe_account_created';
    vendorId: string;
    vendorEmail: string;
    vendorName: string;
    adminUserId: string;
    adminEmail: string;
    details?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}) {
    const metadata = await getRequestMetadata();

    await AuditLogger.log({
        action: `vendor.${params.action}`,
        category: 'vendor',
        severity: params.severity || (params.action === 'rejected' ? 'warning' : 'info'),
        userId: params.adminUserId,
        userType: 'admin',
        userEmail: params.adminEmail,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        resourceType: 'vendor',
        resourceId: params.vendorId,
        details: {
            vendorEmail: params.vendorEmail,
            vendorName: params.vendorName,
            ...params.details,
        },
    });
}

/**
 * Log product-related events
 */
export async function logProductEvent(params: {
    action: 'created' | 'updated' | 'deleted' | 'status_changed';
    productId: string;
    productName: string;
    vendorId: string;
    userId: string;
    userEmail: string;
    userType: 'vendor' | 'admin';
    details?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}) {
    const metadata = await getRequestMetadata();

    await AuditLogger.log({
        action: `product.${params.action}`,
        category: 'product',
        severity: params.severity || 'info',
        userId: params.userId,
        userType: params.userType,
        userEmail: params.userEmail,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        resourceType: 'product',
        resourceId: params.productId,
        details: {
            productName: params.productName,
            vendorId: params.vendorId,
            ...params.details,
        },
    });
}

/**
 * Log image moderation events
 */
export async function logImageModerationEvent(params: {
    action: 'approved' | 'rejected';
    imageIds: string[];
    productId?: string;
    categoryId?: string;
    adminUserId: string;
    adminEmail: string;
    details?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}) {
    const metadata = await getRequestMetadata();

    await AuditLogger.log({
        action: `moderation.image_${params.action}`,
        category: 'moderation',
        severity: params.severity || 'info',
        userId: params.adminUserId,
        userType: 'admin',
        userEmail: params.adminEmail,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        resourceType: params.productId ? 'product' : 'category',
        resourceId: params.productId || params.categoryId,
        details: {
            imageIds: params.imageIds,
            imageCount: params.imageIds.length,
            ...params.details,
        },
    });
}

/**
 * Log payout-related events
 */
export async function logPayoutEvent(params: {
    action: 'requested' | 'processed' | 'completed' | 'failed';
    payoutId: string;
    vendorId: string;
    amount: number;
    currency: string;
    userId: string;
    userEmail: string;
    userType: 'vendor' | 'admin';
    details?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}) {
    const metadata = await getRequestMetadata();

    await AuditLogger.log({
        action: `payout.${params.action}`,
        category: 'financial',
        severity: params.severity || (params.action === 'failed' ? 'warning' : 'info'),
        userId: params.userId,
        userType: params.userType,
        userEmail: params.userEmail,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        resourceType: 'payout',
        resourceId: params.payoutId,
        details: {
            vendorId: params.vendorId,
            amount: params.amount,
            currency: params.currency,
            ...params.details,
        },
    });
}

/**
 * Log admin operations
 */
export async function logAdminEvent(params: {
    action: string;
    category: 'settings' | 'user_management' | 'category' | 'general';
    adminUserId: string;
    adminEmail: string;
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}) {
    const metadata = await getRequestMetadata();

    await AuditLogger.log({
        action: `admin.${params.action}`,
        category: params.category,
        severity: params.severity || 'info',
        userId: params.adminUserId,
        userType: 'admin',
        userEmail: params.adminEmail,
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        details: params.details || {},
    });
}

