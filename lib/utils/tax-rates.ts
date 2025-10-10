/**
 * Mexico Tax Rate Calculator
 * 
 * Mexico uses IVA (Value Added Tax) with different rates:
 * - Standard Rate: 16% (most of Mexico)
 * - Border Rate: 8% (border states and Quintana Roo)
 * - Zero Rate: 0% (certain essential items - not implemented here)
 */

// Border states that qualify for 8% IVA rate
const BORDER_STATES = [
    'Baja California',
    'Baja California Sur',
    'Sonora',
    'Chihuahua',
    'Coahuila',
    'Nuevo León',
    'Tamaulipas',
    'Quintana Roo', // Tourist zone, gets special rate
];

// Standard IVA rate for most of Mexico
const STANDARD_TAX_RATE = 0.16; // 16%

// Border zone reduced IVA rate
const BORDER_TAX_RATE = 0.08; // 8%

/**
 * Get the applicable tax rate for a given Mexican state
 * @param state - The state name (e.g., "CDMX", "Baja California")
 * @returns The tax rate as a decimal (e.g., 0.16 for 16%)
 */
export function getTaxRate(state: string | null | undefined): number {
    if (!state) {
        return STANDARD_TAX_RATE; // Default to standard rate
    }

    // Normalize state name for comparison
    const normalizedState = state.trim();

    // Check if it's a border state
    const isBorderState = BORDER_STATES.some(
        borderState => normalizedState.toLowerCase().includes(borderState.toLowerCase()) ||
            borderState.toLowerCase().includes(normalizedState.toLowerCase())
    );

    return isBorderState ? BORDER_TAX_RATE : STANDARD_TAX_RATE;
}

/**
 * Calculate tax amount for a given subtotal and state
 * @param subtotal - The subtotal amount
 * @param state - The state name
 * @returns The calculated tax amount
 */
export function calculateTaxForState(subtotal: number, state: string | null | undefined): number {
    const taxRate = getTaxRate(state);
    return subtotal * taxRate;
}

/**
 * Format tax rate as percentage string
 * @param state - The state name
 * @returns Formatted tax rate string (e.g., "16%")
 */
export function getTaxRateLabel(state: string | null | undefined): string {
    const rate = getTaxRate(state);
    return `${(rate * 100).toFixed(0)}%`;
}

/**
 * Check if a state qualifies for the border tax rate
 * @param state - The state name
 * @returns True if border rate applies
 */
export function isBorderState(state: string | null | undefined): boolean {
    if (!state) return false;

    const normalizedState = state.trim();
    return BORDER_STATES.some(
        borderState => normalizedState.toLowerCase().includes(borderState.toLowerCase()) ||
            borderState.toLowerCase().includes(normalizedState.toLowerCase())
    );
}

export { STANDARD_TAX_RATE, BORDER_TAX_RATE, BORDER_STATES };

