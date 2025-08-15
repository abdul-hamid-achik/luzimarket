import { db } from "@/db";
import * as schema from "@/db/schema";
import { sql } from "drizzle-orm";
import { initializeShippingData } from "@/lib/actions/shipping";

/**
 * Seeds foundation tables that other tables depend on:
 * - Categories
 * - Shipping zones and methods
 * - Email templates
 */
export async function seedFoundationTables(database = db, options?: any) {
  console.log("🏗️  Setting up foundation tables...");
  
  // 1. Initialize shipping data first (needed for vendor foreign keys)
  const shippingResult = await initializeShippingData();
  if (shippingResult.success) {
    console.log(`✅ ${shippingResult.message}`);
  } else {
    console.log(`⚠️  Shipping data initialization failed: ${shippingResult.error}`);
  }

  // 2. Seed Categories
  const categories = [
    {
      name: "Flores y Arreglos",
      slug: "flores-arreglos",
      description: "Hermosos arreglos florales para toda ocasión: cumpleaños, aniversarios, condolencias y más",
      displayOrder: 1,
      isActive: true
    },
    {
      name: "Chocolates y Dulces",
      slug: "chocolates-dulces",
      description: "Deliciosos chocolates artesanales, bombones y dulces gourmet",
      displayOrder: 2,
      isActive: true
    },
    {
      name: "Velas y Aromas",
      slug: "velas-aromas",
      description: "Velas aromáticas, difusores y productos para crear ambientes especiales",
      displayOrder: 3,
      isActive: true
    },
    {
      name: "Regalos Personalizados",
      slug: "regalos-personalizados",
      description: "Regalos únicos y personalizados para ocasiones especiales",
      displayOrder: 4,
      isActive: true
    },
    {
      name: "Cajas de Regalo",
      slug: "cajas-regalo",
      description: "Cajas curadas con productos selectos para regalar",
      displayOrder: 5,
      isActive: true
    },
    {
      name: "Decoración y Hogar",
      slug: "decoracion-hogar",
      description: "Artículos decorativos y accesorios para el hogar",
      displayOrder: 6,
      isActive: true
    },
    {
      name: "Joyería y Accesorios",
      slug: "joyeria-accesorios",
      description: "Joyería fina y accesorios de moda",
      displayOrder: 7,
      isActive: true
    },
    {
      name: "Gourmet y Delicatessen",
      slug: "gourmet-delicatessen",
      description: "Productos gourmet y delicatessen selectos",
      displayOrder: 8,
      isActive: true
    }
  ];

  await database
    .insert(schema.categories)
    .values(categories)
    .onConflictDoNothing({ target: schema.categories.slug });
  
  const insertedCategories = await database.select().from(schema.categories);

  // 3. Seed Email Templates
  const emailTemplates = [
    {
      name: "welcome",
      subject: "¡Bienvenido a Luzimarket!",
      htmlTemplate: "<h1>Bienvenido {{name}}</h1><p>Gracias por unirte a Luzimarket.</p>",
      textTemplate: "Bienvenido {{name}}. Gracias por unirte a Luzimarket.",
      variables: ["name", "email"],
      isActive: true
    },
    {
      name: "order_confirmation",
      subject: "Confirmación de pedido #{{orderNumber}}",
      htmlTemplate: "<h1>Pedido Confirmado</h1><p>Tu pedido #{{orderNumber}} ha sido confirmado.</p>",
      textTemplate: "Tu pedido #{{orderNumber}} ha sido confirmado.",
      variables: ["name", "email", "orderNumber"],
      isActive: true
    },
    {
      name: "order_shipped",
      subject: "Tu pedido #{{orderNumber}} ha sido enviado",
      htmlTemplate: "<h1>Pedido Enviado</h1><p>Tu pedido #{{orderNumber}} está en camino.</p>",
      textTemplate: "Tu pedido #{{orderNumber}} está en camino.",
      variables: ["name", "email", "orderNumber", "trackingNumber"],
      isActive: true
    },
    {
      name: "vendor_approved",
      subject: "¡Tu solicitud de vendedor ha sido aprobada!",
      htmlTemplate: "<h1>¡Felicidades!</h1><p>Tu tienda {{businessName}} ha sido aprobada.</p>",
      textTemplate: "Tu tienda {{businessName}} ha sido aprobada.",
      variables: ["name", "email", "businessName"],
      isActive: true
    },
    {
      name: "password_reset",
      subject: "Restablecer contraseña - Luzimarket",
      htmlTemplate: "<h1>Restablecer contraseña</h1><p>Haz clic en el enlace para restablecer tu contraseña: {{resetLink}}</p>",
      textTemplate: "Restablecer contraseña: {{resetLink}}",
      variables: ["name", "email", "resetLink"],
      isActive: true
    }
  ];

  await database
    .insert(schema.emailTemplates)
    .values(emailTemplates)
    .onConflictDoUpdate({
      target: schema.emailTemplates.name,
      set: {
        subject: sql`excluded.subject`,
        htmlTemplate: sql`excluded.html_template`,
        textTemplate: sql`excluded.text_template`,
        variables: sql`excluded.variables`,
        isActive: sql`excluded.is_active`,
      },
    });

  return {
    success: true,
    message: `Foundation tables seeded: ${insertedCategories.length} categories, ${emailTemplates.length} email templates`,
    data: {
      categories: insertedCategories,
      emailTemplates: emailTemplates.length
    }
  };
}