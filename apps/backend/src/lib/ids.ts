/**
 * Prefixed ID generation utilities for LuziMarket
 * Format: lm_<pattern>_<32_char_hex>
 * Example: lm_cus_4c4a82eda3e14c56aa0a26962ddd0425
 */

import { randomUUID } from 'crypto';

// Define your patterns for each entity type
export const ID_PATTERNS = {
    USER: 'cus',        // customers/users
    ORDER: 'ord',       // orders
    PRODUCT: 'prod',    // products
    VARIANT: 'var',     // product variants
    VENDOR: 'vend',     // vendors
    CATEGORY: 'cat',    // categories
    SESSION: 'sess',    // sessions
    CART: 'cart',       // cart items
    BUNDLE: 'bund',     // bundles
    DELIVERY: 'del',    // delivery zones
    PHOTO: 'photo',     // photos
    ARTICLE: 'art',     // editorial articles
    BRAND: 'brand',     // brands
    REVIEW: 'rev',      // reviews
    ADDRESS: 'addr',    // addresses
    DISCOUNT: 'disc',   // discount codes
    TRACKING: 'track',  // tracking history
    EMPLOYEE: 'emp',    // employees
    PETITION: 'pet',    // petitions
    OCCASION: 'occ',    // occasions
    STATE: 'state',     // states
    SLIDE: 'slide',     // homepage slides
    TOKEN: 'token',     // refresh tokens
} as const;

export type IDPattern = typeof ID_PATTERNS[keyof typeof ID_PATTERNS];

/**
 * Generate a prefixed ID with format: lm_<pattern>_<32_char_hex>
 */
export function generatePrefixedId(pattern: IDPattern): string {
    const uuid = randomUUID().replace(/-/g, '');
    return `lm_${pattern}_${uuid}`;
}

/**
 * Validate a prefixed ID format
 */
export function validatePrefixedId(id: string, expectedPattern?: IDPattern): boolean {
    if (expectedPattern) {
        const regex = new RegExp(`^lm_${expectedPattern}_[a-f0-9]{32}$`);
        return regex.test(id);
    }

    // Check if it matches any valid pattern
    const validPatterns = Object.values(ID_PATTERNS);
    return validPatterns.some(pattern => {
        const regex = new RegExp(`^lm_${pattern}_[a-f0-9]{32}$`);
        return regex.test(id);
    });
}

/**
 * Extract pattern from ID (e.g., "cus" from "lm_cus_4c4a82eda3e14c56aa0a26962ddd0425")
 */
export function extractPattern(id: string): string | null {
    const match = id.match(/^lm_(\w+)_/);
    return match ? match[1] : null;
}

/**
 * Extract the UUID part from a prefixed ID
 */
export function extractUUID(id: string): string | null {
    const match = id.match(/^lm_\w+_([a-f0-9]{32})$/);
    return match ? match[1] : null;
}

/**
 * Check if ID is legacy UUID format
 */
export function isLegacyUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

/**
 * Convert legacy UUID to prefixed format (for migration purposes)
 */
export function convertLegacyUUID(uuid: string, pattern: IDPattern): string {
    const cleanUuid = uuid.replace(/-/g, '');
    return `lm_${pattern}_${cleanUuid}`;
} 