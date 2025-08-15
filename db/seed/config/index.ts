// Seed configuration for realistic e-commerce data
export const SEED_CONFIG = {
  // Core entities
  categories: 8,           // Main product categories
  vendors: 25,             // Active marketplace vendors
  products: 500,           // Total products across all vendors
  productVariants: 1200,   // Variants (sizes, colors) for ~40% of products
  users: 200,              // Registered customers
  
  // Orders and transactions
  orders: 350,             // Historical orders (last 90 days)
  orderItemsPerOrder: {    // Items per order
    min: 1,
    max: 5,
    avg: 2.3
  },
  reviews: 180,            // Product reviews (~50% of delivered orders)
  
  // Financial data
  vendorPayouts: 45,       // Completed payouts (weekly for active vendors)
  
  // Supporting data
  adminUsers: 5,           // Platform administrators
  subscriptions: 500,      // Newsletter subscribers
  stockReservations: 30,   // Active cart reservations
  
  // Image moderation
  moderationRecords: 100,  // Image review records
  
  // Distribution patterns
  orderStatusDistribution: {
    delivered: 0.60,       // 60% completed
    shipped: 0.20,         // 20% in transit
    processing: 0.15,      // 15% being prepared
    pending: 0.05          // 5% awaiting payment
  },
  
  vendorActivityDistribution: {
    veryActive: 0.20,      // 20% have 30+ products
    active: 0.40,          // 40% have 10-30 products
    moderate: 0.30,        // 30% have 5-10 products
    inactive: 0.10         // 10% have <5 products
  },
  
  productPriceRanges: {
    budget: { min: 99, max: 499, weight: 0.30 },
    mid: { min: 500, max: 1999, weight: 0.50 },
    premium: { min: 2000, max: 9999, weight: 0.20 }
  },
  
  reviewRatingDistribution: {
    5: 0.45,  // 45% five stars
    4: 0.30,  // 30% four stars
    3: 0.15,  // 15% three stars
    2: 0.07,  // 7% two stars
    1: 0.03   // 3% one star
  }
};

// Realistic Mexican e-commerce categories
export const CATEGORIES_CONFIG = [
  { name: "Flores y Arreglos", slug: "flores-arreglos", avgPrice: 850, productCount: 80 },
  { name: "Chocolates y Dulces", slug: "chocolates-dulces", avgPrice: 450, productCount: 70 },
  { name: "Velas y Aromas", slug: "velas-aromas", avgPrice: 350, productCount: 60 },
  { name: "Regalos Personalizados", slug: "regalos-personalizados", avgPrice: 750, productCount: 55 },
  { name: "Cajas de Regalo", slug: "cajas-regalo", avgPrice: 1200, productCount: 50 },
  { name: "Decoración y Hogar", slug: "decoracion-hogar", avgPrice: 650, productCount: 65 },
  { name: "Joyería y Accesorios", slug: "joyeria-accesorios", avgPrice: 1800, productCount: 60 },
  { name: "Gourmet y Delicatessen", slug: "gourmet-delicatessen", avgPrice: 950, productCount: 60 }
];

// Vendor types for realistic marketplace
export const VENDOR_TYPES = [
  { type: "boutique", commission: 15, productRange: [5, 15] },
  { type: "established", commission: 12, productRange: [15, 40] },
  { type: "enterprise", commission: 10, productRange: [40, 100] },
  { type: "artisan", commission: 18, productRange: [3, 10] },
  { type: "dropshipper", commission: 20, productRange: [20, 50] }
];

// Seasonal patterns for orders
export const SEASONAL_PATTERNS = {
  // Mexican holidays and shopping patterns
  highSeasons: [
    { month: 2, multiplier: 1.8 },  // Valentine's Day
    { month: 5, multiplier: 2.0 },  // Mother's Day (May 10)
    { month: 12, multiplier: 2.5 }, // Christmas
  ],
  normalSeasons: [
    { month: 1, multiplier: 0.8 },  // January (post-holiday)
    { month: 3, multiplier: 1.0 },
    { month: 4, multiplier: 1.1 },
    { month: 6, multiplier: 0.9 },
    { month: 7, multiplier: 0.9 },
    { month: 8, multiplier: 1.0 },
    { month: 9, multiplier: 1.1 },  // Independence Day
    { month: 10, multiplier: 1.2 }, // Day of the Dead prep
    { month: 11, multiplier: 1.5 }, // Buen Fin (Mexican Black Friday)
  ]
};