// Business configuration values from environment variables
// These values can be adjusted per region or business requirements

export const businessConfig = {
  // Tax configuration
  tax: {
    rate: parseFloat(process.env.TAX_RATE || '0.16'),
    name: process.env.TAX_NAME || 'IVA',
  },

  // Platform commission
  commission: {
    rate: parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.15'),
  },

  // Shipping configuration (in MXN)
  shipping: {
    defaultCost: parseFloat(process.env.DEFAULT_SHIPPING_COST || '99'),
    freeThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '1000'),
  },

  // Social media links
  social: {
    instagram: process.env.SOCIAL_INSTAGRAM_URL || 'https://instagram.com/luzimarket',
    facebook: process.env.SOCIAL_FACEBOOK_URL || 'https://facebook.com/luzimarket',
    tiktok: process.env.SOCIAL_TIKTOK_URL || 'https://tiktok.com/@luzimarket',
    twitter: process.env.SOCIAL_TWITTER_URL || 'https://twitter.com/luzimarket',
  },
} as const;

// Helper functions for common calculations
export function calculateTax(subtotal: number): number {
  return subtotal * businessConfig.tax.rate;
}

export function calculateCommission(amount: number): number {
  return amount * businessConfig.commission.rate;
}

export function calculateShipping(subtotal: number, shippingCost?: number): number {
  if (subtotal >= businessConfig.shipping.freeThreshold) {
    return 0;
  }
  return shippingCost ?? businessConfig.shipping.defaultCost;
}