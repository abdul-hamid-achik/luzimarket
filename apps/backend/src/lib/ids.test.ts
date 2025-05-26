import { describe, it, expect } from 'vitest';
import {
    generatePrefixedId,
    validatePrefixedId,
    extractPattern,
    extractUUID,
    isLegacyUUID,
    convertLegacyUUID,
    ID_PATTERNS
} from './ids';

describe('Prefixed ID Utilities', () => {
    describe('generatePrefixedId', () => {
        it('should generate prefixed IDs with correct format', () => {
            const customerId = generatePrefixedId(ID_PATTERNS.USER);
            const orderId = generatePrefixedId(ID_PATTERNS.ORDER);
            const productId = generatePrefixedId(ID_PATTERNS.PRODUCT);

            // Should match the format: lm_<pattern>_<32_char_hex>
            expect(customerId).toMatch(/^lm_cus_[a-f0-9]{32}$/);
            expect(orderId).toMatch(/^lm_ord_[a-f0-9]{32}$/);
            expect(productId).toMatch(/^lm_prod_[a-f0-9]{32}$/);
        });

        it('should generate unique IDs', () => {
            const id1 = generatePrefixedId(ID_PATTERNS.USER);
            const id2 = generatePrefixedId(ID_PATTERNS.USER);

            expect(id1).not.toBe(id2);
        });

        it('should work with all defined patterns', () => {
            Object.values(ID_PATTERNS).forEach(pattern => {
                const id = generatePrefixedId(pattern);
                expect(id).toMatch(new RegExp(`^lm_${pattern}_[a-f0-9]{32}$`));
            });
        });
    });

    describe('validatePrefixedId', () => {
        it('should validate correct prefixed IDs', () => {
            const customerId = generatePrefixedId(ID_PATTERNS.USER);
            const orderId = generatePrefixedId(ID_PATTERNS.ORDER);

            expect(validatePrefixedId(customerId)).toBe(true);
            expect(validatePrefixedId(orderId)).toBe(true);
        });

        it('should validate specific patterns when provided', () => {
            const customerId = generatePrefixedId(ID_PATTERNS.USER);

            expect(validatePrefixedId(customerId, ID_PATTERNS.USER)).toBe(true);
            expect(validatePrefixedId(customerId, ID_PATTERNS.ORDER)).toBe(false);
        });

        it('should reject invalid formats', () => {
            expect(validatePrefixedId('invalid-id')).toBe(false);
            expect(validatePrefixedId('lm_cus_invalid')).toBe(false);
            expect(validatePrefixedId('lm_invalid_123456789012345678901234567890123')).toBe(false);
            expect(validatePrefixedId('cus_123456789012345678901234567890123')).toBe(false); // missing lm_
            expect(validatePrefixedId('lm_cus_12345678901234567890123456789012345')).toBe(false); // too long
            expect(validatePrefixedId('lm_cus_1234567890123456789012345678901')).toBe(false); // too short
        });

        it('should reject legacy UUID format', () => {
            expect(validatePrefixedId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
        });
    });

    describe('extractPattern', () => {
        it('should extract pattern from valid prefixed IDs', () => {
            const customerId = generatePrefixedId(ID_PATTERNS.USER);
            const orderId = generatePrefixedId(ID_PATTERNS.ORDER);

            expect(extractPattern(customerId)).toBe('cus');
            expect(extractPattern(orderId)).toBe('ord');
        });

        it('should return null for invalid formats', () => {
            expect(extractPattern('invalid-id')).toBe(null);
            expect(extractPattern('550e8400-e29b-41d4-a716-446655440000')).toBe(null);
        });
    });

    describe('extractUUID', () => {
        it('should extract UUID from valid prefixed IDs', () => {
            const id = 'lm_cus_550e8400e29b41d4a716446655440000';

            expect(extractUUID(id)).toBe('550e8400e29b41d4a716446655440000');
        });

        it('should return null for invalid formats', () => {
            expect(extractUUID('invalid-id')).toBe(null);
            expect(extractUUID('lm_cus_invalid')).toBe(null);
        });
    });

    describe('isLegacyUUID', () => {
        it('should validate legacy UUID format', () => {
            expect(isLegacyUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
            expect(isLegacyUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
        });

        it('should reject invalid UUID formats', () => {
            expect(isLegacyUUID('invalid-uuid')).toBe(false);
            expect(isLegacyUUID('lm_cus_550e8400e29b41d4a716446655440000')).toBe(false);
            expect(isLegacyUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false); // too short
        });
    });

    describe('convertLegacyUUID', () => {
        it('should convert legacy UUID to prefixed format', () => {
            const legacyUuid = '550e8400-e29b-41d4-a716-446655440000';
            const converted = convertLegacyUUID(legacyUuid, ID_PATTERNS.USER);

            expect(converted).toBe('lm_cus_550e8400e29b41d4a716446655440000');
            expect(validatePrefixedId(converted, ID_PATTERNS.USER)).toBe(true);
        });

        it('should work with different patterns', () => {
            const legacyUuid = '550e8400-e29b-41d4-a716-446655440000';

            const customerConverted = convertLegacyUUID(legacyUuid, ID_PATTERNS.USER);
            const orderConverted = convertLegacyUUID(legacyUuid, ID_PATTERNS.ORDER);

            expect(customerConverted).toBe('lm_cus_550e8400e29b41d4a716446655440000');
            expect(orderConverted).toBe('lm_ord_550e8400e29b41d4a716446655440000');
        });
    });

    describe('Integration tests', () => {
        it('should work end-to-end', () => {
            // Generate a new ID
            const originalId = generatePrefixedId(ID_PATTERNS.PRODUCT);

            // Validate it
            expect(validatePrefixedId(originalId)).toBe(true);
            expect(validatePrefixedId(originalId, ID_PATTERNS.PRODUCT)).toBe(true);

            // Extract components
            const pattern = extractPattern(originalId);
            const uuid = extractUUID(originalId);

            expect(pattern).toBe('prod');
            expect(uuid).toBeTruthy();
            expect(uuid).toHaveLength(32);

            // Should not be a legacy UUID
            expect(isLegacyUUID(originalId)).toBe(false);
        });

        it('should handle edge cases', () => {
            // Empty string
            expect(validatePrefixedId('')).toBe(false);
            expect(extractPattern('')).toBe(null);
            expect(extractUUID('')).toBe(null);

            // Null values should be handled gracefully by TypeScript
            // These would be caught at compile time, but good to test runtime behavior
        });
    });

    describe('Pattern constants', () => {
        it('should have all expected patterns', () => {
            const expectedPatterns = [
                'cus', 'ord', 'prod', 'var', 'vend', 'cat', 'sess', 'cart',
                'bund', 'del', 'photo', 'art', 'brand', 'rev', 'addr', 'disc',
                'track', 'emp', 'pet', 'occ', 'state', 'slide', 'token'
            ];

            expectedPatterns.forEach(pattern => {
                expect(Object.values(ID_PATTERNS)).toContain(pattern);
            });
        });

        it('should have unique patterns', () => {
            const patterns = Object.values(ID_PATTERNS);
            const uniquePatterns = [...new Set(patterns)];

            expect(patterns.length).toBe(uniquePatterns.length);
        });
    });
}); 