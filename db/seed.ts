import { config } from "dotenv";
import { reset } from "drizzle-seed";
import { fakerES_MX as faker } from "@faker-js/faker";
import * as schema from "./schema";
import { generateAndUploadImage, generateProductImagePrompt, generateCategoryImagePrompt } from "../lib/openai";
import { eq, sql } from "drizzle-orm";
import slugify from "slugify";
import bcrypt from "bcryptjs";
import { initializeShippingData } from "../lib/actions/shipping";

// Load environment variables before importing db
config({ path: ".env.local" });

import { db } from "./index";

// Set a fixed seed for consistent data generation
faker.seed(12345);


// Fixed data
const CATEGORIES = [
  {
    name: "Flores y Arreglos",
    slug: "flores-arreglos",
    description: "Hermosos arreglos florales para toda ocasión: cumpleaños, aniversarios, condolencias y más",
    imageUrl: null, // Will be generated with AI
    displayOrder: 1
  },
  {
    name: "Chocolates y Dulces",
    slug: "chocolates-dulces",
    description: "Deliciosos chocolates artesanales, bombones y dulces gourmet",
    imageUrl: null, // Will be generated with AI
    displayOrder: 2
  },
  {
    name: "Velas y Aromas",
    slug: "velas-aromas",
    description: "Velas aromáticas, difusores y productos para crear ambientes especiales",
    imageUrl: null, // Will be generated with AI
    displayOrder: 3
  },
  {
    name: "Regalos Personalizados",
    slug: "regalos-personalizados",
    description: "Regalos únicos y personalizados para ocasiones especiales",
    imageUrl: null, // Will be generated with AI
    displayOrder: 4
  },
  {
    name: "Cajas de Regalo",
    slug: "cajas-regalo",
    description: "Cajas curadas con productos selectos para regalar",
    imageUrl: null, // Will be generated with AI
    displayOrder: 5
  },
  {
    name: "Decoración y Hogar",
    slug: "decoracion-hogar",
    description: "Artículos decorativos y accesorios para el hogar",
    imageUrl: null, // Will be generated with AI
    displayOrder: 6
  },
  {
    name: "Joyería y Accesorios",
    slug: "joyeria-accesorios",
    description: "Joyería fina y accesorios de moda",
    imageUrl: null, // Will be generated with AI
    displayOrder: 7
  },
  {
    name: "Gourmet y Delicatessen",
    slug: "gourmet-delicatessen",
    description: "Productos gourmet, vinos y delicatessen",
    imageUrl: null, // Will be generated with AI
    displayOrder: 8
  },
  {
    name: "Eventos y Cenas",
    slug: "eventos-cenas",
    description: "Servicios y productos para eventos especiales, cenas románticas y celebraciones",
    imageUrl: null, // Will be generated with AI
    displayOrder: 9
  }
];

const PRODUCT_NAMES = [
  // Flores y Arreglos
  "Ramo de Rosas Premium",
  "Bouquet de Girasoles",
  "Orquídea en Maceta",
  "Arreglo Floral Primaveral",
  "Ramo de Tulipanes",
  "Centro de Mesa Floral",
  "Bouquet de Peonías",
  "Arreglo de Flores Silvestres",
  "Ramo de Lirios Blancos",
  "Arreglo de Alcatraces",
  "Bouquet de Gerberas",
  "Corona Floral",
  "Ramo de Lavanda",
  "Arreglo de Suculentas",
  "Bouquet de Flores Mixtas",

  // Chocolates y Dulces
  "Caja de Chocolates Artesanales",
  "Trufas de Chocolate Belga",
  "Chocolates Ferrero Rocher",
  "Brownies Artesanales",
  "Bombones de Licor",
  "Chocolate Oaxaqueño",
  "Macarons Franceses",
  "Galletas Decoradas",
  "Paletas de Chocolate",
  "Caja de Chocolates Suizos",
  "Dulces Típicos Mexicanos",
  "Chocolates Rellenos",
  "Barras de Chocolate Gourmet",
  "Pretzels Cubiertos",
  "Chocolates Sin Azúcar",

  // Velas y Aromas
  "Vela Aromática de Lavanda",
  "Set de Velas Aromáticas",
  "Difusor de Aromas",
  "Vela de Soya Natural",
  "Incienso Natural",
  "Aceites Esenciales",
  "Vela de Masaje",
  "Aromatizador de Ambiente",
  "Velas Flotantes",
  "Set de Spa Aromático",
  "Vela de Citronela",
  "Difusor de Bambú",
  "Sales de Baño Aromáticas",
  "Potpurrí Natural",
  "Velas Decorativas",

  // Regalos Personalizados
  "Album Fotográfico Personalizado",
  "Taza Personalizada",
  "Marco Digital Inteligente",
  "Libro de Recuerdos",
  "Cojín Personalizado",
  "Llavero Grabado",
  "Placa Conmemorativa",
  "Retrato Personalizado",
  "Joyero Grabado",
  "Reloj Personalizado",
  "Termo Personalizado",
  "Agenda Personalizada",
  "Funda de Celular Personalizada",
  "Puzzle Personalizado",
  "Manta Personalizada",

  // Cajas de Regalo
  "Caja Regalo Spa",
  "Caja Desayuno Sorpresa",
  "Caja Romántica",
  "Kit de Café Especialidad",
  "Caja de Té Premium",
  "Box de Cuidado Personal",
  "Caja de Vinos",
  "Kit de Barbacoa",
  "Caja de Snacks Gourmet",
  "Box de Productos Orgánicos",
  "Caja de Cerveza Artesanal",
  "Kit de Coctelería",
  "Box de Productos Mexicanos",
  "Caja de Bienestar",
  "Kit de Arte y Manualidades",

  // Decoración y Hogar
  "Jarrón de Talavera",
  "Espejo Decorativo",
  "Maceta Artesanal",
  "Cuadro Decorativo",
  "Tapete Artesanal",
  "Lámpara Decorativa",
  "Reloj de Pared",
  "Portavelas de Cristal",
  "Cesta Decorativa",
  "Figura Decorativa",
  "Cortina de Macramé",
  "Portarretratos Vintage",
  "Adorno de Mesa",
  "Móvil Decorativo",
  "Escultura Artesanal",

  // Joyería y Accesorios
  "Collar de Plata",
  "Pulsera de Oro",
  "Aretes de Perlas",
  "Anillo de Compromiso",
  "Reloj de Lujo",
  "Brazalete de Cuero",
  "Dije de Plata",
  "Cadena de Oro",
  "Anillo de Plata",
  "Broche Vintage",
  "Gemelos de Plata",
  "Tobillera de Oro",
  "Piercing de Oro",
  "Set de Joyería",
  "Collar de Piedras Preciosas",

  // Gourmet y Delicatessen
  "Canasta Gourmet Premium",
  "Tabla de Quesos Gourmet",
  "Vino Tinto Reserva",
  "Aceite de Oliva Extra Virgen",
  "Miel Artesanal",
  "Mermeladas Gourmet",
  "Café de Especialidad",
  "Té Premium Importado",
  "Especias Exóticas",
  "Conservas Gourmet",
  "Vinagre Balsámico",
  "Pasta Italiana Premium",
  "Caviar Premium",
  "Jamón Serrano",
  "Queso Artesanal"
];

// Realistic price ranges for each category (in MXN)
const CATEGORY_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  "flores-arreglos": { min: 399, max: 2499 },
  "chocolates-dulces": { min: 199, max: 999 },
  "velas-aromas": { min: 149, max: 599 },
  "regalos-personalizados": { min: 299, max: 1499 },
  "cajas-regalo": { min: 499, max: 2999 },
  "decoracion-hogar": { min: 299, max: 1999 },
  "joyeria-accesorios": { min: 599, max: 4999 },
  "gourmet-delicatessen": { min: 399, max: 2499 }
};

const BUSINESS_HOURS = [
  "Lun-Sab: 8:00-20:00, Dom: 9:00-18:00",
  "Lun-Vie: 10:00-19:00, Sab: 10:00-17:00",
  "Lun-Vie: 11:00-19:00, Sab: 11:00-16:00",
  "Lun-Dom: 9:00-21:00",
  "Mar-Dom: 10:00-18:00"
];

const CITIES = ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Querétaro"];
const STATES = ["CDMX", "Jalisco", "Nuevo León", "Puebla", "Querétaro"];

const VENDOR_PREFIXES = [
  "Boutique", "Casa", "Tienda", "Atelier", "Estudio", "Galería", "Rincón",
  "Jardín", "Tesoro", "Arte", "Dulce", "Bella", "Luna", "Sol", "Magia"
];

const VENDOR_SUFFIXES = [
  "de Regalos", "Floral", "Gourmet", "Artesanal", "Creativo", "Exclusivo",
  "Premium", "Deluxe", "& Co.", "Mexicano", "Boutique", "Studio", "Express"
];

async function main() {
  console.log("🌱 Starting seed...");

  // Available command line flags:
  // --no-reset: Skip database reset
  // --no-images: Skip AI image generation
  // --force-images: Force regenerate existing images
  // --fast: Limit image generation to 10 items for testing

  // Check command line flags
  const shouldReset = !process.argv.includes('--no-reset');
  const shouldGenerateImages = !process.argv.includes('--no-images') && !!process.env.OPENAI_SECRET_KEY;
  const forceRegenerateImages = process.argv.includes('--force-images'); // Force regenerate existing images
  const imageBatchSize = process.argv.includes('--fast') ? 10 : 100; // Limit images in fast mode

  try {
    // Reset database if needed
    if (shouldReset) {
      console.log("🧹 Resetting database...");

      // Use drizzle-seed reset with node-postgres driver for compatibility
      try {
        // Import node-postgres driver only when needed
        const { drizzle } = await import('drizzle-orm/node-postgres');
        const { Client } = await import('pg');

        // Create a temporary connection with node-postgres for reset
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
        });

        await client.connect();
        const pgDb = drizzle(client, { schema });

        // Reset using the pg driver connection
        await reset(pgDb, schema);

        // Close the temporary connection
        await client.end();

        console.log("✅ Database reset complete");
      } catch (resetError: any) {
        console.error("❌ Failed to reset database:", resetError);
        throw resetError;
      }
    } else {
      console.log("⚡ Skipping database reset (--no-reset flag detected)");
    }

    console.log("📦 Seeding database...");

    // 1. Seed Categories
    console.log("🏷️  Creating categories...");
    const categories = await db.insert(schema.categories).values(CATEGORIES).returning();
    console.log(`✅ Created ${categories.length} categories`);

    // 2. Seed Admin Users
    console.log("👤 Creating admin users...");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Ensure admin user exists (upsert approach)
    const adminUsersData = [
      {
        email: "admin@luzimarket.shop",
        name: "Administrador Principal",
        passwordHash: hashedPassword,
        role: "super_admin" as const,
        isActive: true
      },
      {
        email: "support@luzimarket.shop",
        name: "Soporte Técnico",
        passwordHash: hashedPassword,
        role: "admin" as const,
        isActive: true
      },
      {
        email: "manager@luzimarket.shop",
        name: "Gerente de Ventas",
        passwordHash: hashedPassword,
        role: "admin" as const,
        isActive: true
      }
    ];

    const adminUsers = [];
    for (const userData of adminUsersData) {
      try {
        // Try to insert, if it fails due to unique constraint, update instead
        const [user] = await db.insert(schema.adminUsers).values(userData).returning();
        adminUsers.push(user);
        console.log(`✅ Created admin user: ${userData.email}`);
      } catch (error: any) {
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          // User exists, update password and ensure it's active
          console.log(`👤 Admin user ${userData.email} already exists, updating...`);
          const [user] = await db.update(schema.adminUsers)
            .set({
              passwordHash: hashedPassword,
              isActive: true,
              name: userData.name,
              role: userData.role
            })
            .where(eq(schema.adminUsers.email, userData.email))
            .returning();
          adminUsers.push(user);
          console.log(`✅ Updated admin user: ${userData.email}`);
        } else {
          console.error(`❌ Error creating admin user ${userData.email}:`, error);
          throw error;
        }
      }
    }
    console.log(`✅ Ensured ${adminUsers.length} admin users exist`);

    // 3. Seed Email Templates
    console.log("📧 Creating email templates...");
    const emailTemplates = await db.insert(schema.emailTemplates).values([
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
      }
    ]).returning();
    console.log(`✅ Created ${emailTemplates.length} email templates`);

    // 4. Seed Vendors
    console.log("🏪 Creating vendors...");
    const vendorData = [];
    // Add a default password hash for all test vendors
    const defaultPasswordHash = await bcrypt.hash("password123", 10);

    for (let i = 0; i < 20; i++) {
      const prefix = faker.helpers.arrayElement(VENDOR_PREFIXES);
      const suffix = faker.helpers.arrayElement(VENDOR_SUFFIXES);
      const businessName = `${prefix} ${suffix}`;
      vendorData.push({
        businessName,
        slug: slugify(businessName + "-" + i, { lower: true, strict: true }), // Use index instead of random string
        contactName: faker.person.fullName(),
        email: faker.internet.email(),
        passwordHash: defaultPasswordHash, // All test vendors use password123
        phone: faker.phone.number(),
        whatsapp: faker.phone.number(),
        businessPhone: faker.phone.number(),
        businessHours: faker.helpers.arrayElement(BUSINESS_HOURS),
        street: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(CITIES),
        state: faker.helpers.arrayElement(STATES),
        country: "México",
        postalCode: faker.location.zipCode("#####"),
        websiteUrl: faker.datatype.boolean(0.7) ? faker.internet.url() : "",
        description: faker.lorem.sentences(2),
        hasDelivery: faker.datatype.boolean(0.8),
        deliveryService: faker.helpers.arrayElement(["own", "external", "both"]),
        instagramUrl: faker.datatype.boolean(0.6) ? `@${faker.internet.username()}` : "",
        facebookUrl: faker.datatype.boolean(0.6) ? faker.internet.username() : "",
        tiktokUrl: faker.datatype.boolean(0.4) ? `@${faker.internet.username()}` : "",
        isActive: faker.datatype.boolean(0.9),
        shippingOriginState: faker.helpers.arrayElement(STATES),
        freeShippingThreshold: faker.helpers.arrayElement([null, "500", "1000", "1500", "2000"])
      });
    }

    // Add a specific test vendor for e2e tests
    vendorData.push({
      businessName: "Test Vendor Shop",
      slug: "test-vendor-shop",
      contactName: "Test Vendor",
      email: "vendor@luzimarket.shop",
      passwordHash: defaultPasswordHash, // password123
      phone: "+52 555 123 4567",
      whatsapp: "+52 555 123 4567",
      businessPhone: "+52 555 123 4567",
      businessHours: "Lun-Vie 9:00-18:00",
      street: "Calle Test 123",
      city: "Ciudad de México",
      state: "CDMX",
      country: "México",
      postalCode: "01000",
      websiteUrl: "https://testvendor.com",
      description: "Test vendor for e2e tests",
      hasDelivery: true,
      deliveryService: "own",
      instagramUrl: "@testvendor",
      facebookUrl: "testvendor",
      tiktokUrl: "@testvendor",
      isActive: true,
      shippingOriginState: "Ciudad de México",
      freeShippingThreshold: "1000"
    });

    const vendors = await db.insert(schema.vendors).values(vendorData).returning();
    console.log(`✅ Created ${vendors.length} vendors`);

    // 5. Seed Products
    console.log("📦 Creating products...");
    const productData = [];

    // Group product names by category
    const CATEGORY_PRODUCT_NAMES: Record<string, string[]> = {
      "flores-arreglos": PRODUCT_NAMES.slice(0, 15),
      "chocolates-dulces": PRODUCT_NAMES.slice(15, 30),
      "velas-aromas": PRODUCT_NAMES.slice(30, 45),
      "regalos-personalizados": PRODUCT_NAMES.slice(45, 60),
      "cajas-regalo": PRODUCT_NAMES.slice(60, 75),
      "decoracion-hogar": PRODUCT_NAMES.slice(75, 90),
      "joyeria-accesorios": PRODUCT_NAMES.slice(90, 105),
      "gourmet-delicatessen": PRODUCT_NAMES.slice(105, 120)
    };

    for (let i = 0; i < 100; i++) {
      // Use modulo to cycle through categories deterministically
      const categoryIndex = i % categories.length;
      const category = categories[categoryIndex];
      
      const categoryProducts = CATEGORY_PRODUCT_NAMES[category.slug] || PRODUCT_NAMES;
      // Use modulo to cycle through product names
      const productNameIndex = Math.floor(i / categories.length) % categoryProducts.length;
      const baseName = categoryProducts[productNameIndex];
      
      const adjectives = [
        "Premium", "Deluxe", "Exclusivo", "Artesanal", "Elegante",
        "Clásico", "Moderno", "Vintage", "Lujoso", "Especial"
      ];
      // Use modulo to cycle through adjectives
      const adjectiveIndex = i % adjectives.length;
      const adjective = adjectives[adjectiveIndex];
      
      const name = `${baseName} ${adjective}`;
      const priceRange = CATEGORY_PRICE_RANGES[category.slug] || { min: 299, max: 1999 };
      const price = faker.number.int({ min: priceRange.min, max: priceRange.max });

      // Generate more realistic descriptions based on category
      let description = "";
      if (category.slug === "flores-arreglos") {
        description = `Hermoso arreglo floral con ${baseName.toLowerCase()} frescos, perfectos para ${faker.helpers.arrayElement(["celebraciones", "aniversarios", "cumpleaños", "ocasiones especiales"])}. Incluye ${faker.helpers.arrayElement(["follaje verde", "baby's breath", "decoración especial", "lazo elegante"])}.`;
      } else if (category.slug === "chocolates-dulces") {
        description = `Deliciosos chocolates ${faker.helpers.arrayElement(["belgas", "suizos", "artesanales", "gourmet"])} con ${faker.helpers.arrayElement(["cacao 70%", "relleno de trufa", "frutos secos", "caramelo"])}. Presentación ${faker.helpers.arrayElement(["en caja elegante", "envueltos individualmente", "con moño decorativo"])}.`;
      } else if (category.slug === "velas-aromas") {
        description = `Vela aromática de ${faker.helpers.arrayElement(["cera de soya", "cera de abeja", "parafina premium"])} con esencia de ${faker.helpers.arrayElement(["lavanda francesa", "vainilla de Madagascar", "sándalo", "jazmín"])}. Duración aproximada de ${faker.number.int({ min: 20, max: 60 })} horas.`;
      } else {
        description = faker.lorem.sentences(2) + ` ${faker.helpers.arrayElement(["Hecho a mano con amor.", "Producto exclusivo de temporada.", "Edición limitada.", "Diseño único."])}`;
      }

      // Assign vendors deterministically by cycling through them
      const vendorIndex = i % vendors.length;
      const vendor = vendors[vendorIndex];
      // Create deterministic slug based on product index only (since everything else is now deterministic)
      const deterministicSlug = slugify(`${baseName}-${adjective}-${i}`, { lower: true, strict: true });
      
      productData.push({
        name,
        slug: deterministicSlug,
        description,
        categoryId: category.id,
        vendorId: vendor.id,
        price: String(Math.round(price / 50) * 50), // Round to nearest 50
        images: null, // Will be generated with AI
        tags: faker.helpers.arrayElements(["nuevo", "popular", "oferta", "exclusivo", "limitado", "artesanal", "eco-friendly", "premium"], { min: 1, max: 4 }),
        stock: faker.helpers.weightedArrayElement([
          { value: faker.number.int({ min: 1, max: 10 }), weight: 2 }, // Low stock
          { value: faker.number.int({ min: 11, max: 50 }), weight: 5 }, // Normal stock
          { value: faker.number.int({ min: 51, max: 100 }), weight: 3 }, // High stock
          { value: 0, weight: 1 } // Out of stock
        ]),
        isActive: faker.datatype.boolean(0.95),
        // Shipping fields based on category
        weight: (() => {
          if (category.slug === "flores-arreglos") return faker.number.int({ min: 500, max: 3000 }); // 0.5-3kg
          if (category.slug === "chocolates-dulces") return faker.number.int({ min: 100, max: 1000 }); // 0.1-1kg
          if (category.slug === "velas-aromas") return faker.number.int({ min: 200, max: 800 }); // 0.2-0.8kg
          if (category.slug === "joyeria-accesorios") return faker.number.int({ min: 50, max: 300 }); // 0.05-0.3kg
          if (category.slug === "gourmet-delicatessen") return faker.number.int({ min: 300, max: 2000 }); // 0.3-2kg
          return faker.number.int({ min: 200, max: 1500 }); // Default 0.2-1.5kg
        })(),
        length: faker.number.int({ min: 10, max: 50 }), // 10-50cm
        width: faker.number.int({ min: 10, max: 40 }), // 10-40cm
        height: faker.number.int({ min: 5, max: 30 }), // 5-30cm
        shippingClass: faker.helpers.arrayElement(["standard", "fragile", "oversize"])
      });
    }
    const products = await db.insert(schema.products).values(productData).returning();
    console.log(`✅ Created ${products.length} products`);

    // 5.5 Seed Product Variants
    console.log("🎨 Creating product variants...");
    const variantData = [];

    // Define variant configurations by category
    const CATEGORY_VARIANTS: Record<string, { types: string[], values: Record<string, any[]> }> = {
      "flores-arreglos": {
        types: ["size", "color"],
        values: {
          size: [
            { name: "Pequeño", price: 0 },
            { name: "Mediano", price: 150 },
            { name: "Grande", price: 300 },
            { name: "Extra Grande", price: 500 }
          ],
          color: [
            { name: "Rosa", attributes: { colorValue: "#FFB6C1" } },
            { name: "Rojo", attributes: { colorValue: "#DC143C" } },
            { name: "Blanco", attributes: { colorValue: "#FFFFFF" } },
            { name: "Amarillo", attributes: { colorValue: "#FFD700" } },
            { name: "Mixto", attributes: { colorValue: "linear-gradient(45deg, #FFB6C1, #FFD700)" } }
          ]
        }
      },
      "chocolates-dulces": {
        types: ["size", "type"],
        values: {
          size: [
            { name: "Individual", price: 0 },
            { name: "Caja Pequeña (6 pz)", price: 100 },
            { name: "Caja Mediana (12 pz)", price: 200 },
            { name: "Caja Grande (24 pz)", price: 400 }
          ],
          type: [
            { name: "Chocolate Oscuro" },
            { name: "Chocolate con Leche" },
            { name: "Chocolate Blanco" },
            { name: "Mixto" }
          ]
        }
      },
      "velas-aromas": {
        types: ["size", "scent"],
        values: {
          size: [
            { name: "Vela Pequeña (100g)", price: 0 },
            { name: "Vela Mediana (200g)", price: 150 },
            { name: "Vela Grande (400g)", price: 300 }
          ],
          scent: [
            { name: "Lavanda" },
            { name: "Vainilla" },
            { name: "Canela" },
            { name: "Cítricos" },
            { name: "Rosa" },
            { name: "Sándalo" }
          ]
        }
      },
      "joyeria-accesorios": {
        types: ["material", "size"],
        values: {
          material: [
            { name: "Plata 925", price: 0 },
            { name: "Oro 14k", price: 2000 },
            { name: "Oro Rosa", price: 1500 },
            { name: "Acero Inoxidable", price: -500 }
          ],
          size: [
            { name: "XS" },
            { name: "S" },
            { name: "M" },
            { name: "L" },
            { name: "Ajustable" }
          ]
        }
      },
      "cajas-regalo": {
        types: ["size", "theme"],
        values: {
          size: [
            { name: "Caja Pequeña", price: 0 },
            { name: "Caja Mediana", price: 300 },
            { name: "Caja Grande", price: 600 },
            { name: "Caja Premium", price: 1000 }
          ],
          theme: [
            { name: "Cumpleaños" },
            { name: "Aniversario" },
            { name: "Día de las Madres" },
            { name: "Navidad" },
            { name: "San Valentín" },
            { name: "Personalizada" }
          ]
        }
      }
    };

    // Create variants for products that have variant configurations
    let variantCounter = 0;
    for (const product of products.slice(0, 50)) { // Add variants to first 50 products
      const category = categories.find(c => c.id === product.categoryId);
      if (!category) continue;

      const variantConfig = CATEGORY_VARIANTS[category.slug];
      if (!variantConfig) continue;

      for (const variantType of variantConfig.types) {
        const values = variantConfig.values[variantType];
        for (const value of values) {
          const stock = faker.number.int({ min: 0, max: 50 });
          variantCounter++;
          variantData.push({
            productId: product.id,
            name: value.name,
            variantType,
            sku: `${product.id.substring(0, 8)}-${variantType.charAt(0).toUpperCase()}-${variantCounter.toString().padStart(4, '0')}`,
            price: value.price ? String(Number(product.price) + value.price) : null,
            stock,
            attributes: value.attributes || {},
            isActive: stock > 0
          });
        }
      }
    }

    if (variantData.length > 0) {
      await db.insert(schema.productVariants).values(variantData);
      console.log(`✅ Created ${variantData.length} product variants`);
    }

    // 6. Seed Users (Customers)
    console.log("👥 Creating users...");
    const userPassword = await bcrypt.hash("password123", 10);
    const userData = [];
    
    // Add specific test users first
    userData.push({
      email: "customer1@example.com",
      name: "Test Customer",
      passwordHash: userPassword,
      stripeCustomerId: `cus_test_customer1`,
      isActive: true
    });
    
    userData.push({
      email: "customer2@example.com",
      name: "Test Customer 2",
      passwordHash: userPassword,
      stripeCustomerId: `cus_test_customer2`,
      isActive: true
    });
    
    // Add random users
    for (let i = 0; i < 48; i++) {
      userData.push({
        email: faker.internet.email(),
        name: faker.person.fullName(),
        passwordHash: userPassword,
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        isActive: faker.datatype.boolean(0.95)
      });
    }
    const users = await db.insert(schema.users).values(userData).returning();
    console.log(`✅ Created ${users.length} users`);

    // 7. Seed Newsletter Subscriptions
    console.log("📰 Creating newsletter subscriptions...");
    const subscriptionData = [];
    for (let i = 0; i < 100; i++) {
      subscriptionData.push({
        email: faker.internet.email(),
        isActive: faker.datatype.boolean(0.9)
      });
    }
    await db.insert(schema.subscriptions).values(subscriptionData);
    console.log(`✅ Created ${subscriptionData.length} subscriptions`);

    // 8. Seed Orders
    console.log("🛒 Creating orders...");
    const orderData = [];
    const carriers = ["fedex", "ups", "dhl", "estafeta", "correos-de-mexico"];

    for (let i = 0; i < 150; i++) {
      const subtotal = faker.number.int({ min: 199, max: 9999 });
      const tax = Math.round(subtotal * 0.16);
      const shipping = faker.helpers.arrayElement([0, 99, 149, 199]);
      const total = subtotal + tax + shipping;

      const status = faker.helpers.weightedArrayElement([
        { value: "delivered", weight: 4 },
        { value: "shipped", weight: 3 },
        { value: "processing", weight: 2 },
        { value: "pending", weight: 1 }
      ]);

      const orderCreatedAt = faker.date.recent({ days: 90 });

      // Prepare tracking information for shipped and delivered orders
      let trackingData: any = {};

      if (status === "shipped" || status === "delivered") {
        const carrier = faker.helpers.arrayElement(carriers);
        const trackingNumber = `${carrier.toUpperCase().substring(0, 3)}${faker.string.numeric(12)}`;
        const shippedDate = faker.date.between({ from: orderCreatedAt, to: new Date() });
        const estimatedDelivery = new Date(shippedDate);
        estimatedDelivery.setDate(estimatedDelivery.getDate() + faker.number.int({ min: 1, max: 5 }));

        // Build tracking history
        const trackingHistory = [];

        // Order picked up
        trackingHistory.push({
          status: "picked_up",
          location: faker.helpers.arrayElement(CITIES),
          timestamp: shippedDate,
          description: "Paquete recogido por el transportista",
          coordinates: {
            lat: Number(faker.location.latitude({ min: 14, max: 33 })),
            lng: Number(faker.location.longitude({ min: -117, max: -86 }))
          }
        });

        // In transit events
        const transitEvents = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < transitEvents; j++) {
          const transitDate = faker.date.between({ from: shippedDate, to: estimatedDelivery });
          trackingHistory.push({
            status: "in_transit",
            location: faker.helpers.arrayElement(CITIES),
            timestamp: transitDate,
            description: faker.helpers.arrayElement([
              "En tránsito hacia el destino",
              "Paquete en centro de distribución",
              "Procesando en instalación"
            ]),
            coordinates: {
              lat: Number(faker.location.latitude({ min: 14, max: 33 })),
              lng: Number(faker.location.longitude({ min: -117, max: -86 }))
            }
          });
        }

        // Out for delivery (for both shipped and delivered)
        const outForDeliveryDate = new Date(estimatedDelivery);
        outForDeliveryDate.setHours(outForDeliveryDate.getHours() - faker.number.int({ min: 2, max: 8 }));
        trackingHistory.push({
          status: "out_for_delivery",
          location: faker.helpers.arrayElement(CITIES),
          timestamp: outForDeliveryDate,
          description: "En ruta de entrega",
          coordinates: {
            lat: Number(faker.location.latitude({ min: 14, max: 33 })),
            lng: Number(faker.location.longitude({ min: -117, max: -86 }))
          }
        });

        // Delivered event (only for delivered orders)
        if (status === "delivered") {
          // Ensure the delivery date is not in the future
          const maxDeliveryDate = new Date();
          const minDeliveryDate = new Date(outForDeliveryDate);

          // If outForDeliveryDate is in the future, set actual delivery to a reasonable time after it
          if (minDeliveryDate > maxDeliveryDate) {
            // Add 1-4 hours to outForDeliveryDate for actual delivery
            const hoursAfterOutForDelivery = faker.number.int({ min: 1, max: 4 });
            minDeliveryDate.setHours(minDeliveryDate.getHours() + hoursAfterOutForDelivery);
            var actualDeliveryDate = minDeliveryDate;
          } else {
            // Normal case: delivery happened between out for delivery and now
            var actualDeliveryDate = faker.date.between({ from: outForDeliveryDate, to: maxDeliveryDate });
          }

          trackingHistory.push({
            status: "delivered",
            location: faker.helpers.arrayElement(CITIES),
            timestamp: actualDeliveryDate,
            description: "Entregado exitosamente",
            coordinates: {
              lat: Number(faker.location.latitude({ min: 14, max: 33 })),
              lng: Number(faker.location.longitude({ min: -117, max: -86 }))
            }
          });

          trackingData.actualDeliveryDate = actualDeliveryDate;
        }

        // Sort tracking history by timestamp
        trackingHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        trackingData = {
          trackingNumber,
          carrier,
          estimatedDeliveryDate: estimatedDelivery,
          trackingHistory,
          ...trackingData
        };
      }

      orderData.push({
        userId: faker.helpers.arrayElement(users).id,
        vendorId: faker.helpers.arrayElement(vendors).id,
        orderNumber: `ORD-${faker.string.numeric(8)}`,
        status,
        subtotal: String(subtotal),
        tax: String(tax),
        shipping: String(shipping),
        total: String(total),
        currency: "MXN",
        paymentIntentId: `pi_${faker.string.alphanumeric(24)}`,
        paymentStatus: faker.helpers.weightedArrayElement([
          { value: "succeeded", weight: 9 },
          { value: "pending", weight: 1 }
        ]),
        shippingAddress: {
          name: faker.person.fullName(),
          street: faker.location.streetAddress(),
          city: faker.helpers.arrayElement(CITIES),
          state: faker.helpers.arrayElement(STATES),
          postalCode: faker.location.zipCode("#####"),
          country: "México"
        },
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
        createdAt: orderCreatedAt,
        ...trackingData
      });
    }
    const orders = await db.insert(schema.orders).values(orderData).returning();
    console.log(`✅ Created ${orders.length} orders`);

    // 9. Seed Order Items
    console.log("📋 Creating order items...");
    const orderItemData = [];
    for (const order of orders) {
      const itemCount = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(products, itemCount);

      for (const product of selectedProducts) {
        const quantity = faker.number.int({ min: 1, max: 3 });
        const price = parseInt(product.price);
        orderItemData.push({
          orderId: order.id,
          productId: product.id,
          quantity,
          price: String(price),
          total: String(price * quantity)
        });
      }
    }
    await db.insert(schema.orderItems).values(orderItemData);
    console.log(`✅ Created ${orderItemData.length} order items`);

    // 10. Seed Reviews
    console.log("⭐ Creating reviews...");
    const reviewData = [];
    const reviewTitles = [
      "Excelente producto",
      "Muy buena calidad",
      "Recomendado",
      "Superó mis expectativas",
      "Buen servicio",
      "Producto como se describe",
      "Entrega rápida",
      "Volveré a comprar"
    ];

    // Create reviews for random products
    const productsWithReviews = faker.helpers.arrayElements(products, 120);
    for (const product of productsWithReviews) {
      const reviewCount = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < reviewCount; i++) {
        const user = faker.helpers.arrayElement(users);
        // Check if user has ordered this product
        const hasOrdered = faker.datatype.boolean(0.8);

        reviewData.push({
          productId: product.id,
          userId: user.id,
          orderId: hasOrdered ? faker.helpers.arrayElement(orders).id : null,
          rating: faker.helpers.weightedArrayElement([
            { value: 5, weight: 5 },
            { value: 4, weight: 3 },
            { value: 3, weight: 1.5 },
            { value: 2, weight: 0.5 }
          ]),
          title: faker.helpers.arrayElement(reviewTitles),
          comment: faker.lorem.sentences(2),
          isVerifiedPurchase: hasOrdered,
          helpfulCount: faker.number.int({ min: 0, max: 50 })
        });
      }
    }
    await db.insert(schema.reviews).values(reviewData);
    console.log(`✅ Created ${reviewData.length} reviews`);

    // 11. Initialize shipping data
    console.log("🚚 Initializing shipping zones and methods...");
    const shippingResult = await initializeShippingData();
    if (shippingResult.success) {
      console.log(`✅ ${shippingResult.message}`);
    } else {
      console.log(`⚠️  Shipping data initialization failed: ${shippingResult.error}`);
    }

    // Generate AI images if enabled
    if (shouldGenerateImages) {
      console.log("\n🎨 Generating AI images for products and categories...");

      // Create uploads directory for local development
      if (process.env.NODE_ENV === 'development' && !process.env.BLOB_READ_WRITE_TOKEN) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'ai-generated');
        await fs.mkdir(uploadsDir, { recursive: true });
        console.log('📁 Created local uploads directory\n');
      }

      // Generate category images (only for categories without images, unless forced)
      console.log('🖼️  Generating category images...');
      const categoriesToImage = forceRegenerateImages ? categories : categories.filter(c => !c.imageUrl);
      console.log(`📊 Found ${categoriesToImage.length} categories ${forceRegenerateImages ? '(forced regeneration)' : 'without images'}`);

      for (const category of categoriesToImage) {
        try {
          console.log(`🖼️  Generating image for category: ${category.name}`);

          const prompt = generateCategoryImagePrompt({
            name: category.name,
            description: category.description || '',
          });

          const imageUrl = await generateAndUploadImage(
            prompt,
            `category-${category.slug}.png`,
            {
              size: '1792x1024',
              quality: 'hd',
              style: 'natural',
            }
          );

          await db.update(schema.categories)
            .set({ imageUrl })
            .where(eq(schema.categories.id, category.id));

          console.log(`✅ Generated image for ${category.name}`);

          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Error generating image for ${category.name}:`, error);
        }
      }

      // Generate product images (only for products without images, unless forced)
      console.log('\n🖼️  Generating product images...');
      const productsNeedingImages = forceRegenerateImages ? products : products.filter(p => !p.images || (Array.isArray(p.images) && p.images.length === 0));
      const productsToImage = productsNeedingImages.slice(0, imageBatchSize);
      console.log(`📊 Found ${productsNeedingImages.length} products ${forceRegenerateImages ? '(forced regeneration)' : 'without images'}, generating for ${productsToImage.length}`);

      for (const product of productsToImage) {
        try {
          console.log(`🖼️  Generating image for product: ${product.name}`);

          const prompt = generateProductImagePrompt({
            name: product.name,
            description: product.description || '',
            tags: product.tags as string[],
          });

          const imageUrl = await generateAndUploadImage(
            prompt,
            `product-${product.slug}.png`,
            {
              size: '1024x1024',
              quality: 'standard',
              style: 'natural',
            }
          );

          await db.update(schema.products)
            .set({
              images: [imageUrl]
            })
            .where(eq(schema.products.id, product.id));

          console.log(`✅ Generated image for ${product.name}`);

          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Error generating image for ${product.name}:`, error);
        }
      }

      console.log('\n✨ AI image generation completed!');
    } else {
      if (process.argv.includes('--no-images')) {
        console.log("\n⏭️  Skipping AI image generation (--no-images flag)");
      } else {
        console.log("\n⚠️  Skipping AI image generation (OPENAI_SECRET_KEY not found)");
      }
    }

    // Print summary
    console.log("\n📋 Summary:");
    const counts = await db.select({
      categories: sql<number>`(SELECT COUNT(*) FROM ${schema.categories})`,
      vendors: sql<number>`(SELECT COUNT(*) FROM ${schema.vendors})`,
      products: sql<number>`(SELECT COUNT(*) FROM ${schema.products})`,
      users: sql<number>`(SELECT COUNT(*) FROM ${schema.users})`,
      orders: sql<number>`(SELECT COUNT(*) FROM ${schema.orders})`,
      reviews: sql<number>`(SELECT COUNT(*) FROM ${schema.reviews})`
    }).from(schema.categories);

    const summary = counts[0];
    console.log(`- Categories: ${summary.categories}`);
    console.log(`- Vendors: ${summary.vendors}`);
    console.log(`- Products: ${summary.products}`);
    console.log(`- Users: ${summary.users}`);
    console.log(`- Orders: ${summary.orders}`);
    console.log(`- Reviews: ${summary.reviews}`);

    console.log("\n🔐 Login credentials:");
    console.log("Admin: admin@luzimarket.shop / admin123");
    console.log("User: any user email / password123");

    console.log("\n✅ Database seeded successfully!");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();