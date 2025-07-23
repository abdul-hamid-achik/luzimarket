/**
 * Generate a user-friendly order ID
 * Format: LM-YYMM-XXXX (e.g., LM-2312-A7B9)
 * - LM: Luzimarket prefix
 * - YYMM: Year and month
 * - XXXX: 4-character alphanumeric code
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Generate a 4-character alphanumeric code (uppercase letters and numbers)
  // Avoiding ambiguous characters like 0/O, 1/I/L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `LM-${year}${month}-${code}`;
}

/**
 * Validate order number format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  const pattern = /^LM-\d{4}-[A-Z0-9]{4}$/;
  return pattern.test(orderNumber);
}

/**
 * Extract date info from order number
 */
export function getOrderDate(orderNumber: string): { year: number; month: number } | null {
  const match = orderNumber.match(/^LM-(\d{2})(\d{2})-[A-Z0-9]{4}$/);
  if (!match) return null;
  
  const year = 2000 + parseInt(match[1]);
  const month = parseInt(match[2]);
  
  return { year, month };
}