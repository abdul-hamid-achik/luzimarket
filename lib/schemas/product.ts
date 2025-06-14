import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "El precio debe ser un número positivo",
  }),
  categoryId: z.number().positive("Selecciona una categoría"),
  stock: z.number().int().min(0, "El stock no puede ser negativo").default(0),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export type Product = z.infer<typeof productSchema>;