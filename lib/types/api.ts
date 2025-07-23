import { z } from "zod";

// Generic API Response type with proper discrimination
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Type guard for API responses
export function isApiSuccess<T>(response: ApiResponse<T>): response is { success: true; data: T } {
  return response.success === true;
}

export function isApiError<T>(response: ApiResponse<T>): response is { success: false; error: string } {
  return response.success === false;
}

// Report data schemas
export const salesReportDataSchema = z.object({
  summary: z.object({
    totalOrders: z.number(),
    totalRevenue: z.number(),
  }),
  dailyData: z.array(z.object({
    date: z.string(),
    orderCount: z.number(),
    totalRevenue: z.number(),
  })),
  topProducts: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    quantitySold: z.number(),
    revenue: z.number(),
  })),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export const revenueReportDataSchema = z.object({
  currentBalance: z.object({
    availableBalance: z.string(),
    pendingBalance: z.string(),
    reservedBalance: z.string(),
  }),
  transactions: z.array(z.object({
    type: z.string(),
    status: z.string(),
    totalAmount: z.number(),
    count: z.number(),
  })),
  payouts: z.array(z.object({
    status: z.string(),
    totalAmount: z.number(),
    count: z.number(),
  })),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export const productsReportDataSchema = z.object({
  productPerformance: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    currentStock: z.number(),
    price: z.string(),
    quantitySold: z.number(),
    revenue: z.number(),
    orderCount: z.number(),
  })),
  inventoryValue: z.number(),
  lowStockCount: z.number(),
  lowStockProducts: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    currentStock: z.number(),
  })),
  totalProducts: z.number(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export const payoutsReportDataSchema = z.object({
  summary: z.object({
    total: z.number(),
    pending: z.number(),
    processing: z.number(),
    paid: z.number(),
    failed: z.number(),
    pendingCount: z.number(),
    processingCount: z.number(),
    paidCount: z.number(),
    failedCount: z.number(),
  }),
  payouts: z.array(z.object({
    id: z.string(),
    vendorId: z.string(),
    amount: z.string(),
    status: z.string(),
    method: z.string(),
    createdAt: z.date(),
    processedAt: z.date().nullable(),
    arrivalDate: z.date().nullable(),
    failureReason: z.string().nullable(),
  })),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export const platformOverviewDataSchema = z.object({
  platformRevenue: z.string(),
  totalSales: z.object({
    amount: z.string(),
    count: z.number(),
  }),
  vendorStats: z.object({
    totalVendors: z.number(),
    activeVendors: z.number(),
  }),
  topVendors: z.array(z.object({
    vendorId: z.string(),
    vendorName: z.string(),
    revenue: z.string(),
    orderCount: z.number(),
  })),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

export const downloadReportDataSchema = z.object({
  content: z.string(),
  filename: z.string(),
  contentType: z.string(),
});

// Type definitions
export type SalesReportData = z.infer<typeof salesReportDataSchema>;
export type RevenueReportData = z.infer<typeof revenueReportDataSchema>;
export type ProductsReportData = z.infer<typeof productsReportDataSchema>;
export type PayoutsReportData = z.infer<typeof payoutsReportDataSchema>;
export type PlatformOverviewData = z.infer<typeof platformOverviewDataSchema>;
export type DownloadReportData = z.infer<typeof downloadReportDataSchema>;

// Union type for all report data
export type ReportData =
  | SalesReportData
  | RevenueReportData
  | ProductsReportData
  | PayoutsReportData
  | PlatformOverviewData;

// Stripe Connect data schemas
export const stripeRequirementsSchema = z.object({
  currentlyDue: z.array(z.string()),
  eventuallyDue: z.array(z.string()),
  pastDue: z.array(z.string()),
  pendingVerification: z.array(z.string()),
  errors: z.array(z.object({
    code: z.string(),
    reason: z.string(), 
    requirement: z.string(),
  })),
});

export const stripeCapabilitiesSchema = z.record(z.string());

export const stripeBusinessProfileSchema = z.object({
  mcc: z.string().optional(),
  name: z.string().optional(),
  url: z.string().optional(),
  supportEmail: z.string().optional(),
  supportPhone: z.string().optional(),
}).catchall(z.any());

// Type definitions for Stripe Connect
export type StripeRequirements = z.infer<typeof stripeRequirementsSchema>;
export type StripeCapabilities = z.infer<typeof stripeCapabilitiesSchema>;
export type StripeBusinessProfile = z.infer<typeof stripeBusinessProfileSchema>;

// Report parameters schema for frontend
export const reportParamsSchema = z.object({
  vendorId: z.string().uuid().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reportType: z.enum([
    "sales",
    "revenue", 
    "products",
    "payouts",
    "platform_overview",
  ]),
});

export type ReportParams = z.infer<typeof reportParamsSchema>;