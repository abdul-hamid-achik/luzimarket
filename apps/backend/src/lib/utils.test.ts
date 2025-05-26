import { describe, it, expect } from 'vitest'

// Example utility function to test
export function formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function calculateDiscount(price: number, discountPercentage: number): number {
    if (discountPercentage < 0 || discountPercentage > 100) {
        throw new Error('Discount percentage must be between 0 and 100');
    }
    return price * (discountPercentage / 100);
}

// Tests
describe('Utility Functions', () => {
    describe('formatCurrency', () => {
        it('should format currency with default USD', () => {
            expect(formatCurrency(1234.56)).toBe('$1,234.56');
        });

        it('should format currency with specified currency', () => {
            expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
        });

        it('should handle zero amount', () => {
            expect(formatCurrency(0)).toBe('$0.00');
        });
    });

    describe('validateEmail', () => {
        it('should validate correct email format', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
        });

        it('should reject invalid email format', () => {
            expect(validateEmail('invalid-email')).toBe(false);
            expect(validateEmail('test@')).toBe(false);
            expect(validateEmail('@domain.com')).toBe(false);
            expect(validateEmail('test.domain.com')).toBe(false);
        });
    });

    describe('calculateDiscount', () => {
        it('should calculate discount correctly', () => {
            expect(calculateDiscount(100, 10)).toBe(10);
            expect(calculateDiscount(250, 25)).toBe(62.5);
        });

        it('should handle zero discount', () => {
            expect(calculateDiscount(100, 0)).toBe(0);
        });

        it('should handle 100% discount', () => {
            expect(calculateDiscount(100, 100)).toBe(100);
        });

        it('should throw error for invalid discount percentage', () => {
            expect(() => calculateDiscount(100, -5)).toThrow('Discount percentage must be between 0 and 100');
            expect(() => calculateDiscount(100, 105)).toThrow('Discount percentage must be between 0 and 100');
        });
    });
}); 