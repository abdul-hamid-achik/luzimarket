import { faker } from '@faker-js/faker';

/**
 * Generate a power law distribution
 * Most items get few, some items get many
 */
export function powerLawDistribution(
  total: number,
  items: number,
  minPer: number = 1,
  alpha: number = 1.5
): number[] {
  const distribution: number[] = [];
  let remaining = total;
  
  for (let i = 0; i < items - 1; i++) {
    const rank = i + 1;
    const share = Math.floor(total * Math.pow(rank, -alpha) / 
      Array.from({length: items}, (_, j) => Math.pow(j + 1, -alpha))
        .reduce((a, b) => a + b, 0));
    
    const allocated = Math.max(minPer, Math.min(share, remaining - (items - i - 1) * minPer));
    distribution.push(allocated);
    remaining -= allocated;
  }
  
  distribution.push(Math.max(minPer, remaining));
  return distribution.sort((a, b) => b - a); // Descending order
}

/**
 * Generate seasonal order volumes
 */
export function seasonalOrderVolume(
  baseOrders: number,
  month: number,
  dayOfMonth: number
): number {
  const seasonalMultipliers: Record<number, number> = {
    1: 0.7,   // January - post holiday slump
    2: 1.4,   // February - Valentine's Day
    3: 0.9,   // March
    4: 1.0,   // April
    5: 1.8,   // May - Mother's Day (May 10 in Mexico)
    6: 0.8,   // June
    7: 0.8,   // July
    8: 0.9,   // August
    9: 1.1,   // September - Independence Day
    10: 1.2,  // October - Day of the Dead prep
    11: 1.5,  // November - Buen Fin
    12: 2.2   // December - Christmas
  };
  
  let multiplier = seasonalMultipliers[month] || 1.0;
  
  // Special day boosts
  if (month === 2 && dayOfMonth >= 12 && dayOfMonth <= 14) {
    multiplier *= 2.5; // Valentine's peak
  }
  if (month === 5 && dayOfMonth >= 8 && dayOfMonth <= 10) {
    multiplier *= 3.0; // Mother's Day peak
  }
  if (month === 12 && dayOfMonth >= 15 && dayOfMonth <= 24) {
    multiplier *= 1.5; // Christmas rush
  }
  
  // Weekend boost
  const dayOfWeek = new Date(2024, month - 1, dayOfMonth).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    multiplier *= 1.2;
  }
  
  return Math.round(baseOrders * multiplier);
}

/**
 * Customer lifetime value segments
 */
export function customerSegments(totalCustomers: number) {
  return {
    vip: Math.floor(totalCustomers * 0.05),        // 5% VIP (10+ orders)
    loyal: Math.floor(totalCustomers * 0.15),      // 15% Loyal (5-10 orders)
    regular: Math.floor(totalCustomers * 0.30),    // 30% Regular (2-4 orders)
    occasional: Math.floor(totalCustomers * 0.50)  // 50% Occasional (1 order)
  };
}

/**
 * Realistic vendor performance tiers
 */
export function vendorPerformanceTiers(vendors: any[]) {
  const sorted = [...vendors];
  
  return {
    topPerformers: sorted.slice(0, Math.floor(sorted.length * 0.2)),      // Top 20%
    established: sorted.slice(
      Math.floor(sorted.length * 0.2), 
      Math.floor(sorted.length * 0.5)
    ),                                                                      // Next 30%
    growing: sorted.slice(
      Math.floor(sorted.length * 0.5), 
      Math.floor(sorted.length * 0.8)
    ),                                                                      // Next 30%
    struggling: sorted.slice(Math.floor(sorted.length * 0.8))             // Bottom 20%
  };
}

/**
 * Product popularity distribution (Pareto principle)
 */
export function productPopularity(products: any[]) {
  const total = products.length;
  
  return products.map((product, index) => {
    const rank = index + 1;
    const popularity = Math.pow(total - rank + 1, 2) / Math.pow(total, 2);
    
    return {
      ...product,
      popularityScore: popularity,
      expectedDailySales: Math.max(0.1, popularity * 10),
      stockLevel: Math.round(popularity * 100),
      reviewCount: Math.round(popularity * 50)
    };
  });
}

/**
 * Realistic pricing based on category and vendor type
 */
export function realisticPricing(
  category: string,
  vendorType: 'boutique' | 'established' | 'enterprise' | 'artisan' | 'dropshipper'
): number {
  const basePrices: Record<string, { min: number; max: number }> = {
    'flores-arreglos': { min: 399, max: 2499 },
    'chocolates-dulces': { min: 199, max: 999 },
    'velas-aromas': { min: 149, max: 599 },
    'regalos-personalizados': { min: 299, max: 1499 },
    'cajas-regalo': { min: 499, max: 2999 },
    'decoracion-hogar': { min: 299, max: 1999 },
    'joyeria-accesorios': { min: 599, max: 4999 },
    'gourmet-delicatessen': { min: 399, max: 2499 }
  };
  
  const vendorMultipliers = {
    boutique: 1.2,
    established: 1.0,
    enterprise: 0.9,
    artisan: 1.3,
    dropshipper: 0.8
  };
  
  const range = basePrices[category] || { min: 299, max: 1999 };
  const basePrice = faker.number.int({ min: range.min, max: range.max });
  const adjustedPrice = Math.round(basePrice * vendorMultipliers[vendorType]);
  
  // Round to nearest 50 or 99
  if (adjustedPrice < 500) {
    return Math.round(adjustedPrice / 50) * 50 - 1; // 149, 199, 249, etc.
  } else {
    return Math.round(adjustedPrice / 100) * 100 - 1; // 499, 599, 999, etc.
  }
}

/**
 * Cart abandonment simulation
 */
export function cartAbandonmentRate(): boolean {
  // Industry average: 70% abandonment
  return Math.random() < 0.7;
}

/**
 * Review likelihood based on order value and customer segment
 */
export function reviewLikelihood(
  orderValue: number,
  customerType: 'vip' | 'loyal' | 'regular' | 'occasional'
): boolean {
  const baseProbabilities = {
    vip: 0.7,
    loyal: 0.5,
    regular: 0.3,
    occasional: 0.15
  };
  
  let probability = baseProbabilities[customerType];
  
  // Higher value orders more likely to get reviews
  if (orderValue > 2000) probability *= 1.3;
  if (orderValue > 5000) probability *= 1.5;
  
  return Math.random() < Math.min(1, probability);
}