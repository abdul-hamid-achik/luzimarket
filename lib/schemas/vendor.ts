import { z } from "zod";

export const vendorRegistrationSchema = z.object({
  // Business information
  businessName: z.string().min(2, "El nombre del negocio debe tener al menos 2 caracteres"),
  contactName: z.string().min(2, "El nombre del responsable debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  businessPhone: z.string().min(10, "Teléfono inválido"),
  businessHours: z.string().optional(),
  
  // Address
  street: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  city: z.string().min(2, "Ciudad requerida"),
  state: z.string().min(2, "Estado requerido"),
  country: z.string().min(1, "País requerido"),
  postalCode: z.string().optional(),
  
  // Online presence
  websiteUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  
  // Delivery
  hasDelivery: z.boolean(),
  deliveryService: z.enum(["own", "external", "none"]).optional(),
  
  // Social media
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
});

export type VendorRegistration = z.infer<typeof vendorRegistrationSchema>;