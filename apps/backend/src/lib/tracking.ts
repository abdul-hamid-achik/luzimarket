/**
 * Tracking utility functions for order tracking and shipping management
 */

/**
 * Generate a unique tracking number for LuziMarket orders
 * Format: LZM-YYYYMMDD-XXXXXX (where X is alphanumeric)
 */
export function generateTrackingNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `LZM-${dateStr}-${randomStr}`;
}

/**
 * Mexican shipping carriers configuration
 */
export const MEXICAN_CARRIERS = {
    FEDEX: {
        name: 'FedEx México',
        code: 'fedex',
        trackingUrl: 'https://www.fedex.com/es-mx/tracking.html?trknbr=',
        apiSupport: true,
        services: ['express', 'standard', 'overnight', 'international']
    },
    UPS: {
        name: 'UPS México',
        code: 'ups',
        trackingUrl: 'https://www.ups.com/track?loc=es_MX&tracknum=',
        apiSupport: true,
        services: ['express', 'standard', 'ground', 'next_day']
    },
    DHL: {
        name: 'DHL México',
        code: 'dhl',
        trackingUrl: 'https://www.dhl.com/mx-es/home/tracking.html?tracking-id=',
        apiSupport: true,
        services: ['express', 'standard', 'same_day']
    },
    CORREOS_MEXICO: {
        name: 'Correos de México',
        code: 'correos_mexico',
        trackingUrl: 'https://www.correosdemexico.gob.mx/Paginas/Home.aspx',
        apiSupport: false,
        services: ['standard', 'certified', 'express']
    },
    ESTAFETA: {
        name: 'Estafeta',
        code: 'estafeta',
        trackingUrl: 'https://rastreo.estafeta.com/RastreoWebInternet/consultaEnvio.do?dispatch=doConsultaEnvioInternet&guia=',
        apiSupport: true,
        services: ['express', 'standard', 'next_day', 'ground']
    },
    PAQUETE_EXPRESS: {
        name: 'Paquete Express',
        code: 'paquete_express',
        trackingUrl: 'https://www.paquetexpress.com.mx/rastreo/',
        apiSupport: false,
        services: ['express', 'standard']
    },
    REDPACK: {
        name: 'Redpack',
        code: 'redpack',
        trackingUrl: 'https://www.redpack.com.mx/es/rastreo',
        apiSupport: true,
        services: ['express', 'standard', 'same_day']
    }
} as const;

/**
 * Get carrier information by code
 */
export function getCarrierInfo(carrierCode: string) {
    return Object.values(MEXICAN_CARRIERS).find(carrier => carrier.code === carrierCode);
}

/**
 * Generate tracking URL for a carrier
 */
export function generateTrackingUrl(carrierCode: string, trackingNumber: string): string {
    const carrier = getCarrierInfo(carrierCode);
    if (!carrier) {
        return '';
    }

    return carrier.trackingUrl + trackingNumber;
}

/**
 * Validate tracking number format for specific carriers
 */
export function validateTrackingNumber(carrierCode: string, trackingNumber: string): boolean {
    if (!trackingNumber) return false;

    switch (carrierCode) {
        case 'fedex':
            // FedEx: 12-14 digits
            return /^\d{12,14}$/.test(trackingNumber);
        case 'ups':
            // UPS: 1Z followed by 16 alphanumeric characters
            return /^1Z[A-Z0-9]{16}$/.test(trackingNumber);
        case 'dhl':
            // DHL: 10-11 digits
            return /^\d{10,11}$/.test(trackingNumber);
        case 'estafeta':
            // Estafeta: Various formats, generally numeric
            return /^\d{6,20}$/.test(trackingNumber);
        default:
            // Generic validation: alphanumeric, 6-30 characters
            return /^[A-Z0-9]{6,30}$/.test(trackingNumber.toUpperCase());
    }
}

/**
 * Normalize tracking status from different carriers to standard statuses
 */
export function normalizeTrackingStatus(carrierCode: string, carrierStatus: string): string {
    const status = carrierStatus.toLowerCase();

    // Common status mappings
    const statusMappings: { [key: string]: string } = {
        // Standard statuses
        'pending': 'pending',
        'label_created': 'processing',
        'in_transit': 'in_transit',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered',
        'exception': 'exception',
        'returned': 'returned',

        // FedEx specific
        'picked_up': 'in_transit',
        'at_fedex_facility': 'in_transit',
        'on_fedex_vehicle': 'out_for_delivery',

        // UPS specific
        'ups_facility': 'in_transit',
        'ups_vehicle': 'out_for_delivery',
        'origin_scan': 'in_transit',
        'destination_scan': 'out_for_delivery',

        // DHL specific
        'processed_at_dhl_location': 'in_transit',
        'with_delivery_courier': 'out_for_delivery',
        'shipment_picked_up': 'in_transit',

        // Estafeta specific
        'en_transito': 'in_transit',
        'en_reparto': 'out_for_delivery',
        'entregado': 'delivered',
    };

    return statusMappings[status] || 'in_transit';
}

/**
 * Get human-readable status message in Spanish
 */
export function getStatusMessage(status: string): string {
    const messages: { [key: string]: string } = {
        'pending': 'Pendiente de envío',
        'processing': 'Procesando envío',
        'in_transit': 'En tránsito',
        'out_for_delivery': 'En ruta de entrega',
        'delivered': 'Entregado',
        'exception': 'Incidencia en el envío',
        'returned': 'Devuelto',
        'cancelled': 'Cancelado'
    };

    return messages[status] || 'Estado desconocido';
}

/**
 * Shipping service types available in Mexico
 */
export const SHIPPING_SERVICES = {
    STANDARD: {
        code: 'standard',
        name: 'Envío Estándar',
        description: 'Entrega en 3-5 días hábiles',
        estimatedDays: 5
    },
    EXPRESS: {
        code: 'express',
        name: 'Envío Express',
        description: 'Entrega en 1-2 días hábiles',
        estimatedDays: 2
    },
    OVERNIGHT: {
        code: 'overnight',
        name: 'Entrega al Siguiente Día',
        description: 'Entrega garantizada al día siguiente',
        estimatedDays: 1
    },
    SAME_DAY: {
        code: 'same_day',
        name: 'Entrega el Mismo Día',
        description: 'Entrega el mismo día (solo áreas metropolitanas)',
        estimatedDays: 0
    },
    GROUND: {
        code: 'ground',
        name: 'Envío Terrestre',
        description: 'Entrega económica en 5-7 días hábiles',
        estimatedDays: 7
    }
} as const;

/**
 * Calculate estimated delivery date based on shipping service
 */
export function calculateEstimatedDelivery(shippingService: string, shippedDate?: Date): Date {
    const shipped = shippedDate || new Date();
    const service = Object.values(SHIPPING_SERVICES).find(s => s.code === shippingService);
    const estimatedDays = service?.estimatedDays || 5;

    const estimatedDate = new Date(shipped);
    estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

    return estimatedDate;
} 