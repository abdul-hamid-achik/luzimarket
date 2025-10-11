import { z } from "zod";

/**
 * ValidationService
 * Centralized validation schemas for the entire application
 * All Zod schemas extracted from routes and consolidated here
 */

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const registerSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Contraseña requerida"),
    userType: z.enum(["customer", "vendor", "admin"]).optional(),
});

export const requestResetSchema = z.object({
    email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token requerido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export const verify2FASchema = z.object({
    code: z.string().length(6, "El código debe tener 6 dígitos"),
    backupCode: z.string().optional(),
});

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const createProductSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    price: z.number().positive("El precio debe ser mayor que 0"),
    stock: z.number().int().nonnegative("El stock no puede ser negativo"),
    categoryId: z.number().int("ID de categoría inválido"),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).min(1, "Debes subir al menos una imagen"),
});

export const updateProductSchema = z.object({
    name: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
    categoryId: z.number().int().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

export const productFiltersSchema = z.object({
    categoryIds: z.array(z.string()).optional(),
    vendorIds: z.array(z.string()).optional(),
    productIds: z.array(z.string()).optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    tags: z.array(z.string()).optional(),
    minRating: z.number().min(1).max(5).optional(),
    availability: z.enum(["in-stock", "out-of-stock", "low-stock"]).optional(),
    sortBy: z.enum(["price-asc", "price-desc", "name", "newest", "rating", "popularity"]).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(50).optional(),
});

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const createOrderSchema = z.object({
    items: z.array(z.object({
        id: z.string(),
        quantity: z.number().int().min(1),
        price: z.number().positive(),
        name: z.string(),
        vendorId: z.string(),
        vendorName: z.string(),
    })).min(1, "Debes tener al menos un producto en el carrito"),
    shippingAddress: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        address: z.string().min(1),
        apartment: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        postalCode: z.string().min(1),
        country: z.string().default("MX"),
    }),
    billingAddress: z.object({
        address: z.string().min(1),
        apartment: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        postalCode: z.string().min(1),
        country: z.string().default("MX"),
    }).optional(),
    isGuest: z.boolean().optional(),
    selectedShipping: z.any().optional(),
    selectedShippingByVendor: z.any().optional(),
    shippingCostsByVendor: z.any().optional(),
});

export const ordersQuerySchema = z.object({
    search: z.string().optional(),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'all']).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
});

export const orderStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    notes: z.string().optional(),
    trackingNumber: z.string().optional(),
    carrier: z.string().optional(),
});

export const cancelOrderSchema = z.object({
    reason: z.string().min(10, "Por favor proporciona una razón de al menos 10 caracteres"),
});

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

export const createReviewSchema = z.object({
    productId: z.string(),
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().min(10, "La opinión debe tener al menos 10 caracteres"),
});

export const updateReviewSchema = z.object({
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().optional(),
    comment: z.string().min(10).optional(),
});

export const markReviewHelpfulSchema = z.object({
    helpful: z.boolean(),
});

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

export const contactSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres"),
    message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

// ============================================================================
// VENDOR SCHEMAS
// ============================================================================

export const vendorRegistrationSchema = z.object({
    businessName: z.string().min(3, "El nombre del negocio debe tener al menos 3 caracteres"),
    contactName: z.string().min(2, "El nombre de contacto debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    phone: z.string().min(10, "Teléfono inválido"),
    businessDescription: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
    address: z.string().min(5, "Dirección requerida"),
    city: z.string().min(2, "Ciudad requerida"),
    state: z.string().min(2, "Estado requerido"),
    postalCode: z.string().min(5, "Código postal requerido"),
    businessType: z.string().optional(),
    taxId: z.string().optional(),
});

export const updateVendorProfileSchema = z.object({
    businessName: z.string().min(3).optional(),
    contactName: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    businessDescription: z.string().min(20).optional(),
    address: z.string().min(5).optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    postalCode: z.string().min(5).optional(),
    businessType: z.string().optional(),
    taxId: z.string().optional(),
    logo: z.string().optional(),
    banner: z.string().optional(),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const updateUserProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
});

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const adminUsersQuerySchema = z.object({
    search: z.string().optional(),
    userType: z.enum(['customer', 'vendor', 'admin', 'all']).optional(),
    status: z.enum(['active', 'inactive', 'locked', 'all']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

export const updateUserStatusSchema = z.object({
    isActive: z.boolean(),
    reason: z.string().optional(),
});

export const lockUserAccountSchema = z.object({
    durationMinutes: z.number().int().min(1).max(10080).optional(), // Max 1 week
    reason: z.string().min(10),
});

// ============================================================================
// NEWSLETTER SCHEMAS
// ============================================================================

export const newsletterSubscribeSchema = z.object({
    email: z.string().email("Email inválido"),
    name: z.string().optional(),
});

// ============================================================================
// SHIPPING SCHEMAS
// ============================================================================

export const calculateShippingSchema = z.object({
    items: z.array(z.object({
        weight: z.number().positive().optional(),
        dimensions: z.object({
            length: z.number().positive(),
            width: z.number().positive(),
            height: z.number().positive(),
        }).optional(),
    })).optional(),
    destination: z.object({
        postalCode: z.string().min(5),
        state: z.string().min(2),
        city: z.string().min(2),
    }),
    vendorId: z.string().optional(),
});

// ============================================================================
// COUPON SCHEMAS
// ============================================================================

export const applyCouponSchema = z.object({
    code: z.string().min(3, "Código de cupón inválido"),
    orderTotal: z.number().positive(),
});

export const createCouponSchema = z.object({
    code: z.string().min(3).max(20),
    type: z.enum(['percentage', 'fixed']),
    value: z.number().positive(),
    minOrderValue: z.number().nonnegative().optional(),
    maxDiscount: z.number().positive().optional(),
    expiresAt: z.string().or(z.date()).optional(),
    usageLimit: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates data against a schema and returns typed result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string; details?: z.ZodError } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors[0]?.message || "Datos inválidos",
                details: error,
            };
        }
        return { success: false, error: "Error de validación desconocido" };
    }
}

/**
 * Safe parse that returns the validation result
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown) {
    return schema.safeParse(data);
}

